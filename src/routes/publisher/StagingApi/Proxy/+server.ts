import { PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
import type { RequestHandler } from './$types';
import { URL } from 'node:url';

const ORIGIN_WHITELIST = [
	'https://api.badgr.io',
	'https://api.eu.badgr.io',
	'https://api.ca.badgr.io',
	'https://api.test.badgr.com',
	'https://www.credly.com',
	// Accredible API regions (must match apiDomain values in src/lib/utils/accredible.ts)
	'https://api.accredible.com',
	'https://eu.api.accredible.com',
	'https://sandbox.api.accredible.com'
];

// Accredible's signed badge-image render service. Allowed ONLY for
// `FollowRedirects: false` requests, so the proxy hands back just the redirect
// target (a short S3 URL), never content from these hosts.
const isRedirectOnlyOrigin = (url: URL) =>
	url.protocol === 'https:' &&
	(url.hostname === 'pdf.ms.credential.net' || url.hostname.endsWith('.pdf.ms.credential.net'));

export const POST: RequestHandler = async ({ request }) => {
	const requestData: {
		URL: string;
		Method: string;
		Body: string;
		Headers: Array<{ Name: string; Value: string }>;
		FollowRedirects?: boolean;
	} = await request.json();

	const urlData = new URL(requestData.URL);
	const followRedirects = requestData.FollowRedirects !== false;
	const allowed =
		ORIGIN_WHITELIST.includes(urlData.origin) || (!followRedirects && isRedirectOnlyOrigin(urlData));
	if (!allowed)
		return new Response(
			JSON.stringify(
				{
					Headers: [],
					StatusCode: 400,
					StatusMessage: `URL {URL} was not in list of approved origins for this tool`,
					StatusSuccess: false,
					Body: ''
				},
				null,
				2
			),
			{
				status: 400
			}
		);

	const externalResponse = await fetch(requestData.URL, {
		method: requestData.Method,
		headers: Object.fromEntries(requestData.Headers.map((i) => [i.Name, i.Value])),
		body: requestData.Body,
		redirect: followRedirects ? 'follow' : 'manual'
	});

	let responseHeaders: Array<{ Name: string; Value: string }> = [];
	externalResponse.headers.forEach((value, key) => {
		responseHeaders.push({ Name: key, Value: value });
	});
	// A redirect-only lookup returns just status + headers (incl. Location).
	const responseBody = followRedirects ? await externalResponse.text() : '';

	return new Response(
		JSON.stringify(
			{
				Valid: true,
				Messages: [],
				Data: {
					Headers: responseHeaders,
					StatusCode: externalResponse.status,
					StatusMessage: 'Fetched external API successfully.',
					StatusSuccess: true,
					Body: responseBody
				}
			},
			null,
			2
		)
	);
};
