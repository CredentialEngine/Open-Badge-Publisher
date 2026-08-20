<script lang="ts">
	import { fade } from 'svelte/transition';
	import {
		accredibleApiKey,
		accredibleAgreeTerms,
		accredibleSelectedRegion,
		accredibleGroups,
		fetchAccredibleGroups
	} from '$lib/stores/badgeSourceStore.js';
	import { accredibleRegions, type AccredibleEnvKey } from '$lib/utils/accredible.js';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Button from '$lib/components/Button.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import OpenEye from '$lib/icons/eye.svelte';
	import ClosedEye from '$lib/icons/closed-eye.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';

	let accredibleApiKeyHidden = true;
	let debounceLoadGroups = false;
	let loadGroupsMessage = '';
	let loadGroupsPromise: Promise<boolean> = new Promise((resolve) => resolve(true));

	const handleSelectRegion = (regionId: string) => {
		$accredibleSelectedRegion = regionId as AccredibleEnvKey;
	};

	const handleLoadGroups = () => {
		if (
			debounceLoadGroups ||
			!$accredibleSelectedRegion ||
			!$accredibleAgreeTerms ||
			!$accredibleApiKey
		)
			return;

		loadGroupsMessage = '';
		debounceLoadGroups = true;
		loadGroupsPromise = fetchAccredibleGroups().catch((err) => {
			loadGroupsMessage = err.message || 'Error loading badges from Accredible.';
			throw err;
		});
		setTimeout(() => (debounceLoadGroups = false), 5000);
	};
</script>

<Heading><h3>Configure Accredible connection</h3></Heading>

<BodyText>
	You'll need an Accredible API key with issuer access, found in Accredible under Settings &gt;
	API &amp; Integrations. Use a Sandbox key when testing against a Sandbox account.
</BodyText>

<div class="mt-8 mb-2">
	<ConfigurationStep
		stepNumber="5a"
		stepName="Choose environment"
		isActive={!$accredibleSelectedRegion}
	/>
</div>
<ul class="mt-4 md:grid gap-6 w-full grid-cols-2 xl:grid-cols-3">
	{#each [...accredibleRegions.values()] as region}
		<RadioCard
			label={region.name}
			name="accredibleregionradio"
			groupValue={$accredibleSelectedRegion}
			value={region.id}
			on:select={(e) => handleSelectRegion(e.detail.value)}
			description={region.apiDomain}
		/>
	{/each}
</ul>

{#if $accredibleSelectedRegion}
	<div class="mt-8 mb-2" transition:fade>
		<ConfigurationStep stepNumber="5b" stepName="Enter API key" isActive={!$accredibleApiKey} />
	</div>
	<div class="flex items-end flex-col md:flex-row" transition:fade>
		<div class="flex mb-3 w-full">
			<button
				type="button"
				class="inline-flex items-center p-2 text-sm text-gray-900 bg-gray-200 rounded-l border border-r-0 border-gray-300"
				on:click={() => (accredibleApiKeyHidden = !accredibleApiKeyHidden)}
				aria-label="Toggle API key visibility"
			>
				{#if accredibleApiKeyHidden}<ClosedEye />{:else}<OpenEye />{/if}
			</button>
			{#if accredibleApiKeyHidden}
				<input
					bind:value={$accredibleApiKey}
					autocomplete="off"
					type="password"
					name="accredible_api_key"
					id="input_accredibleapikey"
					class="rounded-none rounded-r bg-gray-50 p-2 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm"
					placeholder="Accredible API key"
				/>
			{:else}
				<input
					bind:value={$accredibleApiKey}
					autocomplete="off"
					type="text"
					name="accredible_api_key"
					id="input_accredibleapikey"
					class="rounded-none rounded-r bg-gray-50 p-2 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm"
					placeholder="Accredible API key"
				/>
			{/if}
		</div>
	</div>
{/if}

{#if $accredibleSelectedRegion && $accredibleApiKey}
	<div class="mt-8 mb-2" transition:fade>
		<ConfigurationStep
			stepNumber="5c"
			stepName="Agree to terms"
			isActive={!$accredibleAgreeTerms}
		/>
	</div>
	<div class="mt-2" transition:fade>
		<div class="py-4 flex items-center">
			<input
				bind:checked={$accredibleAgreeTerms}
				id="accredibleAgreeTerms"
				type="checkbox"
				class="w-4 h-4 text-tahiti bg-gray-100 rounded border-gray-300 focus:ring-tahiti focus:ring-2"
			/>
			<label for="accredibleAgreeTerms" class="ml-2 max-w-prose text-sm font-medium text-gray-900">
				I certify that I am a representative of the listed organization and authorized to publish
				this data to the Credential Registry.
			</label>
		</div>
	</div>
{/if}

{#if $accredibleSelectedRegion && $accredibleApiKey && $accredibleAgreeTerms}
	<div class="mt-8 mb-2" transition:fade>
		<ConfigurationStep stepNumber="5d" stepName="Load badges" isActive={!$accredibleGroups.length} />
	</div>
	{#await loadGroupsPromise}
		<div role="status" class="max-w-sm animate-pulse mt-8" transition:fade>
			<div class="h-2.5 bg-gray-200 rounded-full w-48 mb-4" />
			<div class="h-2 bg-gray-200 rounded-full max-w-[360px] mb-2.5" />
			<span class="sr-only">Loading...</span>
		</div>
	{:then}
		{#if $accredibleGroups.length}
			<div class="max-w-sm mt-8" transition:fade>
				<BodyText>
					Found {$accredibleGroups.length}
					{$accredibleGroups.length == 1 ? 'badge' : 'badges'} on Accredible.
				</BodyText>
				<BodyText gray={true}>
					Skill/outcome alignments that don't resolve to a URL (framework code) will be omitted
					from the imported data, since Badge Publisher requires a URL on every alignment entry.
				</BodyText>
			</div>
		{:else}
			<div
				class="my-4 flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-gray-300 border-dashed"
				transition:fade
			>
				<Button buttonType="primary" disabled={debounceLoadGroups} on:click={handleLoadGroups}>
					Load badges from Accredible
				</Button>
			</div>
		{/if}
	{:catch}
		<Alert message={loadGroupsMessage} level="error" heading="Fetching badges failed." />
	{/await}
{/if}
