<script lang="ts">
	import { slide } from 'svelte/transition';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import ManualAlignments from './ManualAlignments.svelte';
	import { badgeSourceType } from '$lib/stores/badgeSourceStore.js';
	import {
		credentialDrafts,
		ctdlPublicationResultStore,
		proofingStep,
		reviewingStep
	} from '$lib/stores/publisherStore.js';
</script>

<Heading><h2>Summary</h2></Heading>

<div
	aria-label="form"
	transition:slide
	class="focus:outline-none w-full bg-white dark:bg-midnight p-10"
>
	<div class="md:flex items-center border-b pb-6 border-gray-200">
		<ConfigurationStep
			stepNumber="10"
			stepName="Update Alignments"
			isActive={$proofingStep == 4 && $reviewingStep == 1}
		/>
		<ConfigurationStep stepNumber="11" stepName="Summary Report" isActive={$reviewingStep == 2} />
	</div>

	{#if $reviewingStep == 0}
		<div transition:slide>
			<Heading><h3 aria-label="source type">No data yet</h3></Heading>

			<BodyText>
				Complete saving selected badges to publisher, and then review publishing activity here.
			</BodyText>
		</div>
	{:else if $reviewingStep == 1}
		{#if $badgeSourceType == 'canvas'}
			<BodyText>Update your canvas alignments...</BodyText>
		{:else}
			<ManualAlignments />
		{/if}
	{/if}
</div>
