<script lang="ts">
	import { tick } from 'svelte';
	import {
		credentialDrafts,
		type CtdlApiCredential,
		type AlignmentObject
	} from '$lib/stores/publisherStore.js';
	import Button from '$lib/components/Button.svelte';

	export let credential: CtdlApiCredential;
	export let fieldName = '';
	export let fieldId: 'Requires';
	export let helpText = '';
	export let helpUrl = '';

	let value: AlignmentObject[] = credential.Credential[fieldId] || [];
	let filteredValues: AlignmentObject[] = value.filter(
		(v) => v.Description == 'Open Badges Alignment'
	);

	const handleDeleteItem = async (deletedAlignmentNode: string) => {
		const pruneList = (a: AlignmentObject[]): AlignmentObject[] => {
			let pruned: AlignmentObject[] = [];
			console.log('Pruning...');
			console.log(value);
			value.forEach((ao) => {
				if (ao.Description != 'Open Badges Alignment')
					pruned.push(ao); // Ignore other Requires alignments on the Credential
				else {
					const filteredTargets = ao.TargetCompetency.filter(
						(c) => c.TargetNode != deletedAlignmentNode
					);
					if (filteredTargets.length) pruned.push({ ...ao, TargetCompetency: filteredTargets });
				}
			});
			console.log(pruned);
			console.log('....Pruned!');
			return pruned;
		};

		let editedCredential = {
			Credential: {
				...credential.Credential
			},
			PublishForOrganizationIdentifier: credential.PublishForOrganizationIdentifier
		};
		editedCredential.Credential[fieldId] = pruneList(editedCredential.Credential[fieldId]);
		credentialDrafts.updateCredential(editedCredential);
		await tick();
		value = credential.Credential[fieldId] || [];
		filteredValues = value.filter((v) => v.Description == 'Open Badges Alignment');
	};
</script>

<!-- Display the Value -->
<tr class="bg-white border-b">
	<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
		{fieldName || fieldId}
	</th>
	<td class="py-4 px-6" colspan="2">
		<slot>
			<div>
				{#each filteredValues as valueEntry, i (i)}
					<div>
						{#each valueEntry.TargetCompetency as targetCompetency (targetCompetency.TargetNode)}
							<div class="flex flex-col md:flex-row">
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
								<div>
									<Button
										buttonType="default"
										on:click={() => {
											handleDeleteItem(targetCompetency.TargetNode);
										}}
									>
										Delete
									</Button>
								</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</slot>
	</td>
</tr>
