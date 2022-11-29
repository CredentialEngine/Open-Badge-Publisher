import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { PUBLIC_BASEURL, PUBLIC_UI_API_BASEURL } from '$env/static/public';
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

interface PublisherCredentialSummary {
	Id: number;
	RowId: string;
	Name: string;
	Description: string;
	CTID: string;
	Type: string;
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
export const updateOrgCredentials = async (): Promise<boolean> => {
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
			},
			{
				URI: 'ceterms:credentialType',
				ItemTexts: ['ceterms:OpenBadge']
			}
		],
		Skip: 0,
		Take: 100
	};

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(formData),
		headers: {
			Authorization: `Bearer ${get(publisherUser).user?.Token}`
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

export const getUser = async () => {
	if (!browser || get(publisherUser).user) return null;

	const url = `${PUBLIC_UI_API_BASEURL || '/publisher'}/StagingApi/Load/User`;
	if (!haveSameDomain(url, PUBLIC_BASEURL)) return null;

	console.log(`Fetching User from ${url} ...`);

	// Attempt to get user from the publisher using cookies that may be set if this app is running on same-origin.
	// TODO: just skip this if we can tell in advance that it is not running on same origin.
	const response = await fetch(url, { credentials: 'include' });
	console.log(`UserResponse: ${response.status}`);
	if (!response.ok) return null;

	const data = await response.json();

	if (!data || !data['Valid']) return null;

	publisherUser.set({ user: data['Data'] });
	publisherOptions.set({ ...get(publisherOptions), cookieBasedAccess: true });
};
