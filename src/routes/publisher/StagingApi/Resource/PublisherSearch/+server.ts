import { PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const publisherUrl = `${PUBLIC_PUBLISHER_API_BASEURL}/StagingApi/Resource/PublisherSearch`;
	const requestBody = await request.json();
	const orgCtid = requestBody.Filters.find((item) => item.URI == 'search:recordOwnedBy')[
		'ItemTexts'
	];
	const bearerToken = request.headers.get('Authorization');

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
