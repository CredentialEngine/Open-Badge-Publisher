import { get } from 'svelte/store';
import { browser } from '$app/env';

import { storageBackend } from '../stores/storageBackend.js';
import {
	basicAuthorization,
	beginOAuthTransaction,
	consumeOAuthTransaction,
	pkceChallenge
} from './oauthTransaction.js';
import { PUBLIC_BASEURL, PUBLIC_UI_API_BASEURL } from '$app/env/public';
import {
	publisherCredentials,
	publisherOrganization,
	publisherSetupStep,
	publisherVerificationService
} from '../stores/publisherStore.js';
import {
	badgeSetupStep,
	parchmentAccessToken,
	parchmentOrganization,
	parchmentSelectedRegion
} from '../stores/badgeSourceStore.js';
import { restoreStores, serializeStores } from '../stores/storageBackend.js';
import { refreshCredentialTypes } from '../stores/credentialTypesStore.js';
import { tick } from 'svelte';
import { error } from '@sveltejs/kit';
import { parchmentEnv } from '#lib/utils/parchment.js';

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

export const initiateLogin = async () => {
	if (!browser) return;

	console.log('Stashing session data...');
	serializeStores();

	// Use tab-scoped storage so simultaneous logins in different tabs cannot collide.
	const { state, verifier } = beginOAuthTransaction(window.sessionStorage);
	const code_challenge = await pkceChallenge(verifier);

	const selectedRegion = get(parchmentSelectedRegion) || 'test';
	const parchmentLoginOptions = parchmentEnv(selectedRegion);
	const selectedParchmentOrganization = get(parchmentOrganization);
	const client_id: string = parchmentLoginOptions.client_id || 'CREDENTIALENGINEBADGEPUBLISHER';

	const authorizeParams: [string, string][] = [
		['client_id', client_id],
		['redirect_uri', PUBLIC_BASEURL],
		['state', state],
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
	// Verify the callback BEFORE restoring a session or exchanging its authorization code.
	const callbackUrl = new URL(window.location.href);
	const code = callbackUrl.searchParams.get('code') ?? '';
	const state = callbackUrl.searchParams.get('state');
	const transaction = consumeOAuthTransaction(window.sessionStorage, state);

	// Remove the authorization code from history, including on a failed validation.
	callbackUrl.searchParams.delete('code');
	callbackUrl.searchParams.delete('state');
	window.history.replaceState(window.history.state, '', callbackUrl.toString());

	if (!transaction || !code) {
		throw error(400, 'Unable to complete Parchment login: invalid or expired OAuth state.');
	}

	const verifier = transaction.verifier;
	restoreStores();

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

	const tokenResponse = await requestByProxy(
		'POST',
		`${parchmentLoginOptions.apiDomain}/o/token`,
		new URLSearchParams(tokenParams).toString(),
		[
			{ Name: 'Authorization', Value: basicAuthorization(client_id, client_secret) },
			{ Name: 'Accept', Value: 'application/json' },
			{ Name: 'Content-Type', Value: 'application/x-www-form-urlencoded' }
		]
	);
	if (tokenResponse.status !== 200) {
		throw error(
			500,
			'Unable to get access token from Parchment. Status code: ' + tokenResponse.status
		);
	}
	const responseBody = JSON.parse(tokenResponse.body ?? '{}');
	if (!responseBody.access_token) {
		throw error(
			500,
			'Unable to get access token from Parchment. Access token not found in Parchment response.'
		);
	}

	storageBackend?.setItem('parchment_access_token', responseBody.access_token);
	parchmentAccessToken.set(responseBody.access_token);
	await restoreSession();
	await refreshCredentialTypes();
};
