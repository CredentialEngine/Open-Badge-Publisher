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

export enum BadgeSourceTypeOptions {
	None = '',
	Canvas = 'canvas',
	Credly = 'credly',
	JSON = 'json'
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
		canvasAccessToken,
		canvasAgreeTerms,
		canvasSelectedRegion,
		canvasSelectedIssuer,
		credlySelectedIssuer,
		credlyAgreeTerms,
		credlyIssuerData,
		credlyIssuerBadges
	],
	([
		$advancedBadgesFound,
		$badgeSourceType,
		$canvasAccessToken,
		$canvasAgreeTerms,
		$canvasSelectedRegion,
		$canvasSelectedIssuer,
		$credlySelectedIssuer,
		$credlyAgreeTerms,
		$credlyIssuerData,
		$credlyIssuerBadges
	]) => {
		if ($badgeSourceType == BadgeSourceTypeOptions['Canvas']) {
			return (
				!!$canvasAccessToken &&
				!!$canvasAgreeTerms &&
				!!$canvasSelectedRegion &&
				!!$canvasSelectedIssuer
			);
		} else if ($badgeSourceType == BadgeSourceTypeOptions['Credly']) {
			return (
				!!$credlySelectedIssuer &&
				!!$credlyAgreeTerms &&
				!!$credlyIssuerData &&
				!!$credlyIssuerBadges.length
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
		advancedBadgesFound
	],
	([
		$badgeSetupComplete,
		$badgeSourceType,
		$canvasSelectedIssuerBadges,
		$credlyIssuerBadges,
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
};
