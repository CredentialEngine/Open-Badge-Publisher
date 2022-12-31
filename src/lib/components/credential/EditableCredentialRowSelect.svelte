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
	import Tag from '$lib/components/Tag.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';

	export let credential: CtdlApiCredential;
	export let fieldName = '';
	export let editStatus: EditStatus;
	export let fieldId: 'CredentialType' | 'CredentialStatusType';
	export let helpText = '';
	export let helpUrl = '';
	export let editable = false;
	export let options: Array<{ value: string; name: string }>;
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

	const prettyNameForValue = (v: string | undefined): string => {
		const option = options.find((o) => o.value == v);
		if (!option) return v || '';
		return option.name;
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
			<slot><Tag>{prettyNameForValue(value)}</Tag></slot>
		</td>
		<td class="py-4 px-6">
			{#if editable}
				<button
					type="button"
					class="text-gray-900 text-sm px-5 py-2.5 ml-3 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 focus:outline-none"
					on:click={() => {
						isEditing = true;
					}}
				>
					Edit
				</button>
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
			<select
				id="countries"
				bind:value
				class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
			>
				<option selected={!value}>Choose option</option>
				{#each options as option (option)}
					<option value={option.value} selected={value == option.value}>{option.name}</option>
				{/each}
			</select>
			{#if isPendingUpdate && publisherFieldData != value}
				<div transition:slide>
					<BodyText>
						<span class="text-xs text-gray-600"
							>On publisher: {prettyNameForValue(publisherFieldData)}</span
						>
					</BodyText>
				</div>
			{/if}
			{#if validationErrorMessage}
				<Alert level="error" message={validationErrorMessage} />
			{/if}
		</td>
		<td class="flex flex-col py-4 px-6 space-y-3">
			<button
				type="button"
				class="text-gray-900 w-full text-sm px-5 py-2.5 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 focus:outline-none"
				on:click={handleCancelRowEdit}
			>
				Cancel
			</button>
			<button
				type="button"
				class="text-gray-900 w-full text-sm px-5 py-2.5 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 focus:outline-none"
				on:click={handleSaveRow}
			>
				Save
			</button>
		</td>
	</tr>
{/if}
