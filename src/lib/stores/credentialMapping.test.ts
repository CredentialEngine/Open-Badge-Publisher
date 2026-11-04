import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
	badgeClassToCtdlApiCredential,
	defaultAchievementTypeForBadgeAchievementType,
	publisherOrganization,
	publisherVerificationService
} from './publisherStore.js';
import type { BadgeClassCTDLExtended } from '../utils/badges.js';

const sampleBadge: BadgeClassCTDLExtended = {
	id: 'https://badges.example/1',
	name: 'Example badge',
	description: 'Demonstrates skills',
	issuer: 'https://issuer.example',
	image: 'https://images.example/1.png',
	achievementType: 'Certification',
	tags: ['web', 'accessibility'],
	criteria: { id: 'https://badges.example/criteria', narrative: 'Finish the course' },
	alignment: [
		{
			targetUrl: 'https://skills.example/a',
			targetName: 'Skill A',
			targetDescription: 'First skill'
		},
		{
			targetUrl: 'https://skills.example/self',
			targetName: 'Self-referential',
			targetDescription: '',
			targetFramework: 'Credential Transparency Description Language'
		}
	],
	'ceterms:dateEffective': '2024-01-02'
};

describe('Open Badge to CTDL conversion (no UI)', () => {
	beforeEach(() => {
		publisherOrganization.set({});
		publisherVerificationService.set('');
	});

	it('requires a selected publisher organization', () => {
		expect(() => badgeClassToCtdlApiCredential(sampleBadge)).toThrow(/Publishing org must be set/);
	});

	it('maps a badge into a CTDL draft and drops self-referential alignments', () => {
		publisherOrganization.set({ org: { CTID: 'ce-test-org' } } as Parameters<
			typeof publisherOrganization.set
		>[0]);
		publisherVerificationService.set('ce-verification');

		const draft = badgeClassToCtdlApiCredential(sampleBadge);

		expect(draft.PublishForOrganizationIdentifier).toBe('ce-test-org');
		expect(draft.Credential).toMatchObject({
			CredentialId: 'https://badges.example/1',
			CredentialType: 'ceterms:Certification',
			Name: 'Example badge',
			Image: 'https://images.example/1.png',
			DateEffective: '2024-01-02',
			SubjectWebpage: 'https://badges.example/criteria',
			UsesVerificationService: ['ce-verification']
		});
		expect(Object.keys(draft.obAlignments)).toEqual(['https://skills.example/a']);
		expect(draft.obAlignments['https://skills.example/a'].skip).toBe(false);
		expect(get(publisherVerificationService)).toBe('ce-verification');
	});

	it('falls back to the badge identifier for the subject webpage', () => {
		publisherOrganization.set({ org: { CTID: 'ce-test-org' } } as Parameters<
			typeof publisherOrganization.set
		>[0]);
		const draft = badgeClassToCtdlApiCredential({
			...sampleBadge,
			criteria: { narrative: 'Finish training' }
		});
		expect(draft.Credential.SubjectWebpage).toBe('https://badges.example/1');
	});

	it('maps recognized achievement types and defaults unknown types to OpenBadge', () => {
		expect(defaultAchievementTypeForBadgeAchievementType('BachelorDegree')).toBe(
			'ceterms:BachelorDegree'
		);
		expect(defaultAchievementTypeForBadgeAchievementType('Achievement')).toBe('ceterms:OpenBadge');
		expect(defaultAchievementTypeForBadgeAchievementType('__proto__')).toBe('ceterms:OpenBadge');
		expect(defaultAchievementTypeForBadgeAchievementType('unexpected')).toBe('ceterms:OpenBadge');
	});
});
