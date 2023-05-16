<script lang="ts">
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import { credentialTypesStore } from '$lib/stores/credentialTypesStore.js';
	import {
		credentialDrafts,
		AlignmentTargetNodeTypes,
		AlignmentPropertyTypes,
		getPropertyName,
		nodeTypePropertyDefaultMap,
		alignmentPropertyTypeDescriptions,
		type AlignmentTargetNodeTypeKey,
		type AlignmentPropertyTypeCredentialKey,
		type CtdlCredentialDraft,
		type OBAlignmentConfig,
		type AlignmentPropertyKey
	} from '$lib/stores/publisherStore.js';
	import abbreviate from '$lib/utils/abbreviate.js';
	import { get } from 'svelte/store';
	import { slide } from 'svelte/transition';

	export let credential: CtdlCredentialDraft;
	export let ac: OBAlignmentConfig;
	const targetUrl = ac.sourceData.targetUrl;
	let nodeType = ac.targetNodeType ?? 'DEFAULT';
	let propertyType = ac.propertyType ?? 'DEFAULT';
	let credentialSubtype = ac.destinationData?.Type ?? 'ceterms:Certification';
	const credentialSubtypeOptions = $credentialTypesStore.map((typ) => {
		return { value: typ.URI, name: typ.Name };
	});

	let propertyTypeOptions = [AlignmentPropertyTypes.DEFAULT as AlignmentPropertyKey].concat(
		nodeTypePropertyDefaultMap[nodeType] as AlignmentPropertyKey[]
	);

	const nodeTypeOptions = [
		AlignmentTargetNodeTypes.DEFAULT,
		AlignmentTargetNodeTypes.AssessmentProfile,
		AlignmentTargetNodeTypes.Competency,
		AlignmentTargetNodeTypes.Course,
		AlignmentTargetNodeTypes.Credential,
		AlignmentTargetNodeTypes.LearningProgram,
		AlignmentTargetNodeTypes.LearningOpportunity,
		AlignmentTargetNodeTypes.Occupation,
		AlignmentTargetNodeTypes.QACredentialOrganization
	];

	const handleChangeNodeType = (newNodeType: AlignmentTargetNodeTypeKey) => {
		const editedCredential: CtdlCredentialDraft = {
			Credential: {
				...credential.Credential
			},
			PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier,
			obAlignments: {
				...credential.obAlignments,
				[targetUrl]: {
					...credential.obAlignments[targetUrl],
					targetNodeType: newNodeType ?? 'DEFAULT',
					propertyType:
						propertyType == 'DEFAULT' ? propertyType : getPropertyName(newNodeType, propertyType)
				}
			}
		};
		credentialDrafts.updateCredential(editedCredential);
		propertyType = editedCredential.obAlignments[targetUrl].propertyType;
	};

	const handleChangePropertyType = (newPropertyType: AlignmentPropertyKey) => {
		const filteredPropertyType: AlignmentPropertyKey =
			newPropertyType == 'DEFAULT' ? newPropertyType : getPropertyName(nodeType, newPropertyType);

		if (filteredPropertyType == credential.obAlignments[targetUrl].propertyType) return;

		const editedCredential: CtdlCredentialDraft = {
			Credential: {
				...credential.Credential
			},
			PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier,
			obAlignments: {
				...credential.obAlignments,
				[targetUrl]: {
					...credential.obAlignments[targetUrl],
					propertyType: filteredPropertyType
				}
			}
		};
		credentialDrafts.updateCredential(editedCredential);
	};

	const handleChangeSkip = () => {
		const editedCredential: CtdlCredentialDraft = {
			Credential: {
				...credential.Credential
			},
			PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier,
			obAlignments: {
				...credential.obAlignments,
				[targetUrl]: {
					...credential.obAlignments[targetUrl],
					skip: !ac.skip
				}
			}
		};
		credentialDrafts.updateCredential(editedCredential);
	};

	const handleChangeCredentialSubtype = () => {
		const editedCredential = {
			Credential: {
				...credential.Credential
			},
			PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier,
			obAlignments: {
				...credential.obAlignments,
				[targetUrl]: {
					...credential.obAlignments[targetUrl],
					destinationData: {
						...(credential.obAlignments[targetUrl].destinationData ?? {}),
						Type: credentialSubtype
					}
				}
			}
		};
		credentialDrafts.updateCredential(editedCredential);
	};

	$: propertyType =
		propertyType == 'DEFAULT' ? propertyType : getPropertyName(nodeType, propertyType); // Ensures the property type still makes sense for the node type.
	$: propertyTypeOptions = [AlignmentPropertyTypes.DEFAULT as AlignmentPropertyKey].concat(
		nodeTypePropertyDefaultMap[nodeType] as AlignmentPropertyKey[]
	); // Ensures the property type options are updated when the node type changes.
</script>

<div class="flex flex-column justify-between sm:flex-row !mt-2">
	<Heading>
		<h4 class="!mt-0">
			Alignment: {ac.sourceData.targetName}
		</h4>
	</Heading>
	<div class="flex-initial">
		<label class="relative inline-flex items-center cursor-pointer">
			<input
				type="checkbox"
				value=""
				class="sr-only peer"
				checked={!ac.skip}
				on:click={() => {
					handleChangeSkip();
				}}
			/>
			<div
				class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
			/>
			<span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300"
				>{ac.skip ? 'Skipped' : 'Included'}</span
			>
		</label>
	</div>
</div>
{#if !ac.skip}
	<div transition:slide>
		<p class="text-xs text-midgray">
			<a
				class="text-midnight underline hover:no-underline"
				href={ac.sourceData.targetUrl}
				target="_blank"
				rel="noreferrer">{abbreviate(ac.sourceData.targetUrl)}</a
			><br />
			Description: {ac.sourceData.targetDescription}
			{#if ac.sourceData.targetCode}<br />Target code: {ac.sourceData.targetCode}{/if}
			{#if ac.sourceData.targetFramework}<br />Framework name: {ac.sourceData.targetFramework}{/if}
		</p>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
			<div>
				<BodyText>
					<label for={`nodeTypeSelect-${targetUrl}`}>Resource type</label>
				</BodyText>
				<select
					id={`nodeTypeSelect-${targetUrl}`}
					bind:value={nodeType}
					on:change={() => {
						handleChangeNodeType(nodeType);
					}}
					class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
				>
					{#each nodeTypeOptions as option (option)}
						<option value={option} selected={nodeType == option}>
							{option == 'DEFAULT' ? `Use default (Competency)` : option}
						</option>
					{/each}
				</select>
			</div>
			<div>
				<BodyText>
					<label for={`propertyTypeSelect-${targetUrl}`}>Connection type</label>
				</BodyText>
				<select
					id={`propertyTypeSelect-${targetUrl}`}
					bind:value={propertyType}
					on:change={() => {
						handleChangePropertyType(propertyType);
					}}
					class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
				>
					{#each propertyTypeOptions as option (option)}
						<option value={option} selected={propertyType == option}>
							{option == 'DEFAULT' ? `Use default (${getPropertyName(nodeType, option)})` : option}
						</option>
					{/each}
				</select>
			</div>
		</div>
		<p class="text-xs text-midgray mt-2">
			{#if propertyType == 'DEFAULT'}
				{getPropertyName(nodeType, 'DEFAULT')} (default):
			{/if}
			{alignmentPropertyTypeDescriptions[getPropertyName(nodeType, propertyType)]}
		</p>
		{#if nodeType == 'Credential'}
			<div transition:slide>
				<BodyText>
					<label for={`credentialSubtypeSelect-${targetUrl}`}
						>Select Credential sub-type (required for this resource type)</label
					>
				</BodyText>
				<select
					id={`credentialSubtypeSelect-${targetUrl}`}
					bind:value={credentialSubtype}
					on:change={() => {
						handleChangeCredentialSubtype();
					}}
					class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
				>
					{#each credentialSubtypeOptions as option (option)}
						<option value={option.value} selected={credentialSubtype == option.value}>
							{option.name}
						</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>
{/if}
