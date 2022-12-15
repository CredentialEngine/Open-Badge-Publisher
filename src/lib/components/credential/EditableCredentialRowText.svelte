<script lang="ts">
	import type { CtdlApiCredential } from '$lib/stores/badgeDestinationStore.js';
	import * as yup from 'yup';
	import type { BaseSchema } from 'yup';
	import { ctdlCredentials } from '$lib/stores/badgeDestinationStore.js';
	import Alert from '$lib/components/Alert.svelte';

	export let credential: CtdlApiCredential;
	export let fieldName = '';
	export let fieldId: 'Name' | 'Description' | 'SubjectWebpage' | 'Image' | 'CTID';
	export let helpText = '';
	export let helpUrl = '';
	export let editable = false;
	export let longText = false;
	export let validator: BaseSchema = yup.string();

	const inputId = `${encodeURIComponent(credential.Credential.CredentialId)}-${fieldId}`;
	let value: string = credential.Credential[fieldId] || ''; // Todo -- Image is nullable. Make sure not to send '' to server
	let isEditing = false;
	let validationErrorMessage = '';

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
		ctdlCredentials.updateCredential(editedCredential);
		isEditing = false;
	};
</script>

{#if !isEditing}
	<!-- Display the Value -->
	<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
		<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
			{fieldName || fieldId}
		</th>
		<td class="py-4 px-6">
			<slot>{value}</slot>
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
			{#if longText}
				<textarea
					id={inputId}
					class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
