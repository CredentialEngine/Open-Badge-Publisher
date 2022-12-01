<script lang="ts">
	import { updated } from '$app/stores';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
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
				<li>
					<input
						type="radio"
						name="sourcetyperadio"
						bind:group={$badgeSourceType}
						value={1}
						id="sourcetype-canvascredentials"
						class="hidden peer"
						required
					/>
					<label
						for="sourcetype-canvascredentials"
						class="inline-flex justify-between items-center p-5 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						<div class="block">
							<div class="w-full text-lg font-semibold">Canvas Credentials</div>
							<div class="w-full">
								Formerly known as Badgr, this badging tool is now part of the Instructure Learning
								Platform.
							</div>
						</div>
					</label>
				</li>
				<li>
					<input
						type="radio"
						name="sourcetyperadio"
						bind:group={$badgeSourceType}
						value={2}
						id="sourcetype-credly"
						class="hidden peer"
					/>
					<label
						for="sourcetype-credly"
						class="inline-flex justify-between items-center p-5 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						<div class="block">
							<div class="w-full text-lg font-semibold">Credly Acclaim</div>
							<div class="w-full">
								A leading badge platform focused on resume-ready achievements in education,
								workforce, and professional development.
							</div>
						</div>
					</label>
				</li>
				<li>
					<input
						type="radio"
						name="sourcetyperadio"
						bind:group={$badgeSourceType}
						value={3}
						id="sourcetype-advanced"
						class="hidden peer"
					/>
					<label
						for="sourcetype-advanced"
						class="inline-flex justify-between items-center p-5 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						<div class="block">
							<div class="w-full text-lg font-semibold">
								JSON <span
									class="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800"
									>Advanced</span
								>
							</div>
							<div class="w-full">Paste an array of Open Badges achievements in JSON format.</div>
						</div>
					</label>
				</li>
			</ul>
			<div class="md:flex items-center border-b pb-6 border-gray-200">
				<NextPrevButton
					on:click={() => badgeSetupStep.update((n) => n + 1)}
					isActive={$badgeSourceType > 0}
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
