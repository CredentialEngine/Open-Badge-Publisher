<script lang="ts">
	import { slide } from 'svelte/transition';
	import Alert from '$lib/components/Alert.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Button from '$lib/components/Button.svelte';
	import Check from '$lib/icons/check.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import {
		canvasSelectedIssuerBadges,
		canvasSelectedRegion,
		canvasAccessToken
	} from '$lib/stores/badgeSourceStore.js';
	import {
		publisherUser,
		alignmentExistsForCredential,
		alignmentUrlForCredential,
		credentialDrafts,
		ctdlPublicationResultStore,
		PubStatuses,
		type CtdlApiCredential
	} from '$lib/stores/publisherStore.js';
	import type { Alignment } from '$lib/utils/badges.js';
	import { canvasRegions } from '$lib/utils/canvas.js';
	import { PUBLIC_PUBLISHER_API_ENV_LABEL, PUBLIC_UI_API_BASEURL } from '$env/static/public';

	const updateCanvasCredential = async (c: CtdlApiCredential): Promise<boolean> => {
		const canvasBadge = $canvasSelectedIssuerBadges.find(
			(cb) => cb.openBadgeId == c.Credential.CredentialId
		);
		const ctid = $ctdlPublicationResultStore[c.Credential.CredentialId]?.CTID;

		if (!canvasBadge) throw new Error('Could not identify source badge in Canvas.');

		const newAlignment: Alignment = {
			targetUrl: alignmentUrlForCredential(ctid),
			targetName: c.Credential.Name,
			targetDescription: `Additional information powered by the Credential Registry${
				PUBLIC_PUBLISHER_API_ENV_LABEL ? ' ' + PUBLIC_PUBLISHER_API_ENV_LABEL : ''
			}.`,
			targetFramework: 'Credentials Transparency Description Language',
			targetCode: ctid
		};

		const requestBody = {
			name: canvasBadge.name,
			description: canvasBadge.description,
			alignments: [...canvasBadge.alignments, newAlignment]
		};

		const requestData = {
			URL: `${canvasRegions.get($canvasSelectedRegion)?.apiDomain}/v2/badgeclasses/${
				canvasBadge.entityId
			}`,
			Method: 'PUT',
			Body: JSON.stringify(requestBody),
			Headers: [
				{
					Name: 'Authorization',
					Value: `Bearer ${$canvasAccessToken}`
				},
				{
					Name: 'Accept',
					Value: 'application/json'
				},
				{
					Name: 'Content-Type',
					Value: 'application/json'
				}
			]
		};

		let proxyRequestHeaders = new Headers();
		proxyRequestHeaders.append('Content-Type', 'application/json');
		if ($publisherUser.user?.Token)
			proxyRequestHeaders.append('Authorization', `Bearer ${$publisherUser.user.Token}`);

		const proxyResponse = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
			method: 'POST',
			body: JSON.stringify(requestData),
			headers: proxyRequestHeaders
		});
		const proxyResponseData = await proxyResponse.json();

		if (!proxyResponseData.Valid || proxyResponseData.Data?.StatusCode != '200')
			throw new Error('Error fetching badge data from Canvas Credentials.');

		return true;
	};

	let credentials: CtdlApiCredential[];
	let updatePromises: { [key: string]: Promise<boolean> } = {};
	$: {
		credentials = $credentialDrafts.filter((c) => {
			const status = $ctdlPublicationResultStore[c.Credential.CredentialId];
			return [PubStatuses.SaveSuccess, PubStatuses.SourceUpdated].includes(
				status?.publicationStatus
			);
		});
		credentials.map((c) => {
			updatePromises[c.Credential.CredentialId] = new Promise((resolve, reject) => {
				resolve(false);
			});
		});
	}
</script>

<Heading><h3>Update badge alignments</h3></Heading>

<BodyText>
	It is helpful to include links to registry resources within your badge to help users understand
	the badges more clearly. Here is a summary of the badges you have saved and a Credential Finder
	alignment you can add to each of them. The alignment URLs below will work once you have completed
	publication of these Credentials in the Publisher.
</BodyText>

<div class="overflow-x-auto relative rounded-lg" transition:slide>
	<table class="w-full text-sm text-left text-gray-500">
		<thead class="text-xs text-gray-700 uppercase bg-gray-50">
			<tr>
				<th scope="col" class="py-3 px-6">Badge Name</th>
				<th scope="col" class="py-3 px-6">Alignments</th>
				<th scope="col" class="py-3 px-6">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each credentials as credential}
				<tr class="bg-white border-b">
					<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
						{credential.Credential.Name}
					</th>
					<td class="py-4 px-6">
						{#if alignmentExistsForCredential(credential)}
							<div class="inline-block"><Check height="16" width="16" /></div>
							Alignment has been previously added.
						{:else}
							<BodyText
								><span class="font-bold">targetName</span>: {credential.Credential.Name}</BodyText
							>
							<BodyText
								><span class="font-bold">targetUrl</span>: {alignmentUrlForCredential(
									$ctdlPublicationResultStore[credential.Credential.CredentialId]?.CTID
								)}</BodyText
							>
							<BodyText
								><span class="font-bold">targetDescription</span>: Additional information powered by
								the Credential Registry{PUBLIC_PUBLISHER_API_ENV_LABEL
									? ` ${PUBLIC_PUBLISHER_API_ENV_LABEL}`
									: ''}.
							</BodyText>
							<BodyText
								><span class="font-bold">targetFramework</span>: Credential Transparency Description
								Language</BodyText
							>
							<BodyText
								><span class="font-bold">targetCode</span>: {$ctdlPublicationResultStore[
									credential.Credential.CredentialId
								]?.CTID}</BodyText
							>
						{/if}
					</td>
					<td class="py-4 px-6">
						{#if $ctdlPublicationResultStore[credential.Credential.CredentialId]?.publicationStatus == PubStatuses.SourceUpdated || alignmentExistsForCredential(credential)}
							<div class="inline-block"><Check height="16" width="16" /></div>
							Saved
						{:else}
							{#await updatePromises[credential.Credential.CredentialId]}
								<LoadingSpinner />
							{:then value}
								{#if value}
									<div class="inline-block"><Check height="16" width="16" /></div>
									Saved
								{:else}
									<Button
										class="ughbutton"
										on:click={() => {
											updatePromises[credential.Credential.CredentialId] =
												updateCanvasCredential(credential);
										}}>Save</Button
									>
								{/if}
							{:catch error}
								<Alert level="error" message={error.message} />
							{/await}
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
