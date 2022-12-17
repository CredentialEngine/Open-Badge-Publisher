<script lang="ts">
	import type { CtdlApiCredential, AlignmentObject } from '$lib/stores/publisherStore.js';

	import BodyText from '$lib/components/typography/BodyText.svelte';

	export let credential: CtdlApiCredential;
	export let fieldName = '';
	export let fieldId: 'Requires';
	export let helpText = '';
	export let helpUrl = '';

	let value: AlignmentObject[] = credential.Credential[fieldId] || [];
</script>

<!-- Display the Value -->
<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
	<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
		{fieldName || fieldId}
	</th>
	<td class="py-4 px-6">
		<slot>
			<div class="flex flex-wrap flex-row">
				{#each value.filter((v) => v.Description == 'Open Badges Alignment') as valueEntry, i (i)}
					<div class="flex flex-col space-y-2">
						{#each valueEntry.TargetCompetency as targetCompetency (targetCompetency.TargetNode)}
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
						{/each}
					</div>
				{/each}
			</div>
		</slot>
	</td>
	<td class="py-4 px-6">
		<!-- Competencies are not editable -->
	</td>
</tr>
