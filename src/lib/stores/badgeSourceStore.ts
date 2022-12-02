import { writable, derived } from 'svelte/store';

enum BadgeSourceTypeOptions {
	None = '',
	Canvas = 'canvas',
	Credly = 'credly',
	JSON = 'json'
}

export const badgeSourceType = writable(BadgeSourceTypeOptions['None']);
export const badgeSetupStep = writable(1);

// Canvas Options
interface CanvasIssuer {
	entityId: string;
	openBadgeId: string;
	name: string;
	image?: string;
	email: string;
	description: string;
	url: string;
}

export const canvasRegions = new Map([
	[
		'us',
		{
			id: 'us',
			domain: 'https://badgr.com',
			apiDomain: 'https://api.badgr.io',
			name: 'United States'
		}
	],
	[
		'ca',
		{
			id: 'ca',
			domain: 'https://ca.badgr.com',
			apiDomain: 'https://api.ca.badgr.io',
			name: 'Canada'
		}
	],
	[
		'eu',
		{
			id: 'eu',
			domain: 'https://eu.badgr.com',
			apiDomain: 'https://api.eu.badgr.io',
			name: 'Europe'
		}
	],
	[
		'au',
		{
			id: 'au',
			domain: 'https://au.badgr.com',
			apiDomain: 'https://api.au.badgr.io',
			name: 'Australia'
		}
	],
	[
		'test',
		{
			id: 'test',
			domain: 'https://test.badgr.com',
			apiDomain: 'https://api.test.badgr.com',
			name: 'Test (test.badgr.com)'
		}
	]
]);

export const canvasAccessToken = writable<string>('');
export const canvasAgreeTerms = writable(false);
export const canvasSelectedRegion = writable('');
export const canvasIssuers = writable<Array<CanvasIssuer>>();
export const canvasSelectedIssuer = writable<CanvasIssuer>();

// Credly Options
interface CredlyIssuerBasic {
	id: string;
	name: string;
	vanity_url: string;
	badge_count: number;
}
export interface CredlyBadgeBasic {
	id: string;
	name: string;
	description: string;
	image_url: string;
	alignments: Array<{
		id: string;
		name: string;
		description: string;
		url: string;
	}>
}

export const credlySelectedIssuer = writable<string>('');
export const credlyAgreeTerms = writable<boolean>(false);
export const credlyIssuerData = writable<CredlyIssuerBasic | undefined>();
export const credlyIssuerBadges = writable<Array<CredlyBadgeBasic>>([]);

// Is Badge Setup Complete?
export const badgeSetupComplete = derived(
	[
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
			)
		} else if ($badgeSourceType == BadgeSourceTypeOptions['Credly']) {
			return (
				!!$credlySelectedIssuer &&
				!!$credlyAgreeTerms &&
				!!$credlyIssuerData &&
				!!$credlyIssuerBadges.length
			)
		}

		// JSON not implemented
		return false;
	}
);
