<script lang="ts">
	import {
		canvasRegions,
		canvasAccessToken,
		canvasAgreeTerms,
		canvasSelectedRegion,
		canvasIssuers,
		canvasSelectedIssuer
	} from '$lib/stores/badgeSourceStore.js';
	import { PUBLIC_UI_API_BASEURL } from '$env/static/public';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import OpenEye from '$lib/icons/eye.svelte';
	import ClosedEye from '$lib/icons/closed-eye.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';

	let canvasAccessTokenHidden = true;
	let getCanvasIssuers = async (): Promise<boolean> => {
		if (
			debounceRefreshIssuers ||
			!$canvasSelectedRegion ||
			!$canvasAgreeTerms ||
			!$canvasAccessToken
		)
			return false;

		const requestData = {
			URL: `${canvasRegions.get($canvasSelectedRegion)?.apiDomain}/v2/issuers?num=100`,
			Method: 'GET',
			Body: null,
			Headers: [
				{
					Name: 'Authorization',
					Value: `Bearer ${$canvasAccessToken}`
				}
			]
		};

		const proxyResponse = await fetch(`${PUBLIC_UI_API_BASEURL}/StagingApi/Proxy`, {
			method: 'POST',
			body: JSON.stringify(requestData)
		});
		const proxyResponseData = await proxyResponse.json();

		if (!proxyResponseData.Valid || proxyResponseData.Data?.StatusCode != '200')
			throw new Error('Error fetching issuer data.');

		const issuerData = JSON.parse(proxyResponseData.Data?.Body);
		$canvasIssuers = issuerData.result.map((i) => {
			return {
				entityId: i.entityId,
				openBadgeId: i.openBadgeId,
				name: i.name,
				image: i.image,
				email: i.email,
				description: i.description,
				url: i.url
			};
		});

		return true;
	};
	let canvasIssuersPromise = new Promise((resolve, reject) => {
		resolve(true);
	});

	let debounceRefreshIssuers = false;
	const handleRefreshIssuers = () => {
		if (debounceRefreshIssuers) return;

		canvasIssuersPromise = getCanvasIssuers();
		debounceRefreshIssuers = true;
		setTimeout(() => {
			debounceRefreshIssuers = false;
		}, 5000);
	};
</script>

<Heading><h3>Configure Canvas Credentials connection</h3></Heading>

<BodyText>
	<a
		href="https://www.instructure.com/higher-education/products/canvas/canvas-credentials-digital-badges"
		target="new">Canvas Credentials</a
	>, formerly known as Badgr, is an Open Badges issuing platform offering LMS integration, skills
	alignment, learning pathways, social sharing and analytics. Client environments are hosted in four
	regions internationally.
</BodyText>
<div class="mt-8 mb-2">
	<ConfigurationStep stepNumber="5a" stepName="Choose region" isActive={!$canvasSelectedRegion} />
</div>
<BodyText>
	Select the region that matches where your organization's data is held by Canvas Credentials. If
	you aren't sure, check the domain where you sign into Canvas Credentials. If it is <code
		>badgr.com</code
	>, choose United States.
</BodyText>
<div class="mt-8">
	{#each [...canvasRegions] as [regionId, region]}
		<div class="flex items-center mb-4">
			<input
				id={`canvasRegionSelect-${region.id}`}
				type="radio"
				bind:group={$canvasSelectedRegion}
				value={region.id}
				class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
			/>
			<label
				for={`canvasRegionSelect-${region.id}`}
				class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
			>
				{region.name}
			</label>
		</div>
	{/each}
</div>

{#if $canvasSelectedRegion}
	<div class="mt-8 mb-2">
		<ConfigurationStep
			stepNumber="5b"
			stepName="Agree to terms"
			isActive={!!$canvasSelectedRegion && !$canvasAgreeTerms}
		/>
	</div>
	<div class="mt-2">
		<div class="py-4 flex items-center">
			<input
				bind:checked={$canvasAgreeTerms}
				id="canvasAgreeTerms"
				type="checkbox"
				value=""
				class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
			/>
			<label
				for="canvasAgreeTerms"
				class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
				>I agree with the Canvas Credentials (Badgr) <a
					href="https://www.instructure.com/policies/badgr-terms-of-service"
					class="text-indigo-700 dark:text-superaqua">terms of service</a
				></label
			>
		</div>
	</div>
{/if}

{#if $canvasSelectedRegion && $canvasAgreeTerms}
	<div class="mt-8 mb-2">
		<div class="mt-8 mb-2">
			<ConfigurationStep
				stepNumber="5c"
				stepName="Obtain access token"
				isActive={!!$canvasSelectedRegion && $canvasAgreeTerms && !$canvasAccessToken}
			/>
		</div>
	</div>
	<BodyText>
		Obtain an access token by requesting one from the Badgr API. You can obtain a token with your
		email address and password using <code>cUrl</code> with the code below, or another tool. Replace
		<code>YOUREMAIL</code>
		and
		<code>YOUREMAIL</code> with your credentials for this server.
	</BodyText>
	<pre class="overflow-scroll"><code class="text-xs"
			>curl -X POST '{canvasRegions.get($canvasSelectedRegion)
				?.apiDomain}/o/token' -d "username=YOUREMAIL&password=YOURPASSWORD"</code
		></pre>
	<div class="mt-8 md:flex items-center">
		<div class="flex flex-col w-full">
			<label
				for="input_canvasapikey"
				class="mb-3 text-sm leading-none text-gray-800 dark:text-white"
				>Canvas Credentials API Access Token</label
			>
			<div class="relative w-full max-w-lg">
				{#if canvasAccessTokenHidden}
					<input
						bind:value={$canvasAccessToken}
						autocomplete="off"
						type="password"
						id="input_canvasapikey"
						class="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
						placeholder="Access Token"
						required
					/>
				{:else}
					<input
						bind:value={$canvasAccessToken}
						autocomplete="off"
						type="text"
						id="input_canvasapikey"
						class="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
						placeholder="Access Token"
						required
					/>
				{/if}
				<button
					type="button"
					tabindex="-1"
					on:click={() => (canvasAccessTokenHidden = !canvasAccessTokenHidden)}
					aria-hidden="true"
					class="absolute top-0 right-0 p-2.5 text-sm font-medium text-white rounded-r-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					{#if canvasAccessTokenHidden}
						<ClosedEye />
					{:else}
						<OpenEye />
					{/if}
				</button>
			</div>
		</div>
	</div>
	{#if $canvasAccessToken.trim().length && $canvasAccessToken.trim().length != 30}
		<div class="my-2">
			<Alert
				level="warning"
				message="Access token appears to be the wrong length. Check it before proceeding."
			/>
		</div>
	{/if}
{/if}

{#if $canvasAgreeTerms && $canvasAccessToken && $canvasSelectedRegion}
	<div class="mt-8 mb-2">
		<div class="mt-8 mb-2">
			<ConfigurationStep
				stepNumber="5d"
				stepName="Select Canvas Credentials issuer"
				isActive={!!($canvasAgreeTerms && $canvasAccessToken && $canvasSelectedRegion)}
			/>
		</div>
	</div>
	<BodyText>
		Select which issuer's badges to publish to the Registry. If you have no issuers on your Canvas
		Credentials account, sign into an account that has staff access to the correct issuer, or create
		a new issuer and badges within your account.
	</BodyText>

	{#await canvasIssuersPromise}
		<div
			class="my-4 flex flex-col items-center justify-center w-full h-64 rounded-lg border-2 border-gray-300 border-dashed"
		>
			<LoadingSpinner />
		</div>
	{:then}
		{#if $canvasIssuers?.length}
			<ul
				class="mt-6 md:grid gap-6 w-full grid-cols-2 xl:grid-cols-3 text-gray-500 dark:text-gray-400"
			>
				{#each $canvasIssuers as issuer (issuer.entityId)}
					<RadioCard
						label={issuer.name}
						name="canvasissuerradio"
						groupValue={$canvasSelectedIssuer?.entityId}
						value={issuer.entityId}
						on:select={(e) => ($canvasSelectedIssuer = issuer)}
						description={issuer.description}
					>
						<span slot="label"
							><span class="text-sm font-light text-gray-500 dark:text-gray-400">
								<a
									href={`${canvasRegions.get($canvasSelectedRegion)?.apiDomain}/public/issuers/${
										issuer.entityId
									}`}
									target="new"
									class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
									>{issuer.name}</a
								>
							</span></span>
					</RadioCard>
				{/each}
			</ul>
		{:else}
			<div
				class="my-4 flex flex-col items-center justify-center w-full h-64 rounded-lg border-2 border-gray-300 border-dashed"
			>
				<button
					type="button"
					class="text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					class:bg-blue-700={!debounceRefreshIssuers}
					class:bg-gray-200={debounceRefreshIssuers}
					on:click={handleRefreshIssuers}
				>
					Load issuers
				</button>
			</div>
		{/if}
	{:catch error}
		<Alert message={error.message} level="error" heading="Fetching issuers failed." />
	{/await}
{/if}
