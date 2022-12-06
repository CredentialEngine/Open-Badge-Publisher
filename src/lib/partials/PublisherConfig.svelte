<script lang="ts">
	import { updated } from '$app/stores';
	import { onMount } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import * as yup from 'yup';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import {
		PUBLIC_UI_API_BASEURL,
		PUBLIC_PUBLISHER_API_BASEURL,
		PUBLIC_PUBLISHER_API_ENV_LABEL
	} from '$env/static/public';
	import {
		getUser,
		publisherUser,
		publisherCredentials,
		publisherOptions,
		publisherOrganization,
		setPublisherSelection,
		resetPublisherSelection,
		publisherSetupStep,
		updateOrgCredentials
	} from '$lib/stores/publisherStore.js';
	import BodyText from '$lib/components/typography/BodyText.svelte';

	let currentMessage = {
		level: 'info',
		heading: '',
		message: ''
	};
	const setAlert = (level: string, message: string, heading = '') =>
		(currentMessage = { level, message, heading });
	const resetAlert = () => (currentMessage = { level: 'info', message: '', heading: '' });

	let registryEmailAddress = '';
	let registryPassword = '';
	let registryAgreeTerms = false;
	const registryFormSchema = yup.object().shape({
		email: yup.string().email().required(),
		password: yup.string().required()
	});
	const submitRegistryForm = () => {
		if (!registryAgreeTerms) {
			setAlert('error', 'You must agree to the terms to proceed.', 'Terms of Service');
			return;
		}
		resetAlert();
		const formData = {
			email: registryEmailAddress,
			password: registryPassword
		};
		registryFormSchema
			.validate(formData)
			.catch((err) => {
				setAlert('error', String(err));
				return;
			})
			.then(async (valid) => {
				const url = `${PUBLIC_UI_API_BASEURL}/StagingApi/Login`;
				const response = await fetch(url, {
					method: 'POST',
					body: JSON.stringify(formData)
				});
				const responseData = await response.json();
				if (!responseData['Valid']) {
					setAlert('error', responseData['Messages'][0], 'Authentication error:');
					return;
				}

				// reset form and save user
				let registryEmailAddress = '';
				let registryPassword = '';
				let registryAgreeTerms = false;
				publisherUser.set({ user: responseData['Data'] });
			});
	};

	const publisherUrl = new URL(PUBLIC_PUBLISHER_API_BASEURL);
	const accountSettingsUrl = new URL('/accounts/Dashboard', publisherUrl.origin).href;
	let userPromise = new Promise((resolve, reject) => {}); // use await block to show loading spinner to start

	onMount(() => {
		userPromise = getUser();
		publisherSetupStep.set(1);
	});

	let selectedOrg = '';
	let credentialsLoading = new Promise((resolve, reject) => {}); // credentials list starts in loading state

	$: if (!!selectedOrg) {
		setPublisherSelection(selectedOrg);
	}

	const handlePreviewCredentials = () => {
		credentialsLoading = updateOrgCredentials(); // eventually resolves to true once loaded
		publisherSetupStep.set(3);
	};

	let panelIsHidden = false;
</script>

<Heading>
	<h2>
		{#if $publisherSetupStep == 3}☑ {/if}
		Publisher Configuration
	</h2>
</Heading>

{#if !panelIsHidden}
	<div
		id="publisherConfigContent"
		aria-label="form"
		class="focus:outline-none w-full bg-white dark:bg-midnight p-10"
		transition:slide
	>
		<div class="md:flex items-center border-b pb-6 border-gray-200">
			<ConfigurationStep
				stepNumber="1"
				stepName="Connect Account"
				isActive={$publisherSetupStep <= 1}
			/>
			<ConfigurationStep
				stepNumber="2"
				stepName="Choose Organization"
				isActive={$publisherSetupStep == 2}
			/>
			<ConfigurationStep
				stepNumber="3"
				stepName="Organization Details"
				isActive={$publisherSetupStep == 3}
			/>
		</div>

		<!-- STEP 0: Automated checking if the user is already authenticated -->
		{#if $publisherSetupStep == 0}
			<div id="publishersetup-step0" transition:fade={{ duration: 400 }}>
				<Heading><h3>Connect your Publisher Account</h3></Heading>
				<div class="mt-2">
					<LoadingSpinner />
				</div>
				<div class="md:flex items-center border-b pb-6 border-gray-200">
					<NextPrevButton on:click={() => null} isNext={true} isActive={false} />
				</div>
			</div>

			<!-- STEP 1: Show connected account data or allow user to connect account -->
		{:else if $publisherSetupStep == 1}
			<div id="registrysetup-step1" in:fade={{ duration: 200, delay: 401 }} out:fly={{ x: -400 }}>
				{#if !$publisherUser.user}
					<!-- auto-loading the user not possible, but they can authenticate manually -->
					<Heading><h3>Connect your Publisher Account</h3></Heading>
					<BodyText>
						Connect to the
						<a
							href={PUBLIC_PUBLISHER_API_BASEURL}
							class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
						>
							Credential Engine Publisher {PUBLIC_PUBLISHER_API_ENV_LABEL}
						</a>
						({publisherUrl.hostname}).
					</BodyText>

					<div class="mt-8 md:flex items-center">
						<div class="flex flex-col">
							<label
								for="input_registryemail"
								class="mb-3 text-sm leading-none text-gray-800 dark:text-white">Email</label
							>
							<input
								id="input_registryemail"
								type="email"
								aria-label="Enter publisher account email"
								class="focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64 bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200"
								bind:value={registryEmailAddress}
							/>
						</div>
					</div>
					<div class="mt-8 md:flex items-center">
						<div class="flex flex-col">
							<label
								for="input_registrypassword"
								class="mb-3 text-sm leading-none text-gray-800 dark:text-white">Password</label
							>
							<input
								id="input_registrypassword"
								type="password"
								aria-label="Enter publisher account password"
								class="focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64 bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200"
								bind:value={registryPassword}
							/>
						</div>
					</div>

					<div class="mt-8">
						<div class="py-4 flex items-center">
							<input
								bind:checked={registryAgreeTerms}
								id="registryAgreeTerms"
								type="checkbox"
								value=""
								class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
							/>
							<label
								for="registryAgreeTerms"
								class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
								>I agree with the Credential Engine <a
									href="http://credentialengine.org/terms/"
									class="text-indigo-700 dark:text-superaqua">terms of service</a
								>
							</label>
						</div>
					</div>

					{#if currentMessage.message}
						<Alert
							level={currentMessage.level}
							message={currentMessage.message}
							heading={currentMessage.heading}
						/>
					{/if}

					<div class="md:flex items-center border-b pb-6 border-gray-200">
						<NextPrevButton on:click={submitRegistryForm} isNext={true} isActive={true} />
					</div>
				{:else}
					<!-- User is authenticated -->
					<Heading><h3>Authenticated User</h3></Heading>
					<BodyText>
						Your API Key will be used to interact with the publisher and upload credentials.
					</BodyText>

					<Heading><h4>{$publisherUser.user.Name}</h4></Heading>

					<BodyText>
						{$publisherUser.user.Email}
						{#if $publisherUser.user.IsSiteStaff}(staff){/if}
					</BodyText>
					{#if $publisherUser.user.Organizations?.length}
						<BodyText>
							{$publisherUser.user.Organizations.length}
							{$publisherUser.user.Organizations.length !== 1 ? 'Organizations' : 'Organization'}:
							<span class="font-bold"
								>{$publisherUser.user.Organizations.map((o) => o.Name).join(', ')}</span
							>
						</BodyText>
					{/if}

					<div class="md:flex items-center border-b pb-6 border-gray-200">
						<NextPrevButton
							on:click={() => publisherUser.set({})}
							isNext={false}
							isActive={true}
							label="Reset User"
						/>
						<NextPrevButton
							on:click={() => publisherSetupStep.set(2)}
							isNext={true}
							isActive={true}
						/>
					</div>
				{/if}
			</div>

			<!-- STEP 2: Choose which of a user's organizations to use -->
		{:else if $publisherSetupStep == 2}
			<div id="registrysetup-step2" in:fade={{ duration: 200, delay: 401 }} out:fly={{ x: -400 }}>
				<Heading><h3>Choose Organization</h3></Heading>
				<BodyText>
					Credentials will be saved to this organization in the Publisher, where you can finalize
					them.
				</BodyText>

				{#if $publisherUser.user?.Organizations?.length}
					{#each $publisherUser.user?.Organizations as org}
						<div class="flex items-center mb-4">
							<input
								id={`orgSelect-${org.CTID}`}
								type="radio"
								bind:group={selectedOrg}
								value={org.CTID}
								class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
							/>
							<label
								for={`orgSelect-${org.CTID}`}
								class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
							>
								{org.Name} ({org.CTID})
							</label>
						</div>
					{/each}
				{/if}

				<div class="md:flex items-center border-b pb-6 border-gray-200">
					<NextPrevButton on:click={() => publisherSetupStep.set(1)} isNext={false} />
					<NextPrevButton
						on:click={() => handlePreviewCredentials()}
						isNext={true}
						isActive={!!selectedOrg}
					/>
				</div>
			</div>

			<!-- Preview Org Data and Credentials -->
		{:else if $publisherSetupStep == 3}
			<div id="registrysetup-step3" in:fade={{ duration: 200, delay: 401 }} out:fly={{ x: -400 }}>
				<Heading><h3>Selected Organization</h3></Heading>
				<BodyText>
					Credentials will be saved to this organization in the publisher, where you can finalize
					them.
				</BodyText>

				<Heading><h4>{$publisherOrganization.org?.Name}</h4></Heading>
				<BodyText>
					{$publisherOrganization.org?.CTID}
				</BodyText>

				<Heading><h4>Credentials ({$publisherCredentials.credentials.length})</h4></Heading>
				{#await credentialsLoading}
					<div class="mt-2">
						<LoadingSpinner />
					</div>
				{:then value}
					<ul class="mt-6 md:grid gap-6 w-full grid-cols-2 xl:grid-cols-3">
						{#each $publisherCredentials.credentials.slice(0, 9) as credential}
							<li class="mb-2 md:md-0 border border-gray-200 dark:border-gray-700 p-2">
								<BodyText>
									<a
										href={`${PUBLIC_PUBLISHER_API_BASEURL}/credential/${credential.Id}`}
										target="new"
										class="font-bold text-blue-600 dark:text-blue-500 hover:underline"
										>{credential.Name}</a
									>
									({credential.CTID})
									<br />
									{credential.Description}
								</BodyText>
							</li>
						{/each}
					</ul>
					{#if $publisherCredentials.credentials.length > 9}
						<BodyText>({$publisherCredentials.credentials.length - 9} more)</BodyText>
					{/if}
				{/await}

				<div class="md:flex items-center border-b pb-6 border-gray-200">
					<NextPrevButton
						on:click={() => {
							resetPublisherSelection();
							publisherSetupStep.set(2);
						}}
						isNext={false}
					/>
					<NextPrevButton
						on:click={() => {
							panelIsHidden = true;
						}}
						isNext={true}
						isActive={!!selectedOrg}
						label="Finish Publisher Setup"
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
		class="focus:outline-none w-full bg-white dark:bg-midnight p-10"
		transition:slide
	>
		<div class="flex items-end flex-col justify-between md:flex-row">
			<BodyText>
				Publisher setup complete. <br />
				<span class="font-bold">Selected Organization:</span>
				{$publisherOrganization.org?.Name} ({$publisherCredentials.credentials.length}
				{$publisherCredentials.credentials.length == 1 ? 'credential' : 'credentials'})
			</BodyText>
			<button
				type="button"
				class="text-gray-900 text-sm px-5 py-2.5 ml-3 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 focus:outline-none dark:focus:ring-gray-700"
				on:click={() => {
					panelIsHidden = false;
				}}
			>
				Edit
			</button>
		</div>
	</div>
{/if}

<style lang="postcss">
	#publisherConfigContent {
		/* TODO make this work, maybe use an absolute height -- doesn't work on auto height elements */
		transition: max-height 6.8s ease-in-out;
	}
</style>
