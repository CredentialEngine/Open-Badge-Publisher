<script lang="ts">
	import { slide } from 'svelte/transition';
	import Check from '$lib/icons/check.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import {
		alignmentExistsForCredential,
		alignmentUrlForCredential,
		credentialDrafts,
		ctdlPublicationResultStore,
		PubStatuses
	} from '$lib/stores/publisherStore.js';
	import { PUBLIC_PUBLISHER_API_ENV_LABEL } from '$env/static/public';

	let credentials = $credentialDrafts.filter((c) => {
		const status = $ctdlPublicationResultStore[c.Credential.CredentialId];
		return status?.publicationStatus == PubStatuses.SaveSuccess;
	});

	
</script>

<Heading><h3>Update badge alignments</h3></Heading>

<BodyText>
	It is helpful to include links to registry resources within your badge to help users understand
	the badges more clearly. Here is a summary of the badges you have saved and a Credential Finder
	alignment you can add to each of them. The alignment URLs below will work once you have completed
	publication of these Credentials in the Publisher.
</BodyText>

<div class="overflow-x-auto relative rounded-lg" transition:slide>
	<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
		<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
			<tr>
				<th scope="col" class="py-3 px-6">Badge Name</th>
				<th scope="col" class="py-3 px-6">Alignments</th>
			</tr>
		</thead>
		<tbody>
			{#each credentials as credential}
				<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
					<th
						scope="row"
						class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white"
					>
						{credential.Credential.Name}
					</th>
					<td class="py-4 px-6">
						{#if alignmentExistsForCredential(credential)}
							<div class="inline-block"><Check height="16" width="16" /></div> Alignment has been previously added.
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
				</tr>
			{/each}
		</tbody>
	</table>
</div>
