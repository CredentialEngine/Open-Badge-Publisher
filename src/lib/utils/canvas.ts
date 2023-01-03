import type { Alignment, BadgeClassBasic } from '$lib/utils/badges.js';
import type { CtdlApiCredential } from '$lib/stores/publisherStore.js';
import {
	PUBLIC_UI_API_BASEURL, PUBLIC_PUBLISHER_API_ENV_LABEL
} from '$env/static/public';

// Canvas Options
export interface CanvasIssuer {
	entityId: string;
	openBadgeId: string;
	name: string;
	image?: string;
	email: string;
	description: string;
	url: string;
}

export interface CanvasBadge {
	entityId: string;
	openBadgeId: string;
	createdAt: string;
	createdBy: string;
	issuer: string;
	issuerOpenBadgeId: string;
	name: string;
	image: string;
	description: string;
	achievementType?: string;
	criteriaUrl?: string;
	criteriaNarrative?: string;
	alignments: Alignment[];
	tags: string[];
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

export const badgeclassFromCanvasApiBadge = (cb: CanvasBadge): BadgeClassBasic => {
	return {
		id: cb.openBadgeId,
		name: cb.name,
		description: cb.description,
		issuer: cb.issuerOpenBadgeId,
		image: cb.image,
		achievementType: cb.achievementType,
		tags: cb.tags,
		alignment: cb.alignments,
		criteria: {
			id: cb.criteriaUrl,
			narrative: cb.criteriaNarrative
		}
	};
};


	
