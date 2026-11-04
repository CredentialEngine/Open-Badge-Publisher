/** OAuth state and PKCE are a single, one-time transaction in the browser tab. */
const TRANSACTION_KEY = 'parchment_oauth_transaction';

type TransactionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type Transaction = { state: string; verifier: string };

/** 32 CSPRNG bytes = 256 bits of entropy, encoded as URL-safe lowercase hex. */
export const randomOAuthValue = (): string => {
	const bytes = new Uint8Array(32);
	globalThis.crypto.getRandomValues(bytes);
	return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
};

/** Starting another login in the same tab replaces the previous pending one. */
export const beginOAuthTransaction = (storage: TransactionStorage): Transaction => {
	const transaction: Transaction = {
		state: randomOAuthValue(),
		verifier: randomOAuthValue()
	};
	storage.setItem(TRANSACTION_KEY, JSON.stringify(transaction));
	return transaction;
};

/** Consume first, verify second: even an invalid callback cannot replay the state. */
export const consumeOAuthTransaction = (
	storage: TransactionStorage,
	receivedState: string | null
): Transaction | null => {
	const value = storage.getItem(TRANSACTION_KEY);
	storage.removeItem(TRANSACTION_KEY);
	if (!receivedState || !value) return null;

	try {
		const parsed: unknown = JSON.parse(value);
		if (!parsed || typeof parsed !== 'object') return null;
		const transaction = parsed as Partial<Transaction>;
		if (
			transaction.state !== receivedState ||
			typeof transaction.verifier !== 'string' ||
			!/^[a-f0-9]{64}$/.test(transaction.verifier)
		)
			return null;
		return { state: receivedState, verifier: transaction.verifier };
	} catch {
		return null;
	}
};

export const basicAuthorization = (username: string, password: string): string =>
	`Basic ${btoa(`${username}:${password}`)}`;

/** OAuth PKCE S256 challenge, per RFC 7636 (SHA-256 followed by base64url). */
export const pkceChallenge = async (verifier: string): Promise<string> => {
	const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
	return btoa(String.fromCharCode(...new Uint8Array(hash)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
};
