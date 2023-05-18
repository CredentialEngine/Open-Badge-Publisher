import { browser } from '$app/environment';

import {
	publisherUser,
	publisherOrganization,
	publisherVerificationService,
	publisherCredentials,
	publisherOptions
} from '$lib/stores/publisherStore.js';
import { get } from 'svelte/store';
import { badgeSourceType, canvasSelectedRegion, canvasAgreeTerms } from './badgeSourceStore.js';

const storageBackend = browser ? window?.sessionStorage : null;

export const serializeStores = () => {
	storageBackend?.setItem('publisherUser', JSON.stringify(get(publisherUser)));
	storageBackend?.setItem('publisherOrganization', JSON.stringify(get(publisherOrganization)));
	storageBackend?.setItem(
		'publisherVerificationService',
		JSON.stringify(get(publisherVerificationService))
	);
	storageBackend?.setItem('publisherCredentials', JSON.stringify(get(publisherCredentials)));
	storageBackend?.setItem('publisherOptions', JSON.stringify(get(publisherOptions)));

	storageBackend?.setItem('badgeSourceType', JSON.stringify(get(badgeSourceType)));
	storageBackend?.setItem('canvasSelectedRegion', JSON.stringify(get(canvasSelectedRegion)));
	storageBackend?.setItem('canvasAgreeTerms', JSON.stringify(get(canvasAgreeTerms)));

	const storageTimestamp = JSON.stringify(Date.now());
	storageBackend?.setItem('storageTimestamp', storageTimestamp);
	return storageTimestamp;
};

export const deserializeStores = () => {
	const publisherUserString = storageBackend?.getItem('publisherUser');
	if (publisherUserString) publisherUser.set(JSON.parse(publisherUserString));
	storageBackend?.removeItem('publisherUser');

	const publisherOrganizationString = storageBackend?.getItem('publisherOrganization');
	if (publisherOrganizationString)
		publisherOrganization.set(JSON.parse(publisherOrganizationString));
	storageBackend?.removeItem('publisherOrganization');

	const publisherVerificationServiceString = storageBackend?.getItem(
		'publisherVerificationService'
	);
	if (publisherVerificationServiceString)
		publisherVerificationService.set(JSON.parse(publisherVerificationServiceString));
	storageBackend?.removeItem('publisherVerificationService');

	const publisherCredentialsString = storageBackend?.getItem('publisherCredentials');
	if (publisherCredentialsString) publisherCredentials.set(JSON.parse(publisherCredentialsString));
	storageBackend?.removeItem('publisherCredentials');

	const publisherOptionsString = storageBackend?.getItem('publisherOptions');
	if (publisherOptionsString) publisherOptions.set(JSON.parse(publisherOptionsString));
	storageBackend?.removeItem('publisherOptions');

	const badgeSourceTypeString = storageBackend?.getItem('badgeSourceType');
	if (badgeSourceTypeString) badgeSourceType.set(JSON.parse(badgeSourceTypeString));
	storageBackend?.removeItem('badgeSourceType');

	const canvasSelectedRegionString = storageBackend?.getItem('canvasSelectedRegion');
	if (canvasSelectedRegionString) canvasSelectedRegion.set(JSON.parse(canvasSelectedRegionString));
	storageBackend?.removeItem('canvasSelectedRegion');

	const canvasAgreeTermsString = storageBackend?.getItem('canvasAgreeTerms');
	if (canvasAgreeTermsString) canvasAgreeTerms.set(JSON.parse(canvasAgreeTermsString));
	storageBackend?.removeItem('canvasAgreeTerms');

	storageBackend?.removeItem('storageTimestamp');
};
