import { describe, expect, it } from 'vitest';
import {
	accredibleAuthHeader,
	accredibleDesignEndpoint,
	accredibleDesignPreviewEndpoint,
	accredibleGroupDetailEndpoint,
	accredibleRegions,
	badgeclassFromAccredibleGroup,
	badgeDesignIdForGroup,
	groupFromDetailPayload,
	imageUrlFromDesign,
	type AccredibleGroup
} from './accredible.js';

const sandbox = accredibleRegions.get('sandbox')!;

describe('Accredible badge conversion (business logic)', () => {
	it('maps a group into a credential-ready badge with sorted, plain-text criteria', () => {
		const badge = badgeclassFromAccredibleGroup(
			{
				id: 12,
				course_name: 'Cloud Fundamentals',
				course_description: '<p>Learn <strong>cloud</strong> foundations</p>',
				earning_criteria: [
					{ position: 2, text: '<p>Submit work</p>', required: false },
					{ position: 1, text: '<p>Complete training</p>', required: true }
				]
			},
			sandbox,
			'https://images.example/badge.png'
		);

		expect(badge).toMatchObject({
			id: 'https://sandbox.credential.net/group/12',
			name: 'Cloud Fundamentals',
			description: 'Learn cloud foundations',
			image: 'https://images.example/badge.png',
			achievementType: 'Achievement',
			issuer: '',
			criteria: { narrative: 'Complete training\n\nSubmit work (optional)' }
		});
		expect(badge.alignment).toEqual([]);
	});

	it('uses URL-bearing skills and ignores unresolved bare-string learning outcomes', () => {
		const badge = badgeclassFromAccredibleGroup(
			{
				id: 4,
				name: 'Example',
				skill_framework: { name: 'Framework A' },
				skills: [
					{
						name: 'Skill A',
						url: 'https://skills.example/a',
						identifier: 'A1',
						description: '<b>Analysis</b>'
					},
					{ name: 'Not resolvable' },
					{ name: 'Missing URL', url: '' }
				],
				learning_outcomes: ['Free text with no URL']
			},
			sandbox
		);

		expect(badge.alignment).toEqual([
			{
				targetName: 'Skill A',
				targetUrl: 'https://skills.example/a',
				targetDescription: 'Analysis',
				targetFramework: 'Framework A',
				targetCode: 'A1'
			}
		]);
	});

	it('merges structured outcomes, giving skills precedence for duplicate URLs', () => {
		const badge = badgeclassFromAccredibleGroup(
			{
				id: 5,
				skills: [{ name: 'Preferred skill', url: 'https://skills.example/shared' }],
				learning_outcomes: [
					{ name: 'Other name', targetUrl: 'https://skills.example/shared' },
					{
						name: 'Separate competency',
						targetUrl: 'https://skills.example/other',
						targetCode: 'B2'
					},
					{ name: 'No URL' }
				]
			},
			sandbox
		);

		expect(badge.alignment.map((a) => [a.targetName, a.targetUrl])).toEqual([
			['Preferred skill', 'https://skills.example/shared'],
			['Separate competency', 'https://skills.example/other']
		]);
	});

	it('provides a criteria fallback and prefers a supplied image to a group image', () => {
		const badge = badgeclassFromAccredibleGroup(
			{
				id: 'group-id',
				name: 'Short name',
				description: 'Description',
				image_url: 'https://old.example/image'
			},
			sandbox,
			'https://new.example/image'
		);

		expect(badge.image).toBe('https://new.example/image');
		expect(badge.criteria.narrative).toBe(
			'See https://sandbox.credential.net/group/group-id for details.'
		);
	});

	it('handles empty criterion objects without emitting empty narratives', () => {
		const badge = badgeclassFromAccredibleGroup(
			{ id: 8, earning_criteria: [{ text: ' ' }, { text: '<p></p>' }] },
			sandbox
		);
		expect(badge.criteria.narrative).toBe(
			'See https://sandbox.credential.net/group/8 for details.'
		);
	});
});

describe('Accredible API response helpers', () => {
	it('unwraps valid group detail envelopes and rejects invalid payloads', () => {
		expect(groupFromDetailPayload({ group: { id: 3, name: 'Group' } })).toMatchObject({ id: 3 });
		expect(groupFromDetailPayload({ id: 4 })).toMatchObject({ id: 4 });
		expect(groupFromDetailPayload({ group: {} })).toBeUndefined();
		expect(groupFromDetailPayload(null)).toBeUndefined();
	});

	it('uses the badge design before the primary, generic and certificate designs', () => {
		const group: AccredibleGroup = {
			id: 1,
			badge_design_id: 9,
			primary_design_id: 8,
			design_id: 7,
			certificate_design_id: 6
		};
		expect(badgeDesignIdForGroup(group)).toBe(9);
		expect(badgeDesignIdForGroup({ id: 1, badge_design_id: '', primary_design_id: 8 })).toBe(8);
		expect(badgeDesignIdForGroup({ id: 1 })).toBeUndefined();
	});

	it('reads documented design preview links and tolerated fallbacks', () => {
		expect(imageUrlFromDesign({ link: 'https://images.example/primary' })).toBe(
			'https://images.example/primary'
		);
		expect(
			imageUrlFromDesign({ design: { rasterized_content_url: 'https://images.example/fallback' } })
		).toBe('https://images.example/fallback');
		expect(imageUrlFromDesign({ link: 123 })).toBe('');
		expect(imageUrlFromDesign(null)).toBe('');
	});

	it('generates the expected API endpoints and authentication header', () => {
		expect(accredibleAuthHeader('test-key')).toEqual({
			Name: 'Authorization',
			Value: 'Token token=test-key'
		});
		expect(accredibleGroupDetailEndpoint(sandbox, 23)).toBe(
			'https://sandbox.api.accredible.com/v1/issuer/groups/23'
		);
		expect(accredibleDesignEndpoint(sandbox, 4)).toBe(
			'https://sandbox.api.accredible.com/v1/designs/4'
		);
		expect(accredibleDesignPreviewEndpoint(sandbox, 4)).toBe(
			'https://sandbox.api.accredible.com/v1/designs/4/preview'
		);
	});
});
