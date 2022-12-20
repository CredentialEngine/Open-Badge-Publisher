import * as dotenv from 'dotenv';
import { PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const publisherUrl = `${PUBLIC_PUBLISHER_API_BASEURL}/StagingApi/Login`;
	const { email, password } = await request.json();

	const publisherResponse = await fetch(publisherUrl, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ Email: email, Password: password })
	});

	return new Response(publisherResponse.body);
};
