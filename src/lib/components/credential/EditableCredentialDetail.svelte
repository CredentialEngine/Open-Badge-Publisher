<script lang="ts">
	import { slide } from 'svelte/transition';
	import { setContext } from 'svelte';
	import * as bcp47 from 'bcp-47';
	import * as yup from 'yup';

	import EditableCredentialRowText from '$lib/components/credential/EditableCredentialRowText.svelte';
	import EditableCredentialRowSelect from '$lib/components/credential/EditableCredentialRowSelect.svelte';
	import EditableCredentialRowTags from '$lib/components/credential/EditableCredentialRowTags.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Tag from '$lib/components/Tag.svelte';

	import abbreviate from '$lib/utils/abbreviate.js';
	import { credentialDrafts, EditStatus } from '$lib/stores/publisherStore.js';
	import {
		credentialTypesStore,
		prettyNameForCredentialType
	} from '$lib/stores/credentialTypesStore.js';
	import type { CtdlApiCredential } from '$lib/stores/publisherStore.js';
	import BodyText from '../typography/BodyText.svelte';

	export let credential: CtdlApiCredential;
	export let handleFinishEditingCredential = (credentialId: string): void => {};

	let modalVisible = false;
	let editStatus: EditStatus = EditStatus.Editing;

	const handleFinish = () => {
		editStatus = EditStatus.FinishRequested;
		setTimeout(() => {
			if (editStatus == EditStatus.FinishRequested) 
			handleFinishEditingCredential(credential.Credential.CredentialId);
		}, 200)
	};
	const handleUnsaved = () => {
		if (editStatus != EditStatus.Editing) {
			editStatus = EditStatus.Editing;
			modalVisible = true;
		}
	};
	const handleRevert = () => {
		editStatus = EditStatus.Reject;
		modalVisible = false;
		setTimeout(() => {
			handleFinishEditingCredential(credential.Credential.CredentialId);
		}, 200);
	};
	const handleAccept = () => {
		editStatus = EditStatus.Accept;
		modalVisible = false;
		setTimeout(() => {
			handleFinishEditingCredential(credential.Credential.CredentialId);
		}, 200);
	};


	const credentialStatusOptions = [
		{ value: 'Active', name: 'Active' },
		{ value: 'Probationary', name: 'Probationary' },
		{ value: 'Deprecated', name: 'Deprecated' },
		{ value: 'Suspended', name: 'Suspended' },
		{ value: 'TeachOut', name: 'Teach Out' }
	];

	
</script>

<div
	class="w-full bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700"
>
	<div class="py-3 px-6">
		<Heading><h3>{credential.Credential.Name}</h3></Heading>
	</div>

	<div class="overflow-x-auto relative rounded-lg" transition:slide>
		<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
			<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
				<tr>
					<th scope="col" class="py-3 px-6">CTDL Property</th>
					<th scope="col" class="py-3 px-6">Value</th>
					<th scope="col" class="py-3 px-6"><span class="sr-only">Edit</span></th>
				</tr>
			</thead>
			<tbody>
				<EditableCredentialRowText
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					fieldId="Name"
					editable={true}
					validator={yup.string().required()}
				/>

				<EditableCredentialRowText
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					fieldId="CTID"
					editable={false}
					helpText="A Credential Transparency Identifier (CTID) is assigned by Credential Engine upon creation."
				/>

				<EditableCredentialRowText
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					editable={true}
					fieldId="Description"
					longText={true}
					validator={yup.string().required()}
				/>

				<EditableCredentialRowSelect
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					editable={true}
					fieldId="CredentialType"
					fieldName="Credential Type"
					helpText="CTDL defines a number of Credential subclasses so issuers can describe Credentials more specifically."
					helpUrl="https://credreg.net/ctdl/handbook#credentialtypes"
					options={$credentialTypesStore.map((typ) => {
						return { value: typ.URI, name: typ.Name };
					})}
				/>

				<EditableCredentialRowText
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					editable={true}
					fieldId="Image"
					helpText="The URL to an image that is a symbolic representation of the achievement. Data URIs cannot be used in the Registry."
					validator={yup.string().url()}
				>
					{#if credential.Credential.Image}
						<img
							class="aspect-square"
							width="160"
							src={credential.Credential.Image}
							alt={`The badge image is a symbolic representation of ${credential.Credential.Name}`}
						/>
					{:else}
						None Set
					{/if}
				</EditableCredentialRowText>

				<EditableCredentialRowText
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					editable={true}
					fieldId="SubjectWebpage"
					helpText="If there is an external badge criteria URL, that is used. Otherwise id is used. This URL must be resolvable at publication time."
					validator={yup.string().required().url()}
				>
					<a href={credential.Credential.SubjectWebpage} target="new">
						{credential.Credential.SubjectWebpage}
					</a>
				</EditableCredentialRowText>

				<EditableCredentialRowSelect
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					editable={true}
					fieldId="CredentialStatusType"
					fieldName="Status"
					helpText="If the credential is not Active, there are some options "
					helpUrl="https://credreg.net/ctdl/handbook#credentialtypes"
					options={credentialStatusOptions}
				/>

				<EditableCredentialRowTags
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					editable={true}
					fieldId="InLanguage"
					fieldName="Language"
					helpText="Enter a standardized code or tag compatible with IETF BCP 47"
					validator={yup
						.string()
						.required()
						.test(
							'languageCodeValid',
							"Language code must be a valid BCP-47 identifier like 'en-US'",
							(value, testContext) => {
								try {
									const parsed = bcp47.parse(value || '');
									return true;
								} catch {
									return false;
								}
							}
						)}
				/>

				<EditableCredentialRowTags
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					editable={true}
					fieldId="Keyword"
					fieldName="Keywords"
					helpText="List of keywords for this credential"
				/>

				<!--
				Requires
					Requires not working yet...
				 -->
			</tbody>
		</table>

		<div class="flex flex-row-reverse">
			<button
				type="button"
				class="text-gray-900 text-sm mt-6 px-5 py-2.5 b mr-6 mb-3 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 focus:outline-none dark:focus:ring-gray-700"
				on:click={() => {handleFinish();}}
			>
				Finished Editing
			</button>
		</div>
	</div>
</div>

<Modal
	visible={modalVisible}
	id={`unsaved-${credential.Credential.CredentialId}`}
	on:close={() => {modalVisible = false;}}
	title="Unsaved Changes"
	actions={[
		{ label: 'Cancel', buttonType: 'default', onClick: () => {modalVisible = false;} },
		{ label: 'Revert changes', buttonType: 'danger', onClick: handleRevert },
		{ label: 'Accept changes', buttonType: 'primary', onClick: handleAccept },
	]}
>
	<BodyText>Some fields have unsaved changes. Do you want to save these changes or discard them?</BodyText>
</Modal>
