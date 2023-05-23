<script lang="ts">
	import { slide } from 'svelte/transition';
	import Button from '$lib/components/Button.svelte';
	import Icon from 'svelte-icons-pack/Icon.svelte';
	import FaSolidExternalLinkAlt from 'svelte-icons-pack/fa/FaSolidExternalLinkAlt.js';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import EditableCredentialDetail from '$lib/components/credential/EditableCredentialDetail.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import TagLink from '$lib/components/TagLink.svelte';
	import abbreviate from '$lib/utils/abbreviate.js';
	import {
		credentialTypesStore,
		prettyNameForCredentialType
	} from '$lib/stores/credentialTypesStore.js';
	import {
		credentialDrafts,
		ctdlPublicationResultStore,
		PubStatuses,
		publisherOptions,
		nodeTypePropertyDefaultMap,
		alignmentPropertyTypeDescriptions,
		type OBAlignmentMap,
		AlignmentPropertyTypes,
		type AlignmentTargetNodeTypeKey,
		type AlignmentPropertyKey,
		getPropertyName,
		nodeTypeOptions
	} from '$lib/stores/publisherStore.js';
	import Alert from '$lib/components/Alert.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';

	export let handleNextStep: () => void;
	export let handlePreviousStep: () => void;

	// Enable editing of default settings for alignment mapping
	let settingsModalOpen = false;
	let defaultNodeType: AlignmentTargetNodeTypeKey =
		$publisherOptions.alignmentSettings.defaultTargetType;
	let defaultPropertyType: AlignmentPropertyKey =
		$publisherOptions.alignmentSettings.defaultPropertyType;
	let unmappedAlignmentWarnings = 0;

	const handleContinueMaybe = () => {
		const settings = $publisherOptions.alignmentSettings;
		if (settings.defaultTargetType != 'DEFAULT' && settings.defaultPropertyType != 'DEFAULT')
			return handleNextStep();

		unmappedAlignmentWarnings = 0;
		$credentialDrafts.forEach((draft) => {
			unmappedAlignmentWarnings += Object.values(draft.obAlignments).reduce((acc, val) => {
				const isMapped =
					(val.targetNodeType != 'DEFAULT' || settings.defaultTargetType != 'DEFAULT') &&
					(val.propertyType != 'DEFAULT' || settings.defaultPropertyType != 'DEFAULT');

				return acc + (val.skip || isMapped ? 0 : 1);
			}, 0);
		});

		if (unmappedAlignmentWarnings == 0) handleNextStep();
	};

	const credentialSubtypeOptions = $credentialTypesStore.map((typ) => {
		return { value: typ.URI, name: typ.Name };
	});
	let defaultCredentialSubtype = $publisherOptions.alignmentSettings.defaultCredentialSubtype;

	let propertyTypeOptions = [AlignmentPropertyTypes.DEFAULT as AlignmentPropertyKey].concat(
		nodeTypePropertyDefaultMap[defaultNodeType] as AlignmentPropertyKey[]
	);

	const handleChangeDefaultNodeType = (newNodeType: AlignmentTargetNodeTypeKey) => {
		$publisherOptions = {
			...$publisherOptions,
			alignmentSettings: { ...$publisherOptions.alignmentSettings, defaultTargetType: newNodeType }
		};
	};
	const handleChangeDefaultPropertyType = (newPropertyType: AlignmentPropertyKey) => {
		$publisherOptions = {
			...$publisherOptions,
			alignmentSettings: {
				...$publisherOptions.alignmentSettings,
				defaultPropertyType: newPropertyType
			}
		};
	};
	const handleChangeDefaultCredentialSubtype = (newCredentialSubtype: string) => {
		$publisherOptions = {
			...$publisherOptions,
			alignmentSettings: {
				...$publisherOptions.alignmentSettings,
				defaultCredentialSubtype: newCredentialSubtype
			}
		};
	};

	$: defaultPropertyType =
		defaultPropertyType == 'DEFAULT'
			? defaultPropertyType
			: getPropertyName(defaultNodeType, defaultPropertyType); // Ensures the property type still makes sense for the node type.
	$: propertyTypeOptions = [AlignmentPropertyTypes.DEFAULT as AlignmentPropertyKey].concat(
		nodeTypePropertyDefaultMap[defaultNodeType] as AlignmentPropertyKey[]
	); // Ensures the property type options are updated when the node type changes.

	// Manage state of editing process for each credential
	let currentlyEditing: { [key: string]: boolean } = {};
	const handleEditCredential = (credentialId: string) => {
		currentlyEditing[credentialId] = true;
	};
	const handleFinishEditingCredential = (credentialId: string) => {
		currentlyEditing[credentialId] = false;
	};
	const handleOpenSettingsModal = () => {
		settingsModalOpen = true;
	};

	const alignmentsCountByTargetNodeType = (map: OBAlignmentMap) => {
		let counts: { [key: string]: number } = {};
		for (let a of Object.values(map).filter((ac) => !ac.skip)) {
			let key =
				a.targetNodeType == 'DEFAULT' &&
				defaultNodeType != 'DEFAULT' &&
				defaultPropertyType != 'DEFAULT'
					? defaultNodeType
					: a.targetNodeType;
			if (counts[key] == undefined) counts[key] = 1;
			counts[key]++;
		}
		return Object.entries(counts);
	};
</script>

<div class="flex items-center flex-col justify-between md:flex-row mb-6">
	<div class="space-y-2">
		<Heading><h3 aria-label="source type">Final Edits</h3></Heading>
		<BodyText>
			Check to see that the following Credential definitions are correct. You can customize options
			for each badge before saving to the publisher. If there are unmapped alignments, you can set
			defaults in settings.
		</BodyText>
	</div>
	<div>
		<Button buttonType="default" on:click={handleOpenSettingsModal}>
			Settings
			{#if defaultNodeType == 'DEFAULT' || defaultPropertyType == 'DEFAULT'}
				<span class="text-red-600">&#8226;</span>
			{/if}
		</Button>
	</div>
</div>

<ul class="space-y-4">
	{#each $credentialDrafts as credential (credential.Credential.CredentialId)}
		<li>
			{#if currentlyEditing[credential.Credential.CredentialId]}
				<EditableCredentialDetail {credential} {handleFinishEditingCredential} />
			{:else}
				<!-- Fields shown on CE detail page - https://sandbox.credentialengine.org/publisher/credential/7259
                {Name},
                Issuer Name
                {CredentialType}

                About This Credential:          {image}         Owned By
                {Description}                                   {Issuer Name}
                                                                "Offered By" "Owned By"
                Status: {Status}                                (other issuer metadata values as tags)
                Credential Type:
                {Credential Type (again):}

                Additional Information
                In Language: {InLanguage}

                {Competencies}
                {RequirementProfiles}
                -->
				<div
					class="flex flex-col md:flex-row w-full bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden"
					transition:slide
				>
					<div class="flex-initial max-w-xs mx-auto p-6">
						{#if credential.Credential.Image}
							<img
								class="aspect-square"
								width="160"
								src={credential.Credential.Image}
								alt={`The badge image is a symbolic representation of ${credential.Credential.Name}`}
							/>
						{:else}
							<div
								class="flex items-center justify-center w-36 h-36 bg-gray-300 rounded dark:bg-gray-700"
							>
								<svg
									class="w-12 h-12 text-gray-200"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
									fill="currentColor"
									viewBox="0 0 640 512"
									><path
										d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z"
									/></svg
								>
							</div>
							<span class="sr-only">No badge image set.</span>
						{/if}
					</div>
					<div class="p-6 flex-auto">
						<Heading>
							<h4 class="!mt-0 mb-2">
								{credential.Credential.Name}
								{#if $ctdlPublicationResultStore[credential.Credential.CredentialId]?.publicationStatus == PubStatuses.PendingUpdate}
									<span
										class="bg-supermint text-blue-800 text-sm font-medium mx-2 px-2.5 py-0.5 rounded"
									>
										Update Pending
									</span>
								{:else if $ctdlPublicationResultStore[credential.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveInProgress}
									<span
										class="bg-supermint text-blue-800 text-sm font-medium mx-2 px-2.5 py-0.5 rounded"
									>
										Updating...
									</span>
								{:else if $ctdlPublicationResultStore[credential.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveError}
									<span
										class="bg-red-100 text-red-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded"
									>
										Error Saving Credential
									</span>
								{:else if $ctdlPublicationResultStore[credential.Credential.CredentialId]?.publicationStatus == PubStatuses.SaveSuccess}
									<span
										class="bg-tahiti text-midnight text-sm font-medium mx-2 px-2.5 py-0.5 rounded"
									>
										Successfully updated
									</span>
								{/if}
							</h4></Heading
						>
						<div class="space-x-2">
							<Tag>{prettyNameForCredentialType(credential.Credential.CredentialType)}</Tag>
							<Tag>{credential.Credential.CredentialStatusType}</Tag>
							<Tag>{credential.Credential.InLanguage.join(', ')}</Tag>
							<a href={credential.Credential.CredentialId} target="new">
								<TagLink>
									{abbreviate(credential.Credential.CredentialId, 28)}
									<Icon
										src={FaSolidExternalLinkAlt}
										color="currentColor"
										className="inline-block"
										size="0.8em"
									/>
								</TagLink>
							</a>
						</div>
						<div class="mt-2 space-x-2">
							{#if Object.keys(credential.obAlignments).length}
								<span class="text-xs font-bold text-midnight">Alignments:</span>
								{#each nodeTypeOptions as option (option)}
									{#if option == 'DEFAULT' && (defaultNodeType == 'DEFAULT' || defaultPropertyType == 'DEFAULT') && Object.values(credential.obAlignments).filter((a) => a.targetNodeType == 'DEFAULT').length}
										<span class="inline-block">
											<Tag class="text-red-600 bg-red-200">
												Unmapped ({Object.values(credential.obAlignments).filter(
													(a) => a.targetNodeType == 'DEFAULT'
												).length})
											</Tag>
										</span>
									{:else if option != 'DEFAULT' && Object.values(credential.obAlignments).filter((a) => a.targetNodeType == option || (defaultNodeType == option && defaultPropertyType != 'DEFAULT')).length}
										<span class="inline-block">
											<Tag>
												{option} ({Object.values(credential.obAlignments).filter(
													(a) =>
														a.targetNodeType == option ||
														(a.targetNodeType == 'DEFAULT' &&
															defaultNodeType == option &&
															defaultPropertyType != 'DEFAULT')
												).length})
											</Tag>
										</span>
									{/if}
								{/each}
							{/if}
						</div>
						<BodyText>
							<span class="text-sm">{abbreviate(credential.Credential.Description, 280)}</span>
						</BodyText>
						{#if [PubStatuses.PendingUpdate, PubStatuses.PendingNew, PubStatuses.SaveError].includes($ctdlPublicationResultStore[credential.Credential.CredentialId]?.publicationStatus)}
							<Button on:click={() => handleEditCredential(credential.Credential.CredentialId)}>
								Edit
							</Button>
						{/if}
						{#each $ctdlPublicationResultStore[credential.Credential.CredentialId]?.messages || [] as message}
							<div class="mt-2">
								<Alert level="error" {message} />
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</li>
	{/each}
</ul>

<div class="mt-8 sm:flex flex-row items-center pb-6 sm:space-x-4">
	<NextPrevButton on:click={handlePreviousStep} isNext={false} />
	<NextPrevButton on:click={handleContinueMaybe} />
</div>

<Modal
	visible={settingsModalOpen}
	id={`proofingSettingsModal`}
	on:close={() => {
		settingsModalOpen = false;
	}}
	title="Customize alignment mapping"
	actions={[
		{
			label: 'Done',
			buttonType: 'primary',
			onClick: () => {
				settingsModalOpen = false;
			}
		}
	]}
>
	<div class="space-y-4">
		<BodyText>
			There may be badge alignments that are not yet mapped to destination types. If there is a
			common setting that fits most of your alignments, you can set it here to save time. Alignments
			that are not mapped to a specific resource type and connection type will be skipped.
		</BodyText>
		<div transition:slide class="mb-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
				<div>
					<BodyText>
						<label for={`nodeTypeSelect-default`}>Resource type</label>
					</BodyText>
					<select
						id={`nodeTypeSelect-default`}
						bind:value={defaultNodeType}
						on:change={() => {
							handleChangeDefaultNodeType(defaultNodeType);
						}}
						class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
					>
						{#each nodeTypeOptions as option (option)}
							<option value={option} selected={defaultNodeType == option}>
								{option == 'DEFAULT' ? 'Skip Unmapped Alignments (!)' : option}
							</option>
						{/each}
					</select>
				</div>
				<div>
					<BodyText>
						<label for={`propertyTypeSelect-default`}>Connection type</label>
					</BodyText>
					<select
						id={`propertyTypeSelect-default`}
						bind:value={defaultPropertyType}
						on:change={() => {
							handleChangeDefaultPropertyType(defaultPropertyType);
						}}
						class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
					>
						{#each propertyTypeOptions as option (option)}
							<option value={option} selected={defaultPropertyType == option}>
								{option == 'DEFAULT' ? 'Skip Unmapped Alignments (!)' : option}
							</option>
						{/each}
					</select>
				</div>
			</div>

			{#if defaultPropertyType == 'DEFAULT' || defaultNodeType == 'DEFAULT'}
				<p class="text-xs text-red-500 my-2">
					Incomplete defaults. Alignments that are not mapped to a specific resource type and
					connection type will be skipped.
				</p>
			{:else}
				<p class="text-xs text-midgray my-2">
					{alignmentPropertyTypeDescriptions[getPropertyName(defaultNodeType, defaultPropertyType)]}
				</p>
			{/if}

			{#if defaultNodeType == 'Credential'}
				<div transition:slide>
					<BodyText>
						<label for={`credentialSubtypeSelect-default`}
							>Select Credential sub-type (required for this resource type)</label
						>
					</BodyText>
					<select
						id={`credentialSubtypeSelect-default`}
						bind:value={defaultCredentialSubtype}
						on:change={() => {
							handleChangeDefaultCredentialSubtype(defaultCredentialSubtype);
						}}
						class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
					>
						{#each credentialSubtypeOptions as option (option)}
							<option value={option.value} selected={defaultCredentialSubtype == option.value}>
								{option.name}
							</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
	</div>
</Modal>

<Modal
	visible={unmappedAlignmentWarnings > 0}
	id={`unmappedAlignmentsWarningModal`}
	on:close={() => {
		unmappedAlignmentWarnings = 0;
	}}
	title="Unmapped alignments"
	actions={[
		{
			label: 'Continue and skip',
			buttonType: 'danger',
			onClick: () => {
				unmappedAlignmentWarnings = 0;
				handleNextStep();
			}
		},
		{
			label: 'Customize defaults',
			buttonType: 'default',
			onClick: () => {
				unmappedAlignmentWarnings = 0;
				settingsModalOpen = true;
			}
		},
		{
			label: 'Cancel',
			buttonType: 'default',
			onClick: () => {
				unmappedAlignmentWarnings = 0;
			}
		}
	]}
>
	<BodyText
		>There are still <Tag class="text-red-600 bg-red-200">{unmappedAlignmentWarnings}</Tag> unmapped
		alignments from your badge data. If you continue, these alignments will be skipped. You may cancel
		to configure the details of each alignment, or you may set a default that applies to all unmapped
		alignments.
	</BodyText>
	<BodyText>
		<strong class="font-bold">What is alignment mapping?</strong> Open Badges only have one type of alignment,
		but the CTDL can describe many relationships. This interface lets you quickly select the meaning
		of each alignment among these options.
	</BodyText>
</Modal>
