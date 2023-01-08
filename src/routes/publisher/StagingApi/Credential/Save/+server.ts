/*import * as dotenv from 'dotenv';*/
import { PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const publisherUrl = `${PUBLIC_PUBLISHER_API_BASEURL}/StagingApi/Credential/Save`;
	const requestBody = await request.text();

	const publisherResponse = await fetch(publisherUrl, {
		method: 'POST',
		headers: {
			Authorization: request.headers.get('Authorization'),
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: requestBody
	});

	return new Response(publisherResponse.body);
};
