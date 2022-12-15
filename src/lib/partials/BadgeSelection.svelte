<script lang="ts">
	import { onMount } from 'svelte';
	import {
		badgeSourceType,
		badgeSetupStep,
		badgeSetupComplete,
		normalizedBadges,
		checkedBadges
	} from '$lib/stores/badgeSourceStore.js';
	import abbreviate from '$lib/utils/abbreviate.js';
	import Heading from '$lib/components/typography/Heading.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';

	const handleChange = (badgeId: string) => {
		$checkedBadges[badgeId] = !$checkedBadges[badgeId];
		$checkedBadges = Object.fromEntries(
			Object.entries($checkedBadges).filter(([key, value]) => value === true)
		);
		console.log('Updated badge selections');
		console.log($checkedBadges);
	};
</script>

<Heading><h3>Select Badges</h3></Heading>
<BodyText>
	Select badges that you want to publish to the Credential Registry, including any updates to those
	previously published to the Registry.
</BodyText>

<div class="overflow-x-auto relative">
	<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
		<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
			<tr>
				<th scope="col" class="py-3 px-6">
					☑ <span class="sr-only">Should this badge be published?</span>
				</th>
				<th scope="col" class="py-3 px-6"> Badge Name </th>
				<th scope="col" class="py-3 px-6"> Description </th>
				<th scope="col" class="py-3 px-6"> ID </th>
			</tr>
		</thead>
		<tbody>
			{#each $normalizedBadges as badge (badge.id)}
				<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
					<td class="py-4 px-6">
						<input
							checked={!!checkedBadges[badge.id]}
							on:change={() => {
								handleChange(badge.id);
							}}
							id={'includeBadge-' + badge.id}
							type="checkbox"
							value=""
							class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
						/>
					</td>
					<th
						scope="row"
						class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white"
					>
						{badge.name}
					</th>
					<td class="py-4 px-6">
						{abbreviate(badge.description)}
					</td>
					<td class="py-4 px-6">
						<a class="text-indigo-700 dark:text-superaqua" href={badge.id} target="new"
							>View source</a
						>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
