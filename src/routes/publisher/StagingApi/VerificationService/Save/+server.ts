import { PUBLIC_PUBLISHER_API_BASEURL } from '$app/env/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const authorization = request.headers.get('Authorization');
	if (!authorization) return new Response('Authorization required', { status: 401 });

	const publisherUrl = `${PUBLIC_PUBLISHER_API_BASEURL}/StagingApi/VerificationService/Save`;
	const requestBody = await request.text();

	const publisherResponse = await fetch(publisherUrl, {
		method: 'POST',
		headers: {
			Authorization: authorization,
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: requestBody
	});

	return new Response(publisherResponse.body);
};
