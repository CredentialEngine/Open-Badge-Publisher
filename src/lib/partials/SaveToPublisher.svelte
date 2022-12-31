<script lang="ts">
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import { slide } from 'svelte/transition';
	import {
		type CtdlApiCredential,
		type CredentialPublicationStatus,
		PubStatuses
	} from '$lib/stores/publisherStore.js';
	import { PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
	import {
		credentialDrafts,
		ctdlPublicationResultStore,
		publisherCredentials,
		saveCredential
	} from '$lib/stores/publisherStore.js';
	import CredentialProofingList from './CredentialProofingList.svelte';
	import Alert from '$lib/components/Alert.svelte';
</script>

<Heading><h4>Summary</h4></Heading>

<!-- <BodyText>
	
	There are <span class="font-bold">4 new pending credentials</span> ready to be saved.
	<span class="font-bold">3 updates</span> to existing credentials are pending.
	<span class="font-bold">1 new credential</span> and <span class="font-bold">2 new updates</span>
	have been successfully saved. There were <span class="font-bold">2 errors</span> from this batch of
	saves that you can review below.
</BodyText> -->

<div class="overflow-x-auto relative rounded-lg" transition:slide>
	<table class="w-full text-sm text-left text-gray-500">
		<thead class="text-xs text-gray-700 uppercase bg-gray-50">
			<tr>
				<th scope="col" class="py-3 px-6">Badge Name</th>
				<th scope="col" class="py-3 px-6">Publishing Status</th>
				<th scope="col" class="py-3 px-6">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each $credentialDrafts as draft}
				<tr class="bg-white border-b">
					<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
						{draft.Credential.Name}
					</th>
					<td class="py-4 px-6">
						{$ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus}
						{#if $ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveInProgress}
							<LoadingSpinner />
						{:else if $ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveError}
							{#each $ctdlPublicationResultStore[draft.Credential.CredentialId]?.messages || [] as message}
								<div class="flex flex-col space-y-2">
									<Alert {message} level="error" />
								</div>
							{/each}
						{/if}
					</td>
					<td class="py-4 px-6 flex flex-row py-4 space-x-3">
						{#if [PubStatuses.PendingNew, PubStatuses.PendingUpdate, PubStatuses.SaveError].includes($ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus)}
							<button
								class="text-gray-900 w-full text-sm px-5 py-2.5 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 focus:outline-none"
								on:click={() => saveCredential(draft)}
							>
								Save
							</button>
						{:else if $ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveInProgress}
							<button
								class="cursor-not-allowed text-gray-700 w-full text-sm px-5 py-2.5 bg-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 focus:outline-none"
								disabled
							>
								Save
							</button>
						{:else if $ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveSuccess}
							<span class="text-sm px-5 py-2.5 text-center font-medium">
								<a
									href={`${PUBLIC_PUBLISHER_API_BASEURL}/detail/Credential/${
										$ctdlPublicationResultStore[draft.Credential.CredentialId]?.Id
									}`}
									class="text-indigo-700"
									target="new"
								>
									View Credential
								</a>
							</span>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
