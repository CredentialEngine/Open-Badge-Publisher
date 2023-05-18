import { OidcClient, type OidcClientSettings } from 'oidc-client-ts';
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import {
	PUBLIC_BASEURL,
	PUBLIC_CANVAS_TEST_LOGIN_AUTHORITY,
	PUBLIC_CANVAS_TEST_LOGIN_CLIENT_ID,
	PUBLIC_CANVAS_TEST_LOGIN_CLIENT_SECRET,
	PUBLIC_PUBLISHER_API_BASEURL,
	PUBLIC_UI_API_BASEURL
} from '$env/static/public';
import Utf8 from 'crypto-js/enc-utf8.js';
import Base64 from 'crypto-js/enc-base64.js';
import { canvasSelectedRegion } from '../stores/badgeSourceStore.js';
import { deserializeStores, serializeStores } from '../stores/storageBackend.js';

// TODO adapt to not be region specific to test... figure out how to select which env var dynamically

const defaultSettings = {
	redirect_uri: PUBLIC_BASEURL,
	response_type: 'code',
	scope: 'rw:issuer',
	authority: 'UNKNOWN',
	client_id: 'DEFAULT'
};
const settingsByEnv: { [key: string]: OidcClientSettings } = {
	au: {
		...defaultSettings
	},
	ca: {
		...defaultSettings
	},
	eu: {
		...defaultSettings
	},
	us: {
		...defaultSettings
	},
	test: {
		...defaultSettings,
		authority: PUBLIC_CANVAS_TEST_LOGIN_AUTHORITY ?? '',
		client_id: PUBLIC_CANVAS_TEST_LOGIN_CLIENT_ID ?? '',
		client_secret: PUBLIC_CANVAS_TEST_LOGIN_CLIENT_SECRET ?? '',
		metadata: {
			issuer: PUBLIC_CANVAS_TEST_LOGIN_AUTHORITY ?? '',
			authorization_endpoint: 'https://test.badgr.com/auth/oauth2/authorize',
			token_endpoint: 'https://test.badgr.com/o/token',
			grant_types_supported: ['authorization_code'],
			response_modes_supported: ['query'],
			code_challenge_methods_supported: ['S256'],
			frontchannel_logout_session_supported: false,
			backchannel_logout_supported: false
		}
	}
};
const oidcSettings = settingsByEnv[get(canvasSelectedRegion) ?? 'test'] ?? settingsByEnv['test'];

const generateBasicAuth = (client_id: string, client_secret: string) => {
	const basicAuth = Utf8.parse([client_id, client_secret].join(':'));
	return Base64.stringify(basicAuth);
};

const exchangeCodeByProxy = async ({
	grant_type = 'authorization_code',
	redirect_uri = oidcSettings.redirect_uri,
	client_id = oidcSettings.client_id,
	client_secret = oidcSettings.client_secret,
	...args
}) => {
	if (!client_id) {
		throw new Error('A client_id is required');
	}
	if (!redirect_uri) {
		throw new Error('A redirect_uri is required');
	}
	if (!args.code) {
		throw new Error('A code is required');
	}
	const params = new URLSearchParams({ grant_type, redirect_uri });
	for (const [key, value] of Object.entries(args)) {
		if (value != null) {
			params.set(key, value);
		}
	}
	let basicAuth;
	switch (oidcSettings.client_authentication) {
		case 'client_secret_basic':
			if (!client_secret) {
				throw new Error('A client_secret is required');
				throw null;
			}
			basicAuth = generateBasicAuth(client_id, client_secret);
			break;
		case 'client_secret_post':
			params.append('client_id', client_id);
			if (client_secret) {
				params.append('client_secret', client_secret);
			}
			break;
	}
	const url = oidcSettings?.metadata?.token_endpoint ?? '';
	console.log('got token endpoint ' + url);
	// const response = await this._jsonService.postForm(url, { body: params, basicAuth, initCredentials: oidcSettings.fetchRequestCredentials });

	let proxyRequestHeaders = new Headers();
	proxyRequestHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
	proxyRequestHeaders.append('Accept', 'application/json');
	proxyRequestHeaders.append('Authorization', 'Basic ' + basicAuth);
	const proxyResponse = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
		method: 'POST',
		body: params,
		headers: proxyRequestHeaders
	});

	console.log('got response');
	return proxyResponse;
};

const exchangeCodeLog = () => {
	console.log('Whuuuuuuuut...');
};

class ProxyClient extends OidcClient {
	constructor(settings: OidcClientSettings) {
		super(settings);
		Object.defineProperty(this._tokenClient, 'exchangeCode', {
			value: exchangeCodeLog, //exchangeCodeByProxy,
			writable: false,
			enumerable: true,
			configurable: true
		});
		this._tokenClient.exchangeCode();
	}
}

let client = new ProxyClient(oidcSettings);

export const initiateLogin = () => {
	console.log('Stashing session data...');
	const storageTimestamp = serializeStores();
	console.log(`Session data stashed at: ${storageTimestamp}`);
	client
		.createSigninRequest({
			state: { timestamp: storageTimestamp },
			skipUserInfo: true,
			nonce: storageTimestamp
		})
		.then((req) => {
			console.log(req.url);
			window.location.href = req.url;
		})
		.catch((err) => {
			console.log(err);
		});
};

export const processLoginResponse = () => {
	console.log('Reloading previous application state...');
	deserializeStores();
	console.log('Previous application state reloaded.');

	client.processSigninResponse(window.location.toString()).then((response) => {
		console.log(response);
	});
};
