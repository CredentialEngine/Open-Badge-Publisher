<script lang="ts">
	import type { CtdlApiCredential } from '$lib/stores/badgeDestinationStore.js';
	import * as yup from 'yup';
	import type { BaseSchema } from 'yup';
	import { ctdlCredentials } from '$lib/stores/badgeDestinationStore.js';
	import abbreviate from '$lib/utils/abbreviate.js';
	import Alert from '$lib/components/Alert.svelte';
	import Tag from '$lib/components/tag.svelte';
	import Close from '$lib/icons/close.svelte';

	export let credential: CtdlApiCredential;
	export let fieldName = '';
	export let fieldId: 'Keyword' | 'InLanguage';
	export let helpText = '';
	export let helpUrl = '';
	export let editable = false;
	export let validator: BaseSchema = yup.string().required();

	const inputId = `${encodeURIComponent(credential.Credential.CredentialId)}-${fieldId}`;
	let value: string[] = credential.Credential[fieldId] || [];
	let inputValue = '';
	let isEditing = false;
	let validationErrorMessage = '';

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
			Credential: {
				...credential.Credential
			},
			PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier
		};
		editedCredential.Credential[fieldId] = value;
		ctdlCredentials.updateCredential(editedCredential);
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
</script>

{#if !isEditing}
	<!-- Display the Value -->
	<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
		<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
			{fieldName || fieldId}
		</th>
		<td class="py-4 px-6">
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
				<button
					type="button"
					class="text-gray-900 text-sm px-5 py-2.5 ml-3 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 focus:outline-none dark:focus:ring-gray-700"
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
	<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
		<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
			<label for={inputId}>{fieldName || fieldId}</label>
		</th>
		<td class="py-4 px-6">
			<div class="mb-3">
				<div class="flex flex-wrap flex-row">
					{#each value as valueEntry (valueEntry)}
						<div class="mr-2 mb-2">
						<Tag>
							<span class="text-sm">
								{abbreviate(valueEntry, 25)}
								<button
									on:click={() => {
										handleRemoveValue(valueEntry);
									}}
									type="button"
									class="inline-flex items-center p-0.5 ml-2 text-sm text-gray-400 bg-transparent rounded-sm hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-300 dark:hover:text-gray-900"
									data-dismiss-target="#badge-dismiss-dark"
									aria-label="Remove"
								>
									<Close height="8" width="8" />
									<span class="sr-only">Remove {valueEntry}</span>
								</button>
							</span>
						</Tag>
						</div>
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
				<button
					type="submit"
					class="text-gray-900 text-sm px-5 py-2.5 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 focus:outline-none dark:focus:ring-gray-700"
				>
					Add
				</button>
				</form>
			</div>

			{#if validationErrorMessage}
				<Alert level="error" message={validationErrorMessage} />
			{/if}
		</td>
		<td class="flex flex-col py-4 px-6 space-y-3">
			<button
				type="button"
				class="text-gray-900 w-full text-sm px-5 py-2.5 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 focus:outline-none dark:focus:ring-gray-700"
				on:click={() => {
					isEditing = false;
				}}
			>
				Cancel
			</button>
			<button
				type="button"
				class="text-gray-900 w-full text-sm px-5 py-2.5 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 focus:outline-none dark:focus:ring-gray-700"
				on:click={handleSaveRow}
			>
				Save
			</button>
		</td>
	</tr>
{/if}
