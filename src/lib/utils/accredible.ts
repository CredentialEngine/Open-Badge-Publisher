import type { Alignment, BadgeClassCTDLExtended } from '$lib/utils/badges.js';

// Accredible Options
//
// Auth header, endpoints and response shapes below are confirmed against
// Accredible's official OpenAPI spec (github.com/accredible/api-documentation,
// openapi.json). Confirmed:
//   - Auth: `Authorization: Token token=<api_key>`
//   - Server domains match accredibleRegions below (US / EU / Sandbox).
//   - GET /v1/issuer/all_groups -> { groups: [...], meta: { current_page,
//     next_page, total_pages, total_count } }. Envelope key is `groups`;
//     paginate via meta.next_page (null = last page).
//   - Group design ids are `badge_design_id`, `primary_design_id`, `design_id`,
//     `certificate_design_id` (see badgeDesignIdForGroup) -- all confirmed.
//
// TWO BEHAVIORAL GAPS the spec reveals (engineering: address before prod):
//   1. The spec's all_groups EXAMPLE omits `earning_criteria`/`achievement_type`,
//      but live accounts return them on the list (verified against a real
//      account). `skills[]` and `skill_framework`, however, come back ONLY from
//      the single-group GET /v1/issuer/groups/{group_id} (envelope key `group`)
//      and are a pay-gated feature most badges lack -- so fetchAccredibleGroups()
//      backfills them via a per-group GET only when opted in
//      (PUBLIC_ACCREDIBLE_FETCH_GROUP_SKILLS), off by default.
//   2. `learning_outcomes` on a group is an array of BARE STRINGS (no URL) when
//      present, and null otherwise -- so alignments built from it always lack
//      targetUrl and are always dropped by the importer (this is the real cause
//      of the ~81% drop noted below). The resolvable skills are in the group's
//      `skills[]` (each has `url`, `name`, `identifier`, `breadcrumbs`) plus
//      `skill_framework` { taxonomy, provider, attribution } -- map THOSE to
//      Alignment.targetUrl/targetName/targetFramework instead.
// Badge image: there is no image field on the group payload, and the design GET
// response is undocumented (no `rasterized_content_url` in the spec). The only
// documented image source is POST /v1/designs/{design_id}/preview -> { link }
// (name-merged render). Treat the preview `link` as the primary image URL.

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

// A resolved, framework-matched skill as returned on the SINGLE-group GET
// (/v1/issuer/groups/{id}) under `skills[]`. Unlike `learning_outcomes` (bare
// strings), each skill carries a public `url` -- the targetUrl Badge Publisher's
// importer requires. Confirmed against openapi.json (e.g. O*NET skills).
export interface AccredibleSkill {
	id?: number | string;
	name?: string;
	identifier?: string; // framework code, e.g. "2.A.1.b"
	description?: string;
	url?: string; // public framework URL, e.g. https://www.onetonline.org/...
}

// The skill framework a group's `skills[]` are drawn from, returned alongside
// them on the single-group GET. Used for Alignment.targetFramework.
export interface AccredibleSkillFramework {
	id?: number | string;
	name?: string; // e.g. "O*NET Skills"
	taxonomy?: string; // e.g. "ONET"
	provider?: string;
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
	// Groups render credentials using reusable Designs, referenced by id. The
	// group payload has no image itself; the badge image comes from a Design
	// (see fetchAccredibleGroups() / GET /v1/designs/{design_id}). A group can
	// carry several design ids -- for a badge we want `badge_design_id`.
	design_id?: number | string;
	badge_design_id?: number | string;
	certificate_design_id?: number | string;
	primary_design_id?: number | string;
	design_name?: string;
	// Populated by fetchAccredibleGroups() after resolving the Design, so
	// extractImageFromGroup() below can pick it up. Not returned by Accredible.
	image_url?: string;
	// NOTE: per the official spec, a group's learning_outcomes is an array of
	// bare strings (no URL) or null -- NOT the richer object below. The richer,
	// URL-bearing skills come from the single-group GET as `skills[]` +
	// `skill_framework` (see header). This union stays for forward-compat.
	learning_outcomes?: Array<string | AccredibleLearningOutcome>;
	// Returned only by the single-group GET (/v1/issuer/groups/{id}), not the
	// list endpoint. `skills[]` is the source of URL-bearing alignments; the
	// list's `learning_outcomes` has none. fetchAccredibleGroups() backfills
	// these via a per-group GET only when opted in (pay-gated; see header).
	skills?: AccredibleSkill[];
	skill_framework?: AccredibleSkillFramework;
	// Confirmed against openapi.json: the group payload carries NO image field,
	// so a second call is required. There is no `rasterized_content_url` in the
	// spec; the documented image source is POST /v1/designs/{id}/preview -> {link}.
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
 * Alignments come primarily from the group's `skills[]` (populated on each
 * group by fetchAccredibleGroups() via a per-group GET): each skill carries a
 * public framework `url` -- the targetUrl Badge Publisher's importer requires.
 * `learning_outcomes` is used only as a fallback for the rare structured-object
 * form that already includes a targetUrl; its common bare-string form has no
 * URL and is skipped.
 *
 * IMPORTANT: Badge Publisher requires a valid `targetUrl` on EVERY alignment
 * entry and rejects the *entire* achievement if even one is missing it. So any
 * entry without a resolvable targetUrl is dropped here (rather than passed
 * through with only a name) to keep the rest of the achievement publishable.
 * Reading `skills[]` instead of `learning_outcomes` is what makes this retain
 * data: in a 316-item sample, 255 (81%) previously lost ALL skills because
 * learning_outcomes never carries a URL.
 */
export const badgeclassFromAccredibleGroup = (
	g: AccredibleGroup,
	env: AccredibleEnv,
	imageUrl?: string
): BadgeClassCTDLExtended => {
	const name = g.course_name || g.name || '';
	const description = stripHtml(g.course_description || g.description || '');

	const frameworkName = g.skill_framework?.name || g.skill_framework?.taxonomy;

	// Primary source: framework-matched skills, each with a public URL.
	const skillAlignments: Alignment[] = (g.skills || [])
		.map((s): Partial<Alignment> => ({
			targetName: s.name || '',
			targetUrl: s.url,
			targetDescription: stripHtml(s.description || ''),
			targetFramework: frameworkName,
			targetCode: s.identifier
		}))
		.filter((a): a is Alignment => !!a.targetUrl && !!a.targetName);

	// Fallback: structured learning_outcomes that already carry a targetUrl
	// (bare-string outcomes have none and are dropped by the filter).
	const outcomeAlignments: Alignment[] = (g.learning_outcomes || [])
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

	// Merge, de-duping by targetUrl (skills win).
	const seenUrls = new Set(skillAlignments.map((a) => a.targetUrl));
	const alignment: Alignment[] = [
		...skillAlignments,
		...outcomeAlignments.filter((a) => !seenUrls.has(a.targetUrl))
	];

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

// Endpoint for a single group's full detail. The list endpoint (all_groups)
// omits earning_criteria, achievement_type, skills and skill_framework; this
// GET returns them under a `group` envelope.
export const accredibleGroupDetailEndpoint = (env: AccredibleEnv, groupId: string | number) =>
	`${env.apiDomain}/v1/issuer/groups/${groupId}`;

// Unwrap the single-group GET response ({ group: {...} }), tolerating a bare
// object. Returns undefined when the payload has no usable group.
export const groupFromDetailPayload = (payload: unknown): AccredibleGroup | undefined => {
	if (!payload || typeof payload !== 'object') return undefined;
	const root = payload as Record<string, any>;
	const g = root.group ?? root;
	return g && typeof g === 'object' && (g.id !== undefined || g.name || g.course_name)
		? (g as AccredibleGroup)
		: undefined;
};

// A Design object as (optionally) returned by GET /v1/designs/{design_id}. The
// official spec does NOT document this response or a `rasterized_content_url`
// field -- the documented image source is the /preview endpoint ({ link }). The
// GET is kept only as a best-effort fallback, so these keys are speculative.
export interface AccredibleDesign {
	id?: number | string;
	kind?: string; // 'badge' | 'certificate'
	rasterized_content_url?: string;
	image_url?: string;
	preview_url?: string;
}

// The design a group uses for its BADGE image. A group carries several design
// ids; prefer the badge-specific one, then the group's primary/default design.
// (certificate_design_id is intentionally last -- it renders a certificate, not
// a badge.) Returns undefined when the group references no usable design.
export const badgeDesignIdForGroup = (g: AccredibleGroup): number | string | undefined => {
	for (const candidate of [
		g.badge_design_id,
		g.primary_design_id,
		g.design_id,
		g.certificate_design_id
	]) {
		if (candidate !== undefined && candidate !== null && candidate !== '') return candidate;
	}
	return undefined;
};

// Endpoint for a single Design. A group's badge design id points here; the
// Design's rasterized image is used as the badge image.
export const accredibleDesignEndpoint = (env: AccredibleEnv, designId: string | number) =>
	`${env.apiDomain}/v1/designs/${designId}`;

// Endpoint that renders a preview image of a Design and returns `{ link }`.
// Used as a fallback when the Design object itself has no rasterized image URL.
export const accredibleDesignPreviewEndpoint = (env: AccredibleEnv, designId: string | number) =>
	`${env.apiDomain}/v1/designs/${designId}/preview`;

// Extract a usable image URL from a design-preview (or design) payload,
// tolerating either a bare object or one wrapped under a `design` key. The
// documented, primary source is the preview endpoint's `link`; the others are
// tolerated fallbacks in case a given account's design GET returns them.
// Returns '' when nothing usable is present.
export const imageUrlFromDesign = (payload: unknown): string => {
	const root = (payload ?? {}) as Record<string, any>;
	const d: Record<string, any> = root.design ?? root;
	const candidate = d.link || d.rasterized_content_url || d.image_url || d.preview_url;
	return typeof candidate === 'string' ? candidate : '';
};
