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
	import {
		ctdlCredentials,
		ctdlPublicationResultStore,
		publisherCredentials,
        saveCredential
	} from '$lib/stores/publisherStore.js';
	import CredentialProofingList from './CredentialProofingList.svelte';
</script>

<Heading><h4>Summary</h4></Heading>

<BodyText>
	<!-- TODO: Populate with actual live numbers -->
	There are <span class="font-bold">4 new pending credentials</span> ready to be saved.
	<span class="font-bold">3 updates</span> to existing credentials are pending.
	<span class="font-bold">1 new credential</span> and <span class="font-bold">2 new updates</span>
	have been successfully saved. There were <span class="font-bold">2 errors</span> from this batch of
	saves that you can review below.
</BodyText>

<div class="overflow-x-auto relative rounded-lg" transition:slide>
	<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
		<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
			<tr>
				<th scope="col" class="py-3 px-6">Badge Name</th>
				<th scope="col" class="py-3 px-6">Publishing Status</th>
				<th scope="col" class="py-3 px-6">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each $ctdlCredentials as draft}
				<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
					<th
						scope="row"
						class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white"
					>
						{draft.Credential.Name}
					</th>
					<td class="py-4 px-6">
						{$ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus}
                        {#if $ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveInProgress}
							<LoadingSpinner />
						{/if}
					</td>
					<td class="py-4 px-6 flex flex-row py-4 space-x-3">
						{#if [PubStatuses.PendingNew, PubStatuses.PendingUpdate, PubStatuses.SaveInProgress].includes($ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus)}
							<button
                                class="text-gray-900 w-full text-sm px-5 py-2.5 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 focus:outline-none dark:focus:ring-gray-700"
                                disabled={$ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveInProgress}
                                on:click={() => saveCredential(draft)}
                            >
                                Save
                            </button>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
