<script lang="ts">
	import { slide } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { PubStatuses, type CtdlApiCredential } from '$lib/stores/publisherStore.js';
	import * as yup from 'yup';
	import type { BaseSchema } from 'yup';
	import {
		credentialDrafts,
		ctdlPublicationResultStore,
		EditStatus
	} from '$lib/stores/publisherStore.js';
	import Alert from '$lib/components/Alert.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Button from '$lib/components/Button.svelte';

	export let credential: CtdlApiCredential;
	export let editStatus: EditStatus;
	export let fieldName = '';
	export let fieldId: 'Name' | 'Description' | 'SubjectWebpage' | 'Image' | 'CTID';
	export let helpText = '';
	export let helpUrl = '';
	export let editable = false;
	export let longText = false;
	export let validator: BaseSchema = yup.string();

	const dispatch = createEventDispatcher();

	const inputId = `${encodeURIComponent(credential.Credential.CredentialId)}-${fieldId}`;
	let value: string = credential.Credential[fieldId] || ''; // Todo -- Image is nullable. Make sure not to send '' to server
	let isEditing = false;
	let validationErrorMessage = '';

	// Track if the current value represents a change from previously saved credential.
	const isPendingUpdate =
		$ctdlPublicationResultStore[credential.Credential.CredentialId]?.publicationStatus ==
		PubStatuses.PendingUpdate;
	const publisherData =
		$ctdlPublicationResultStore[credential.Credential.CredentialId]?.publisherData;
	let publisherFieldData: string | undefined;
	if (publisherData) {
		publisherFieldData = publisherData[fieldId];
	} else {
		publisherFieldData = undefined;
	}

	const handleSaveRow = () => {
		validationErrorMessage = ''; // reset error message.
		// validate value
		if (validator !== undefined) {
			try {
				validator.validateSync(value);
			} catch (err) {
				if (err instanceof yup.ValidationError) validationErrorMessage = err.errors.join(', ');
				return;
			}
		}

		let editedCredential = {
			Credential: {
				...credential.Credential
			},
			PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier
		};
		editedCredential.Credential[fieldId] = value;
		credentialDrafts.updateCredential(editedCredential);
		isEditing = false;
	};

	const handleCancelRowEdit = () => {
		value = credential.Credential[fieldId] || '';
		isEditing = false;
	};

	$: {
		if (
			isEditing &&
			editStatus == EditStatus.FinishRequested &&
			value != credential.Credential[fieldId]
		)
			dispatch('unsavedChanges', { fieldId: fieldId });
		else if (isEditing && editStatus == EditStatus.Reject) handleCancelRowEdit();
		else if (isEditing && editStatus == EditStatus.Accept) handleSaveRow();
	}
</script>

{#if !isEditing}
	<!-- Display the Value -->
	<tr class="bg-white border-b">
		<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
			{fieldName || fieldId}
		</th>
		<td class="py-4 px-6">
			{#if isPendingUpdate && publisherFieldData != value}
				<div class="w-full mb-2" transition:slide>
					<span
						class="bg-supermint text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 whitespace-nowrap rounded"
					>
						Updated
					</span>
				</div>
			{/if}
			<slot>{value}</slot>
		</td>
		<td class="py-4 px-6">
			{#if editable}
				<Button
					on:click={() => {
						isEditing = true;
					}}
				>
					Edit
				</Button>
			{/if}
		</td>
	</tr>
{:else}
	<!-- Show Edit Form-->
	<tr class="bg-white border-b">
		<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
			<label for={inputId}>{fieldName || fieldId}</label>
		</th>
		<td class="py-4 px-6">
			{#if isPendingUpdate && publisherFieldData != value}
				<div class="w-full mb-2">
					<span
						class="bg-supermint text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 whitespace-nowrap rounded"
					>
						Updated
					</span>
				</div>
			{/if}
			{#if longText}
				<textarea
					id={inputId}
					rows="7"
					class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
					type="text"
					bind:value
				/>
			{:else}
				<input
					id={inputId}
					class="focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200"
					type="text"
					bind:value
				/>
			{/if}
			{#if isPendingUpdate && publisherFieldData != value}
				<div>
					<BodyText>
						<span class="text-xs text-gray-600">On publisher: {publisherFieldData}</span>
					</BodyText>
				</div>
			{/if}
			{#if validationErrorMessage}
				<Alert level="error" message={validationErrorMessage} />
			{/if}
		</td>
		<td class="flex flex-col py-4 px-6 space-y-3">
			<Button on:click={handleCancelRowEdit}>Cancel</Button>
			<Button buttonType="primary" on:click={handleSaveRow}>Save</Button>
		</td>
	</tr>
{/if}
