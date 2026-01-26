import { get } from 'svelte/store';
import { browser } from '$app/environment';
import CryptoJs from 'crypto-js';
import sha256 from 'crypto-js/sha256.js';
import Base64 from 'crypto-js/enc-base64.js';
import Utf8 from 'crypto-js/enc-utf8.js';

import { storageBackend } from '../stores/storageBackend.js';
import {
	PUBLIC_BASEURL,
	PUBLIC_CANVAS_AU_ENABLED,
	PUBLIC_CANVAS_AU_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_AU_LOGIN_CLIENT_SECRET,
	PUBLIC_CANVAS_CA_ENABLED,
	PUBLIC_CANVAS_CA_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_CA_LOGIN_CLIENT_SECRET,
	PUBLIC_CANVAS_EU_ENABLED,
	PUBLIC_CANVAS_EU_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_EU_LOGIN_CLIENT_SECRET,
	PUBLIC_CANVAS_TEST_ENABLED,
	PUBLIC_CANVAS_TEST_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_TEST_LOGIN_CLIENT_SECRET,
	PUBLIC_CANVAS_US_ENABLED,
	PUBLIC_CANVAS_US_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_US_LOGIN_CLIENT_SECRET,
	PUBLIC_UI_API_BASEURL
} from '$env/static/public';
import {
	publisherCredentials,
	publisherOptions,
	publisherOrganization,
	publisherSetupStep,
	publisherVerificationService
} from '../stores/publisherStore.js';
import {
	badgeSetupStep,
	canvasAccessToken,
	canvasSelectedRegion,
	parchmentAccessToken,
	parchmentOrganization,
	parchmentSelectedRegion
} from '../stores/badgeSourceStore.js';
import { canvasEnv } from '../utils/canvas.js';
import { restoreStores, serializeStores } from '../stores/storageBackend.js';
import { refreshCredentialTypes } from '../stores/credentialTypesStore.js';
import { tick } from 'svelte';
import { error } from '@sveltejs/kit';
import { parchmentEnv } from '$lib/utils/parchment.js';

const requestByProxy = async (
	method: string,
	url: string,
	body: string,
	headers: { Name: string; Value: string }[]
) => {
	const proxyBody = JSON.stringify({
		URL: url,
		Method: method,
		Body: body,
		Headers: headers
	});
	let proxyRequestHeaders = new Headers();
	proxyRequestHeaders.append('Content-Type', 'application/json');
	const proxyResponse = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
		method: 'POST',
		body: proxyBody,
		headers: proxyRequestHeaders
	});
	const proxyResponseBody = await proxyResponse.json();
	return {
		status: proxyResponseBody.Data?.StatusCode as number | undefined,
		body: (proxyResponseBody.Data?.Body as string) ?? ''
	};
};

const generateBasicAuth = (username: string, password: string): string => {
	return 'Basic ' + window.btoa(username ?? '' + ':' + password ?? '');
};

const UUID_TEMPLATE = '10000000-1000-4000-8000-100000000000';
const verifierPart = (): string => {
	const uuid = UUID_TEMPLATE.replace(/[018]/g, (c) =>
		(+c ^ (CryptoJs.lib.WordArray.random(1).words[0] & (15 >> (+c / 4)))).toString(16)
	);
	return uuid.replace(/-/g, '');
};

export const initiateLogin = async () => {
	if (!browser) return;

	console.log('Stashing session data...');
	const storageTimestamp = serializeStores();
	console.log(`Session data stashed at: ${storageTimestamp}`);

	const verifier = verifierPart() + verifierPart() + verifierPart();
	const hashed = sha256(verifier);
	const code_challenge = Base64.stringify(hashed)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

	storageBackend?.setItem('pkce_code_verifier', verifier);

	const selectedRegion = get(parchmentSelectedRegion) || 'test';
	const parchmentLoginOptions = parchmentEnv(selectedRegion);
	const selectedParchmentOrganization = get(parchmentOrganization);
	const client_id: string = parchmentLoginOptions.client_id || 'CREDENTIALENGINEBADGEPUBLISHER';

	const authorizeParams: [string, string][] = [
		['client_id', client_id],
		['redirect_uri', PUBLIC_BASEURL],
		['state', storageTimestamp],
		['scope', 'rw:issuer'],
		['code_challenge_method', 'S256'],
		['code_challenge', code_challenge]
	];

	const authorizeUri = `https://${selectedParchmentOrganization}.${parchmentLoginOptions.domain}/auth/oauth2/authorize?${new URLSearchParams(
		authorizeParams
	).toString()}`;
	window.location.replace(authorizeUri);
};

/* Return the user experience to the spot where they load data from Canvas for the first time */
const restoreSession = async () => {
	if (
		get(publisherOrganization).org?.Id &&
		get(publisherVerificationService) &&
		get(publisherCredentials).credentials?.length >= 0 // May be no drafts yet
	) {
		publisherSetupStep.set(5); // Triggers reactive statement in PublisherConfig.svelte
		badgeSetupStep.set(2);
		await tick();
		document.getElementById('badge-source-configuration')?.scrollIntoView();
	}
};

export const processLoginResponse = async () => {
	console.log("Calling restoreStores")
	// Restore session data from before the redirect to Canvas.
	restoreStores();

	// In case the user refreshes the page after returning from Canvas,
	// and this function is triggered because `code=` is still in the
	// querystring, it would be nice to not force them to go sign in with
	// Parchment again.
	if (get(parchmentAccessToken)) {
		// Now that we have a user token again, we can reload credentialtypes
		console.log("Token acquired")
		restoreSession();
		refreshCredentialTypes();
		return; // Session is restored, including Parchment access token, so we're done.
	}

	// Normally: handle the first time the user returns from Parchment in a session.
	const params = new URLSearchParams(window.location.toString()?.split('?')[1]);
	const code = params.get('code') ?? '';
	const state = params.get('state');
	console.log("Got code", code)

	// Remove these items so that an invalid request for some reason doesn't get sent
	// to Parchment over and over.
	const storageTimestamp = storageBackend?.getItem('storageTimestamp');
	storageBackend?.removeItem('storageTimestamp');

	const verifier = storageBackend?.getItem('pkce_code_verifier') || '';
	storageBackend?.removeItem('pkce_code_verifier');

	// Now that we have a user token again, we can reload credentialtypes
	refreshCredentialTypes();

	const selectedRegion = get(parchmentSelectedRegion) || 'test';
	const parchmentLoginOptions = parchmentEnv(selectedRegion);
	const client_id: string = parchmentLoginOptions.client_id || 'CREDENTIALENGINEBADGEPUBLISHER';
	const client_secret: string = parchmentLoginOptions.client_secret || 'SECRET_NOT_CONFIGURED';

	const tokenParams: [string, string][] = [
		['grant_type', 'authorization_code'],
		['code', code],
		['client_id', client_id],
		['client_secret', client_secret],
		['redirect_uri', PUBLIC_BASEURL],
		['code_verifier', verifier]
	];

	if (verifier && code && state == storageTimestamp) {
		const tokenResponse = await requestByProxy(
			'POST',
			`${parchmentLoginOptions.apiDomain}/o/token`,
			new URLSearchParams(tokenParams).toString(),
			[
				{
					Name: 'Authorization',
					Value: generateBasicAuth(client_id, client_secret)
				},
				{
					Name: 'Accept',
					Value: 'application/json'
				},
				{
					Name: 'Content-Type',
					Value: 'application/x-www-form-urlencoded'
				}
			]
		);
		if (tokenResponse.status !== 200) {
			throw error(
				500,
				'Unable to get access token from Parchment. Status code: ' + tokenResponse.status
			);
		}
		const responseBody = JSON.parse(tokenResponse.body ?? '{}');

		if (responseBody.access_token) {
			storageBackend?.setItem('parchment_access_token', responseBody.access_token);
			parchmentAccessToken.set(responseBody.access_token);
			restoreSession();
		} else {
			throw error(
				500,
				'Unable to get access token from Parchment. Access token not found in Parchment response.'
			);
		}
	} else {
		throw error(500, 'Unable to get access token from Parchment. Request invalid.');
	}
};
