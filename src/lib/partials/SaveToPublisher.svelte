<script lang="ts">
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { pluralize, pluralizeFrom } from '$lib/utils/pluralize.js';
	import { PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
	import {
		type CtdlApiCredential,
		type CredentialPublicationStatus,
		PubStatuses,
		credentialDrafts,
		ctdlPublicationResultStore,
		publisherCredentials,
		saveCredential
	} from '$lib/stores/publisherStore.js';
	import CredentialProofingList from './CredentialProofingList.svelte';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';

	interface Counts {
		pendingNew: number;
		pendingUpdate: number;
		saveError: number;
		saveSuccess: number;
	}

	let counts: Counts = {
		pendingNew: 0,
		pendingUpdate: 0,
		saveError: 0,
		saveSuccess: 0
	};
	const updateCounts = (results: { [key: string]: CredentialPublicationStatus }) => {
		counts = Object.values(results).reduce(
			(acc: Counts, v) => {
				const isSuccess = [PubStatuses.SaveSuccess, PubStatuses.SourceUpdated].includes(
					v.publicationStatus
				);
				return {
					pendingNew:
						v.publicationStatus == PubStatuses.PendingNew ? acc.pendingNew + 1 : acc.pendingNew,
					pendingUpdate:
						v.publicationStatus == PubStatuses.PendingUpdate
							? acc.pendingUpdate + 1
							: acc.pendingUpdate,
					saveError:
						v.publicationStatus == PubStatuses.SaveError ? acc.saveError + 1 : acc.saveError,
					saveSuccess: isSuccess ? acc.saveSuccess + 1 : acc.saveSuccess
				};
			},
			{
				pendingNew: 0,
				pendingUpdate: 0,
				saveError: 0,
				saveSuccess: 0
			}
		);
		console.log('Updated counts!');
		console.log(Object.values(results));
		console.log(counts);
	};

	onMount(() => {
		updateCounts($ctdlPublicationResultStore);
	});

	$: updateCounts($ctdlPublicationResultStore);
</script>

<BodyText>
	There {pluralizeFrom(counts.pendingNew, 'are', 'is', 'are')}
	<span class="font-bold">
		{counts.pendingNew} new {pluralize(counts.pendingNew, 'credential')}
	</span>
	ready to be saved.
	<span class="font-bold">{counts.pendingUpdate} {pluralize(counts.pendingUpdate, 'update')}</span>
	to existing credentials {pluralizeFrom(counts.pendingUpdate, 'are', 'is', 'are')} pending.
	<span class="font-bold">{counts.saveSuccess} {pluralize(counts.saveSuccess, 'credential')}</span>
	have been successfully saved.
	<span class="font-bold">{counts.saveError} {pluralize(counts.saveError, 'error')}</span> resulted from
	this batch of saves. Detailed results below.
</BodyText>

<div class="mt-4 overflow-x-auto relative rounded-lg" transition:slide>
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
							<Button on:click={() => saveCredential(draft)}>Save</Button>
						{:else if $ctdlPublicationResultStore[draft.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveInProgress}
							<Button disabled={true}>Save</Button>
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
