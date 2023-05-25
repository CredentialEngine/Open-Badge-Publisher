import { markdownToTxt } from 'markdown-to-txt';
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import {
	PUBLIC_BASEURL,
	PUBLIC_UI_API_BASEURL,
	PUBLIC_PUBLISHER_API_BASEURL,
	PUBLIC_PUBLISHER_API_ENV_LABEL
} from '$env/static/public';
import type { BadgeClassBasic, BadgeClassCTDLExtended, Alignment } from '$lib/utils/badges.js';
import { normalizedBadges, checkedBadges } from '$lib/stores/badgeSourceStore.js';
import { haveSameDomain } from '$lib/utils/urls.js';
import type Condition from 'yup/lib/Condition.js';

interface PublisherOrganization {
	Id: string;
	RowId: string;
	Name: string;
	CTID: string;
	Type: string;
}

interface UserData {
	Id: number;
	Name: string;
	Email: string;
	IsSiteStaff: boolean;
	Token?: string;
	Organizations?: Array<PublisherOrganization>;
}

interface UserDataStore {
	user?: UserData;
}

interface OrganizationDataStore {
	org?: PublisherOrganization;
}

export interface AlignmentObject {
	Description: string; // "Open Badges Alignment" -- purpose of the ConditionProfile
	TargetCompetency?: Competency[];
	SubjectWebpage?: string; // Used for the expression of the critieria ID, if present.
	Name?: string;
	TargetNode?: string;
}

export enum AlignmentPropertyTypes {
	DEFAULT = 'DEFAULT',
	AdvancedStandingFrom = 'AdvancedStandingFrom',
	Corequisite = 'Corequisite',
	IsAdvancedStandingFor = 'IsAdvancedStandingFor',
	IsPreparationFor = 'IsPreparationFor',
	IsRecommendedFor = 'IsRecommendedFor',
	IsRequiredFor = 'IsRequiredFor',
	PreparationFrom = 'PreparationFrom',
	Recommends = 'Recommends',
	Requires = 'Requires',
	AccreditedBy = 'AccreditedBy',
	ApprovedBy = 'ApprovedBy',
	RecognizedBy = 'RecognizedBy',
	RegulatedBy = 'RegulatedBy'
}
export type AlignmentPropertyKey = keyof typeof AlignmentPropertyTypes;
export type AlignmentPropertyTypeCredentialKey = Exclude<AlignmentPropertyKey, 'DEFAULT'>;

export enum AlignmentTargetNodeTypes {
	DEFAULT = 'DEFAULT',
	AssessmentProfile = 'AssessmentProfile',
	Competency = 'Competency',
	Course = 'Course',
	Credential = 'Credential',
	LearningProgram = 'LearningProgram',
	LearningOpportunity = 'LearningOpportunity',
	Occupation = 'Occupation',
	QACredentialOrganization = 'QACredentialOrganization'
}
export type AlignmentTargetNodeTypeKey = keyof typeof AlignmentTargetNodeTypes;

export const nodeTypeOptions = [
	AlignmentTargetNodeTypes.DEFAULT,
	AlignmentTargetNodeTypes.AssessmentProfile,
	AlignmentTargetNodeTypes.Competency,
	AlignmentTargetNodeTypes.Course,
	AlignmentTargetNodeTypes.Credential,
	AlignmentTargetNodeTypes.LearningProgram,
	AlignmentTargetNodeTypes.LearningOpportunity,
	AlignmentTargetNodeTypes.Occupation,
	AlignmentTargetNodeTypes.QACredentialOrganization
];

const NodeTypeKeyForCtdlClass: { [key: string]: AlignmentTargetNodeTypeKey } = {
	'ceterms:AssessmentProfile': 'AssessmentProfile',
	'ceasn:Competency': 'Competency',
	'ceterms:Course': 'Course',
	'ceterms:Credential': 'Credential',
	'ceterms:LearningProgram': 'LearningProgram',
	'ceterms:LearningOpportunityProfile': 'LearningOpportunity',
	'ceterms:Occupation': 'Occupation',
	'ceterms:QACredentialOrganization': 'QACredentialOrganization'
};

export interface OBAlignmentConfig {
	sourceData: Alignment;
	propertyType: AlignmentPropertyKey;
	targetNodeType: AlignmentTargetNodeTypeKey;
	destinationData: { [key: string]: string }; // Holds overrides the user has made to properties of the destination object. If either type config is changed, customizations are assumed to be reset.
	skip: boolean;
}

export interface OBAlignmentMap {
	[key: string]: OBAlignmentConfig;
}

// Objects representing alignment targets for types of things that the Credential might align to
interface BaseAlignmentTarget {}

// ceterms:AssessmentProfile can be referenced as ConditionProfile.TargetAssessment
export interface AssessmentProfile {
	Type: 'ceterms:AssessmentProfile';
	Name?: string;
	Description: string;
	SubjectWebpage?: string;
	Identifier?: Array<{
		IdentifierValueCode: string;
		IdentifierTypeName: string;
	}>;
}

// ceasn:Competency may be referenced from ConditionProfile.TargetCompetency
export interface Competency {
	// Framework: Link to the target framework registry resource URL, but there is no source in Open Badges AlignmentObject to find this "https://credentialengineregistry.org/resources/ce-48A570E2-DAC8-4AD9-99A5-BF368393C73B",
	FrameworkName?: string; // targetFramework -- Optional Framework Name
	TargetNodeName: string; // targetName -- Required Competency Name
	TargetNode: string; // targetUrl -- Alignment URL (preferably in registry domain)
	TargetNodeDescription?: string; // targetDescription  -- Optional Competency Description
	CodedNotation?: string; // targetCode
}

// ceterms:Course may be referenced from ConditionProfile.TargetLearningOpportunity
export interface Course extends AlignmentObject {
	Name: string; // "Course Name",
	Description: string; // "Description of course.",
	SubjectWebpage?: string; // "http://www.courses.com/course/123",
	CodedNotation?: string; // "123",
	Type: 'ceterms:Course';
}

// ceterms:LearningOpportunityProfile may be referenced from ConditionProfile.TargetLearningOpportunity
export interface LearningOpportunity extends AlignmentObject {
	Name: string; // "Learning Opportunity Name",
	Description: string; // "Description of learning opportunity.",
	SubjectWebpage?: string; // "http://www.learningopportunities.com/learningopportunity/123",
	CodedNotation?: string; // "123",
	Type: 'ceterms:LearningOpportunityProfile';
}

// ceterms:LearningOpportunity may be referenced from ConditionProfile.TargetLearningOpportunity
export interface LearningProgram extends AlignmentObject {
	Name: string; // "Learning Program Name",
	Description: string; // "Description of learning program.",
	SubjectWebpage?: string; // "http://www.learningprograms.com/learningprogram/123",
	CodedNotation?: string; // "123",
	Type: 'ceterms:LearningProgram';
}

// ctdl:Occupation may be referenced from Credential.IsRequiredFor, IsRecommendedFor, IsPreparationFor directly.
export interface Occupation extends AlignmentObject {
	Name: string; // "Occupation Name",
	Description: string; // "Description of occupation.",
	SubjectWebpage?: string; // "http://www.onetonline.org/link/summary/11-1011.00",
	CodedNotation?: string; // "11-1011.00",
	Type: 'ceterms:Occupation';
}

export interface QualityAssurance extends AlignmentObject {
	Type: 'ceterms:QACredentialOrganization';
	Name: string; // "Required Organization Name",
	Description: string; // "Organization Description - not a description related to accreditation.",
	SubjectWebpage?: string; // "https://example.org/subjectwebpage",
	Identifier?: Array<{
		IdentifierValueCode: string;
		IdentifierTypeName: string;
	}>;
}

// ceterms:Credential (supertype of many credential subtypes)
// - An abbreviated Credential object may be referenced from ConditionProfile.TargetCredential
export interface TargetCredential extends AlignmentObject {
	Type: string;
	Name?: string;
	Description: string;
	SubjectWebpage?: string;
	Identifier?: Array<{
		IdentifierValueCode: string;
		IdentifierTypeName: string;
	}>;
}

export const alignmentPropertyTypeDescriptions: { [key: string]: string } = {
	Requires:
		'The credential requires the completion of identified credentials, assessments or learning opportunities.',
	AdvancedStandingFrom:
		'This credential has its time or cost reduced by other credentials, assessments or learning opportunities.',
	CoPrerequisite:
		'This credential identifies other resources that must be completed prior to, or pursued at the same time, as this credential.',
	Corequisite: 'This credential must be pursued concurrently with other credentials or activities.',
	IsAdvancedStandingFor:
		'This credential reduces the time or cost of obtaining additional identified credentials or of pursuing other activities.',
	IsPreparationFor:
		'This credential provides preparation for other credentials, assessments or learning opportunities.',
	IsRecommendedFor:
		'It is recommended to earn or complete this credential before attempting to earn or complete the referenced credentials, assessments, or learning opportunity.',
	IsRequiredFor:
		'This credential must be earned or completed prior to attempting to earn or complete the referenced credential, assessment, or learning opportunity.',
	PreparationFrom:
		'Other credentials, learning opportunities or assessments provide preparation for this credential.',
	Recommends:
		'Holders of this credential are recommended to pursue other credentials, assessments or learning opportunities.',
	RecognizedBy:
		'This credential is recognized or accepted by one or more third-party organizations.',
	AccreditedBy: 'This credential is accredited by one or more third-party organizations.',
	ApprovedBy: 'This credential is approved by one or more third-party organizations.',
	RegulatedBy: 'This credential is regulated by one or more third-party organizations.'
};

export const mergeOccupationAlignment = (
	credential: CtdlCredential,
	alignmentConfig: OBAlignmentConfig
): CtdlCredential => {
	let result: CtdlCredential = { ...credential };

	const property = getPropertyName(alignmentConfig.targetNodeType, alignmentConfig.propertyType);
	const descriptionTerms: { [key: string]: string } = {
		IsPreparationFor: 'Occupations that this credential prepares learners for',
		IsRequiredFor: 'Occupations that require this credential',
		IsRecommendedFor: 'Occupations for which workers are recommended to have this credential'
	};
	const descriptionTermFor = (property: AlignmentPropertyKey | keyof CtdlCredential) =>
		descriptionTerms[property] || 'Open Badges Alignment';

	const occupationProfile: ConditionProfile[] = [
		{
			Name: 'Occupations',
			Description: descriptionTermFor(property),
			TargetOccupation: [
				{
					Type: 'ceterms:Occupation',
					Name: alignmentConfig.sourceData?.targetName ?? 'Connected Occupation',
					Description:
						alignmentConfig.sourceData?.targetDescription ??
						'An Occupation related to this credential',
					CodedNotation: alignmentConfig.sourceData?.targetCode,
					SubjectWebpage: alignmentConfig.sourceData?.targetUrl
				}
			]
		}
	];

	const starterValue: ConditionProfile[] = (credential[property] as ConditionProfile[]) ?? [];
	const existingCP = starterValue.find((value) => value.Name === 'Occupations');

	if (existingCP) {
		const existingTargetOccupation = existingCP.TargetOccupation ?? [];
		result[property] = starterValue
			.filter((value) => value.Name !== 'Occupations')
			.concat([
				{
					...existingCP,
					TargetOccupation: existingTargetOccupation.concat(
						occupationProfile[0].TargetOccupation as Occupation[]
					)
				}
			]);
	} else {
		result[property] = occupationProfile.concat(starterValue ?? []);
	}

	return result;
};

export const mergeQAAlignment = (
	credential: CtdlCredential,
	alignmentConfig: OBAlignmentConfig
): CtdlCredential => {
	let result: CtdlCredential = { ...credential };

	const OCCUPATION_ALLOWED_PROPERTIES = [
		'AccreditedBy',
		'ApprovedBy',
		'RecognizedBy',
		'RegulatedBy'
	];

	const property = OCCUPATION_ALLOWED_PROPERTIES.includes(alignmentConfig.propertyType)
		? (alignmentConfig.propertyType as
				| 'AccreditedBy'
				| 'ApprovedBy'
				| 'RecognizedBy'
				| 'RegulatedBy')
		: 'RecognizedBy';

	const descriptionTerms = {
		AccreditedBy: 'QA organizations that provide official approval of this credential',
		ApprovedBy: 'QA Organizations that approved this credential',
		RecognizedBy: 'QA Organizations that recognize this credential',
		RegulatedBy: 'QA Organizations that regulate this credential'
	};

	const qualityAssuranceProfile: ConditionProfile[] = [
		{
			...{
				Type: 'ceterms:QACredentialOrganization',
				Name: alignmentConfig.sourceData?.targetName ?? `${property} Organization`,
				Description: alignmentConfig.sourceData?.targetDescription ?? 'A QA Organization',
				SubjectWebpage: alignmentConfig.sourceData?.targetUrl ?? ''
			},
			...(alignmentConfig.sourceData?.targetCode && {
				// Attach the Identifier property only if there is something useful to go there.
				Identifier: [
					{
						IdentifierValueCode: alignmentConfig.sourceData?.targetCode,
						IdentifierTypeName: 'TargetCode'
					}
				]
			})
		}
	];

	const starterValue: ConditionProfile[] = credential[property] ?? [];
	const existingCP = starterValue.find(
		(value) => value.SubjectWebpage && value.SubjectWebpage == alignmentConfig.sourceData?.targetUrl
	);

	if (existingCP) {
		result[property] = starterValue
			.filter(
				(value) =>
					!value.SubjectWebpage || value.SubjectWebpage != alignmentConfig.sourceData?.targetUrl
			)
			.concat(qualityAssuranceProfile);
	} else {
		result[property] = starterValue.concat(qualityAssuranceProfile);
	}

	return result;
};

export const mergeCompetencyAlignment = (
	credential: CtdlCredential,
	alignmentConfig: OBAlignmentConfig
): CtdlCredential => {
	let result: CtdlCredential = { ...credential };

	const property = getPropertyName(alignmentConfig.targetNodeType, alignmentConfig.propertyType);
	const descriptionTermFor = (property: AlignmentPropertyKey | keyof CtdlCredential) =>
		alignmentPropertyTypeDescriptions[property] || 'Open Badges Alignment';

	const competencyProfile: ConditionProfile[] = [
		{
			Name: 'Open Badges Alignment',
			Description: descriptionTermFor(property),
			TargetCompetency: [
				{
					TargetNode: alignmentConfig.sourceData.targetUrl,
					TargetNodeName: alignmentConfig.sourceData?.targetName ?? 'Connected Competency',
					TargetNodeDescription:
						alignmentConfig.sourceData?.targetDescription ??
						'A competency related to this credential',
					FrameworkName: alignmentConfig.sourceData?.targetFramework,
					CodedNotation: alignmentConfig.sourceData?.targetCode
				}
			]
		}
	];

	const starterValue: ConditionProfile[] = (credential[property] as ConditionProfile[]) ?? [];
	const existingCP = starterValue.find(
		(value) => value.Name === 'Open Badges Alignment' || value.Name === 'Open Badges Criteria'
	);

	if (existingCP) {
		const existingTargetCompetency = existingCP.TargetCompetency ?? [];
		result[property] = starterValue
			.filter(
				(value) => value.Name != 'Open Badges Alignment' && value.Name != 'Open Badges Criteria'
			)
			.concat([
				{
					...existingCP,
					TargetCompetency: existingTargetCompetency.concat(
						competencyProfile[0].TargetCompetency as Competency[]
					)
				}
			]);
	} else {
		result[property] = competencyProfile.concat(starterValue ?? []);
	}

	return result;
};

const connectionTypeForNodeType = (
	nodeType: AlignmentTargetNodeTypeKey
):
	| 'TargetAssessment'
	| 'TargetCompetency'
	| 'TargetCredential'
	| 'TargetLearningOpportunity'
	| 'TargetOccupation' => {
	switch (nodeType) {
		case 'AssessmentProfile':
			return 'TargetAssessment';
		case 'Course':
			return 'TargetLearningOpportunity';
		case 'Credential':
			return 'TargetCredential';
		case 'LearningOpportunity':
			return 'TargetLearningOpportunity';
		case 'LearningProgram':
			return 'TargetLearningOpportunity';
		case 'Occupation':
			return 'TargetOccupation';
		default: // 'DEFAULT', 'QACredentialOrganization'
			return 'TargetCompetency';
	}
};

export const mergeSingleAlignment = (
	credential: CtdlCredential,
	ac: OBAlignmentConfig
): CtdlCredential => {
	let property: AlignmentPropertyTypeCredentialKey;
	let targetProperty: 'TargetAssessment' | 'TargetCredential' | 'TargetLearningOpportunity';

	switch (ac.targetNodeType) {
		case 'Occupation':
			return mergeOccupationAlignment(credential, ac);
		case 'QACredentialOrganization':
			return mergeQAAlignment(credential, ac);
		case 'Competency':
			return mergeCompetencyAlignment(credential, ac);
		case 'AssessmentProfile':
		case 'Course':
		case 'Credential':
		case 'LearningOpportunity':
		case 'LearningProgram':
			property = getPropertyName(ac.targetNodeType, ac.propertyType);
			targetProperty = connectionTypeForNodeType(ac.targetNodeType) as
				| 'TargetAssessment'
				| 'TargetCredential'
				| 'TargetLearningOpportunity';
			break;
		default:
			return mergeCompetencyAlignment(credential, ac);
	}

	let result: CtdlCredential = { ...credential };
	const cpName = property == 'Requires' ? 'Open Badges Criteria' : 'Open Badges Alignment';

	const starterValue = Object.hasOwn(credential, property)
		? (credential[property] as ConditionProfile[])
		: ([] as ConditionProfile[]);

	const existingCP =
		starterValue.find((value) => value.Name === cpName) ?? ({} as ConditionProfile);

	let cp: ConditionProfile = {
		Name: cpName,
		Description: alignmentPropertyTypeDescriptions[property]
	};

	const existingTargetList: AlignmentObject[] = existingCP
		? (existingCP[targetProperty] as AlignmentObject[]) ?? ([] as AlignmentObject[])
		: ([] as AlignmentObject[]);
	const existingMatchingMember =
		existingTargetList.find(
			(target: any) =>
				target.SubjectWebpage === ac.sourceData.targetUrl ||
				(target.TargetNode && ac.sourceData.targetUrl)
		) ?? {};
	const filteredExistingList: AlignmentObject[] =
		existingTargetList.filter(
			(target: any) =>
				target.SubjectWebpage !== ac.sourceData.targetUrl &&
				target.TargetNode !== ac.sourceData.targetUrl
		) ?? [];

	switch (targetProperty) {
		case 'TargetAssessment':
			cp['TargetAssessment'] = filteredExistingList.concat([
				{
					...(existingMatchingMember as AssessmentProfile),

					Name: ac.sourceData.targetName,
					Description: ac.sourceData.targetDescription,
					SubjectWebpage: ac.sourceData.targetUrl,
					Identifier: ac.sourceData.targetCode
						? [
								{
									IdentifierValueCode: ac.sourceData.targetCode || '',
									IdentifierTypeName: 'TargetCode'
								}
						  ]
						: [],
					Type: 'ceterms:AssessmentProfile'
				} as AssessmentProfile
			]) as AssessmentProfile[];
			break;
		case 'TargetCredential':
			cp['TargetCredential'] = filteredExistingList.concat([
				{
					...(existingMatchingMember as TargetCredential),

					Name: ac.sourceData.targetName,
					Description: ac.sourceData.targetDescription,
					SubjectWebpage: ac.sourceData.targetUrl,
					Identifier: ac.sourceData.targetCode
						? [
								{
									IdentifierValueCode: ac.sourceData.targetCode || '',
									IdentifierTypeName: 'TargetCode'
								}
						  ]
						: [],
					Type: ac.destinationData?.Type ?? 'ceterms:Certification'
				} as TargetCredential
			]) as TargetCredential[];
			break;
		case 'TargetLearningOpportunity':
			cp['TargetLearningOpportunity'] = filteredExistingList.concat([
				{
					...(existingMatchingMember as Course | LearningOpportunity | LearningProgram),
					Name: ac.sourceData.targetName,
					Description: ac.sourceData.targetDescription,
					SubjectWebpage: ac.sourceData.targetUrl,
					CodedNotation: ac.sourceData.targetCode || '',
					Type: CtdlTargetNodeType[ac.targetNodeType]
				} as Course | LearningOpportunity | LearningProgram
			]) as (Course | LearningOpportunity | LearningProgram)[];
			break;
	}

	result[property] = starterValue.filter((value) => value.Name !== cpName).concat([cp]);
	return result;
};

export const mergeAllAlignments = (
	credential: CtdlCredential,
	alignmentMap: { [key: string]: OBAlignmentConfig }
): CtdlCredential => {
	let result: CtdlCredential = { ...credential };
	const alignmentKeys = Object.keys(alignmentMap);
	return alignmentKeys.reduce((acc: CtdlCredential, key: string) => {
		if (alignmentMap[key].skip) return acc;
		return mergeSingleAlignment(acc, alignmentMap[key]);
	}, result);
};

export interface ConditionProfile {
	Type?: string; // usually defaults to just ConditionProfile, but sometimes it's something else, e.g. Credential.ApprovedBy.Type = "ceterms:QACredentialOrganization"
	Description: string; // e.g. used for the expression of criteria narrative
	SubjectWebpage?: string; // Used for the expression of the critieria ID, if present in a Requires profile.
	Name?: string; // e.g. "Open Badges Criteria"
	Identifier?: Array<{
		IdentifierValueCode: string;
		IdentifierTypeName: string;
	}>;

	TargetAssessment?: AssessmentProfile[];
	TargetCompetency?: Competency[];
	TargetCredential?: TargetCredential[];
	TargetLearningOpportunity?: Array<Course | LearningOpportunity | LearningProgram>;
	TargetOccupation?: Occupation[];
}

export interface CtdlCredential {
	//============= REQUIRED / POPULATED PROPERTIES =============
	CredentialId: string; // "https://example.com/e198bbd5",  //The required primary ID of the credential

	CredentialType: string; // "Badge",
	CredentialStatusType: 'Active' | 'Deprecated' | 'Probationary' | 'Suspended' | 'TeachOut'; // Default "Active"

	Name: string; // "Name of Badge",
	Description: string; // "Description of badge.",

	// Issuer: One of OwnedBy or OfferedBy is required
	OwnedBy: Array<{
		CTID: string; // CTID of the owning organization: "ce-696ea290-249a-4f99-9ed1-419f000d8472"
	}>;
	OfferedBy: Array<{
		CTID: string; // CTID of the offering organization: "ce-696ea290-249a-4f99-9ed1-419f000d8472"
	}>;

	//The CTID is not included for a new credential. The generated CTID would be returned on a valid add and would be required for updates.
	CTID?: string; // "ce-816cc650-f86d-4c08-9024-01c347e59b3d",

	//SubjectWebpage is required and must be resolvable at publication time. Use criteria URL if used, or BadgeClass.id
	SubjectWebpage: string; // "http://www.hutchcc.edu/",

	//============= OPTIONAL PROPERTIES =============
	DateEffective?: string; // "2019-01-01T00:00:00.00Z", Date the credential definition was created

	InLanguage: string[]; // ["en-US"], // Language: defaults to en-US if not provided

	// SameAs: provide the CTID or URL of a resource in the registry. Not presently used.
	// "SameAs": [
	//     "ce-f2b07632-753f-4514-8e9b-a42225a6cbfb", "https://credentialengineregistry.org/resources/ce-6fdd56d3-0214-4a67-b0c4-bb4c16ce9a13"
	// ],

	// Other identifiers specific to the current credential. Not used at this time, but could be supported for OB 3.0.
	Identifier?: Array<{
		IdentifierType: string; // "@id" - "Framework, scheme or organizing principle of this identifier"
		IdentifierTypeName: string; // "Open Badges ID";
		IdentifierValueCode: string; // "https://example.com/e198bbd5"
	}>;

	Image?: string; // "https://placekitten.com/400/400" //image URL

	Keyword?: string[]; // ["tag1", "tag two"] // list of keywords for the credential
	// "Subject": string[];  // ["Subject1", "Subject2"], // not used at this time. list of subjects for the credential

	// Alignments: Condition profiles with required competencies, assessments, learning opportunities, etc.
	AdvancedStandingFrom?: ConditionProfile[];
	Corequisite?: ConditionProfile[];
	IsAdvancedStandingFor?: ConditionProfile[];
	IsPreparationFor?: ConditionProfile[];
	IsRecommendedFor?: ConditionProfile[];
	IsRequiredFor?: ConditionProfile[];
	PreparationFrom?: ConditionProfile[];
	Recommends?: ConditionProfile[];
	Requires?: ConditionProfile[]; // Used for Open Badges Criteria and some other alignments.

	// OccupationType alignment
	OccupationType?: Array<{
		TargetNodeName: string; // "Occupation Name",
		TargetNode: string; // "http://www.onetonline.org/link/summary/11-1011.00",
		TargetNodeDescription: string; // "Description of occupation.",
		Framework: string; // This term selection is a little strange, but functionality is working as written.
		CodedNotaion: string; // "11-1011.00",
	}>;

	// Alignments: QualityAssurance
	// An improvement could be to make these a slightly improved QACredentialOrganization type instead of having a generic ConditionProfile that sometimes represents an organization
	AccreditedBy?: ConditionProfile[];
	ApprovedBy?: ConditionProfile[];
	RecognizedBy?: ConditionProfile[];
	RegulatedBy?: ConditionProfile[];

	// Verification Service Profile
	UsesVerificationService: string[];
}

export interface CtdlApiCredential {
	//required CTID of the owning organization
	PublishForOrganizationIdentifier: string; // "ce-696ea290-249a-4f99-9ed1-419f000d8472",
	Credential: CtdlCredential;
	DoingCompleteReplacement?: boolean;
}

export enum CtdlAlignmentProperty {
	// Expect type ConditionProfile
	advancedStandingFrom = 'AdvancedStandingFrom',
	corequisite = 'Corequisite',
	isAdvancedStandingFor = 'IsAdvancedStandingFor',
	isPreparationFor = 'IsPreparationFor',
	isRecommendedFor = 'IsRecommendedFor',
	isRequiredFor = 'IsRequiredFor',
	preparationFrom = 'PreparationFrom',
	recommends = 'Recommends',
	requires = 'Requires',

	// Expect type QACredentialOrganization
	accreditedBy = 'AccreditedBy',
	approvedBy = 'ApprovedBy',
	recognizedBy = 'RecognizedBy',
	regulatedBy = 'RegulatedBy'
}

export enum CtdlTargetNodeType {
	AssessmentProfile = 'ceterms:AssessmentProfile',
	Competency = 'ceterms:Competency',
	Course = 'ceterms:Course',
	Credential = 'ceterms:Credential',
	LearningProgram = 'ceterms:LearningProgram',
	LearningOpportunity = 'ceterms:LearningOpportunityProfile',
	Occupation = 'ceterms:Occupation',
	QACredentialOrganization = 'ceterms:QACredentialOrganization'
}

const RequiresGroup = [
	'Requires',
	'AdvancedStandingFrom',
	'CoPrerequisite',
	'Corequisite',
	'IsAdvancedStandingFor',
	'IsPreparationFor',
	'IsRecommendedFor',
	'IsRequiredFor',
	'PreparationFrom',
	'Recommends'
];
export const nodeTypePropertyDefaultMap = {
	DEFAULT: RequiresGroup,
	AssessmentProfile: RequiresGroup,
	Competency: RequiresGroup,
	Course: RequiresGroup,
	Credential: RequiresGroup,
	LearningProgram: RequiresGroup,
	LearningOpportunity: RequiresGroup,
	Occupation: ['IsPreparationFor', 'IsRecommendedFor', 'IsRequiredFor'],
	QACredentialOrganization: ['RecognizedBy', 'AccreditedBy', 'ApprovedBy', 'RegulatedBy']
};

export interface CtdlCredentialDraft extends CtdlApiCredential {
	obAlignments: OBAlignmentMap; // indexed by targetUrl (which is a required string)
}

interface PublisherCredentialSummary {
	Id: number;
	RowId: string;
	Name: string;
	Description: string;
	CTID: string;
	Type: string;
	CredentialId?: string;
	Credential?: CtdlCredential;
}

interface PublisherCredentialsDataStore {
	credentials: Array<PublisherCredentialSummary>;
	totalResults: number;
}

interface PublisherOptions {
	alignmentSettings: {
		defaultTargetType: AlignmentTargetNodeTypeKey;
		defaultPropertyType: AlignmentPropertyKey;
		defaultCredentialSubtype: string;
	};
}

/**
 * Get the default property name for a given node type, or validate a suggestion, returning default value if suggestion is not acceptable.
 */
export const getPropertyName = (
	nodeType: AlignmentTargetNodeTypeKey,
	suggestion?: AlignmentPropertyKey
): AlignmentPropertyTypeCredentialKey => {
	if (suggestion) {
		return suggestion !== 'DEFAULT' && nodeTypePropertyDefaultMap[nodeType].includes(suggestion)
			? suggestion
			: (nodeTypePropertyDefaultMap[nodeType][0] as AlignmentPropertyTypeCredentialKey);
	}
	return nodeTypePropertyDefaultMap[nodeType][0] as AlignmentPropertyTypeCredentialKey;
};

// Which user is authenticated, if any
export const publisherUser = writable<UserDataStore>({});

// Which organization is selected, if any
export const publisherOrganization = writable<OrganizationDataStore>({});
export const setPublisherSelection = (orgId: string) => {
	const selectedOrgData = get(publisherUser).user?.Organizations?.find((o) => o.CTID == orgId);
	publisherOrganization.set({ org: selectedOrgData });
};

// The CTID of the verification service selected for the current organization
export const publisherVerificationService = writable<string>('');

// Which credentials already exist within the publisher for the selected org:
export const publisherCredentials = writable<PublisherCredentialsDataStore>({
	credentials: [],
	totalResults: 0
});
export const getOrgCredentialList = async (): Promise<boolean> => {
	const url = `${PUBLIC_UI_API_BASEURL}/StagingApi/Resource/PublisherSearch`;
	const orgCtid = get(publisherOrganization).org?.CTID;
	let page = 0;
	let results: any[] = [];

	const formData = {
		Filters: [
			{
				URI: 'search:recordOwnedBy',
				ItemTexts: [orgCtid]
			},
			{
				URI: '@type',
				ItemTexts: ['credential']
			}
		],
		Skip: 0,
		Take: 100
	};

	const fetchPage = async () => {
		const response = await fetch(url, {
			method: 'POST',
			body: JSON.stringify({ ...formData, Skip: page * 100 }),
			headers: {
				Authorization: `Bearer ${get(publisherUser).user?.Token}`,
				'Content-Type': 'application/json'
			}
		});
		return await response.json();
	};
	let responseData = await fetchPage();
	if (!responseData['Valid']) {
		return false;
	}
	results = results.concat(responseData.Data.Results);
	while (results.length < responseData.Data.TotalResults) {
		page++;
		responseData = await fetchPage();
		results = results.concat(responseData?.Data?.Results ?? []);
		if (responseData['Valid'] === false) break;
	}

	publisherCredentials.set({
		credentials: results,
		totalResults: responseData.Data.TotalResults
	});

	return true;
};

export const getOrgVsp = async (): Promise<boolean> => {
	const url = `${PUBLIC_UI_API_BASEURL}/StagingApi/Resource/PublisherSearch`;
	const orgCtid = get(publisherOrganization).org?.CTID;

	const formData = {
		Filters: [
			{
				URI: 'search:recordOwnedBy',
				ItemTexts: [orgCtid]
			},
			{
				URI: '@type',
				ItemTexts: ['verificationservice']
			},
			{
				URI: 'ceterms:claimType',
				ItemTexts: ['claimType:BadgeClaim']
			}
		],
		Skip: 0,
		Take: 10
	};

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(formData),
		headers: {
			Authorization: `Bearer ${get(publisherUser).user?.Token}`,
			'Content-Type': 'application/json'
		}
	});
	const responseData = await response.json();
	if (!responseData['Valid']) {
		return false;
	}

	if (responseData.Data?.Results.length) {
		publisherVerificationService.set(responseData.Data.Results[0]?.CTID || '');
	} else {
		const vspCreateData = {
			PublishForOrganizationIdentifier: orgCtid,
			VerificationServiceProfile: {
				Description:
					'Open Badges verification: This organization issues credentials as Open Badges, which can each be verified by employers or other verifiers with whom they are shared.',
				OfferedBy: [
					{
						CTID: orgCtid
					}
				]
			}
		};

		const createResponse = await fetch(
			`${PUBLIC_UI_API_BASEURL}/StagingApi/VerificationService/Save`,
			{
				method: 'POST',
				body: JSON.stringify(vspCreateData),
				headers: {
					Authorization: `Bearer ${get(publisherUser).user?.Token}`,
					'Content-Type': 'application/json'
				}
			}
		);

		const createResponseData = await createResponse.json();
		if (!responseData['Valid']) {
			return false;
		}
		publisherVerificationService.set(createResponseData.Data?.CTID || '');
	}

	return true;
};

export const resetPublisherSelection = () => {
	publisherOrganization.set({});
	publisherCredentials.set({ credentials: [], totalResults: 0 });
};

// Details about the API connection to the publisher and configuration
export const publisherOptions = writable<PublisherOptions>({
	alignmentSettings: {
		defaultTargetType: AlignmentTargetNodeTypes.DEFAULT,
		defaultPropertyType: AlignmentPropertyTypes.DEFAULT,
		defaultCredentialSubtype: 'ceterms:Certification'
	}
});

// Governs which step is displayed
export const publisherSetupStep = writable<number>(0);
export const proofingStep = writable(0);
export const reviewingStep = writable(0);

export const getUser = async () => {
	if (!browser || get(publisherUser).user) return null;

	const url = `${PUBLIC_UI_API_BASEURL || '/publisher'}/StagingApi/Load/User`;
	if (!haveSameDomain(url, PUBLIC_BASEURL, PUBLIC_BASEURL)) return null;

	// Attempt to get user from the publisher using cookies that may be set if this app is running on same-origin.
	const response = await fetch(url, { credentials: 'include' });
	if (!response.ok) return null;

	const data = await response.json();

	if (!data || !data['Valid']) return null;

	publisherUser.set({ user: data['Data'] });
};

export const defaultAchievementTypeForBadgeAchievementType = (btype: string): string => {
	const mapping: { [key: string]: string } = {
		// Direct CTDL Mappings. List formatted as OpenBadgeTerm: CTDLTerm
		ApprenticeshipCertificate: 'ceterms:ApprenticeshipCertificate',
		AssociateDegree: 'ceterms:AssociateDegree',
		Badge: 'ceterms:OpenBadge',
		BachelorDegree: 'ceterms:BachelorDegree',
		Certificate: 'ceterms:Certificate',
		CertificateOfCompletion: 'ceterms:CertificateOfCompletion',
		Certification: 'ceterms:Certification',
		Degree: 'ceterms:Degree',
		Diploma: 'ceterms:Diploma',
		DoctoralDegree: 'ceterms:DoctoralDegree',
		GeneralEducationDevelopment: 'ceterms:GeneralEducationDevelopment',
		JourneymanCertificate: 'ceterms:JourneymanCertificate',
		License: 'ceterms:License',
		ProfessionalDoctorate: 'ceterms:ProfessionalDoctorate',
		QualityAssuranceCredential: 'ceterms:QualityAssuranceCredential',
		MasterCertificate: 'ceterms:MasterCertificate',
		MasterDegree: 'ceterms:MasterDegree',
		MicroCredential: 'ceterms:MicroCredential',
		ResearchDoctorate: 'ceterms:ResearchDoctorate',
		SecondarySchoolDiploma: 'ceterms:SecondarySchoolDiploma',

		// Not Found in CTDL https://credreg.net/ctdl/terms#credentialType enumeration
		Achievement: 'ceterms:OpenBadge',
		Assessment: 'ceterms:OpenBadge',
		Assignment: 'ceterms:OpenBadge',
		Award: 'ceterms:OpenBadge',
		CoCurricular: 'ceterms:OpenBadge',
		CommunityService: 'ceterms:OpenBadge',
		Competency: 'ceterms:OpenBadge',
		Course: 'ceterms:OpenBadge',
		Fieldwork: 'ceterms:OpenBadge',
		LearningProgram: 'ceterms:OpenBadge',
		Membership: 'ceterms:OpenBadge'
	};

	if (Object.hasOwn(mapping, btype)) return mapping[btype];

	return 'ceterms:OpenBadge'; // default.
};

// Converts a credential's data from Open Badges format to CTDL Publisher API format
export const badgeClassToCtdlApiCredential = (b: BadgeClassCTDLExtended): CtdlCredentialDraft => {
	const publisherOrgId = get(publisherOrganization).org?.CTID;
	if (!publisherOrgId) throw new Error('Publishing org must be set before importing credentials.');

	const vsp = get(publisherVerificationService);

	const badgeAlignments = b.alignment ?? [];
	let conditionProfile: ConditionProfile = {
		Name: 'Open Badges Criteria',
		Description: b.criteria.narrative ? markdownToTxt(b.criteria.narrative) : 'Earning criteria',
		SubjectWebpage: b.criteria.id ?? undefined
	};

	let result: CtdlCredentialDraft = {
		PublishForOrganizationIdentifier: publisherOrgId,
		Credential: {
			CredentialType: defaultAchievementTypeForBadgeAchievementType(
				b.achievementType || 'OpenBadge'
			),
			CredentialStatusType: 'Active',
			Name: b.name,
			DateEffective: b['ceterms:dateEffective'],
			Description: b.description,
			OwnedBy: [{ CTID: publisherOrgId }],
			OfferedBy: [{ CTID: publisherOrgId }],
			CredentialId: b.id,
			SubjectWebpage: b.criteria.id || b.id, // Fall back to primary ID if no criteria URL set.
			Keyword: b.tags,
			InLanguage: ['en-US'],
			Requires: [conditionProfile],
			UsesVerificationService: [vsp]
		},
		obAlignments: badgeAlignments.reduce((acc: OBAlignmentMap, a: Alignment): OBAlignmentMap => {
			if (a.targetFramework == 'Credentials Transparency Description Language') return acc; // Skip self-referential alignment.
			return {
				...acc,
				[a.targetUrl]: {
					sourceData: a,
					propertyType: 'DEFAULT',
					targetNodeType: 'DEFAULT',
					destinationData: {},
					skip: false
				}
			};
		}, {})
	};
	if (b.image) result.Credential.Image = b.image;

	return result;
};

interface FilterData {
	cp: ConditionProfile | null;
	ac: OBAlignmentConfig | null;
}

const filterAlignmentFromConditionProfile = (
	cp: ConditionProfile,
	ac: OBAlignmentConfig,
	prop: keyof CtdlCredential = 'Requires'
): FilterData => {
	let newCp = { ...cp };
	let newAc: OBAlignmentConfig | null = null;
	let foundAlignment: Array<any> = [];
	const targetUrl = ac.sourceData.targetUrl;

	let remainingAlignmentsCount = 0;
	if (Object.hasOwn(cp, 'TargetAssessment')) {
		const propValue = cp['TargetAssessment'];
		foundAlignment = propValue?.filter((a) => a.SubjectWebpage === targetUrl) ?? [];
		newCp['TargetAssessment'] = propValue?.filter((a) => a.SubjectWebpage !== targetUrl);
		remainingAlignmentsCount += cp['TargetAssessment']?.length ?? 0;

		if (foundAlignment.length)
			newAc = {
				...ac,
				propertyType: prop as AlignmentPropertyTypeCredentialKey,
				targetNodeType: 'AssessmentProfile'
			};
	}
	if (Object.hasOwn(cp, 'TargetCompetency')) {
		const propValue = cp['TargetCompetency'];
		foundAlignment = propValue?.filter((a) => a.TargetNode === targetUrl) ?? [];
		newCp['TargetCompetency'] = propValue?.filter((a) => a.TargetNode !== targetUrl);
		remainingAlignmentsCount += cp['TargetCompetency']?.length ?? 0;

		if (foundAlignment.length)
			newAc = {
				...ac,
				propertyType: prop as AlignmentPropertyTypeCredentialKey,
				targetNodeType: 'Competency'
			};
	}
	if (Object.hasOwn(cp, 'TargetCredential')) {
		const propValue = cp['TargetCredential'];
		foundAlignment = propValue?.filter((a) => a.SubjectWebpage === targetUrl) ?? [];
		newCp['TargetCredential'] = propValue?.filter((a) => a.SubjectWebpage !== targetUrl);
		remainingAlignmentsCount += cp['TargetCredential']?.length ?? 0;

		if (foundAlignment.length)
			newAc = {
				...ac,
				propertyType: prop as AlignmentPropertyTypeCredentialKey,
				targetNodeType: 'Credential',
				destinationData: { ...ac.destinationData, Type: foundAlignment[0].Type }
			};
	}
	if (Object.hasOwn(cp, 'TargetLearningOpportunity')) {
		const propValue = cp['TargetLearningOpportunity'];
		foundAlignment = propValue?.filter((a) => a.SubjectWebpage === targetUrl) ?? [];
		newCp['TargetLearningOpportunity'] = propValue?.filter((a) => a.SubjectWebpage !== targetUrl);
		remainingAlignmentsCount += cp['TargetLearningOpportunity']?.length ?? 0;

		if (foundAlignment.length)
			newAc = {
				...ac,
				propertyType: prop as AlignmentPropertyTypeCredentialKey,
				targetNodeType: NodeTypeKeyForCtdlClass[foundAlignment[0].Type] ?? 'DEFAULT'
			};
	}
	if (Object.hasOwn(cp, 'TargetOccupation')) {
		const propValue = cp['TargetOccupation'];
		foundAlignment = propValue?.filter((a) => a.SubjectWebpage === targetUrl) ?? [];
		newCp['TargetOccupation'] = propValue?.filter((a) => a.SubjectWebpage !== targetUrl);
		remainingAlignmentsCount += cp['TargetOccupation']?.length ?? 0;

		if (foundAlignment.length)
			newAc = {
				...ac,
				propertyType: prop as AlignmentPropertyTypeCredentialKey,
				targetNodeType: 'Occupation'
			};
	}

	// If no alignments remain, return null to indicate that the condition profile should be removed.
	// There is some tiny risk that a user manually entered some additional data in the CP after it was previously
	// published, and this will be deleted, so that the AlignmentConfigs will repopulate it with the correct data.
	// This is a very unlikely scenario.
	if (remainingAlignmentsCount === 0 && newCp.Name != 'Open Badges Criteria')
		return { cp: null, ac: newAc };
	return { cp: newCp, ac: newAc };
};

export const filterAlignmentFromCredential = (
	c: CtdlCredentialDraft,
	ac: OBAlignmentConfig
): CtdlCredentialDraft => {
	let newCredential = { ...c };

	const conditionProfilePropsToCheck: Array<
		| 'AdvancedStandingFrom'
		| 'Corequisite'
		| 'IsAdvancedStandingFor'
		| 'IsPreparationFor'
		| 'IsRecommendedFor'
		| 'IsRequiredFor'
		| 'PreparationFrom'
		| 'Recommends'
		| 'Requires'
	> = [
		'AdvancedStandingFrom',
		'Corequisite',
		'IsAdvancedStandingFor',
		'IsPreparationFor',
		'IsRecommendedFor',
		'IsRequiredFor',
		'PreparationFrom',
		'Recommends',
		'Requires'
	];

	// Check all locations in the credential where alignments might be found within a ConditionProfile
	conditionProfilePropsToCheck.map((prop) => {
		if (Object.hasOwn(newCredential.Credential, prop)) {
			const propValue = newCredential.Credential[prop] as Array<any> | undefined;
			const newCps =
				propValue?.map(
					(cp: ConditionProfile): FilterData => filterAlignmentFromConditionProfile(cp, ac, prop)
				) ?? [];
			newCredential.Credential[prop] = newCps
				.map((c: FilterData) => c.cp)
				.filter((cp: ConditionProfile | null) => cp !== null) as ConditionProfile[];
			const newAcs = newCps
				.map((c: FilterData) => c.ac)
				.filter((ac) => ac !== null) as OBAlignmentConfig[];

			// Replace the alignmentConfig with the discovered one, recording the user's previous preference
			// about the placement of this alignment within the CtdlCredential.
			if (newAcs.length) {
				console.log(
					`${newAcs[0].targetNodeType} alignment to ${ac.sourceData.targetUrl} found in ${newAcs[0].propertyType} of ${prop}`
				);
				newCredential.obAlignments[ac.sourceData.targetUrl] = newAcs[0];
			}
		}
	});

	// Check all locations in the credential where alignments might be found to a QA org profile
	const qaOrgPropsToCheck: Array<'AccreditedBy' | 'ApprovedBy' | 'RecognizedBy' | 'RegulatedBy'> = [
		'AccreditedBy',
		'ApprovedBy',
		'RecognizedBy',
		'RegulatedBy'
	];
	qaOrgPropsToCheck.map((prop) => {
		if (Object.hasOwn(newCredential.Credential, prop)) {
			const propValue = newCredential.Credential[prop] as QualityAssurance[];
			const foundAlignment = propValue?.filter(
				(a) => a.SubjectWebpage === ac.sourceData.targetUrl
			) as QualityAssurance[];

			if (foundAlignment.length) {
				newCredential.Credential[prop] = propValue?.filter(
					(a) => a.SubjectWebpage !== ac.sourceData.targetUrl
				) as QualityAssurance[];

				console.log(
					`QACredentialOrganization alignment to ${ac.sourceData.targetUrl} found in ${prop}`
				);

				// Replace the alignmentConfig with the discovered one, recording the user's previous preference
				newCredential.obAlignments[ac.sourceData.targetUrl] = {
					...ac,
					propertyType: prop as AlignmentPropertyTypeCredentialKey,
					targetNodeType: 'QACredentialOrganization'
				};
			}
		}

		// If the target URL is self-referential (an informational alignment to the finder itself), then we can drop the AC from the data.
		if (ac.sourceData.targetUrl == alignmentUrlForCredential(newCredential.Credential.CTID)) {
			delete newCredential.obAlignments[ac.sourceData.targetUrl];
		}
	});

	return newCredential;
};

const smartBlendCredential = (
	publisherData: CtdlCredential,
	badgeData: CtdlCredential
): CtdlCredential => {
	let result = { ...publisherData };
	result['Name'] = badgeData['Name'] ?? publisherData['Name'];
	result['Description'] = badgeData['Description'] ?? publisherData['Description'];
	result['SubjectWebpage'] = badgeData['SubjectWebpage'] ?? publisherData['SubjectWebpage'];
	result['DateEffective'] = badgeData['DateEffective'] ?? publisherData['DateEffective'];
	result['InLanguage'] = badgeData['InLanguage'] ?? publisherData['InLanguage'];
	result['Image'] = badgeData['Image'] ?? publisherData['Image'];
	result['Keyword'] = badgeData['Keyword'] ?? publisherData['Keyword'];

	// Gently merge the criteria requirement profile from the badge with any existing CPs on the publisher data.
	let r = badgeData['Requires'] ?? [];
	let pubR = publisherData['Requires'] ?? [];
	if (r.length && pubR.length) {
		const previouslySavedCriteria = pubR.filter(
			(cp) => cp.Name === 'Open Badges Criteria' || cp.Description == r[0].Description
		);
		if (previouslySavedCriteria.length) {
			result['Requires'] = [{ ...previouslySavedCriteria[0], ...r[0] }].concat(
				pubR.filter(
					(cp) => cp.Name !== 'Open Badges Criteria' && cp.Description !== r[0].Description
				)
			);
		} else {
			result['Requires'] = r.concat(pubR);
		}
	} else {
		// pubR.length == 0 // there are no existing CPs on the publisher data for the key 'Requires'
		result['Requires'] = r;
	}
	return result;
};

// This store holds credential drafts ready for publishing.
const createCredentialDraftStore = () => {
	const { subscribe, set, update } = writable<CtdlCredentialDraft[]>([]);

	return {
		set,
		subscribe,
		importCheckedSourceBadges: () => {
			const checkedBadgeKeys = get(checkedBadges);
			set(
				get(normalizedBadges)
					.filter((b) => checkedBadgeKeys[b.id] === true)
					.map((bc) => badgeClassToCtdlApiCredential(bc))
					.sort((a, b) => a.Credential.Name.localeCompare(b.Credential.Name))
			);
		},
		updateCredential: (b: CtdlCredentialDraft) => {
			update((credentialList) => {
				const filteredList = credentialList.filter(
					(c) => c.Credential.CredentialId != b.Credential.CredentialId
				);
				return [...filteredList, b].sort((a, b) =>
					a.Credential.Name.localeCompare(b.Credential.Name)
				);
			});
		},
		reconcileCredentialWithPublisher: (credentialId: string, publisherData: CtdlCredential) => {
			update((credentialList) => {
				const credential = credentialList.find((c) => c.Credential.CredentialId == credentialId);
				if (!credential) return credentialList;

				// Describe self-referential alignments to also filter out
				const selfA: OBAlignmentConfig = {
					sourceData: {
						targetUrl: alignmentUrlForCredential(publisherData.CTID),
						targetName: credential.Credential.Name,
						targetDescription: 'Additional information powered by the Credential Registry'
					},
					propertyType: 'DEFAULT',
					targetNodeType: 'DEFAULT',
					destinationData: {},
					skip: false
				};

				// Filter out any existing alignment from publisher data
				const updated: CtdlCredentialDraft = Object.values(credential.obAlignments)
					.concat([selfA])
					.reduce(
						(acc: CtdlCredentialDraft, ac: OBAlignmentConfig) => {
							return filterAlignmentFromCredential(acc, ac);
						},
						{
							...credential,
							Credential: smartBlendCredential(publisherData, credential.Credential)
						}
					);

				const filteredList = credentialList.filter(
					(c) => c.Credential.CredentialId != credentialId
				);

				return [...filteredList, updated].sort((a, b) =>
					a.Credential.Name.localeCompare(b.Credential.Name)
				);
			});
		}
	};
};
export const credentialDrafts = createCredentialDraftStore();

export enum PubStatuses {
	'Pending' = 'Pending',
	'PendingNew' = 'Pending New',
	'PendingUpdate' = 'Pending Update',
	'SaveInProgress' = 'Save in Progress',
	'SaveError' = 'Error',
	'SaveSuccess' = 'Success',
	'SourceUpdateInProgress' = 'Source Update in Progress',
	'SourceUpdated' = 'Source Updated'
}

export interface CredentialPublicationStatus {
	Id?: number;
	CTID?: string;
	CTDLType?: string;
	CTDLTypeLabel?: string;

	CredentialId: string;
	publicationStatus: PubStatuses;
	messages?: string[];
	publisherData?: CtdlCredential;
}

export enum EditStatus {
	FinishRequested,
	Reject,
	Accept,
	Editing
}

const createPublicationResultStore = () => {
	const { subscribe, set, update } = writable<{ [key: string]: CredentialPublicationStatus }>({});
	const getFullCredentialDetail = async (c: CredentialPublicationStatus): Promise<boolean> => {
		if (!c.CTID) return false;

		const url = `${PUBLIC_UI_API_BASEURL}/StagingApi/Load/Credential/${c.CTID}`;

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${get(publisherUser).user?.Token}`
			}
		});

		const responseData = await response.json();

		updateCredentialStatus(c.CredentialId, {
			CredentialId: c.CredentialId,
			publicationStatus: PubStatuses.PendingUpdate,
			publisherData: responseData['Data'] as CtdlCredential,
			messages: responseData['Messages']
		});

		credentialDrafts.reconcileCredentialWithPublisher(
			c.CredentialId,
			responseData['Data'] as CtdlCredential
		);

		return true;
	};

	const updateCredentialStatus = (credentialId: string, s: CredentialPublicationStatus) => {
		update((currentStatus) => {
			let newStatus = { ...currentStatus };

			newStatus[credentialId] = {
				...currentStatus[credentialId],
				...s
			};

			return newStatus;
		});
	};

	return {
		subscribe,
		updateCredentialStatus,
		initialize: () => {
			const drafts = get(credentialDrafts);
			const publisherSummaries = get(publisherCredentials).credentials;
			const existingIds = publisherSummaries.map((s) => s.CredentialId);
			let existingIdMatches: string[] = [];
			let statusIndex: { [key: string]: CredentialPublicationStatus } = {};

			drafts.map((c) => {
				const summaryData =
					publisherSummaries.filter((s) => s.CredentialId == c.Credential.CredentialId)[0] || {};

				statusIndex[c.Credential.CredentialId] = {
					...summaryData,
					CredentialId: c.Credential.CredentialId,
					publicationStatus: PubStatuses.Pending
				};

				if (existingIds.includes(c.Credential.CredentialId)) {
					// If there is already a version of this credential online, we need to fetch its full details
					existingIdMatches.push(c.Credential.CredentialId);
					statusIndex[c.Credential.CredentialId].publicationStatus = PubStatuses.PendingUpdate;
				} else {
					// If there is no match, then we will upload it as a new credential.
					statusIndex[c.Credential.CredentialId].publicationStatus = PubStatuses.PendingNew;
				}
			});

			// Save initial results.
			set(statusIndex);

			// Queue up data population
			existingIdMatches.map((existingId) => {
				getFullCredentialDetail(statusIndex[existingId]).catch((reason) => {
					updateCredentialStatus(existingId, {
						CredentialId: existingId,
						publicationStatus: PubStatuses.SaveError,
						messages: [
							"Error loading credential data from publisher. Can't update without loading existing data: " +
								reason
						]
					});
				});
			});
		}
	};
};
// {[key: CredentialId]: CredentialPublicationStatus}
export const ctdlPublicationResultStore = createPublicationResultStore();

export const saveCredential = async (credential: CtdlCredentialDraft) => {
	const status = get(ctdlPublicationResultStore)[credential.Credential.CredentialId];

	if (
		!status ||
		![PubStatuses.PendingNew, PubStatuses.PendingUpdate, PubStatuses.SaveError].includes(
			status.publicationStatus
		)
	)
		return;

	ctdlPublicationResultStore.updateCredentialStatus(credential.Credential.CredentialId, {
		CredentialId: credential.Credential.CredentialId,
		publicationStatus: PubStatuses.SaveInProgress,
		messages: []
	});

	const url = `${PUBLIC_UI_API_BASEURL}/StagingApi/Credential/Save`;

	const mergedCredential: CtdlApiCredential = {
		PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier,
		Credential: mergeAllAlignments(credential.Credential, credential.obAlignments),
		DoingCompleteReplacement: true
	};

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(mergedCredential),
		headers: {
			Authorization: `Bearer ${get(publisherUser).user?.Token}`,
			'Content-Type': 'application/json'
		}
	});
	const responseData = await response.json();

	if (!responseData['Valid']) {
		ctdlPublicationResultStore.updateCredentialStatus(credential.Credential.CredentialId, {
			CredentialId: credential.Credential.CredentialId,
			publicationStatus: PubStatuses.SaveError,
			messages: responseData['Messages']
		});
	} else {
		ctdlPublicationResultStore.updateCredentialStatus(credential.Credential.CredentialId, {
			...responseData['Data'],
			CredentialId: credential.Credential.CredentialId,
			publicationStatus: PubStatuses.SaveSuccess,
			messages: responseData['Messages']
		});
	}
};

export const saveAllCredentials = async () => {
	let doneYet = false;
	let nextCredential: CtdlCredentialDraft | undefined;
	let currentResults: { [key: string]: CredentialPublicationStatus };

	while (!doneYet) {
		currentResults = get(ctdlPublicationResultStore);
		nextCredential = get(credentialDrafts).find((c) =>
			[PubStatuses.PendingNew, PubStatuses.PendingUpdate].includes(
				currentResults[c.Credential.CredentialId]?.publicationStatus
			)
		);
		if (!nextCredential) doneYet = true;
		else {
			await saveCredential(nextCredential);
		}
	}
};

export const alignmentUrlForCredential = (ctid: string | undefined): string => {
	if (!ctid) return '';
	else if (PUBLIC_PUBLISHER_API_BASEURL.includes('sandbox'))
		return `https://sandbox.credentialengine.org/finder/resources/${ctid}`;
	else if (PUBLIC_PUBLISHER_API_BASEURL.includes('staging'))
		return `https://staging.credentialengine.org/finder/resources/${ctid}`;
	else return `https://credentialfinder.org/resources/${ctid}`;
};

export const alignmentExistsForCredential = (credential: CtdlCredentialDraft): boolean => {
	const targetUrl = alignmentUrlForCredential(
		get(ctdlPublicationResultStore)[credential.Credential.CredentialId]?.CTID
	);
	const existingAlignmentUrls = Object.values(credential.obAlignments).map(
		(a) => a.sourceData.targetUrl
	);
	return existingAlignmentUrls.includes(targetUrl);
};
