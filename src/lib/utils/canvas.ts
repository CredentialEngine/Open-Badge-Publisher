import type { Alignment, BadgeClassCTDLExtended } from '$lib/utils/badges.js';
import {
	PUBLIC_CANVAS_AU_ENABLED,
	PUBLIC_CANVAS_AU_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_AU_LOGIN_CLIENT_SECRET,
	PUBLIC_CANVAS_CA_ENABLED,
	PUBLIC_CANVAS_CA_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_CA_LOGIN_CLIENT_SECRET,
	PUBLIC_CANVAS_EU_ENABLED,
	PUBLIC_CANVAS_EU_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_EU_LOGIN_CLIENT_SECRET,
	PUBLIC_CANVAS_TEST_ENABLED,
	PUBLIC_CANVAS_TEST_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_TEST_LOGIN_CLIENT_SECRET,
	PUBLIC_CANVAS_US_ENABLED,
	PUBLIC_CANVAS_US_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_US_LOGIN_CLIENT_SECRET,
	PUBLIC_PUBLISHER_API_ENV_LABEL,
	PUBLIC_UI_API_BASEURL
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

export interface CanvasEnv {
	enabled?: boolean;
	client_id?: string;
	client_secret?: string;
	id?: string | undefined;
	domain?: string | undefined;
	apiDomain?: string | undefined;
	name?: string | undefined;
}
export type CanvasEnvKey = 'us' | 'ca' | 'eu' | 'au' | 'test';

export const canvasRegions: Map<CanvasEnvKey, CanvasEnv> = new Map([
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

export const badgeclassFromCanvasApiBadge = (cb: CanvasBadge): BadgeClassCTDLExtended => {
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
		},
		'ceterms:dateEffective': cb.createdAt
	};
};

export const canvasEnv = (regionKey: CanvasEnvKey): CanvasEnv => {
	const regionEnvVars: { [key: string]: CanvasEnv } = {
		test: {
			enabled: PUBLIC_CANVAS_TEST_ENABLED == 'true',
			client_id: PUBLIC_CANVAS_TEST_LOGIN_CLIENT_ID,
			client_secret: PUBLIC_CANVAS_TEST_LOGIN_CLIENT_SECRET
		},
		au: {
			enabled: PUBLIC_CANVAS_AU_ENABLED == 'true',
			client_id: PUBLIC_CANVAS_AU_LOGIN_CLIENT_ID,
			client_secret: PUBLIC_CANVAS_AU_LOGIN_CLIENT_SECRET
		},
		ca: {
			enabled: PUBLIC_CANVAS_CA_ENABLED == 'true',
			client_id: PUBLIC_CANVAS_CA_LOGIN_CLIENT_ID,
			client_secret: PUBLIC_CANVAS_CA_LOGIN_CLIENT_SECRET
		},
		eu: {
			enabled: PUBLIC_CANVAS_EU_ENABLED == 'true',
			client_id: PUBLIC_CANVAS_EU_LOGIN_CLIENT_ID,
			client_secret: PUBLIC_CANVAS_EU_LOGIN_CLIENT_SECRET
		},
		us: {
			enabled: PUBLIC_CANVAS_US_ENABLED == 'true',
			client_id: PUBLIC_CANVAS_US_LOGIN_CLIENT_ID,
			client_secret: PUBLIC_CANVAS_US_LOGIN_CLIENT_SECRET
		}
	};
	return {
		...canvasRegions.get(regionKey),
		...regionEnvVars[regionKey]
	};
};
