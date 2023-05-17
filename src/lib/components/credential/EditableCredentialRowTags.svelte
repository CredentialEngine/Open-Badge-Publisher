<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher, tick } from 'svelte';
	import { scale, slide } from 'svelte/transition';
	import {
		PubStatuses,
		type CtdlApiCredential,
		type CtdlCredentialDraft
	} from '$lib/stores/publisherStore.js';
	import * as yup from 'yup';
	import type { BaseSchema } from 'yup';
	import {
		credentialDrafts,
		ctdlPublicationResultStore,
		EditStatus
	} from '$lib/stores/publisherStore.js';
	import abbreviate from '$lib/utils/abbreviate.js';
	import Alert from '$lib/components/Alert.svelte';
	import Button from '$lib/components/Button.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import Close from '$lib/icons/close.svelte';

	export let credential: CtdlCredentialDraft;
	export let editStatus: EditStatus;
	export let fieldName = '';
	export let fieldId: 'Keyword' | 'InLanguage';
	export let helpText = '';
	export let helpUrl = '';
	export let editable = false;
	export let validator: BaseSchema = yup.string().required();

	const dispatch = createEventDispatcher();

	const inputId = `${encodeURIComponent(credential.Credential.CredentialId)}-${fieldId}`;
	let value: string[] = credential.Credential[fieldId] || [];
	let inputValue = '';
	let isEditing = false;
	let validationErrorMessage = '';

	// Track if the current value represents a change from previously saved credential.
	const isPendingUpdate =
		$ctdlPublicationResultStore[credential.Credential.CredentialId]?.publicationStatus ==
		PubStatuses.PendingUpdate;
	const publisherData =
		$ctdlPublicationResultStore[credential.Credential.CredentialId]?.publisherData;
	let publisherFieldData: string[] = [];
	onMount(() => {
		if (publisherData) {
			publisherFieldData = publisherData[fieldId] || [];
		} else {
			publisherFieldData = [];
		}
	});

	const setChanged = (a: string[], b: string[]): boolean => {
		const reducer = (changedYet: boolean, v: string): boolean =>
			changedYet == true ? true : !b.includes(v);
		return a.length != b.length || a.reduce(reducer, false);
	};

	let isValueUpdated = false;
	$: isValueUpdated = isPendingUpdate && setChanged(publisherFieldData, value);

	const handleSaveRow = () => {
		validationErrorMessage = ''; // reset error message.
		// validate value
		try {
			value.map((v) => {
				validator.validateSync(v);
			});
		} catch (err) {
			if (err instanceof yup.ValidationError) validationErrorMessage = err.errors.join(', ');
			return;
		}

		let editedCredential = {
			...credential,
			Credential: {
				...credential.Credential
			}
		};
		editedCredential.Credential[fieldId] = value;
		credentialDrafts.updateCredential(editedCredential);
		isEditing = false;
	};
	const handleAddValue = () => {
		validationErrorMessage = '';
		document.getElementById(inputId)?.focus();
		try {
			validator.validateSync(inputValue);
		} catch (err) {
			if (err instanceof yup.ValidationError) validationErrorMessage = err.errors.join(', ');
			return;
		}
		if (value.includes(inputValue)) {
			validationErrorMessage = 'Items must be unique.';
			inputValue = '';
			return;
		}

		value = [...value, inputValue];
		inputValue = '';
	};
	const handleRemoveValue = (valToRemove: string) => {
		value = value.filter((v) => v != valToRemove);
	};
	const handleCancelRowEdit = () => {
		value = credential.Credential[fieldId] || [];
		isEditing = false;
	};

	$: {
		if (
			isEditing &&
			editStatus == EditStatus.FinishRequested &&
			setChanged(credential.Credential[fieldId] || [], value)
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
			{#if isValueUpdated}
				<div class="w-full mb-2" transition:slide>
					<span
						class="bg-supermint text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 whitespace-nowrap rounded"
					>
						Updated
					</span>
				</div>
			{/if}
			<slot>
				<div class="flex flex-wrap flex-row">
					{#each value as valueEntry (valueEntry)}
						<div class="mr-2 mb-2">
							<Tag>{abbreviate(valueEntry, 25)}</Tag>
						</div>
					{/each}
				</div>
			</slot>
		</td>
		<td class="py-4 px-6">
			{#if editable}
				<Button
					on:click={async () => {
						isEditing = true;
						await tick();
						document.getElementById(inputId)?.focus();
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
			<div class="mb-3">
				{#if helpText}
					<BodyText><span class="text-xs text-gray-600">{helpText}</span></BodyText>
				{/if}
				<div class="flex flex-wrap flex-row">
					{#if isValueUpdated}
						<span
							transition:scale
							class="bg-supermint text-blue-800 text-sm font-medium mr-2 mb-2 px-2 py-1 whitespace-nowrap rounded"
						>
							Updated:
						</span>
					{/if}
					{#each value as valueEntry (valueEntry)}
						<span
							class="inline-flex items-center py-1 px-2 mr-2 mb-2 text-sm font-medium text-gray-800 bg-gray-100 rounded"
						>
							{abbreviate(valueEntry, 25)}
							<button
								on:click={() => {
									handleRemoveValue(valueEntry);
								}}
								type="button"
								class="inline-flex items-center p-0.5 ml-2 text-sm text-gray-400 bg-transparent rounded-sm hover:bg-gray-200 hover:text-gray-900"
								data-dismiss-target="#badge-dismiss-dark"
								aria-label="Remove"
							>
								<Close height="8" width="8" />
								<span class="sr-only">Remove {valueEntry}</span>
							</button>
						</span>
					{/each}
				</div>
			</div>
			<div class="flex items-end flex-col md:flex-row mb-3">
				<form on:submit|preventDefault|stopPropagation={handleAddValue}>
					<input
						id={inputId}
						class="focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200"
						type="text"
						bind:value={inputValue}
					/>
					<Button type="submit">Add</Button>
				</form>
			</div>
			{#if isValueUpdated}
				<div transition:slide>
					<BodyText>
						<span class="text-xs text-gray-600">On publisher: {publisherFieldData.join(', ')}</span>
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
