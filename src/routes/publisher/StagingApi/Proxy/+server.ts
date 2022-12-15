import * as dotenv from 'dotenv';
import { PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
import type { RequestHandler } from './$types';
import { URL } from 'node:url';

const ORIGIN_WHITELIST = [
	'https://api.badgr.io',
	'https://api.eu.badgr.io',
	'https://api.ca.badgr.io',
	'https://api.test.badgr.com',
	'https://www.credly.com'
];

export const POST: RequestHandler = async ({ request }) => {
	const requestData: {
		URL: string;
		Method: string;
		Body: string;
		Headers: Array<{ Name: string; Value: String }>;
	} = await request.json();

	const urlData = new URL(requestData.URL);
	if (!ORIGIN_WHITELIST.includes(urlData.origin))
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
		headers: {
			...Object.fromEntries(requestData.Headers.map((i) => [i.Name, i.Value])),
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: requestData.Body
	});

	let responseHeaders: Array<{ Name: string; Value: string }> = [];
	externalResponse.headers.forEach((value, key) => {
		responseHeaders.push({ Name: key, Value: value });
	});
	const responseBody = await externalResponse.text();

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
