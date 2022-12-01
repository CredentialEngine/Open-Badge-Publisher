import { writable } from 'svelte/store';

enum BadgeSourceTypeOptions {
	None,
	Canvas,
	Credly,
	JSON
}

interface CredlyOptions {
	apiKey: string;
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

// Credly Options
export const credlyOptions = writable<CredlyOptions>({ apiKey: '' });
