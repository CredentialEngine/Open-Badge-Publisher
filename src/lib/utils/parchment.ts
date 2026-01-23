import type { Alignment, BadgeClassCTDLExtended } from '$lib/utils/badges.js';
import {
    PUBLIC_PARCHMENT_AU_ENABLED,
    PUBLIC_PARCHMENT_AU_LOGIN_CLIENT_ID,
    PUBLIC_PARCHMENT_AU_LOGIN_CLIENT_SECRET,
    PUBLIC_PARCHMENT_CA_ENABLED,
    PUBLIC_PARCHMENT_CA_LOGIN_CLIENT_ID,
    PUBLIC_PARCHMENT_CA_LOGIN_CLIENT_SECRET,
    PUBLIC_PARCHMENT_EU_ENABLED,
    PUBLIC_PARCHMENT_EU_LOGIN_CLIENT_ID,
    PUBLIC_PARCHMENT_EU_LOGIN_CLIENT_SECRET,
    PUBLIC_PARCHMENT_TEST_ENABLED,
    PUBLIC_PARCHMENT_TEST_LOGIN_CLIENT_ID,
    PUBLIC_PARCHMENT_TEST_LOGIN_CLIENT_SECRET,
    PUBLIC_PARCHMENT_US_ENABLED,
    PUBLIC_PARCHMENT_US_LOGIN_CLIENT_ID,
    PUBLIC_PARCHMENT_US_LOGIN_CLIENT_SECRET
} from '$env/static/public';

// Canvas Options
export interface ParchmentIssuer {
    entityId: string;
    openBadgeId: string;
    name: string;
    image?: string;
    email: string;
    description: string;
    url: string;
}

export interface ParchmentBadge {
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

export interface ParchmentEnv {
    enabled?: boolean;
    client_id?: string;
    client_secret?: string;
    id?: string | undefined;
    domain?: string | undefined;
    apiDomain?: string | undefined;
    name?: string | undefined;
}
export type ParchmentEnvKey = 'us' | 'ca' | 'eu' | 'au' | 'test';

export const parchmentRegions: Map<ParchmentEnvKey, ParchmentEnv> = new Map([
    [
        'us',
        {
            id: 'us',
            domain: 'https://badges.parchment.com',
            apiDomain: 'https://api.badgr.io',
            name: 'United States'
        }
    ],
    [
        'ca',
        {
            id: 'ca',
            domain: 'https://badges.parchment.ca',
            apiDomain: 'https://api.ca.badgr.io',
            name: 'Canada'
        }
    ],
    [
        'eu',
        {
            id: 'eu',
            domain: 'https://badges.parchment.eu',
            apiDomain: 'https://api.eu.badgr.io',
            name: 'Europe'
        }
    ],
    [
        'au',
        {
            id: 'au',
            domain: 'https://badges.parchment.au',
            apiDomain: 'https://api.au.badgr.io',
            name: 'Australia'
        }
    ],
    [
        'test',
        {
            id: 'test',
            domain: 'https://test.badges.parchment.com',
            apiDomain: 'https://api.test.badgr.com',
            name: 'Test (test.badgr.com)'
        }
    ]
]);

export const badgeclassFromParchmentApiBadge = (pb: ParchmentBadge): BadgeClassCTDLExtended => {
    return {
        id: pb.openBadgeId,
        name: pb.name,
        description: pb.description,
        issuer: pb.issuerOpenBadgeId,
        image: pb.image,
        achievementType: pb.achievementType,
        tags: pb.tags,
        alignment: pb.alignments,
        criteria: {
            id: pb.criteriaUrl,
            narrative: pb.criteriaNarrative
        },
        'ceterms:dateEffective': pb.createdAt
    };
};

export const parchmentEnv = (regionKey: ParchmentEnvKey): ParchmentEnv => {
    const regionEnvVars: { [key: string]: ParchmentEnv } = {
        test: {
            enabled: PUBLIC_PARCHMENT_TEST_ENABLED == 'true',
            client_id: PUBLIC_PARCHMENT_TEST_LOGIN_CLIENT_ID,
            client_secret: PUBLIC_PARCHMENT_TEST_LOGIN_CLIENT_SECRET
        },
        au: {
            enabled: PUBLIC_PARCHMENT_AU_ENABLED == 'true',
            client_id: PUBLIC_PARCHMENT_AU_LOGIN_CLIENT_ID,
            client_secret: PUBLIC_PARCHMENT_AU_LOGIN_CLIENT_SECRET
        },
        ca: {
            enabled: PUBLIC_PARCHMENT_CA_ENABLED == 'true',
            client_id: PUBLIC_PARCHMENT_CA_LOGIN_CLIENT_ID,
            client_secret: PUBLIC_PARCHMENT_CA_LOGIN_CLIENT_SECRET
        },
        eu: {
            enabled: PUBLIC_PARCHMENT_EU_ENABLED == 'true',
            client_id: PUBLIC_PARCHMENT_EU_LOGIN_CLIENT_ID,
            client_secret: PUBLIC_PARCHMENT_EU_LOGIN_CLIENT_SECRET
        },
        us: {
            enabled: PUBLIC_PARCHMENT_US_ENABLED == 'true',
            client_id: PUBLIC_PARCHMENT_US_LOGIN_CLIENT_ID,
            client_secret: PUBLIC_PARCHMENT_US_LOGIN_CLIENT_SECRET
        }
    };
    return {
        ...parchmentRegions.get(regionKey),
        ...regionEnvVars[regionKey]
    };
};
