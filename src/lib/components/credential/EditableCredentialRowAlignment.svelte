<script lang="ts">
	import type {
		CtdlApiCredential,
		CtdlCredentialDraft,
		EditStatus
	} from '$lib/stores/publisherStore.js';
	import Button from '$lib/components/Button.svelte';
	import abbreviate from '$lib/utils/abbreviate.js';
	import AlignmentEditor from '$lib/components/credential/AlignmentEditor.svelte';
	import Modal from '$lib/components/Modal.svelte';

	export let credential: CtdlCredentialDraft;
	let alignmentEditorModalVisible = false;
</script>

<tr class="bg-white border-b">
	<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap"> Alignments </th>
	<td class="py-4 px-6">
		{#if Object.keys(credential.obAlignments).length}
			<ul>
				{#each Object.values(credential.obAlignments) as a (a.sourceData.targetUrl)}
					<li>
						{a.propertyType} / {a.targetNodeType}:
						<a
							href={a.sourceData.targetUrl}
							target="_blank"
							rel="noreferrer"
							class="text-midnight underline hover:no-underline"
						>
							{abbreviate(a.sourceData.targetName, 60)}
						</a>
						{#if a.skip} <span class="text-red-900"> (Skipped)</span> {/if}
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
