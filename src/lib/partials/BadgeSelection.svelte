<script lang="ts">
	import { onMount } from 'svelte';
	import {
		badgeSourceType,
		badgeSetupStep,
		badgeSetupComplete,
		normalizedBadges,
		checkedBadges
	} from '$lib/stores/badgeSourceStore.js';
	import Icon from 'svelte-icons-pack/Icon.svelte';
	import FaSolidExternalLinkAlt from 'svelte-icons-pack/fa/FaSolidExternalLinkAlt.js';
	import { publisherCredentials } from '$lib/stores/publisherStore.js';
	import abbreviate from '$lib/utils/abbreviate.js';
	import Heading from '$lib/components/typography/Heading.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Button from '$lib/components/Button.svelte';

	let showCreatedColumn = false;
	$: if ($normalizedBadges.length && $normalizedBadges[0]['ceterms:dateEffective'])
		showCreatedColumn = true;

	const formatDate = (date: string | undefined) => {
		const d = date ? new Date(date) : undefined;
		return d
			? d.toLocaleDateString('en-US', {
					weekday: undefined,
					month: '2-digit',
					day: '2-digit',
					year: 'numeric'
			  })
			: 'Unknown';
	};

	const handleChange = (badgeId: string) => {
		$checkedBadges[badgeId] = !$checkedBadges[badgeId];
		$checkedBadges = Object.fromEntries(
			Object.entries($checkedBadges).filter(([key, value]) => value === true)
		);
	};

	const handleSelectAllOrNone = () => {
		if (Object.keys($checkedBadges).length > 0) $checkedBadges = {};
		else $checkedBadges = Object.fromEntries($normalizedBadges.map((e) => [e.id, true]));
	};
</script>

<Heading><h3>Select Badges</h3></Heading>
<BodyText>
	Select badges that you want to publish to the Credential Registry, including any updates to those
	previously published to the Registry.
</BodyText>

<div class="overflow-x-auto relative">
	<table class="w-full text-sm text-left text-gray-500">
		<thead class="text-xs text-gray-700 uppercase bg-gray-50">
			<tr>
				<th scope="col" class="py-3 px-6">
					<span class="sr-only" id="includeBadge-selectAll-label">
						This option selects or deselects all the badges for publishing.
					</span>
					<input
						checked={Object.keys($checkedBadges).length == $normalizedBadges.length}
						on:change={(e) => {
							handleSelectAllOrNone();
							if (
								e.target instanceof HTMLInputElement &&
								e.target.checked != (Object.keys($checkedBadges).length == $normalizedBadges.length)
							)
								e.target.checked = !e.target.checked;
						}}
						id={'includeBadge-selectAll'}
						type="checkbox"
						value=""
						aria-labelledby="includeBadge-selectAll-label"
						class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
					/>
					<span class="sr-only">
						The first cell in each row is a checkbox allowing you to select that row for publishing.
					</span>
				</th>
				<th scope="col" class="py-3 px-6 w-20"> Badge Name </th>
				<th scope="col" class="py-3 px-6"> Description </th>
				{#if showCreatedColumn}
					<th scope="col" class="py-3 px-6"> Created </th>
				{/if}
				<th scope="col" class="py-3 px-6"> Link </th>
			</tr>
		</thead>
		<tbody>
			{#each $normalizedBadges as badge (badge.id)}
				<tr class="bg-white border-b">
					<td class="py-4 px-6">
						<input
							checked={!!$checkedBadges[badge.id]}
							on:change={() => {
								handleChange(badge.id);
							}}
							id={'includeBadge-' + badge.id}
							type="checkbox"
							value=""
							class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
						/>
					</td>
					<th scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
						{badge.name}
					</th>
					<td class="py-4 px-6">
						{abbreviate(badge.description)}
					</td>
					{#if showCreatedColumn}
						<td class="py-4 px-6">
							{formatDate(badge['ceterms:dateEffective'])}
						</td>
					{/if}
					<td class="py-4 px-6">
						<a class="text-midnight underline" href={badge.id} target="new">
							<Icon
								src={FaSolidExternalLinkAlt}
								color="currentColor"
								className="inline-block"
								size="0.8em"
							/>
						</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
