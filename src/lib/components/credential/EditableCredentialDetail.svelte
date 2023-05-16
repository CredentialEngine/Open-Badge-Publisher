<script lang="ts">
	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';
	import * as bcp47 from 'bcp-47';
	import * as yup from 'yup';

	import EditableCredentialRowAlignment from '$lib/components/credential/EditableCredentialRowAlignment.svelte';
	import EditableCredentialRowSelect from '$lib/components/credential/EditableCredentialRowSelect.svelte';
	import EditableCredentialRowTags from '$lib/components/credential/EditableCredentialRowTags.svelte';
	import EditableCredentialRowText from '$lib/components/credential/EditableCredentialRowText.svelte';
	import BodyText from '../typography/BodyText.svelte';
	import Button from '$lib/components/Button.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { EditStatus, type CtdlCredentialDraft } from '$lib/stores/publisherStore.js';
	import { credentialTypesStore } from '$lib/stores/credentialTypesStore.js';

	export let credential: CtdlCredentialDraft;
	export let handleFinishEditingCredential = (credentialId: string): void => {};

	let unsavedChangesModalVisible = false;
	let editStatus: EditStatus = EditStatus.Editing;

	const handleFinish = () => {
		editStatus = EditStatus.FinishRequested;
		setTimeout(() => {
			if (editStatus == EditStatus.FinishRequested)
				handleFinishEditingCredential(credential.Credential.CredentialId);
		}, 200);
	};
	const handleUnsaved = async () => {
		if (editStatus != EditStatus.Editing) {
			editStatus = EditStatus.Editing;
			unsavedChangesModalVisible = true;
			// await tick();
			// document.getElementById(`unsaved-${credential.Credential.CredentialId}`)?.focus();
		}
	};
	const handleRevert = () => {
		editStatus = EditStatus.Reject;
		unsavedChangesModalVisible = false;
		setTimeout(() => {
			handleFinishEditingCredential(credential.Credential.CredentialId);
		}, 200);
	};
	const handleAccept = () => {
		editStatus = EditStatus.Accept;
		unsavedChangesModalVisible = false;
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

<div class="w-full bg-white border border-gray-200 rounded-lg shadow-md">
	<div class="py-3 px-6">
		<Heading><h3>{credential.Credential.Name}</h3></Heading>
	</div>

	<div class="overflow-x-auto relative rounded-lg" transition:slide>
		<table class="w-full text-sm text-left text-gray-500">
			<thead class="text-xs text-gray-700 uppercase bg-gray-50">
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
					getter={(cred) => cred.CTID || 'To be assigned on save'}
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
					fieldName="Subject Webpage"
					fieldId="SubjectWebpage"
					helpText="If there is an external badge criteria URL, that is used. Otherwise id is used. This URL must be resolvable at publication time."
					validator={yup.string().required().url()}
				>
					<a
						href={credential.Credential.SubjectWebpage}
						target="new"
						class="underline hover:no-underline"
					>
						{credential.Credential.SubjectWebpage}
					</a>
				</EditableCredentialRowText>

				<EditableCredentialRowText
					{credential}
					{editStatus}
					on:unsavedChanges={handleUnsaved}
					editable={true}
					fieldName="Criteria Narrative"
					getter={(c) => {
						return c.Requires?.find((cp) => cp.Name == 'Open Badges Criteria')?.Description ?? '';
					}}
					transformer={(c, newValue) => {
						let cc = { ...c };

						cc.Requires = c.Requires?.map((ao) => {
							if (ao.Name == 'Open Badges Criteria') {
								return {
									...ao,
									Description: newValue
								};
							}
							return ao;
						});
						return cc;
					}}
					longText={true}
					validator={yup.string().required()}
				>
					<div class="whitespace-pre-line">
						{credential.Credential.Requires?.find((cp) => cp.Name == 'Open Badges Criteria')
							?.Description || ''}
					</div>
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

				<EditableCredentialRowAlignment {credential} />
			</tbody>
		</table>

		<div class="flex flex-row-reverse my-4 px-4 gap-2">
			<Button
				on:click={() => {
					handleFinish();
				}}
				buttonType="primary"
			>
				Finished Editing
			</Button>
		</div>
	</div>
</div>

<Modal
	visible={unsavedChangesModalVisible}
	id={`unsaved-${credential.Credential.CredentialId}`}
	on:close={() => {
		unsavedChangesModalVisible = false;
	}}
	title="Unsaved Changes"
	actions={[
		{
			label: 'Cancel',
			buttonType: 'default',
			onClick: () => {
				unsavedChangesModalVisible = false;
			}
		},
		{ label: 'Revert changes', buttonType: 'danger', onClick: handleRevert },
		{ label: 'Accept changes', buttonType: 'primary', onClick: handleAccept }
	]}
>
	<BodyText>
		Some fields have unsaved changes. Do you want to save these changes or discard them?
	</BodyText>
</Modal>
