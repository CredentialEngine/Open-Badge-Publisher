<script lang="ts">
	import { slide } from 'svelte/transition';
	import {
		parchmentAccessToken,
		parchmentAgreeTerms,
		parchmentSelectedRegion,
		parchmentIssuers,
		parchmentSelectedIssuer,
        parchmentOrganization
	} from '$lib/stores/badgeSourceStore.js';
	import abbreviate from '$lib/utils/abbreviate.js';
	import { publisherUser } from '$lib/stores/publisherStore.js';
	import { PUBLIC_UI_API_BASEURL } from '$env/static/public';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Button from '$lib/components/Button.svelte';
	import OpenEye from '$lib/icons/eye.svelte';
	import ClosedEye from '$lib/icons/closed-eye.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import { initiateLogin } from '$lib/auth/oauth.js';
	import { type ParchmentEnv, parchmentEnv, parchmentRegions } from '$lib/utils/parchment.js';

	let parchmentAccessTokenHidden = true;
	let getParchmentIssuers = async (): Promise<boolean> => {
		if (!$parchmentSelectedRegion) return false;
		const requestData = {
			URL: `${parchmentRegions.get($parchmentSelectedRegion)?.apiDomain}/v2/issuers?num=100`,
			Method: 'GET',
			Body: null,
			Headers: [
				{
					Name: 'Authorization',
					Value: `Bearer ${$parchmentAccessToken}`
				},
				{
					Name: 'Accept',
					Value: 'application/json'
				}
			]
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

		const issuerData = JSON.parse(proxyResponseData.Data?.Body);
		$parchmentIssuers = issuerData.result.map((i: any) => {
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
	let parchmentIssuersPromise = new Promise((resolve, reject) => {
		resolve(true);
	});

	let debounceRefreshIssuers = false;
	const handleRefreshIssuers = () => {
		if (
			debounceRefreshIssuers ||
			!$parchmentSelectedRegion ||
			!$parchmentAgreeTerms ||
			!$parchmentAccessToken
		)
			return false;

		parchmentIssuersPromise = getParchmentIssuers();
		debounceRefreshIssuers = true;
		setTimeout(() => {
			debounceRefreshIssuers = false;
		}, 5000);
	};

	let usePassword = true;
	let parchmentEmail = '';
	let parchmentPassword = '';
	let parchmentErrorMessage = '';
	let debounceObtainAuth = false;

	const handleObtainParchmentAuthTokenWithPassword = async (): Promise<boolean> => {
		if (!$parchmentSelectedRegion) return false;

		parchmentErrorMessage = '';
		const formData = `username=${encodeURIComponent(parchmentEmail)}&password=${encodeURIComponent(
			parchmentPassword
		)}`;
		const requestData = {
			URL: `${parchmentRegions.get($parchmentSelectedRegion)?.apiDomain}/o/token`,
			Method: 'POST',
			Body: formData,
			Headers: [
				{
					Name: 'Accept',
					Value: 'application/json'
				},
				{
					Name: 'Content-Type',
					Value: 'application/x-www-form-urlencoded'
				}
			]
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

		if (!proxyResponseData.Valid || proxyResponseData.Data?.StatusCode != '200') {
			parchmentErrorMessage = '';
			try {
				const errorData = JSON.parse(proxyResponseData.Data?.Body);
				parchmentErrorMessage = 'Error fetching Parchment access token. ' + errorData.error_description;
			} catch {
				parchmentErrorMessage = 'Unknown error.';
			}
			return false;
		}
		const tokenData = JSON.parse(proxyResponseData.Data?.Body);
		$parchmentAccessToken = tokenData.access_token;
		return true;
	};
	let parchmentAuthTokenPromise = new Promise((resolve, reject) => {
		resolve(true);
	});

	let currentParchmentEnv: ParchmentEnv | null = null;
	$: currentParchmentEnv = $parchmentSelectedRegion ? parchmentEnv($parchmentSelectedRegion) : null;
</script>

<Heading><h3>Configure Parchment connection</h3></Heading>

<BodyText>
	<a
		href=""
		target="new"
		class="text-midnight underline hover:no-underline">Parchment</a
	>
</BodyText>
<div class="mt-8 mb-2">
	<ConfigurationStep stepNumber="5a" stepName="Choose region" isActive={!$parchmentSelectedRegion} />
</div>
<BodyText>
	Select the region that matches where your organization's data is held by Parchment Credentials. If
	you aren't sure, check the domain where you sign into Parchment Credentials.
</BodyText>
<div class="mt-8">
	{#each [...parchmentRegions].filter(([rId, r]) => rId !== 'test' || parchmentEnv(rId).enabled) as [regionId, region]}
		<div class="flex items-center mb-4">
			<input
				id={`parchmentRegionSelect-${region.id}`}
				type="radio"
				bind:group={$parchmentSelectedRegion}
				value={region.id}
				disabled={!!$parchmentAccessToken || !parchmentEnv(regionId).enabled}
				class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
			/>
			<label
				for={`parchmentRegionSelect-${region.id}`}
				class={`ml-2 text-sm font-medium ${
					parchmentEnv(regionId).enabled ? 'text-gray-900' : 'text-midgray'
				}`}
			>
				{region.name}
				{#if !parchmentEnv(regionId).enabled}(disabled in app settings){/if}
			</label>
		</div>
	{/each}
</div>

{#if $parchmentSelectedRegion}
	<div class="mt-8 mb-2">
		<ConfigurationStep
			stepNumber="5b"
			stepName="Agree to terms"
			isActive={!!$parchmentSelectedRegion && !$parchmentAgreeTerms}
		/>
	</div>
	<div class="mt-2">
		<div class="py-4 flex items-center">
			<input
				bind:checked={$parchmentAgreeTerms}
				id="parchmentAgreeTerms"
				type="checkbox"
				value=""
				class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
			/>
			<label for="parchmentAgreeTerms" class="ml-2 text-sm font-medium text-gray-900"
				>I agree with the Parchment <a
					href="https://www.instructure.com/policies/badgr-terms-of-service"
					class="text-midnight underline hover:no-underline">terms of service</a
				></label
			>
		</div>
	</div>
{/if}

{#if $parchmentSelectedRegion && $parchmentAgreeTerms}
	<div class="mt-8 mb-2">
		<ConfigurationStep
			stepNumber="5c"
			stepName="Enter organization name"
			isActive={!!$parchmentSelectedRegion && $parchmentAgreeTerms && !$parchmentOrganization}
		/>
		<BodyText>
		Enter the organization name used with your Parchment account.
		</BodyText>
	</div>
	<div class="mt-2">
    <div class="py-4 flex flex-col">
        <label 
            for="parchmentOrganization" 
            class="mb-2 text-sm font-medium text-gray-900"
        >
            Organization Name
        </label>
        <input
            bind:value={$parchmentOrganization}
            id="parchmentOrganization"
            type="text"
            placeholder="Enter the organization name you use on Parchment"
            class="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
</div>
{/if}

{#if $parchmentSelectedRegion && $parchmentAgreeTerms && $parchmentOrganization}
	<div class="mt-8 mb-2">
		<div class="mt-8 mb-2">
			<ConfigurationStep
				stepNumber="5d"
				stepName="Obtain access token"
				isActive={!!$parchmentSelectedRegion && $parchmentAgreeTerms && $parchmentOrganization && !$parchmentAccessToken}
			/>
		</div>
	</div>
	{#if usePassword}
		<div>
			{#if currentParchmentEnv?.client_id && currentParchmentEnv?.client_secret}
				<BodyText>
					Authenticate with Parchment account to load badges. You will be
					redirected to Parchment in your selected region to authorize.
				</BodyText>
				{#if !$parchmentAccessToken}
					<Button
						buttonType="primary"
						on:click={() => {
							initiateLogin();
						}}
					>
						Login with Parchment
					</Button>
				{:else}
					<Button disabled={true}>Login with Parchment</Button>
					<BodyText>Successfully obtained Parchment Auth Token.</BodyText>
				{/if}
			{:else}
				<BodyText>
					Authenticate with Parchment to load badges by entering your email address
					and password. We do not retain password data, but you may also
					<button
						class="text-midnight underline hover:no-underline"
						on:click={() => {
							usePassword = false;
						}}>obtain an auth token manually</button
					>.
				</BodyText>

				{#await parchmentAuthTokenPromise}
					<div transition:slide><LoadingSpinner /></div>
				{:then success}
					{#if $parchmentAccessToken}
						<BodyText>Successfully obtained Parchment Auth Token.</BodyText>
					{:else}
						<div class="mt-8 md:flex items-center" transition:slide>
							<div class="flex flex-col">
								<label for="input_parchmentemail" class="mb-3 text-sm leading-none text-gray-800"
									>Email</label
								>
								<input
									id="input_parchmentemail"
									type="email"
									aria-label="Enter publisher account email"
									class="focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64 bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200"
									bind:value={parchmentEmail}
								/>
							</div>
						</div>
						<div class="mt-4 md:flex items-center">
							<div class="flex flex-col">
								<label for="input_parchmentpassword" class="mb-3 text-sm leading-none text-gray-800"
									>Password</label
								>
								<input
									id="input_parchmentpassword"
									type="password"
									aria-label="Enter publisher account password"
									class="focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64 bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200"
									bind:value={parchmentPassword}
								/>
							</div>
						</div>
						<div class="mt-4">
							<Button buttonType="primary" on:click={handleObtainParchmentAuthTokenWithPassword}
								>Submit</Button
							>
						</div>

						{#if parchmentErrorMessage}
							<div class="mt-4" transition:slide>
								<Alert level="error" message={parchmentErrorMessage} />
							</div>
						{/if}
					{/if}
				{/await}
			{/if}
		</div>
	{:else}
		<!-- usePassword: false -- obtain auth token manually. -->
		<BodyText>
			Obtain an access token by requesting one from the Badgr API. You can obtain a token with your
			email address and password using <code>cUrl</code> with the code below, or another tool.
			Replace
			<code>YOUREMAIL</code>
			and
			<code>YOUREMAIL</code> with your credentials for this server.
			<button
				class="text-midnight underline hover:no-underline"
				on:click={() => {
					usePassword = true;
				}}>Use password instead</button
			>.
		</BodyText>
		<pre class="overflow-scroll"><code class="text-xs"
				>curl -X POST '{parchmentRegions.get($parchmentSelectedRegion)
					?.apiDomain}/o/token' -d "username=YOUREMAIL&password=YOURPASSWORD"</code
			></pre>
		<div class="mt-8 md:flex items-center">
			<div class="flex flex-col w-full">
				<label for="input_parchmentapikey" class="mb-3 text-sm leading-none text-gray-800"
					>Parchment API Access Token</label
				>
				<div class="relative w-full max-w-lg">
					{#if parchmentAccessTokenHidden}
						<input
							bind:value={$parchmentAccessToken}
							autocomplete="off"
							type="password"
							id="input_parchmentapikey"
							class="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Access Token"
							required
						/>
					{:else}
						<input
							bind:value={$parchmentAccessToken}
							autocomplete="off"
							type="text"
							id="input_parchmentapikey"
							class="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Access Token"
							required
						/>
					{/if}
					<button
						type="button"
						tabindex="-1"
						on:click={() => (parchmentAccessTokenHidden = !parchmentAccessTokenHidden)}
						aria-hidden="true"
						class="absolute top-0 right-0 p-2.5 text-sm font-medium text-white rounded-r-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-blue-300"
					>
						{#if parchmentAccessTokenHidden}
							<ClosedEye />
						{:else}
							<OpenEye />
						{/if}
					</button>
				</div>
			</div>
		</div>
		{#if $parchmentAccessToken.trim().length && $parchmentAccessToken.trim().length != 30}
			<div class="my-2">
				<Alert
					level="warning"
					message="Access token appears to be the wrong length. Check it before proceeding."
				/>
			</div>
		{/if}
	{/if}
{/if}

{#if $parchmentAgreeTerms && $parchmentAccessToken && $parchmentSelectedRegion}
	<div class="mt-8 mb-2">
		<div class="mt-8 mb-2">
			<ConfigurationStep
				stepNumber="5d"
				stepName="Select Parchment Credentials issuer"
				isActive={!!($parchmentAgreeTerms && $parchmentAccessToken && $parchmentSelectedRegion)}
			/>
		</div>
	</div>
	<BodyText>
		Select which issuer's badges to publish to the Registry. If you have no issuers on your Parchment account, sign into an account that has staff access to the correct issuer, or create
		a new issuer and badges within your account.
	</BodyText>

	{#await parchmentIssuersPromise}
		<div
			class="my-4 flex flex-col items-center justify-center w-full h-64 rounded-lg border-2 border-gray-300 border-dashed"
		>
			<LoadingSpinner />
		</div>
	{:then}
		{#if $parchmentIssuers?.length}
			<ul class="mt-6 md:grid gap-6 w-full grid-cols-2 xl:grid-cols-3 text-gray-500">
				{#each $parchmentIssuers as issuer (issuer.entityId)}
					<RadioCard
						label={issuer.name}
						name="parchmentissuerradio"
						groupValue={$parchmentSelectedIssuer?.entityId}
						value={issuer.entityId}
						on:select={(e) => ($parchmentSelectedIssuer = issuer)}
						description={abbreviate(issuer.description, 200)}
					>
						<span slot="label"
							><span class="text-base font-medium text-midnight">
								<a
									href={`${parchmentRegions.get($parchmentSelectedRegion)?.apiDomain}/public/issuers/${
										issuer.entityId
									}`}
									target="new"
									class="text-midnight underline hover:no-underline">{issuer.name}</a
								>
							</span></span
						>
					</RadioCard>
				{/each}
			</ul>
		{:else}
			<div
				class="my-4 flex flex-col items-center justify-center w-full h-64 rounded-lg border-2 border-gray-300 border-dashed"
			>
				<Button
					buttonType="primary"
					disabled={!!debounceRefreshIssuers}
					on:click={handleRefreshIssuers}
				>
					Load issuers
				</Button>
			</div>
		{/if}
	{:catch error}
		<Alert message={error.message} level="error" heading="Fetching issuers failed." />
	{/await}
{/if}
