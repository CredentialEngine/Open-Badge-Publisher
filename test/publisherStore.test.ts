import { assert, test } from 'vitest';
import { get } from 'svelte/store';
import {
	credentialDrafts,
	type ConditionProfile,
	type Occupation,
	CtdlCredentialDraft,
	mergeOccupationAlignment,
	mergeQAAlignment,
	mergeAllAlignments,
	mergeSingleAlignment,
	filterAlignmentFromCredential
} from '../src/lib/stores/publisherStore.js';

const exampleCredential: CtdlCredentialDraft = {
	PublishForOrganizationIdentifier: 'abc123',
	Credential: {
		CredentialId: 'https://example.com/credentials/a',

		CredentialType: 'Badge',
		CredentialStatusType: 'Active',
		Name: 'Skillful Badge',
		Description: 'Held by skillful people',

		OwnedBy: [{ CTID: 'ce-696ea290-249a-4f99-9ed1-419f000d8472' }],
		OfferedBy: [{ CTID: 'ce-696ea290-249a-4f99-9ed1-419f000d8472' }],
		SubjectWebpage: 'https://example.com/credentials/a',
		InLanguage: ['en-US'],
		UsesVerificationService: ['ce-11111111-2222-3333-4444-555555555555'],
		Requires: [
			{
				Name: 'Open Badges Criteria',
				Description: 'Earning criteria markdown from the badge system if it was present there',
				SubjectWebpage: undefined
			}
		]
	},
	obAlignments: {
		'http://example.com/competency/1': {
			sourceData: {
				targetUrl: 'http://example.com/competency/1',
				targetName: 'Competency 1',
				targetDescription: 'This is the first Competency. It was good.',
				targetFramework: 'Example Competencies',
				targetCode: 'COMP1'
			},
			propertyType: 'Requires',
			targetNodeType: 'Competency',
			destinationData: {},
			skip: false
		},
		'http://example.com/occupation/2': {
			sourceData: {
				targetUrl: 'http://example.com/occupation/2',
				targetName: 'Occupation 2',
				targetDescription: 'This is the second Occupation. It was better.'
			},
			propertyType: 'IsRequiredFor',
			targetNodeType: 'Occupation',
			destinationData: {},
			skip: false
		},
		'http://example.com/occupation/3': {
			sourceData: {
				targetUrl: 'http://example.com/occupation/2',
				targetName: 'Occupation 3',
				targetDescription: 'This is the third Occupation. It is the charm.'
			},
			propertyType: 'IsRequiredFor',
			targetNodeType: 'Occupation',
			destinationData: {},
			skip: false
		},
		'http://example.com/qa-org/4': {
			sourceData: {
				targetUrl: 'http://example.com/qa-org/4',
				targetName: 'QA Org 4',
				targetDescription: 'There are at least 4 QA Orgs in the world. This is one of them.'
			},
			propertyType: 'AccreditedBy',
			targetNodeType: 'QACredentialOrganization',
			destinationData: {},
			skip: false
		},
		'http://example.com/qa-org/5': {
			sourceData: {
				targetUrl: 'http://example.com/qa-org/5',
				targetName: 'Skippable QA Org 5',
				targetDescription:
					'It turns out there must be 5 QA orgs in the world after all, because this is number 5.'
			},
			propertyType: 'AccreditedBy',
			targetNodeType: 'QACredentialOrganization',
			destinationData: {},
			skip: true
		}
	}
};

test('should reconcile alignments with publisher, dropping requirementless CPs', () => {
	credentialDrafts.set([exampleCredential]);
	assert.equal(get(credentialDrafts).length, 1);
	credentialDrafts.reconcileCredentialWithPublisher(exampleCredential.Credential.CredentialId, {
		...exampleCredential.Credential,
		Requires: [
			{
				Description: 'Just some janky stuff that the admin assistant saved earlier'
			}
		]
	});

	const credential = get(credentialDrafts)[0];
	const requirements = credential.Credential.Requires as ConditionProfile[];
	assert.equal(credential.Credential.Requires?.length, 1);
	assert.equal(requirements[0].Name, 'Open Badges Criteria');

	// It should not drop CPs that have something cool in them, even if that cool thing doesn't come from the badge system
	credentialDrafts.set([exampleCredential]);
	credentialDrafts.reconcileCredentialWithPublisher(exampleCredential.Credential.CredentialId, {
		...exampleCredential.Credential,
		Requires: [
			{
				Description: 'A proper ConditionProfile with all the trimmings',
				TargetAssessment: [
					{
						Name: 'A proper Assessment with all the trimmings',
						Description: 'A proper Assessment with all the trimmings',
						SubjectWebpage: 'https://example.com/assessment/1',
						Type: 'ceterms:AssessmentProfile'
					}
				]
			}
		]
	});

	const credential2 = get(credentialDrafts)[0];
	const requirements2 = credential.Credential.Requires as ConditionProfile[];

	assert.equal(credential2.Credential.Requires?.length, 2);
});

test('should augment a CtdlApiCredential with alignments', () => {
	const occupationCredential = mergeOccupationAlignment(
		exampleCredential.Credential,
		exampleCredential.obAlignments['http://example.com/occupation/2']
	);
	const requiredConditionProfiles = occupationCredential.IsRequiredFor as Array<ConditionProfile>;
	assert.equal(requiredConditionProfiles.length, 1);
	const occupations = requiredConditionProfiles[0].TargetOccupation as Array<Occupation>;
	assert.equal(occupations[0].Description, 'This is the second Occupation. It was better.');
	assert.equal(
		requiredConditionProfiles[0].Description,
		'Occupations that require this credential'
	);

	const upgradedCredential = mergeOccupationAlignment(
		occupationCredential,
		exampleCredential.obAlignments['http://example.com/occupation/3']
	);

	const upgradedConditionProfiles = upgradedCredential.IsRequiredFor as Array<ConditionProfile>;
	assert.equal(upgradedConditionProfiles.length, 1); // We successfully reused the existing ConditionProfile
	assert.equal(upgradedConditionProfiles[0].TargetOccupation?.length, 2); // We successfully added a second Occupation

	const qaAccreditedCredential = mergeQAAlignment(
		exampleCredential.Credential,
		exampleCredential.obAlignments['http://example.com/qa-org/4']
	);
	const accreditedByProfiles = qaAccreditedCredential.AccreditedBy as ConditionProfile[];
	assert.equal(accreditedByProfiles.length, 1);
	assert.equal(
		accreditedByProfiles[0].Description,
		'There are at least 4 QA Orgs in the world. This is one of them.'
	);

	const completeCredential = mergeAllAlignments(
		exampleCredential.Credential,
		exampleCredential.obAlignments
	);

	assert.equal(completeCredential.AccreditedBy?.length, 1); // Skipped alignment is not included, otherwise there would be 2
	assert.equal(completeCredential.IsRequiredFor?.length, 1);
	assert.equal(completeCredential.Requires?.length, 1);
});

test('should filter any of many type of alignment matching target URL from a credential', () => {
	const credential = mergeSingleAlignment(
		exampleCredential.Credential,
		exampleCredential.obAlignments['http://example.com/competency/1']
	);
	assert.equal(credential.Requires?.length, 1);
	if (!credential.Requires) return; // Avoid typescript errors
	assert.equal(credential.Requires[0].TargetCompetency?.length, 1); // There is now a competency.
	assert.equal(credential.Requires[0].Name, 'Open Badges Criteria');

	const filteredCredential = filterAlignmentFromCredential(
		{ ...exampleCredential, Credential: credential },
		exampleCredential.obAlignments['http://example.com/competency/1']
	);

	assert.equal(filteredCredential.Credential.Requires?.length, 1);
	if (!filteredCredential.Credential.Requires) return;
	const criteriaCP: ConditionProfile | undefined = filteredCredential.Credential.Requires[0];
	assert.equal(criteriaCP?.TargetCompetency?.length, 0); // There is no longer a TargetCompetency in the ConditionProfile.

	const employedCredential = mergeSingleAlignment(
		exampleCredential.Credential,
		exampleCredential.obAlignments['http://example.com/occupation/2']
	);
	assert.equal(employedCredential.IsRequiredFor?.length, 1);
	const unemployedCredential = filterAlignmentFromCredential(
		{ ...exampleCredential, Credential: credential },
		exampleCredential.obAlignments['http://example.com/occupation/2']
	);
	assert.equal(unemployedCredential.Credential.IsRequiredFor, undefined);
});

test('can apply both assessments and credentials to the same conditionprofile', () => {
	const credentialBase: CtdlCredentialDraft = {
		...exampleCredential,
		obAlignments: {
			'http://example.com/assessment/1': {
				sourceData: {
					targetUrl: 'http://example.com/assessment/1',
					targetName: 'Assessment 1',
					targetDescription: 'This is the first Assessment. It was good.',
					targetFramework: 'Example Assessments'
				},
				propertyType: 'IsRequiredFor',
				targetNodeType: 'AssessmentProfile',
				destinationData: {},
				skip: false
			},
			'http://example.com/credential/2': {
				sourceData: {
					targetUrl: 'http://example.com/credential/2',
					targetName: 'Credential 2',
					targetDescription: 'This is a credential that also requires this credential.'
				},
				propertyType: 'IsRequiredFor',
				targetNodeType: 'Credential',
				destinationData: { Type: 'ceterms:Certification' },
				skip: false
			}
		}
	};

	const updatedCredential = mergeAllAlignments(
		credentialBase.Credential,
		credentialBase.obAlignments
	);
	assert.equal(updatedCredential.IsRequiredFor?.length, 1);
	if (!updatedCredential.IsRequiredFor) return; // Avoid typescript errors
	assert.equal(updatedCredential.IsRequiredFor[0].TargetAssessment?.length, 1);
	assert.equal(updatedCredential.IsRequiredFor[0].TargetCredential?.length, 1);
});

test('can map occupationtype alignment', () => {
	const merged = mergeSingleAlignment(exampleCredential.Credential, {
		sourceData: {
			targetUrl: 'http://example.com/occupationType/1',
			targetName: 'Occupation Type 1: Hamberger Flipper',
			targetDescription: 'A hamburger flipper is a noble occupation type that has few prerequisites'
		},
		propertyType: 'OccupationType',
		targetNodeType: 'OccupationType',
		destinationData: {},
		skip: false
	});

	assert.equal(merged.OccupationType?.length, 1);
	if (!merged.OccupationType) return; // Avoid typescript errors
	const firstOccupationType = merged.OccupationType[0];
	assert.equal(
		firstOccupationType.TargetNodeDescription,
		'A hamburger flipper is a noble occupation type that has few prerequisites'
	);
});
