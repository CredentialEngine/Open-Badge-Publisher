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

	let saveAllTriggered = false;

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
			targetFramework: 'Credential Transparency Description Language',
			targetCode: ctid
		};

		const requestBody = {
			name: canvasBadge.name,
			description: canvasBadge.description,
			alignments: [...canvasBadge.alignments, newAlignment]
		};

		const requestData = {
			URL: `${canvasRegions.get($canvasSelectedRegion || 'test')?.apiDomain}/v2/badgeclasses/${
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

		ctdlPublicationResultStore.updateCredentialStatus(c.Credential.CredentialId, {
			...$ctdlPublicationResultStore[c.Credential.CredentialId],
			publicationStatus: PubStatuses.SourceUpdateInProgress
		});

		const proxyResponse = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
			method: 'POST',
			body: JSON.stringify(requestData),
			headers: proxyRequestHeaders
		});
		const proxyResponseData = await proxyResponse.json();

		if (!proxyResponseData.Valid || proxyResponseData.Data?.StatusCode != '200')
			throw new Error('Error fetching badge data from Canvas Credentials.');

		ctdlPublicationResultStore.updateCredentialStatus(c.Credential.CredentialId, {
			...$ctdlPublicationResultStore[c.Credential.CredentialId],
			publicationStatus: PubStatuses.SourceUpdated
		});
		return true;
	};

	let credentials: CtdlApiCredential[];
	let updatePromises: { [key: string]: Promise<boolean> } = {};
	$: {
		credentials = $credentialDrafts.filter((c) => {
			const status = $ctdlPublicationResultStore[c.Credential.CredentialId];
			return [
				PubStatuses.SaveSuccess,
				PubStatuses.SourceUpdateInProgress,
				PubStatuses.SourceUpdated
			].includes(status?.publicationStatus);
		});
		credentials.map((c) => {
			updatePromises[c.Credential.CredentialId] = new Promise((resolve, reject) => {
				resolve(false);
			});
		});
	}

	const processNextCredential = () => {
		let nextCredential = credentials.find(
			(c) =>
				PubStatuses.SaveSuccess ==
				$ctdlPublicationResultStore[c.Credential.CredentialId]?.publicationStatus
		);
		if (!!nextCredential) {
			updatePromises[nextCredential.Credential.CredentialId] =
				updateCanvasCredential(nextCredential);
			updatePromises[nextCredential.Credential.CredentialId].then(processNextCredential);
		}
	};
</script>

<Heading><h3>Update badge alignments</h3></Heading>

<BodyText>
	Update your badges in Canvas Credentials to add alignments to Credential Finder pages. This helps
	users better understand the meaning and value of your badges.
</BodyText>
<div class="py-4">
	<Button
		buttonType="primary"
		on:click={() => {
			saveAllTriggered = true;
			processNextCredential();
		}}
		disabled={saveAllTriggered}>Save all alignments to Canvas</Button
	>
</div>

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
