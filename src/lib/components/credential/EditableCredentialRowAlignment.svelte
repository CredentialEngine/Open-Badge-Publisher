<script lang="ts">
	import { tick } from 'svelte';
	import {
		credentialDrafts,
		type CtdlApiCredential,
		type AlignmentObject,
		type TargetCompetency
	} from '$lib/stores/publisherStore.js';
	import Button from '$lib/components/Button.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';

	export let credential: CtdlApiCredential;
	export let fieldName = '';
	export let fieldId: 'Requires';
	export let helpText = '';
	export let helpUrl = '';

	let value: AlignmentObject[] = credential.Credential[fieldId] || [];
	let filteredValues: AlignmentObject[] = value.filter(
		(v) => v.Description == 'Open Badges Alignment'
	);

	const handleToggleItem = async (nodeToToggle: string) => {
		const updatedListWithToggledItem = (a: AlignmentObject[]): AlignmentObject[] => {
			let pruned: AlignmentObject[] = [];
			value.forEach((ao) => {
				if (ao.Description != 'Open Badges Alignment')
					pruned.push(ao); // Ignore other Requires alignments on the Credential
				else {
					let tcList: TargetCompetency[] = [];
					ao.TargetCompetency.forEach((tc) => {
						if (tc.TargetNode == nodeToToggle) {
							tcList.push({
								...tc,
								SKIP: !tc.SKIP
							});
						} else tcList.push(tc);
					});
					if (tcList.length) pruned.push({ ...ao, TargetCompetency: tcList });
				}
			});
			return pruned;
		};

		let editedCredential = {
			Credential: {
				...credential.Credential
			},
			PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier
		};
		editedCredential.Credential[fieldId] = updatedListWithToggledItem(
			editedCredential.Credential[fieldId]
		);
		credentialDrafts.updateCredential(editedCredential);
		await tick();
		value = credential.Credential[fieldId] || [];
		filteredValues = value.filter((v) => v.Description == 'Open Badges Alignment');
	};
</script>

{#if filteredValues.length && filteredValues[0].TargetCompetency.length}
	<tr class="bg-white">
		<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
			{fieldName || fieldId}
		</th>
		<td class="py-4 px-6" colspan="2">
			{helpText}
		</td>
	</tr>
{/if}

{#each filteredValues as valueEntry, i (i)}
	{#each valueEntry.TargetCompetency as targetCompetency, j (targetCompetency.TargetNode)}
		<tr class="bg-white" class:border-b={j + 1 == valueEntry.TargetCompetency.length}>
			<td class="py-4 px-6" colspan="2">
				<div>
					<div>
						<div>
							<p class="my-1">
								<span class="font-bold">URI:</span>
								{targetCompetency.TargetNode}
								{#if targetCompetency.CodedNotation}
									({targetCompetency.CodedNotation})
								{/if}
							</p>
							<p class="my-1">
								<span class="font-bold">Name:</span>
								{targetCompetency.TargetNodeName}
								{#if targetCompetency.TargetNodeDescription}
									<br /><span class="font-bold">Description:</span>
									{targetCompetency.TargetNodeDescription}
								{/if}
							</p>
							{#if targetCompetency.FrameworkName}
								<p class="my-1">
									<span class="font-bold">In Framework:</span>
									{targetCompetency.FrameworkName}
								</p>
							{/if}
						</div>
					</div>
				</div>
			</td>
			<td class="py-4 px-6">
				<label class="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						value=""
						class="sr-only peer"
						checked={!targetCompetency.SKIP}
						on:click={() => {
							handleToggleItem(targetCompetency.TargetNode);
						}}
					/>
					<div
						class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
					/>
					<span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300"
						>{targetCompetency.SKIP ? 'Skipped' : 'Included'}</span
					>
				</label>
			</td>
		</tr>
	{/each}
{/each}
