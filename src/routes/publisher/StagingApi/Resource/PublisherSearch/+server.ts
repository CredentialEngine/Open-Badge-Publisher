import { PUBLIC_PUBLISHER_API_BASEURL } from '$app/env/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const publisherUrl = `${PUBLIC_PUBLISHER_API_BASEURL}/StagingApi/Resource/PublisherSearch`;
	const bearerToken = request.headers.get('Authorization');
	if (!bearerToken) return new Response('Authorization required', { status: 401 });
	const requestBody = await request.json();

	const publisherResponse = await fetch(publisherUrl, {
		method: 'POST',
		headers: {
			Authorization: bearerToken,
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(requestBody)
	});

	return new Response(publisherResponse.body);
};
