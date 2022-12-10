import { writable, derived, get } from 'svelte/store';

import type { BadgeClassBasic, Alignment } from '$lib/stores/badgeSourceStore.js';
import { normalizedBadges, checkedBadges } from '$lib/stores/badgeSourceStore.js';
import { publisherOrganization } from '$lib/stores/publisherStore.js';

export interface CtdlApiCredential {
	//required CTID of the owning organization
	PublishForOrganizationIdentifier: string; // "ce-696ea290-249a-4f99-9ed1-419f000d8472",

	Credential: {
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

		Image: string; // "https://placekitten.com/400/400" //image URL

		Keyword?: string[]; // ["tag1", "tag two"] // list of keywords for the credential
		// "Subject": string[];  // ["Subject1", "Subject2"], // not used at this time. list of subjects for the credential

		// Alignments: Condition profiles with required competencies (Open Badges alignments are assumed to have this relation in Credential)
		Requires: Array<{
			Description: string; // "Open Badges Alignment" -- purpose of the ConditionProfile
			TargetCompetency: Array<{
				// Framework: Link to the target framework registry resource URL, but there is no source in Open Badges AlignmentObject to find this "https://credentialengineregistry.org/resources/ce-48A570E2-DAC8-4AD9-99A5-BF368393C73B",
				FrameworkName?: string; // targetFramework -- Optional Framework Name
				TargetNodeName: string; // targetName -- Required Competency Name
				TargetNode: string; // targetUrl -- Alignment URL (preferably in registry domain)
				TargetNodeDescription?: string; // targetDescription  -- Optional Competency Description
				CodedNotation?: string; // targetCode
			}>;
		}>;
	};
}

export const defaultAchievementTypeForBadgeAchievementType = (btype: string): string => {
	const mapping: { [key: string]: string } = {
		// Direct CTDL Mappings. List formatted as OpenBadgeTerm: CTDLTerm
		ApprenticeshipCertificate: 'ApprenticeshipCertificate',
		AssociateDegree: 'AssociateDegree',
		Badge: 'OpenBadge',
		BachelorDegree: 'BachelorDegree',
		Certificate: 'Certificate',
		CertificateOfCompletion: 'CertificateOfCompletion',
		Certification: 'Certification',
		Degree: 'Degree',
		Diploma: 'Diploma',
		DoctoralDegree: 'DoctoralDegree',
		GeneralEducationDevelopment: 'GeneralEducationDevelopment',
		JourneymanCertificate: 'JourneymanCertificate',
		License: 'License',
		ProfessionalDoctorate: 'ProfessionalDoctorate',
		QualityAssuranceCredential: 'QualityAssuranceCredential',
		MasterCertificate: 'MasterCertificate',
		MasterDegree: 'MasterDegree',
		MicroCredential: 'MicroCredential',
		ResearchDoctorate: 'ResearchDoctorate',
		SecondarySchoolDiploma: 'SecondarySchoolDiploma',

		// Not Found in CTDL https://credreg.net/ctdl/terms#credentialType enumeration
		Achievement: 'OpenBadge',
		Assessment: 'OpenBadge',
		Assignment: 'OpenBadge',
		Award: 'OpenBadge',
		CoCurricular: 'OpenBadge',
		CommunityService: 'OpenBadge',
		Competency: 'OpenBadge',
		Course: 'OpenBadge',
		Fieldwork: 'OpenBadge',
		LearningProgram: 'OpenBadge',
		Membership: 'OpenBadge'
	};

	if (Object.hasOwn(mapping, btype)) return mapping[btype];

	return 'OpenBadge'; // default.
};

// Converts a credential's data from Open Badges format to CTDL Publisher API format
export const badgeClassToCtdlApiCredential = (b: BadgeClassBasic): CtdlApiCredential => {
	const publisherOrgId = get(publisherOrganization).org?.CTID;
	if (!publisherOrgId) throw new Error('Publishing org must be set before importing credentials.');

	const badgeAlignments = b.alignment || [];
	return {
		PublishForOrganizationIdentifier: publisherOrgId,
		Credential: {
			CredentialType: defaultAchievementTypeForBadgeAchievementType(
				b.achievementType || 'OpenBadge'
			),
			CredentialStatusType: 'Active',
			Name: b.name,
			Description: b.description,
			OwnedBy: [{ CTID: publisherOrgId }],
			OfferedBy: [{ CTID: publisherOrgId }],
			CredentialId: b.id,
			SubjectWebpage: b.criteria.id || b.id, // Fall back to primary ID if no criteria URL set.
			Image: b.image,
			Keyword: b.tags,
			InLanguage: ['en-us'],
			Identifier: [
				{
					IdentifierType: 'id',
					IdentifierTypeName: 'Open Badges ID',
					IdentifierValueCode: b.id
				}
			],
			Requires: badgeAlignments.map((a: Alignment) => {
				return {
					Description: 'Open Badges Alignment',
					TargetCompetency: [
						{
							FrameworkName: a.targetFramework,
							TargetNode: a.targetUrl,
							TargetNodeName: a.targetName,
							TargetNodeDescription: a.targetDescription,
							CodedNotation: a.targetCode
						}
					]
				};
			})
		}
	};
};

// This store holds credential drafts ready for publishing.
const createCtdlCredentialStore = () => {
	const { subscribe, set, update } = writable<CtdlApiCredential[]>([]);

	return {
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
		updateCredential: (b: CtdlApiCredential) => {
			update((credentialList) => {
				const filteredList = credentialList.filter(
					(c) => c.Credential.CredentialId != b.Credential.CredentialId
				);
				return [...filteredList, b].sort((a, b) =>
					a.Credential.Name.localeCompare(b.Credential.Name)
				);
			});
		}
	};
};
export const ctdlCredentials = createCtdlCredentialStore();

export const proofingStep = writable(0);
