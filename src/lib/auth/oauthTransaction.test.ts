import { describe, expect, it } from 'vitest';
import {
	basicAuthorization,
	beginOAuthTransaction,
	consumeOAuthTransaction,
	randomOAuthValue,
	pkceChallenge
} from './oauthTransaction.js';

const fakeStorage = () => {
	const values = new Map<string, string>();
	return {
		getItem: (name: string) => values.get(name) ?? null,
		setItem: (name: string, value: string) => {
			values.set(name, value);
		},
		removeItem: (name: string) => {
			values.delete(name);
		}
	};
};

describe('OAuth state and PKCE (non-UI)', () => {
	it('generates 256-bit, URL-safe, unpredictable values', () => {
		const values = Array.from({ length: 10 }, randomOAuthValue);
		expect(values.every((value) => /^[0-9a-f]{64}$/.test(value))).toBe(true);
		expect(new Set(values).size).toBe(values.length);
	});

	it('accepts the correct state exactly once and returns its paired PKCE verifier', () => {
		const storage = fakeStorage();
		const started = beginOAuthTransaction(storage);
		expect(consumeOAuthTransaction(storage, started.state)).toEqual(started);
		expect(consumeOAuthTransaction(storage, started.state)).toBeNull();
	});

	it('rejects a mismatched state and destroys the pending login', () => {
		const storage = fakeStorage();
		const started = beginOAuthTransaction(storage);
		expect(consumeOAuthTransaction(storage, 'attacker-controlled-state')).toBeNull();
		expect(consumeOAuthTransaction(storage, started.state)).toBeNull();
	});

	it('rejects missing state and refuses replay', () => {
		const storage = fakeStorage();
		const started = beginOAuthTransaction(storage);
		expect(consumeOAuthTransaction(storage, null)).toBeNull();
		expect(consumeOAuthTransaction(storage, started.state)).toBeNull();
	});

	it('replaces a pending same-tab login but allows independent tabs', () => {
		const firstTab = fakeStorage();
		const secondTab = fakeStorage();
		const oldTransaction = beginOAuthTransaction(firstTab);
		const replacement = beginOAuthTransaction(firstTab);
		const otherTab = beginOAuthTransaction(secondTab);
		expect(consumeOAuthTransaction(firstTab, replacement.state)).toEqual(replacement);
		expect(consumeOAuthTransaction(firstTab, oldTransaction.state)).toBeNull();
		expect(consumeOAuthTransaction(secondTab, otherTab.state)).toEqual(otherTab);
	});

	it('calculates the RFC 7636 S256 challenge using Web Crypto', async () => {
		const challenge = await pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
		expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
	});

	it('rejects a corrupted transaction', () => {
		const storage = fakeStorage();
		beginOAuthTransaction(storage);
		storage.setItem('parchment_oauth_transaction', '{garbage');
		expect(consumeOAuthTransaction(storage, 'anything')).toBeNull();
	});

	it('encodes the complete username:password in Basic authorization', () => {
		expect(basicAuthorization('client-id', 'client-secret')).toBe(
			`Basic ${btoa('client-id:client-secret')}`
		);
	});
});
