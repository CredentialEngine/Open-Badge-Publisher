<script lang="ts">
	import {
		type AlignmentPropertyKey,
		type AlignmentTargetNodeTypeKey,
		type CtdlApiCredential,
		type CtdlCredentialDraft,
		type EditStatus,
		publisherOptions
	} from '$lib/stores/publisherStore.js';
	import Button from '$lib/components/Button.svelte';
	import abbreviate from '$lib/utils/abbreviate.js';
	import AlignmentEditor from '$lib/components/credential/AlignmentEditor.svelte';
	import Modal from '$lib/components/Modal.svelte';

	export let credential: CtdlCredentialDraft;
	let alignmentEditorModalVisible = false;

	const summarizePropertyType = (t: AlignmentPropertyKey): string =>
		t == 'DEFAULT' ? `${$publisherOptions.alignmentSettings.defaultPropertyType} (default)` : t;
	const summarizeNodeType = (t: AlignmentTargetNodeTypeKey): string =>
		t == 'DEFAULT' ? `${$publisherOptions.alignmentSettings.defaultPropertyType} (default)` : t;
</script>

<tr class="bg-white border-b">
	<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap"> Alignments </th>
	<td class="py-4 px-6">
		{#if Object.keys(credential.obAlignments).length}
			<ul>
				{#each Object.values(credential.obAlignments) as a (a.sourceData.targetUrl)}
					<li>
						{#if a.propertyType !== 'DEFAULT' && a.targetNodeType !== 'DEFAULT'}
							<!-- Alignment settings as mapped specifically by the user -->
							{summarizePropertyType(a.propertyType)} /
							{summarizeNodeType(a.targetNodeType)}:
							<a
								href={a.sourceData.targetUrl}
								target="_blank"
								rel="noreferrer"
								class="text-midnight underline hover:no-underline"
							>
								{abbreviate(a.sourceData.targetName, 60)}
							</a>
						{:else if ($publisherOptions.alignmentSettings.defaultTargetType !== 'DEFAULT' || a.targetNodeType !== 'DEFAULT') && ($publisherOptions.alignmentSettings.defaultPropertyType !== 'DEFAULT' || a.propertyType !== 'DEFAULT')}
							<!-- Alignment settings populated with defaults -->
							{a.propertyType === 'DEFAULT'
								? `${$publisherOptions.alignmentSettings.defaultPropertyType} (default)`
								: summarizePropertyType(a.propertyType)} /
							{a.targetNodeType === 'DEFAULT'
								? `${$publisherOptions.alignmentSettings.defaultTargetType} (default)`
								: summarizeNodeType(a.targetNodeType)}:
							<a
								href={a.sourceData.targetUrl}
								target="_blank"
								rel="noreferrer"
								class="text-midnight underline hover:no-underline"
							>
								{abbreviate(a.sourceData.targetName, 60)}
							</a>
						{:else}
							<!-- Unmapped alignment warning -->
							<span class="text-red-600">Unmapped alignment: </span>
							<a
								href={a.sourceData.targetUrl}
								target="_blank"
								rel="noreferrer"
								class="text-midnight underline hover:no-underline"
							>
								{abbreviate(a.sourceData.targetName, 60)}
							</a>
						{/if}

						{#if a.skip} <span class="text-red-600"> (Skipped)</span> {/if}
					</li>
				{/each}
			</ul>
		{:else}
			None
		{/if}
	</td>
	<td class="py-4 px-6">
		<Button
			on:click={() => {
				alignmentEditorModalVisible = true;
			}}
		>
			Edit
		</Button>
	</td>
</tr>

<Modal
	visible={alignmentEditorModalVisible}
	id={`alignmentEditor-${credential.Credential.CredentialId}`}
	on:close={() => {
		alignmentEditorModalVisible = false;
	}}
	title="Customize alignment mapping"
	actions={[
		{
			label: 'Done',
			buttonType: 'primary',
			onClick: () => {
				alignmentEditorModalVisible = false;
			}
		}
	]}
>
	<AlignmentEditor {credential} />
</Modal>
