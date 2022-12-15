import * as dotenv from 'dotenv';
import { PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request }) => {
	const publisherUrl = `${PUBLIC_PUBLISHER_API_BASEURL}/StagingApi/Load/Credential/${params.id}`;

	const publisherResponse = await fetch(publisherUrl, {
		headers: {
			Authorization: request.headers.get('Authorization'),
			Accept: 'application/json',
			'Content-Type': 'application/json'
		}
	});

	return new Response(publisherResponse.body);
};
