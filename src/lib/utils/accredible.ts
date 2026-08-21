import type { Alignment, BadgeClassCTDLExtended } from '$lib/utils/badges.js';

// Accredible Options
//
// Auth header format and the Groups endpoint path/pagination params below are
// taken directly from Accredible's own export script
// (github.com/accredible/accredible-achievement-ob3-export, accredible_ob3_export.py):
//   request.add_header("Authorization", f"Token token={self.api_key}")
//   self._get("/v1/issuer/all_groups", { page, page_size })
//
// The exact JSON envelope key for the groups list, and any endpoint for
// fetching a badge design/image, were NOT confirmed against Accredible's API
// reference (docs.accredible.com was not reachable while building this) --
// see the TODOs below. Confirm both with Accredible before relying on this
// in production.

export type AccredibleEnvKey = 'us' | 'eu' | 'sandbox';

export interface AccredibleEnv {
	id: AccredibleEnvKey;
	apiDomain: string;
	credentialDomain: string;
	name: string;
}

export const accredibleRegions: Map<AccredibleEnvKey, AccredibleEnv> = new Map([
	[
		'us',
		{
			id: 'us',
			apiDomain: 'https://api.accredible.com',
			credentialDomain: 'https://www.credential.net',
			name: 'United States (production)'
		}
	],
	[
		'eu',
		{
			id: 'eu',
			apiDomain: 'https://eu.api.accredible.com',
			credentialDomain: 'https://eu.credential.net',
			name: 'Europe (production)'
		}
	],
	[
		'sandbox',
		{
			id: 'sandbox',
			apiDomain: 'https://sandbox.api.accredible.com',
			credentialDomain: 'https://sandbox.credential.net',
			name: 'Sandbox'
		}
	]
]);

// A single "learning outcome" / skill entry as returned by Accredible. Accredible's
// export script emits these as bare names unless run with --resolve-skills, in
// which case framework-matched skills also carry targetUrl/targetFramework/targetCode.
export interface AccredibleLearningOutcome {
	name?: string;
	targetUrl?: string;
	targetFramework?: string;
	targetCode?: string;
}

// A single earning-criterion entry as returned by Accredible. Sandbox groups
// return `earning_criteria` as an array of these objects (each `text` is an
// HTML fragment), NOT as a plain string. Confirmed against a live sandbox
// probe (see accredible_probe.py output).
export interface AccredibleCriterion {
	id?: string;
	kind?: string; // e.g. "degree", "skill", "completion"
	text?: string; // HTML fragment describing the criterion
	required?: boolean;
	position?: number;
}

// Raw shape of one entry from Accredible's `/v1/issuer/all_groups` endpoint,
// limited to the fields Accredible's own export script reads.
export interface AccredibleGroup {
	id: number | string;
	name?: string;
	course_name?: string;
	course_description?: string;
	description?: string;
	// May be a plain string OR a structured array of criterion objects,
	// depending on how the group's criteria were configured in Accredible.
	earning_criteria?: string | AccredibleCriterion[];
	achievement_type?: string;
	// Groups render credentials using a reusable Design, referenced by id. The
	// group payload has no image itself; the badge image comes from the Design
	// (see fetchAccredibleGroups() / GET /v1/designs/{design_id}).
	design_id?: number | string;
	// Populated by fetchAccredibleGroups() after resolving the Design, so
	// extractImageFromGroup() below can pick it up. Not returned by Accredible.
	image_url?: string;
	learning_outcomes?: Array<string | AccredibleLearningOutcome>;
	// TODO(confirm with Accredible): if a badge design/image URL is available
	// directly on the group payload under some other field name (e.g.
	// `design`, `badge_design`, `image_url`), add it here and in
	// extractImageFromGroup() below so we can avoid a second API call per badge.
}

const stripHtml = (html: string): string => {
	if (!html) return '';
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
};

// Normalize Accredible's `earning_criteria` (which may be a plain string or a
// structured array of criterion objects) into a single narrative string.
// Downstream code (badgeClassToCtdlApiCredential) runs this through
// markdownToTxt(), which requires a string -- passing the raw array throws and
// silently drops the whole credential from the import.
const narrativeFromEarningCriteria = (
	earning: string | AccredibleCriterion[] | undefined,
	fallback: string
): string => {
	if (!earning) return fallback;
	if (typeof earning === 'string') return earning;
	if (Array.isArray(earning)) {
		const parts = [...earning]
			.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
			.map((c) => {
				const text = stripHtml(c.text || '');
				if (!text) return '';
				return c.required === false ? `${text} (optional)` : text;
			})
			.filter((t) => t.length > 0);
		return parts.length ? parts.join('\n\n') : fallback;
	}
	return fallback;
};

// Best-effort attempt to find an already-present image URL on the group
// payload before resorting to a second lookup call. Field names are guesses
// pending confirmation from Accredible -- extend this list once known.
const extractImageFromGroup = (g: AccredibleGroup): string => {
	const candidate =
		(g as any).image_url || (g as any).badge_design?.image_url || (g as any).design?.image_url;
	return typeof candidate === 'string' ? candidate : '';
};

/**
 * Converts one Accredible group ("badge template") into the shape Badge
 * Publisher's `badgeClassBasicSchema` (src/lib/utils/badges.ts) validates.
 *
 * IMPORTANT: alignment entries without a resolvable `targetUrl` are dropped
 * here rather than passed through with only `targetName`. Badge Publisher's
 * importer requires `targetUrl` to be a valid URL on every alignment entry
 * and rejects the *entire* achievement if even one entry is missing it, with
 * no special case for free-text skills. This was verified against a 316-item
 * sample produced by Accredible's export script: 255/316 (81%) failed import
 * for exactly this reason, across 799 total alignment entries, all missing
 * targetUrl. Dropping unresolvable entries lets the rest of the achievement
 * (name, description, criteria) still publish, at the cost of losing the
 * unresolved skill names -- which is a reasonable tradeoff since Badge
 * Publisher can't accept them as-is anyway.
 */
export const badgeclassFromAccredibleGroup = (
	g: AccredibleGroup,
	env: AccredibleEnv,
	imageUrl?: string
): BadgeClassCTDLExtended => {
	const name = g.course_name || g.name || '';
	const description = stripHtml(g.course_description || g.description || '');

	const alignment: Alignment[] = (g.learning_outcomes || [])
		.map((o): Partial<Alignment> => {
			if (typeof o === 'string') return { targetName: o };
			return {
				targetName: o.name || '',
				targetUrl: o.targetUrl,
				targetFramework: o.targetFramework,
				targetCode: o.targetCode
			};
		})
		.filter((a): a is Alignment => !!a.targetUrl && !!a.targetName);

	return {
		id: `${env.credentialDomain}/group/${g.id}`,
		name,
		description,
		image: imageUrl || extractImageFromGroup(g),
		issuer: '',
		achievementType: g.achievement_type || 'Achievement',
		tags: [],
		criteria: {
			narrative: narrativeFromEarningCriteria(
				g.earning_criteria,
				`See ${env.credentialDomain}/group/${g.id} for details.`
			)
		},
		alignment
	};
};

export const accredibleAuthHeader = (apiKey: string) => ({
	Name: 'Authorization',
	Value: `Token token=${apiKey}`
});

// A Design object as returned by GET /v1/designs/{design_id}. Only the
// image-bearing fields are modeled here. `rasterized_content_url` is
// Accredible's documented "link to generate an image of the design"; the other
// keys are tolerated as fallbacks in case the account returns a different shape.
export interface AccredibleDesign {
	id?: number | string;
	kind?: string; // 'badge' | 'certificate'
	rasterized_content_url?: string;
	image_url?: string;
	preview_url?: string;
}

// Endpoint for a single Design. A group's `design_id` points here; the Design's
// rasterized image is used as the badge image.
export const accredibleDesignEndpoint = (env: AccredibleEnv, designId: string | number) =>
	`${env.apiDomain}/v1/designs/${designId}`;

// Extract a usable image URL from a design payload, tolerating either a bare
// design object or one wrapped under a `design` key, and a few field-name
// variants. Returns '' when nothing usable is present.
export const imageUrlFromDesign = (payload: unknown): string => {
	const root = (payload ?? {}) as Record<string, any>;
	const d: Record<string, any> = root.design ?? root;
	const candidate = d.rasterized_content_url || d.image_url || d.preview_url;
	return typeof candidate === 'string' ? candidate : '';
};
