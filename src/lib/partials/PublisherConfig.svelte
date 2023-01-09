<script lang="ts">
	import { updated } from '$app/stores';
	import { onMount, tick } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import * as yup from 'yup';
	import Button from '$lib/components/Button.svelte';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import Modal from '$lib/components/Modal.svelte';
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
		getOrgCredentialList
	} from '$lib/stores/publisherStore.js';
	import { badgeSetupStep, resetBadgeData } from '$lib/stores/badgeSourceStore.js';
	import abbreviate from '$lib/utils/abbreviate.js';
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
	let userIsLoading = false;
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
				userIsLoading = true;
				const url = `${PUBLIC_UI_API_BASEURL}/StagingApi/Login`;
				const response = await fetch(url, {
					method: 'POST',
					body: JSON.stringify(formData),
					headers: {
						'Content-Type': 'application/json'
					}
				});
				const responseData = await response.json();
				if (!responseData['Valid']) {
					let errorMessage: string;
					try {
						errorMessage = responseData.Messages[0] || responseData.message;
					} catch {
						errorMessage = 'Unexpected server error!';
					}

					setAlert('error', errorMessage, 'Authentication error:');
					userIsLoading = false;
					return;
				}

				// reset form and save user
				registryEmailAddress = '';
				registryPassword = '';
				registryAgreeTerms = false;
				publisherUser.set({ user: responseData['Data'] });
				userIsLoading = false;
				$publisherSetupStep = 2;
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
		credentialsLoading = getOrgCredentialList(); // eventually resolves to true once loaded
		publisherSetupStep.set(3);
	};

	let modalVisible = false;
	let panelIsHidden = false;

	const handleReopenPanel = async () => {
		panelIsHidden = false;
		modalVisible = false;
		$publisherSetupStep = 3;
		resetBadgeData();
		await tick();
		document.getElementById('publisher-destination-configuration')?.scrollIntoView();
	};
</script>

<Heading>
	<h2>
		{#if panelIsHidden}☑{/if}
		Publisher Configuration
	</h2>
</Heading>

{#if !panelIsHidden}
	<div
		id="publisherConfigContent"
		aria-label="form"
		class="focus:outline-none w-full bg-white p-10"
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
			<div id="publishersetup-step0" transition:slide>
				<Heading><h3>Connect your Publisher Account</h3></Heading>
				<BodyText gray={true}
					>Checking to see if your publisher account is already connected.</BodyText
				>

				<div class="my-4 flex flex-col items-center justify-center w-full h-48">
					<LoadingSpinner />
				</div>
			</div>

			<!-- STEP 1: Show connected account data or allow user to connect account -->
		{:else if $publisherSetupStep == 1}
			<div id="registrysetup-step1" in:slide out:fly={{ x: -400 }}>
				{#if !$publisherUser.user && !userIsLoading}
					<!-- auto-loading the user not possible, but they can authenticate manually -->
					<Heading><h3>Connect your Publisher Account</h3></Heading>
					<BodyText gray={true}>
						Connect to the
						<a
							href={PUBLIC_PUBLISHER_API_BASEURL}
							class="font-medium text-midnight underline hover:no-underline"
						>
							Credential Engine Publisher {PUBLIC_PUBLISHER_API_ENV_LABEL}
						</a>
						({publisherUrl.hostname}).
					</BodyText>

					<div class="mt-8 md:flex items-center">
						<div class="flex flex-col">
							<label for="input_registryemail" class="mb-3 text-sm leading-none text-gray-800"
								>Email</label
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
							<label for="input_registrypassword" class="mb-3 text-sm leading-none text-gray-800"
								>Password</label
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
								class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
							/>
							<label for="registryAgreeTerms" class="ml-2 text-sm font-medium text-gray-900"
								>I agree with the Credential Engine <a
									href="http://credentialengine.org/terms/"
									class="text-midnight underline hover:no-underline">terms of service</a
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

					<div class="mt-8 sm:flex flex-row items-center pb-6 sm:space-x-4">
						<NextPrevButton on:click={submitRegistryForm} isNext={true} isActive={true} />
					</div>
				{:else if userIsLoading}
					<div class="my-4 flex flex-col items-center justify-center w-full h-40">
						<LoadingSpinner />
					</div>
				{:else if !!$publisherUser.user}
					<!-- User is authenticated -->
					<Heading><h3>Authenticated User</h3></Heading>
					<BodyText gray={true}>
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

					<div class="mt-8 sm:flex flex-row items-center pb-6 sm:space-x-4">
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
				<BodyText gray={true}>
					Credentials will be saved to this organization in the Publisher, where you can finalize
					them.
				</BodyText>

				{#if $publisherUser.user?.Organizations?.length}
					{#each $publisherUser.user?.Organizations.sort( (a, b) => a.Name.localeCompare(b.Name) ) as org}
						<div class="flex items-center mb-4">
							<input
								id={`orgSelect-${org.CTID}`}
								type="radio"
								bind:group={selectedOrg}
								value={org.CTID}
								class="w-4 h-4 text-tahiti bg-gray-100 border-gray-300 focus:ring-tahiti focus:ring-2"
							/>
							<label for={`orgSelect-${org.CTID}`} class="ml-2 text-sm font-medium text-gray-900">
								{org.Name} ({org.CTID})
							</label>
						</div>
					{/each}
				{/if}

				<div class="mt-8 sm:flex flex-row items-center pb-6 sm:space-x-4">
					<NextPrevButton on:click={() => publisherSetupStep.set(1)} isNext={false} />
					<NextPrevButton
						on:click={() => handlePreviewCredentials()}
						isNext={true}
						isActive={selectedOrg != ''}
					/>
				</div>
			</div>

			<!-- Preview Org Data and Credentials -->
		{:else if $publisherSetupStep == 3}
			<div id="registrysetup-step3" in:fade={{ duration: 200, delay: 401 }} out:fly={{ x: -400 }}>
				<Heading><h3>Selected Organization</h3></Heading>
				<BodyText gray={true}>
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
					<BodyText gray={true}>
						Successfully loaded existing credentials and drafts from Publisher. A preview of this
						data is shown below, to ensure you have selected the right organization.
					</BodyText>
					<ul class="mt-6 md:grid gap-6 w-full grid-cols-2 xl:grid-cols-3">
						{#each $publisherCredentials.credentials.slice(0, 9) as credential}
							<li class="mb-2 md:md-0 border border-gray-200 p-2">
								<BodyText>
									<a
										href={`${PUBLIC_PUBLISHER_API_BASEURL}/credential/${credential.Id}`}
										target="new"
										class="font-bold text-midnight underline hover:no-underline"
										>{credential.Name}</a
									>
									<br />
									({credential.CTID})
								</BodyText>
								<BodyText gray={true}>
									{abbreviate(credential.Description)}
								</BodyText>
							</li>
						{/each}
					</ul>
					{#if $publisherCredentials.credentials.length > 9}
						<BodyText>({$publisherCredentials.credentials.length - 9} more)</BodyText>
					{/if}
				{/await}

				<div class="mt-8 sm:flex flex-row items-center pb-6 sm:space-x-4">
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
							$publisherSetupStep = 4;
							if ($badgeSetupStep == 0) $badgeSetupStep = 1;
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
		class="focus:outline-none w-full bg-white p-10"
		transition:slide
	>
		<div class="flex items-center md:items-end flex-col justify-between md:flex-row">
			<BodyText>
				Publisher setup complete. <br />
				<span class="font-bold">Selected Organization:</span>
				{$publisherOrganization.org?.Name} ({$publisherCredentials.credentials.length}
				{$publisherCredentials.credentials.length == 1 ? 'credential' : 'credentials'})
			</BodyText>
			<Button
				buttonType="default"
				on:click={() => {
					modalVisible = true;
				}}
			>
				Edit
			</Button>
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
		<BodyText>If you change your publisher settings, any loaded badge data will be reset.</BodyText>
	</Modal>
{/if}

<style lang="postcss">
	#publisherConfigContent {
		/* TODO make this work, maybe use an absolute height -- doesn't work on auto height elements */
		transition: max-height 6.8s ease-in-out;
	}
</style>
