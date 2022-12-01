<script lang="ts">
	import { updated } from '$app/stores';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';
	import CanvasConfig from '$lib/partials/CanvasConfig.svelte';
	import { badgeSourceType, badgeSetupStep } from '$lib/stores/badgeSourceStore.js';
</script>

<h2
	class="mb-4 text-3xl font-extrabold tracking-tight leading-none text-gray-900 lg:text-4xl dark:text-white"
>
	Badge Source Data
</h2>

<div aria-label="form" class="focus:outline-none w-full bg-white dark:bg-midnight p-10">
	<div class="md:flex items-center border-b pb-6 border-gray-200">
		<ConfigurationStep
			stepNumber="4"
			stepName="Choose Source Type"
			isActive={$badgeSetupStep == 1}
		/>
		<ConfigurationStep stepNumber="5" stepName="Configure Source" isActive={$badgeSetupStep == 2} />
		<ConfigurationStep stepNumber="6" stepName="Preview Data" isActive={$badgeSetupStep == 3} />
	</div>

	<!-- Step 1: Choose Source Type -->
	{#if $badgeSetupStep == 1}
		<div id="badgesetup-step1">
			<h3
				aria-label="source type"
				class="focus:outline-none text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12"
			>
				Choose Source Type
			</h3>
			<p
				class="focus:outline-none text-sm font-light leading-tight text-gray-600 dark:text-gray-400 mt-4"
			>
				Common badge platforms are supported directly, or you can paste Open Badges data in JSON
				directly.
			</p>

			<ul class="mt-6 grid gap-6 w-full grid-cols-2 xl:grid-cols-3">
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
			<div class="md:flex items-center border-b pb-6 border-gray-200">
				<NextPrevButton
					on:click={() => badgeSetupStep.update((n) => n + 1)}
					isActive={$badgeSourceType !== ''}
				/>
			</div>
		</div>

		<!-- Step 2: Configure Source -->
	{:else if $badgeSetupStep == 2}
		<div id="badgesetup-step2">
			<CanvasConfig />

			<div class="md:flex items-center border-b pb-6 border-gray-200">
				<NextPrevButton on:click={() => badgeSetupStep.update((n) => n - 1)} isNext={false} />
				<NextPrevButton on:click={() => badgeSetupStep.update((n) => n + 1)} />
			</div>
		</div>

		<!-- Step 3: Preview Data -->
	{:else if $badgeSetupStep == 3}
		<div id="badgesetup-step3">
			<h3 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12">Preview Data</h3>

			<div class="md:flex items-center border-b pb-6 border-gray-200">
				<NextPrevButton on:click={() => badgeSetupStep.update((n) => n - 1)} isNext={false} />
			</div>
		</div>
	{/if}
</div>
