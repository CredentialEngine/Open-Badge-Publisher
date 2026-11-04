import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server.js';

// Unit-test the proxy's URL allowlist and forwarding, not SvelteKit's CSRF middleware.
// CSRF is checked by the framework before this route, in production SSR mode.
const requestEvent = (url: string) =>
	({
		request: new Request('http://localhost:5173/publisher/StagingApi/Proxy', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ URL: url, Method: 'GET', Body: '', Headers: [] })
		})
	}) as Parameters<typeof POST>[0];

describe('development proxy allowlist (non-UI route logic)', () => {
	afterEach(() => vi.unstubAllGlobals());

	it.each([
		'https://attacker.example/api',
		'https://api.badgr.io.attacker.example/data',
		'http://api.badgr.io/data'
	])('rejects disallowed origin %s without making a network request', async (url) => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const response = await POST(requestEvent(url));
		expect(response.status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('forwards an allowed origin and returns the external response envelope', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		const response = await POST(requestEvent('https://api.badgr.io/v2/issuers'));
		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.badgr.io/v2/issuers',
			expect.objectContaining({ method: 'GET', redirect: 'manual' })
		);
		expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('body');
		const payload = await response.json();
		expect(payload.Data).toMatchObject({ StatusCode: 200, Body: '{"ok":true}' });
	});
	it('does not automatically follow an upstream redirect to another origin', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response('', { status: 302, headers: { Location: 'http://localhost/private' } })
			);
		vi.stubGlobal('fetch', fetchMock);
		await POST(requestEvent('https://api.badgr.io/redirect'));
		expect(fetchMock.mock.calls[0][1].redirect).toBe('manual');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
