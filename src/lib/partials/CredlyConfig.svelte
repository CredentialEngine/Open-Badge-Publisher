<script lang="ts">
	import { fade } from 'svelte/transition';
	import {
		badgeSourceType,
		credlyAgreeTerms,
		credlyIssuerBadges,
		credlyIssuerData,
		credlySelectedIssuer
	} from '$lib/stores/badgeSourceStore.js';
	import { publisherUser } from '$lib/stores/publisherStore.js';
	import type { CredlyBadgeBasic } from '$lib/stores/badgeSourceStore.js';
	import { get } from 'svelte/store';
	import * as yup from 'yup';
	import { PUBLIC_UI_API_BASEURL } from '$env/static/public';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let debounceRefreshIssuer = false;
	const credlyUrlPattern =
		/https?:\/\/(www\.)?credly\.com\/organizations\/(?<orgslug>[\w\d-_]+)(\/badges)?\/?/;
	const urlCheck = yup.string().url().matches(credlyUrlPattern, { excludeEmptyString: true });
	let credlyIssuerUrl: string = '';
	let issuerUrlValidationMessage = '';
	const handleSaveCredlyIssuer = () => {
		issuerUrlValidationMessage = '';
		debounceRefreshIssuer = true;
		setTimeout(() => (debounceRefreshIssuer = false), 5000);
		urlCheck
			.validate(credlyIssuerUrl)
			.then((value) => {
				const match = credlyIssuerUrl.match(credlyUrlPattern);
				$credlySelectedIssuer = match?.groups?.orgslug || '';
			})
			.catch((err) => {
				issuerUrlValidationMessage = `URL doesn't match expected format. Try adjusting your URL to look like https://www.credly.com/organizations/ibm/badges`;
				debounceRefreshIssuer = false;
			});
	};
	const handleClearCredlyIssuer = () => {
		$credlySelectedIssuer = '';
		$credlyIssuerData = undefined;
	};

	let debounceLoadIssuer = false;
	let credlyLoadMessage = '';

	const loadCredlyIssuer = async (): Promise<boolean> => {
		if (debounceLoadIssuer) return false;

		debounceLoadIssuer = true;
		setTimeout(() => (debounceLoadIssuer = false), 5000);

		const requestData = {
			URL: `https://www.credly.com/organizations/${$credlySelectedIssuer}/badges?sort=most_popular&page=1`,
			Method: 'GET',
			Body: null,
			Headers: [{ Name: 'Accept', Value: 'application/json' }]
		};

		let proxyRequestHeaders = new Headers();
		proxyRequestHeaders.append('Content-Type', 'application/json');
		if ($publisherUser.user?.Token)
			proxyRequestHeaders.append('Authorization', `Bearer ${$publisherUser.user?.Token}`);
		const proxyResponse = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
			method: 'POST',
			body: JSON.stringify(requestData),
			headers: proxyRequestHeaders
		});
		const proxyResponseData = await proxyResponse.json();

		if (!proxyResponseData.Valid || proxyResponseData.Data?.StatusCode != '200')
			throw new Error('Error fetching issuer data.');

		const responseCredlyData = JSON.parse(proxyResponseData.Data?.Body);

		try {
			const iss = responseCredlyData.data[0].issuer.entities[0].entity;
			$credlyIssuerData = {
				id: iss.id,
				name: iss.name,
				vanity_url: iss.vanity_url,
				badge_count: responseCredlyData.metadata.total_count
			};
			$credlyIssuerBadges = responseCredlyData.data.map((b: CredlyBadgeBasic) => {
				return {
					id: b.id,
					name: b.name,
					description: b.description,
					image_url: b.image_url,
					alignments: b.alignments
				};
			});
		} catch (err) {
			credlyLoadMessage =
				'Issuer & badges not found with this URL. Please check the URL and try again.';
			return false;
		}

		return true;
	};
	let loadIssuerPromise: Promise<boolean> = new Promise((resolve, reject) => {
		resolve(true);
	});
</script>

<Heading><h3>Configure Credly connection</h3></Heading>

<div class="mt-8 mb-2">
	<ConfigurationStep
		stepNumber="5a"
		stepName="Choose Credly issuer"
		isActive={!$credlySelectedIssuer}
	/>
</div>
<BodyText>
	Enter the URL of your Credly issuer. For an example, see
	<a
		href="https://www.credly.com/organizations/ibm/badges"
		target="new"
		class="font-medium text-blue-600 dark:text-blue-500 hover:underline">IBM</a
	>.
</BodyText>

<div class="flex items-end flex-col md:flex-row">
	{#if !$credlySelectedIssuer}
		<input
			bind:value={credlyIssuerUrl}
			autocomplete="off"
			type="text"
			name="issuer_url"
			id="input_credlyissuerurl"
			class="block w-full p-2.5 md:mr-3 mb-3 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
			placeholder="https://www.credly.com/organization/..."
			required
		/>
		<button
			type="button"
			class="text-white text-sm px-5 py-2.5 mb-3 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg border border-transparent dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
			class:bg-blue-700={!debounceRefreshIssuer}
			class:bg-gray-200={debounceRefreshIssuer}
			on:click={handleSaveCredlyIssuer}
		>
			Save
		</button>
	{:else}
		<div class="flex mb-3 w-full">
			<span
				class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 rounded-l-lg border border-r-0 border-gray-300 dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600"
				>🔒</span
			>
			<input
				bind:value={credlyIssuerUrl}
				autocomplete="off"
				type="text"
				name="issuer_url"
				id="input_credlyissuerurl"
				aria-label="disabled credly issuer input"
				class="rounded-none rounded-r-lg bg-gray-50 p-2.5 mr-3 border border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 cursor-not-allowed"
				disabled
			/>
		</div>
		<button
			type="button"
			class="text-gray-900 text-sm px-5 py-2.5 mb-3 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 focus:outline-none dark:focus:ring-gray-700"
			on:click={handleClearCredlyIssuer}
		>
			Clear
		</button>
	{/if}
</div>

{#if issuerUrlValidationMessage}
	<Alert level="error" message={issuerUrlValidationMessage} heading="Error validating URL:" />
{/if}

{#if $credlySelectedIssuer}
	<div class="mt-8 mb-2" transition:fade>
		<ConfigurationStep
			stepNumber="5b"
			stepName="Agree to terms"
			isActive={!!$credlySelectedIssuer && !$credlyAgreeTerms}
		/>
	</div>
	<div class="mt-2" transition:fade>
		<div class="py-4 flex items-center">
			<input
				bind:checked={$credlyAgreeTerms}
				id="credlyAgreeTerms"
				type="checkbox"
				class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
			/>
			<label
				for="credlyAgreeTerms"
				class="ml-2 max-w-prose text-sm font-medium text-gray-900 dark:text-gray-300"
			>
				I certify that I am a representative of the listed organization and authorized to publish
				this data to the Credential Registry.
			</label>
		</div>
	</div>
{/if}

{#if $credlySelectedIssuer && $credlyAgreeTerms}
	<div class="mt-8 mb-2" transition:fade>
		<ConfigurationStep
			stepNumber="5c"
			stepName="Preview issuer data"
			isActive={!!$credlySelectedIssuer}
		/>
	</div>
	{#await loadIssuerPromise}
		<div role="status" class="max-w-sm animate-pulse mt-8" transition:fade>
			<div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4" />
			<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5" />
			<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5" />
			<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5" />
			<span class="sr-only">Loading...</span>
		</div>
	{:then}
		{#if $credlyIssuerData}
			<div class="max-w-sm mt-8" transition:fade>
				<Heading><h4>{$credlyIssuerData.name}</h4></Heading>
				<BodyText>
					The issuer {$credlyIssuerData.name} has {$credlyIssuerData.badge_count} badges defined on Credly.
				</BodyText>
				<BodyText>
					<a
						class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
						href={$credlyIssuerData.vanity_url}
						target="new"
					>
						View details on Credly
					</a>
				</BodyText>
			</div>
		{:else}
			<div
				class="my-4 flex flex-col items-center justify-center w-full h-64 rounded-lg border-2 border-gray-300 border-dashed"
				transition:fade
			>
				<button
					type="button"
					class="text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					class:bg-blue-700={!debounceLoadIssuer}
					class:bg-gray-200={debounceLoadIssuer}
					on:click={loadCredlyIssuer}
				>
					Load issuer data
				</button>
			</div>
		{/if}
	{:catch error}
		<Alert message={error.message} level="error" heading="Fetching issuer failed." />
	{/await}
{/if}
