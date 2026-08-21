import type { BadgeClassBasic, BadgeClassCTDLExtended } from '$lib/utils/badges.js';
import {
	badgeclassFromCanvasApiBadge,
	canvasRegions,
	type CanvasBadge,
	type CanvasIssuer,
	type CanvasEnvKey
} from '$lib/utils/canvas.js';
import type { CredlyBadgeBasic, CredlyIssuerBasic } from '$lib/utils/credly.js';
import { writable, derived, get, type Readable } from 'svelte/store';
import { PUBLIC_UI_API_BASEURL } from '$env/static/public';
import { publisherUser } from '$lib/stores/publisherStore.js';
import { badgeclassFromParchmentApiBadge, type ParchmentBadge, type ParchmentEnvKey, type ParchmentIssuer, parchmentRegions } from '$lib/utils/parchment.js';
import {
	accredibleAuthHeader,
	accredibleDesignEndpoint,
	accredibleDesignPreviewEndpoint,
	accredibleRegions,
	badgeclassFromAccredibleGroup,
	badgeDesignIdForGroup,
	imageUrlFromDesign,
	type AccredibleEnvKey,
	type AccredibleGroup
} from '$lib/utils/accredible.js';

export enum BadgeSourceTypeOptions {
	None = '',
	Accredible = 'accredible',
	Canvas = 'canvas',
	Credly = 'credly',
	JSON = 'json',
	Parchment = 'parchment'
}

export const badgeSourceType = writable(BadgeSourceTypeOptions['None']);
export const badgeSetupStep = writable(0);

// Canvas configuration
export const canvasAccessToken = writable<string>('');
export const canvasAgreeTerms = writable(false);
export const canvasSelectedRegion = writable<CanvasEnvKey | ''>('');
export const canvasIssuers = writable<CanvasIssuer[]>();
export const canvasSelectedIssuer = writable<CanvasIssuer | undefined>();
export const canvasSelectedIssuerBadges = writable<CanvasBadge[]>([]);

export const fetchCanvasIssuerBadges = async (): Promise<boolean> => {
	if (!get(canvasSelectedRegion) || !get(canvasAgreeTerms) || !get(canvasAccessToken)) return false;

	const requestData = {
		URL: `${canvasRegions.get(get(canvasSelectedRegion) || 'test')?.apiDomain}/v2/issuers/${
			get(canvasSelectedIssuer)?.entityId
		}/badgeclasses`,
		Method: 'GET',
		Body: null,
		Headers: [
			{
				Name: 'Authorization',
				Value: `Bearer ${get(canvasAccessToken)}`
			},
			{
				Name: 'Accept',
				Value: 'application/json'
			}
		]
	};

	let proxyRequestHeaders = new Headers();
	proxyRequestHeaders.append('Content-Type', 'application/json');
	if (get(publisherUser).user?.Token)
		proxyRequestHeaders.append('Authorization', `Bearer ${get(publisherUser).user?.Token}`);

	const proxyResponse = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
		method: 'POST',
		body: JSON.stringify(requestData),
		headers: proxyRequestHeaders
	});
	const proxyResponseData = await proxyResponse.json();

	if (!proxyResponseData.Valid || proxyResponseData.Data?.StatusCode != '200')
		throw new Error('Error fetching badge data from Canvas Credentials.');

	const issuerBadgeData = JSON.parse(proxyResponseData.Data?.Body);
	canvasSelectedIssuerBadges.set(issuerBadgeData.result);

	return true;
};

// Credly Options
export const credlySelectedIssuer = writable<string>('');
export const credlyAgreeTerms = writable<boolean>(false);
export const credlyIssuerData = writable<CredlyIssuerBasic | undefined>();
export const credlyIssuerBadges = writable<Array<CredlyBadgeBasic>>([]);

const badgeclassFromCredlyApiBadge = (cb: CredlyBadgeBasic): BadgeClassBasic => {
	const issuerId = get(credlyIssuerData)?.id;
	const criteriaComponents =
		cb.badge_template_activities
			?.map((a) => {
				let ret = `${a.activity_type}: ${a.title}`;
				if (a.url) ret += ` ( ${a.url} )`;
				return ret;
			})
			.join(' \n\n') || '';

	const originalAlignments =
		cb.alignments?.map((a) => {
			return {
				targetUrl: a.url,
				targetName: a.name,
				targetDescription: a.description
			};
		}) ?? [];
	const skillsAlignments =
		cb.skills?.map((s) => {
			return {
				targetUrl: `https://www.credly.com/skills/${s.vanity_slug}`,
				targetName: s.name,
				targetDescription:
					'Credly Skill Alignment. Skill trends, top job titles, and related skills are available.'
			};
		}) ?? [];

	return {
		id: `https://api.credly.com/v1/obi/v2/issuers/${issuerId}/badge_classes/${cb.id}`,
		name: cb.name,
		description: cb.description,
		issuer: `https://api.credly.com/v1/obi/v2/issuers/${issuerId}`,
		image: cb.image_url,
		achievementType: null,
		tags: [], // CE requested that skills show up in alignments instead of tags
		alignment: [...originalAlignments, ...skillsAlignments],
		criteria: {
			id: cb.url, // https://www.credly.com/org/education-design-lab/badge/resilience.7
			narrative: criteriaComponents
		}
	};
};

// Parchment configuration
export const parchmentAccessToken = writable<string>('');
export const parchmentAgreeTerms = writable(false);
export const parchmentSelectedRegion = writable<ParchmentEnvKey | ''>('');
export const parchmentOrganization = writable<string>('');
export const parchmentIssuers = writable<ParchmentIssuer[]>();
export const parchmentSelectedIssuer = writable<ParchmentIssuer | undefined>();
export const parchmentSelectedIssuerBadges = writable<ParchmentBadge[]>([]);

export const fetchParchmentIssuerBadges = async (): Promise<boolean> => {
	if (!get(parchmentSelectedRegion) || !get(parchmentAgreeTerms) || !get(parchmentAccessToken)) return false;

	const requestData = {
		URL: `${parchmentRegions.get(get(parchmentSelectedRegion) || 'test')?.apiDomain}/v2/issuers/${
			get(parchmentSelectedIssuer)?.entityId
		}/badgeclasses`,
		Method: 'GET',
		Body: null,
		Headers: [
			{
				Name: 'Authorization',
				Value: `Bearer ${get(parchmentAccessToken)}`
			},
			{
				Name: 'Accept',
				Value: 'application/json'
			}
		]
	};

	const proxyRequestHeaders = new Headers();
	proxyRequestHeaders.append('Content-Type', 'application/json');
	if (get(publisherUser).user?.Token)
		proxyRequestHeaders.append('Authorization', `Bearer ${get(publisherUser).user?.Token}`);

	const proxyResponse = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
		method: 'POST',
		body: JSON.stringify(requestData),
		headers: proxyRequestHeaders
	});
	const proxyResponseData = await proxyResponse.json();

	if (!proxyResponseData.Valid || proxyResponseData.Data?.StatusCode != '200')
		throw new Error('Error fetching badge data from Parchment.');

	const issuerBadgeData = JSON.parse(proxyResponseData.Data?.Body);
	parchmentSelectedIssuerBadges.set(issuerBadgeData.result);

	return true;
};

// Accredible configuration
export const accredibleApiKey = writable<string>('');
export const accredibleAgreeTerms = writable(false);
export const accredibleSelectedRegion = writable<AccredibleEnvKey | ''>('');
export const accredibleGroups = writable<AccredibleGroup[]>([]);

export const fetchAccredibleGroups = async (): Promise<boolean> => {
	const region = get(accredibleSelectedRegion);
	const apiKey = get(accredibleApiKey);
	if (!region || !get(accredibleAgreeTerms) || !apiKey) return false;

	const env = accredibleRegions.get(region);
	if (!env) return false;

	const proxyRequestHeaders = new Headers();
	proxyRequestHeaders.append('Content-Type', 'application/json');
	if (get(publisherUser).user?.Token)
		proxyRequestHeaders.append('Authorization', `Bearer ${get(publisherUser).user?.Token}`);

	// Accredible's `/v1/issuer/all_groups` endpoint is paginated (page/page_size,
	// matching Accredible's own export script). We page through until a page
	// comes back with fewer than page_size results.
	const pageSize = 50;
	let page = 1;
	let allGroups: AccredibleGroup[] = [];

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const requestData = {
			URL: `${env.apiDomain}/v1/issuer/all_groups?page=${page}&page_size=${pageSize}`,
			Method: 'GET',
			Body: null,
			Headers: [accredibleAuthHeader(apiKey), { Name: 'Accept', Value: 'application/json' }]
		};

		const proxyResponse = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
			method: 'POST',
			body: JSON.stringify(requestData),
			headers: proxyRequestHeaders
		});
		const proxyResponseData = await proxyResponse.json();

		if (!proxyResponseData.Valid || proxyResponseData.Data?.StatusCode != '200') {
			const status = proxyResponseData.Data?.StatusCode ?? proxyResponseData.StatusCode;
			const detail =
				proxyResponseData.Data?.Body || proxyResponseData.StatusMessage || 'no response body';
			const hint =
				status == 401 || status == 403
					? ' Check that the API key is correct and matches the selected region.'
					: '';
			throw new Error(
				`Error fetching group data from Accredible (status ${status ?? 'unknown'}).${hint} ` +
					`Details: ${String(detail).slice(0, 300)}`
			);
		}

		const body = JSON.parse(proxyResponseData.Data?.Body);
		// NOTE: the exact envelope key returned by this endpoint was not confirmed
		// against Accredible's API reference (unreachable while building this).
		// Handle a few plausible shapes defensively; adjust once confirmed.
		const pageGroups: AccredibleGroup[] = body.groups || body.all_groups || (Array.isArray(body) ? body : []);

		allGroups = [...allGroups, ...pageGroups];

		if (pageGroups.length < pageSize) break;
		page += 1;
		if (page > 200) break; // safety valve against an unexpected infinite loop
	}

	// Best-effort: resolve a badge image for each group from its Design.
	// The group payload carries no image, only design ids; for a badge we use
	// `badge_design_id` (falling back to the primary/default design). An image
	// lookup failure is logged and never breaks the overall fetch.
	const proxyRequest = async (
		method: string,
		url: string,
		body: string | null = null
	): Promise<any | null> => {
		const response = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
			method: 'POST',
			body: JSON.stringify({
				URL: url,
				Method: method,
				Body: body,
				Headers: [
					accredibleAuthHeader(apiKey),
					{ Name: 'Accept', Value: 'application/json' },
					{ Name: 'Content-Type', Value: 'application/json' }
				]
			}),
			headers: proxyRequestHeaders
		});
		const data = await response.json();
		if (data.Valid && data.Data?.StatusCode == '200') return JSON.parse(data.Data.Body);
		return null;
	};

	// The design's rasterized image is a BLANK template (no data merged), so to
	// match how Accredible renders the badge we POST to the design /preview
	// endpoint with the group's display name merged in (`group.course_name` /
	// `group.name`), which returns a rendered `{ link }`. We fall back to the
	// blank rasterized image only if the merged render fails. Because the merged
	// image depends on the name, it's per-group; we cache by design+name since
	// groups can share a design and name.
	const imageCache = new Map<string, string>();
	for (const g of allGroups) {
		if (g.image_url) continue;
		const designId = badgeDesignIdForGroup(g);
		if (designId === undefined) continue;
		const name = g.course_name || g.name || '';
		const cacheKey = `${designId}|${name}`;
		if (imageCache.has(cacheKey)) {
			g.image_url = imageCache.get(cacheKey);
			continue;
		}
		try {
			// Render the design with the group's name merged in.
			const previewBody = JSON.stringify({ 'group.course_name': name, 'group.name': name });
			let img = imageUrlFromDesign(
				await proxyRequest('POST', accredibleDesignPreviewEndpoint(env, designId), previewBody)
			);
			if (!img) {
				// Fallback: the design's blank rasterized image (no name merged).
				img = imageUrlFromDesign(await proxyRequest('GET', accredibleDesignEndpoint(env, designId)));
			}
			if (img) {
				imageCache.set(cacheKey, img);
				g.image_url = img;
			}
		} catch (e) {
			console.warn(`Could not load Accredible design ${designId} for a badge image:`, e);
		}
	}

	accredibleGroups.set(allGroups);
	return true;
};

// Advanced JSON setup
export const advancedBadges = writable<Array<BadgeClassBasic | null>>([]);
export const advancedBadgesFound = derived(
	advancedBadges,
	($advancedBadges): BadgeClassBasic[] =>
		$advancedBadges.filter((e) => e != null) as BadgeClassBasic[]
);

// Is Badge Setup Complete?
export const badgeSetupComplete = derived(
	[
		advancedBadgesFound,
		badgeSourceType,
		credlySelectedIssuer,
		credlyAgreeTerms,
		credlyIssuerData,
		credlyIssuerBadges,
		parchmentAccessToken,
		parchmentAgreeTerms,
		parchmentSelectedRegion,
		parchmentSelectedIssuer,
		parchmentOrganization,
		accredibleApiKey,
		accredibleAgreeTerms,
		accredibleSelectedRegion,
		accredibleGroups
	],
	([
		$advancedBadgesFound,
		$badgeSourceType,
		$credlySelectedIssuer,
		$credlyAgreeTerms,
		$credlyIssuerData,
		$credlyIssuerBadges,
		$parchmentAccessToken,
		$parchmentAgreeTerms,
		$parchmentSelectedRegion,
		$parchmentSelectedIssuer,
		$parchmentOrganization,
		$accredibleApiKey,
		$accredibleAgreeTerms,
		$accredibleSelectedRegion,
		$accredibleGroups
	]) => {
		if ($badgeSourceType == BadgeSourceTypeOptions['Credly']) {
			return (
				!!$credlySelectedIssuer &&
				!!$credlyAgreeTerms &&
				!!$credlyIssuerData &&
				!!$credlyIssuerBadges.length
			);
		}else if ($badgeSourceType == BadgeSourceTypeOptions['Parchment']) {
			return (
				!!$parchmentAccessToken &&
				!!$parchmentAgreeTerms &&
				!!$parchmentSelectedRegion &&
				!!$parchmentSelectedIssuer &&
				!!$parchmentOrganization
			);
		} else if ($badgeSourceType == BadgeSourceTypeOptions['Accredible']) {
			return (
				!!$accredibleApiKey &&
				!!$accredibleAgreeTerms &&
				!!$accredibleSelectedRegion &&
				!!$accredibleGroups.length
			);
		} else {
			return !!$advancedBadgesFound.length;
		}

		// JSON not implemented
		return false;
	}
);

export const normalizedBadges: Readable<BadgeClassCTDLExtended[]> = derived(
	[
		badgeSetupComplete,
		badgeSourceType,
		canvasSelectedIssuerBadges,
		credlyIssuerBadges,
		parchmentSelectedIssuerBadges,
		accredibleGroups,
		accredibleSelectedRegion,
		advancedBadgesFound
	],
	([
		$badgeSetupComplete,
		$badgeSourceType,
		$canvasSelectedIssuerBadges,
		$credlyIssuerBadges,
		$parchmentSelectedIssuerBadges,
		$accredibleGroups,
		$accredibleSelectedRegion,
		$advancedBadgesFound
	]) => {
		if (!$badgeSetupComplete) {
			console.log('Error: attempted to get list of badges while setup is incomplete');
			return [];
		}

		if (get(badgeSourceType) == BadgeSourceTypeOptions['Canvas']) {
			return $canvasSelectedIssuerBadges.map(badgeclassFromCanvasApiBadge);
		} else if (get(badgeSourceType) == BadgeSourceTypeOptions['Credly']) {
			return $credlyIssuerBadges.map(badgeclassFromCredlyApiBadge);
		}  else if (get(badgeSourceType) == BadgeSourceTypeOptions['Parchment']) {
			return $parchmentSelectedIssuerBadges.map(badgeclassFromParchmentApiBadge);
		} else if (get(badgeSourceType) == BadgeSourceTypeOptions['Accredible']) {
			const env = $accredibleSelectedRegion ? accredibleRegions.get($accredibleSelectedRegion) : undefined;
			if (!env) return [];
			return $accredibleGroups.map((g) => badgeclassFromAccredibleGroup(g, env));
		} else {
			return $advancedBadgesFound;
		}
	}
);

export const checkedBadges = writable<{ [key: string]: boolean }>({});

export const resetBadgeData = () => {
	badgeSetupStep.set(0);
	checkedBadges.set({});
	badgeSourceType.set(BadgeSourceTypeOptions['None']);
	credlyIssuerBadges.set([]);
	credlySelectedIssuer.set('');
	credlyIssuerData.set(undefined);

	// Does not invalidate canvasAuthToken
	canvasIssuers.set([]);
	canvasSelectedIssuer.set(undefined);
	canvasSelectedIssuerBadges.set([]);

	parchmentIssuers.set([]);
	parchmentSelectedIssuer.set(undefined);
	parchmentSelectedIssuerBadges.set([]);

	// Does not invalidate accredibleApiKey
	accredibleGroups.set([]);
};
