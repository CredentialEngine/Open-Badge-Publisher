import { PUBLIC_PUBLISHER_API_BASEURL } from '$app/env/public';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request }) => {
	const authorization = request.headers.get('Authorization');
	if (!authorization) return new Response('Authorization required', { status: 401 });

	const publisherUrl = `${PUBLIC_PUBLISHER_API_BASEURL}/StagingApi/Load/Credential/${params.id}`;

	const publisherResponse = await fetch(publisherUrl, {
		headers: {
			Authorization: authorization,
			Accept: 'application/json',
			'Content-Type': 'application/json'
		}
	});

	return new Response(publisherResponse.body);
};
