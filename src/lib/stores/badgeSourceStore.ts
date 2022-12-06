import { writable, derived, get } from 'svelte/store';
import { array } from 'yup';

enum BadgeSourceTypeOptions {
	None = '',
	Canvas = 'canvas',
	Credly = 'credly',
	JSON = 'json'
}

export const badgeSourceType = writable(BadgeSourceTypeOptions['None']);
export const badgeSetupStep = writable(1);

interface Alignment {
	targetName: string;
	targetUrl: string;
	targetDescription: string;
	targetFramework?: string;
	targetCode?: string;
}

interface BadgeClassBasic {
	id: string;
	name: string;
	image: string;
	description: string;
	issuer: string;
	achievementType?: string | null;
	tags: string[];
	criteria: {
		id?: string | null;
		narrative?: string | null;
	};
	alignment: Alignment[];
}

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

interface CanvasBadge {
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

const badgeclassFromCanvasApiBadge = (cb: CanvasBadge): BadgeClassBasic => {
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
export const canvasIssuers = writable<CanvasIssuer[]>();
export const canvasSelectedIssuer = writable<CanvasIssuer>();
export const canvasSelectedIssuerBadges = writable<CanvasBadge[]>([]);

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
	}>;
	skills: Array<{
		id: string;
		name: string;
		vanity_slug: string;
	}>;
	badge_template_activities: Array<{
		id: string;
		activity_type: string;
		required_badge_template_id?: string | null;
		title: string;
		url?: string | null;
	}>;
	url?: string | null;
}

export const credlySelectedIssuer = writable<string>('');
export const credlyAgreeTerms = writable<boolean>(false);
export const credlyIssuerData = writable<CredlyIssuerBasic | undefined>();
export const credlyIssuerBadges = writable<Array<CredlyBadgeBasic>>([]);

const badgeclassFromCredlyApiBadge = (cb: CredlyBadgeBasic): BadgeClassBasic => {
	const issuerId = get(credlyIssuerData)?.id;
	const criteriaComponents =
		cb.badge_template_activities?.map((a) => `{$a.activity_type}: ${a.title}`).join(' \n') || '';
	return {
		id: `https://api.credly.com/v1/obi/v2/issuers/${issuerId}/badge_classes/${cb.id}`,
		name: cb.name,
		description: cb.description,
		issuer: `https://api.credly.com/v1/obi/v2/issuers/${issuerId}`,
		image: cb.image_url,
		achievementType: null,
		tags: cb.skills?.map((s) => s.name),
		alignment: cb.alignments?.map((a) => {
			return {
				targetUrl: a.url,
				targetName: a.name,
				targetDescription: a.description
			};
		}),
		criteria: {
			id: cb.url,
			narrative: criteriaComponents
		}
	};
};

// Advanced JSON setup
export const advancedBadgeInputJson = writable<string>('');
const badgeclassFromAdvancedJson = (b: BadgeClassBasic): BadgeClassBasic => {
	const destructured = ({
		id,
		name,
		description,
		issuer,
		image,
		achievementType,
		tags,
		alignment,
		criteria
	} = b);
	return destructured;
};
const badgeclassesFromAdvancedJson = (): BadgeClassBasic[] => {
	const parsed = JSON.parse(get(advancedBadgeInputJson));
	if (Array.isArray(parsed)) return parsed.map(badgeclassFromAdvancedJson);
	else if (typeof parsed === 'object') return [badgeclassFromAdvancedJson(parsed)];
	return [];
};

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
			);
		} else if ($badgeSourceType == BadgeSourceTypeOptions['Credly']) {
			return (
				!!$credlySelectedIssuer &&
				!!$credlyAgreeTerms &&
				!!$credlyIssuerData &&
				!!$credlyIssuerBadges.length
			);
		}

		// JSON not implemented
		return false;
	}
);

export const normalizedBadges = derived(
	[badgeSetupComplete, badgeSourceType, canvasSelectedIssuerBadges, credlyIssuerBadges],
	([$badgeSetupComplete, $badgeSourceType, $canvasSelectedIssuerBadges, $credlyIssuerBadges]) => {
		if (!$badgeSetupComplete) {
			console.log('Error: attempted to get list of badges while setup is incomplete');
			return [];
		}

		if (get(badgeSourceType) == BadgeSourceTypeOptions['Canvas']) {
			return $canvasSelectedIssuerBadges.map(badgeclassFromCanvasApiBadge);
		} else if (get(badgeSourceType) == BadgeSourceTypeOptions['Credly']) {
			return $credlyIssuerBadges.map(badgeclassFromCredlyApiBadge);
		} else {
			// TODO add advanced JSON badges
			return [];
		}
	}
);

export const checkedBadges = writable<{ [key: string]: boolean }>({});
