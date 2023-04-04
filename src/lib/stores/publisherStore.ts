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

interface PublisherOptions {
	cookieBasedAccess: boolean;
	apiKey: string;
	accessToken?: string;
}

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

export interface TargetCompetency {
	// Framework: Link to the target framework registry resource URL, but there is no source in Open Badges AlignmentObject to find this "https://credentialengineregistry.org/resources/ce-48A570E2-DAC8-4AD9-99A5-BF368393C73B",
	FrameworkName?: string; // targetFramework -- Optional Framework Name
	TargetNodeName: string; // targetName -- Required Competency Name
	TargetNode: string; // targetUrl -- Alignment URL (preferably in registry domain)
	TargetNodeDescription?: string; // targetDescription  -- Optional Competency Description
	CodedNotation?: string; // targetCode
	SKIP?: boolean; // Not part of CTDL, this enables non-destructive hiding of competencies in edit mode. Skipped nodes are not saved.
}

export interface AlignmentObject {
	Description: string; // "Open Badges Alignment" -- purpose of the ConditionProfile
	TargetCompetency: TargetCompetency[];
	SubjectWebpage?: string; // Used for the expression of the critieria ID, if present.
	Name?: string; //
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

	// Alignments: Condition profiles with required competencies (Open Badges alignments are assumed to have this relation in Credential)
	Requires: AlignmentObject[];
}

export interface CtdlApiCredential {
	//required CTID of the owning organization
	PublishForOrganizationIdentifier: string; // "ce-696ea290-249a-4f99-9ed1-419f000d8472",
	Credential: CtdlCredential;
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

// Which user is authenticated, if any
export const publisherUser = writable<UserDataStore>({});

// Which organization is selected, if any
export const publisherOrganization = writable<OrganizationDataStore>({});
export const setPublisherSelection = (orgId: string) => {
	const selectedOrgData = get(publisherUser).user?.Organizations?.find((o) => o.CTID == orgId);
	publisherOrganization.set({ org: selectedOrgData });
};

// Which credentials already exist within the publisher for the selected org:
export const publisherCredentials = writable<PublisherCredentialsDataStore>({
	credentials: [],
	totalResults: 0
});
export const getOrgCredentialList = async (): Promise<boolean> => {
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
				ItemTexts: ['credential']
			}
		],
		Skip: 0,
		Take: 100
	};
	// TODO: handle pagination

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

	publisherCredentials.set({
		credentials: responseData.Data.Results,
		totalResults: responseData.Data.totalResults
	});

	return true;
};

export const resetPublisherSelection = () => {
	publisherOrganization.set({});
	publisherCredentials.set({ credentials: [], totalResults: 0 });
};

// Details about the API connection to the publisher
export const publisherOptions = writable<PublisherOptions>({
	cookieBasedAccess: false,
	apiKey: '',
	accessToken: undefined
});

// Governs which step is displayed
export const publisherSetupStep = writable<Number>(0);
export const proofingStep = writable(0);
export const reviewingStep = writable(0);

export const getUser = async () => {
	if (!browser || get(publisherUser).user) return null;

	const url = `${PUBLIC_UI_API_BASEURL || '/publisher'}/StagingApi/Load/User`;
	if (!haveSameDomain(url, PUBLIC_BASEURL)) return null;

	// Attempt to get user from the publisher using cookies that may be set if this app is running on same-origin.
	// TODO: just skip this if we can tell in advance that it is not running on same origin.
	const response = await fetch(url, { credentials: 'include' });
	if (!response.ok) return null;

	const data = await response.json();

	if (!data || !data['Valid']) return null;

	publisherUser.set({ user: data['Data'] });
	publisherOptions.set({ ...get(publisherOptions), cookieBasedAccess: true });
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
export const badgeClassToCtdlApiCredential = (b: BadgeClassCTDLExtended): CtdlApiCredential => {
	const publisherOrgId = get(publisherOrganization).org?.CTID;
	if (!publisherOrgId) throw new Error('Publishing org must be set before importing credentials.');

	const badgeAlignments = b.alignment || [];
	let conditionProfile: AlignmentObject = {
		Name: 'Open Badges Criteria',
		Description: b.criteria.narrative ? markdownToTxt(b.criteria.narrative) : 'Earning criteria',
		SubjectWebpage: b.criteria.id || undefined,
		TargetCompetency: []
	};
	badgeAlignments.forEach((a: Alignment) => {
		conditionProfile.TargetCompetency.push({
			FrameworkName: a.targetFramework,
			TargetNode: a.targetUrl,
			TargetNodeName: a.targetName,
			TargetNodeDescription: a.targetDescription,
			CodedNotation:
				!a.targetCode?.match(/^https?:\/\//) && a.targetCode != a.targetUrl
					? a.targetCode
					: undefined
		});
	});

	let result: CtdlApiCredential = {
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
			Requires: [conditionProfile]
		}
	};
	if (b.image) result.Credential.Image = b.image;

	return result;
};

// Combines the previously saved ConditionProfile found in the publisher with the potentially updated data from the badge system
const reconcileAlignments = (
	publisherRequires: AlignmentObject[],
	badgeSystemAlignments: AlignmentObject[],
	ctid: string | undefined
): AlignmentObject[] => {
	let representation: AlignmentObject[] = [];
	publisherRequires.forEach((pa) => {
		if (pa.Description != 'Open Badges Alignment' && pa.Name != 'Open Badges Criteria')
			representation.push(pa); // only replace Open Badges Alignments previously added by this tool, others are left in place
	});
	badgeSystemAlignments.forEach((bsa) => {
		let filteredAlignment: AlignmentObject = {
			Description: bsa.Description,
			TargetCompetency: bsa.TargetCompetency.filter((a) => !!ctid && !a.TargetNode?.includes(ctid))
		};
		if (bsa.Name) filteredAlignment.Name = bsa.Name;
		if (bsa.SubjectWebpage) filteredAlignment.SubjectWebpage = bsa.SubjectWebpage;
		representation.push(filteredAlignment);
	});

	return representation;
};

// This store holds credential drafts ready for publishing.
const createCredentialDraftStore = () => {
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
		},
		reconcileCredentialWithPublisher: (credentialId: string, publisherData: CtdlCredential) => {
			update((credentialList) => {
				const credential = credentialList.find((c) => c.Credential.CredentialId == credentialId);
				if (!credential) {
					return credentialList;
				}

				let updated = {
					PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier,
					Credential: { ...publisherData }
				};
				Object.keys(credential.Credential).map((key) => {
					// If the badge system version has data for the key, set that value into the draft.
					if ('Requires' == key)
						updated.Credential[key] = reconcileAlignments(
							updated.Credential[key], // current data on publisher
							credential.Credential[key], // data from badge system
							publisherData.CTID
						);
					else if (credential.Credential[key as keyof CtdlCredential] != undefined)
						updated.Credential[key as keyof CtdlCredential] = credential.Credential[key];
				});

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
		if (!responseData['Valid']) {
			throw new Error("Credential detail data couldn't be loaded.");
		}

		updateCredentialStatus(c.CredentialId, {
			CredentialId: c.CredentialId,
			publicationStatus: PubStatuses.PendingUpdate,
			publisherData: responseData['Data'] as CtdlCredential
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
							"Error loading credential data from publisher. Can't update without loading existing data."
						]
					});
				});
			});
		}
	};
};
// {[key: CredentialId]: CredentialPublicationStatus}
export const ctdlPublicationResultStore = createPublicationResultStore();

const credentialWithFilteredCompetencies = (credential: CtdlApiCredential): CtdlApiCredential => {
	const filterAlignmentObject = (ao: AlignmentObject[]): AlignmentObject[] => {
		let result: AlignmentObject[] = [];
		ao.forEach((a: AlignmentObject) => {
			if (a.Description == 'Open Badges Alignment') {
				result.push({
					Description: a.Description,
					TargetCompetency: a.TargetCompetency.filter((tc) => !tc.SKIP)
				});
			} else {
				result.push(a);
			}
		});
		return result;
	};

	let ret = {
		Credential: { ...credential.Credential },
		PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier
	};
	const newRequires = filterAlignmentObject(credential.Credential.Requires || []);
	if (newRequires.length) ret.Credential.Requires = newRequires;

	return ret;
};

export const saveCredential = async (credential: CtdlApiCredential) => {
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
	const orgCtid = get(publisherOrganization).org?.CTID;
	const competencyFilteredCredential = credentialWithFilteredCompetencies(credential);

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(competencyFilteredCredential),
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
	let nextCredential: CtdlApiCredential | undefined;
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

export const alignmentExistsForCredential = (credential: CtdlApiCredential): boolean => {
	const targetUrl = alignmentUrlForCredential(
		get(ctdlPublicationResultStore)[credential.Credential.CredentialId]?.CTID
	);
	let existingAlignmentUrls: string[] = [];
	credential.Credential.Requires.filter((r) => r.Description.includes('Open Badges')).map((a) => {
		a.TargetCompetency.map((tc) => {
			existingAlignmentUrls.push(tc.TargetNode);
		});
	});
	return existingAlignmentUrls.includes(targetUrl);
};
