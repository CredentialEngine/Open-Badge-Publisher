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

// Raw shape of one entry from Accredible's `/v1/issuer/all_groups` endpoint,
// limited to the fields Accredible's own export script reads.
export interface AccredibleGroup {
	id: number | string;
	name?: string;
	course_name?: string;
	course_description?: string;
	description?: string;
	earning_criteria?: string;
	achievement_type?: string;
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
			narrative: g.earning_criteria || `See ${env.credentialDomain}/group/${g.id} for details.`
		},
		alignment
	};
};

export const accredibleAuthHeader = (apiKey: string) => ({
	Name: 'Authorization',
	Value: `Token token=${apiKey}`
});

// TODO(confirm with Accredible): endpoint for a badge design/credential image,
// keyed by group id. Accredible's export script does not fetch images at all,
// so this endpoint path is NOT verified -- it's a placeholder for whichever
// call Accredible's API reference specifies (possibly a `/v1/credentials`
// lookup filtered by group, or a dedicated design endpoint). Wire this into
// fetchAccredibleGroups() in badgeSourceStore.ts once confirmed; until then,
// image lookup silently falls back to extractImageFromGroup() (usually '').
export const ACCREDIBLE_GROUP_IMAGE_ENDPOINT_UNCONFIRMED = (env: AccredibleEnv, groupId: string) =>
	`${env.apiDomain}/v1/issuer/all_groups/${groupId}`; // placeholder -- verify with Accredible
