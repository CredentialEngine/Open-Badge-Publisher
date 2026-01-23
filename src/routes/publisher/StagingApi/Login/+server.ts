import { PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const publisherUrl = `${PUBLIC_PUBLISHER_API_BASEURL}/StagingApi/Login`;
	const { email, password } = await request.json();

	// const publisherResponse = await fetch(publisherUrl, {
	// 	method: 'POST',
	// 	headers: {
	// 		Accept: 'application/json',
	// 		'Content-Type': 'application/json'
	// 	},
	// 	body: JSON.stringify({ Email: email, Password: password })
	// });

	return new Response({
    "Valid": true,
    "Messages": [],
    "Data": {
        "Id": 497,
        "Name": "Jenna Waltuch",
        "Email": "jwaltuch@credentialengine.org",
        "IsSiteStaff": true,
        "Token": "bf030cc4-2095-4037-a262-43bd03643b41",
        "Organizations": [
            {
                "Id": 1,
                "RowId": "9bd8c615-9f3c-40e6-9c20-6d9f811844e6",
                "Name": "Credential Engine Administration - Sandbox",
                "CTID": "ce-a4041983-b1ae-4ad4-a43d-284a5b4b2d73",
                "Type": "Organization",
                "Tags": []
            },
            {
                "Id": 6,
                "RowId": "036d082d-d80e-41a7-99a0-2d63a4ad3a4a",
                "Name": "Western Governors University-SANDBOX",
                "CTID": "ce-9d30f846-dfa4-4b1c-90fa-9d01238a86ac",
                "Type": "Organization",
                "Tags": []
            },
            {
                "Id": 1082,
                "RowId": "6a62b250-a1a2-4d31-a702-cdc2437efd31",
                "Name": "NOCTI",
                "CTID": "ce-7b127b5f-9c1f-480e-b90a-ab2b559f7fed",
                "Type": "Organization",
                "Tags": []
            }
        ]
    }
});
};
