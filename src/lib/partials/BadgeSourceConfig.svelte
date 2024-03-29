<script lang="ts">
	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';
	import { updated } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';
	import CanvasConfig from '$lib/partials/CanvasConfig.svelte';
	import CredlyConfig from '$lib/partials/CredlyConfig.svelte';
	import AdvancedBadgeInput from './AdvancedBadgeInput.svelte';
	import BadgeSelection from '$lib/partials/BadgeSelection.svelte';
	import {
		badgeSourceType,
		badgeSetupStep,
		badgeSetupComplete,
		checkedBadges,
		fetchCanvasIssuerBadges
	} from '$lib/stores/badgeSourceStore.js';
	import {
		credentialDrafts,
		ctdlPublicationResultStore,
		publisherSetupStep,
		proofingStep
	} from '$lib/stores/publisherStore.js';
	import Heading from '$lib/components/typography/Heading.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';

	// panelIsHidden = true when data has been saved and this panel is no longer active.
	let panelIsHidden = false;
	let modalVisible = false;

	const handleAdvanceToBadgeSelection = () => {
		if ($badgeSourceType == 'canvas') fetchCanvasIssuerBadges();
		$badgeSetupStep = 3;
		handleRefocusPanel();
	};

	const handleReopenPanel = async () => {
		modalVisible = false;
		panelIsHidden = false;
		$badgeSetupStep = 3;
		$proofingStep = 0;
		handleRefocusPanel();
	};

	const handleRefocusPanel = async () => {
		await tick();
		document.getElementById('badge-source-configuration')?.scrollIntoView();
	};
</script>

<Heading>
	<h2>
		{#if panelIsHidden}☑{/if}
		Badge Source Data
	</h2>
</Heading>

{#if !panelIsHidden}
	<div aria-label="form" class="focus:outline-none w-full bg-white p-4 sm:p-10">
		<div class="md:flex items-center border-b pb-6 border-gray-200">
			<ConfigurationStep
				stepNumber="4"
				stepName="Choose Source Type"
				isActive={$badgeSetupStep == 1 && $publisherSetupStep > 3}
			/>
			<ConfigurationStep
				stepNumber="5"
				stepName="Configure Source"
				isActive={$badgeSetupStep == 2}
			/>
			<ConfigurationStep stepNumber="6" stepName="Select Badges" isActive={$badgeSetupStep == 3} />
		</div>

		<!-- Step 1: Choose Source Type -->
		{#if $badgeSetupStep == 0}
			<div>
				<Heading><h3 aria-label="source type">No data yet</h3></Heading>

				<BodyText>Complete publisher configuration to connect badge data source.</BodyText>
			</div>
		{:else if $badgeSetupStep == 1}
			<div id="badgesetup-step1">
				<Heading><h3>Choose Source Type</h3></Heading>
				<BodyText gray={true}>
					Common badge platforms are supported directly, or you can paste Open Badges data in JSON
					directly.
				</BodyText>

				<ul class="mt-6 md:grid gap-6 w-full grid-cols-2 xl:grid-cols-3">
					<RadioCard
						label="Canvas Credentials"
						name="sourcetyperadio"
						groupValue={$badgeSourceType}
						value="canvas"
						on:select={(e) => ($badgeSourceType = e.detail.value)}
						description="Formerly known as Badgr, this badging tool is now part of the Instructure Learning Platform."
					/>
					<RadioCard
						label="Credly"
						name="sourcetyperadio"
						groupValue={$badgeSourceType}
						value="credly"
						on:select={(e) => ($badgeSourceType = e.detail.value)}
						description="A leading badge platform focused on resume-ready achievements in education, workforce, and professional development."
					/>
					<RadioCard
						label="JSON"
						name="sourcetyperadio"
						groupValue={$badgeSourceType}
						value="json"
						on:select={(e) => ($badgeSourceType = e.detail.value)}
						description="Paste an array of Open Badges achievements in JSON format. (Advanced)"
					/>
				</ul>
				<div class="mt-8 sm:flex flex-row items-center pb-6 sm:space-x-4">
					<NextPrevButton
						on:click={() => badgeSetupStep.update((n) => n + 1)}
						isActive={$badgeSourceType !== ''}
					/>
				</div>
			</div>

			<!-- Step 2: Configure Source -->
		{:else if $badgeSetupStep == 2}
			<div id="badgesetup-step2">
				{#if $badgeSourceType == 'canvas'}
					<CanvasConfig />
				{:else if $badgeSourceType == 'credly'}
					<CredlyConfig />
				{:else if $badgeSourceType == 'json'}
					<AdvancedBadgeInput />
				{/if}

				<div class="mt-8 sm:flex flex-row items-center pb-6 sm:space-x-4">
					<NextPrevButton
						on:click={() => {
							badgeSetupStep.update((n) => n - 1);
							handleRefocusPanel();
						}}
						isNext={false}
					/>
					<NextPrevButton on:click={handleAdvanceToBadgeSelection} isActive={$badgeSetupComplete} />
				</div>
			</div>

			<!-- Step 3: Preview Data -->
		{:else if $badgeSetupStep == 3}
			<div id="badgesetup-step3">
				<BadgeSelection />

				<div class="mt-8 sm:flex flex-row items-center pb-6 sm:space-x-4">
					<NextPrevButton on:click={() => badgeSetupStep.update((n) => n - 1)} isNext={false} />
					<NextPrevButton
						on:click={() => {
							panelIsHidden = true;
							$badgeSetupStep = 4;
							if ($proofingStep == 0) {
								$proofingStep = 1;
								credentialDrafts.importCheckedSourceBadges();
								ctdlPublicationResultStore.initialize();
							}
							tick().then(() => {
								document.getElementById('proofing')?.scrollIntoView();
							});
						}}
						isNext={true}
						isActive={Object.keys($checkedBadges).length > 0}
						label="Finish Badge Setup"
					/>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<!-- Panel is hidden, meaning the user has completed the publisher setup and has moved on. -->
	<div
		id="publisherConfigContent"
		aria-label="form"
		class="focus:outline-none w-full bg-white p-4 sm:p-10"
		transition:slide
	>
		<div class="flex items-center md:items-end flex-col justify-between md:flex-row">
			<BodyText>
				Badge setup complete. <br />
				<span class="font-bold">
					{Object.keys($checkedBadges).length}
					{Object.keys($checkedBadges).length == 1 ? 'badge' : 'badges'} selected.
				</span>
			</BodyText>
			<Button
				on:click={() => {
					modalVisible = true;
				}}>Edit</Button
			>
		</div>
	</div>

	<Modal
		visible={modalVisible}
		id={`badgesourcepanel-warning`}
		on:close={() => {
			modalVisible = false;
		}}
		title="Unsaved Changes"
		actions={[
			{
				label: 'Cancel',
				buttonType: 'default',
				onClick: () => {
					modalVisible = false;
				}
			},
			{ label: 'Proceed', buttonType: 'danger', onClick: handleReopenPanel }
		]}
	>
		<BodyText>
			If you change your badge source selections, any pending changes you have made to credentials
			may be lost.
		</BodyText>
	</Modal>
{/if}
