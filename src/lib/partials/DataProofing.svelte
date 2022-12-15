<script lang="ts">
	import { onMount } from 'svelte';
	import { slide, fly } from 'svelte/transition'; // TODO: implement left-right fly-in instead of slide for next/prev steps
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import CredentialProofingList from '$lib/partials/CredentialProofingList.svelte';
	import SaveToPublisher from '$lib/partials/SaveToPublisher.svelte';

	import { PubStatuses } from '$lib/stores/publisherStore.js';
	import {
		credentialDrafts,
		ctdlPublicationResultStore,
		proofingStep
	} from '$lib/stores/publisherStore.js';
	import { badgeSetupStep } from '$lib/stores/badgeSourceStore.js';

	let numLoadsPending = 1;
	let numCredentialsTotal = 10;

	const handleNextStep = () => {
		$proofingStep = $proofingStep + 1;
	};
	const handlePreviousStep = () => {
		$proofingStep = $proofingStep - 1;
	};

	$: {
		numCredentialsTotal = Object.keys($ctdlPublicationResultStore).length;
		numLoadsPending = Object.entries($ctdlPublicationResultStore).filter(
			([credentialId, credential]) => {
				return credential.publicationStatus == PubStatuses.Pending;
			}
		).length;
	}
</script>

<Heading><h2>Data Preparation</h2></Heading>

<div aria-label="form" in:slide class="focus:outline-none w-full bg-white dark:bg-midnight p-10">
	<div class="md:flex items-center border-b pb-6 border-gray-200">
		<ConfigurationStep
			stepNumber="7"
			stepName="Load Data"
			isActive={$proofingStep == 1 && $badgeSetupStep > 3}
		/>
		<ConfigurationStep stepNumber="8" stepName="Final Edits" isActive={$proofingStep == 2} />
		<ConfigurationStep stepNumber="9" stepName="Save to Publisher" isActive={$proofingStep == 3} />
	</div>

	{#if $proofingStep == 0}
		<div transition:slide>
			<Heading><h3 aria-label="source type">No data yet</h3></Heading>

			<BodyText>
				Connect your badge system to preview data and make final adjustments for publication.
			</BodyText>
		</div>
	{:else if $proofingStep == 1}
		<div transition:slide>
			<Heading><h3 aria-label="source type">Loading Data</h3></Heading>

			<BodyText>Loading data from the publisher and your badge system.</BodyText>

			<div class="w-full mt-2 bg-gray-200 rounded-full dark:bg-gray-700">
				<div
					class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
					style={`width: ${Math.round(100 - (numLoadsPending / numCredentialsTotal) * 100)}%`}
				>
					{Math.round(100 - (numLoadsPending / numCredentialsTotal) * 100)}%
				</div>
			</div>
		</div>

		<div class="md:flex items-center border-b pb-6 border-gray-200">
			<NextPrevButton on:click={handleNextStep} isActive={numLoadsPending < 1} />
		</div>
	{:else if $proofingStep == 2}
		<div transition:slide>
			<Heading><h3 aria-label="source type">Final Edits</h3></Heading>

			<CredentialProofingList />
		</div>

		<div class="md:flex items-center border-b pb-6 border-gray-200">
			<NextPrevButton on:click={handlePreviousStep} isNext={false} />
			<NextPrevButton on:click={handleNextStep} />
		</div>
	{:else if $proofingStep == 3}
		<div transition:slide>
			<Heading><h3 aria-label="source type">Save to Publisher</h3></Heading>

			<BodyText>
				Ready to push badges to the publisher for your Organization's final review.
			</BodyText>

			<SaveToPublisher />
		</div>

		<div class="md:flex items-center border-b pb-6 border-gray-200">
			<NextPrevButton on:click={handlePreviousStep} isNext={false} />
			<NextPrevButton on:click={handlePreviousStep} isActive={false} />
		</div>
	{/if}
</div>
