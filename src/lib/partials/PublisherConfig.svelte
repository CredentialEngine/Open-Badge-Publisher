<script lang="ts">
    import { updated } from "$app/stores"
    import { onMount } from 'svelte'
    import { fade, fly, slide } from 'svelte/transition'
    import { flip } from 'svelte/animate'
    import * as yup from 'yup'
    import ConfigurationStep from "$lib/components/ConfigurationStep.svelte"
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte"
    import NextPrevButton from "$lib/components/NextPrevButton.svelte"
    import Alert from "$lib/components/Alert.svelte"
    import { PUBLIC_UI_API_BASEURL, PUBLIC_PUBLISHER_API_BASEURL, PUBLIC_PUBLISHER_API_ENV_LABEL } from '$env/static/public'
    import { 
        getUser, publisherUser, publisherCredentials, publisherOptions, publisherOrganization,
        setPublisherSelection, resetPublisherSelection, publisherSetupStep, updateOrgCredentials
    } from '$lib/stores/publisherStore.js'

    let currentMessage = {
        level: 'info', 
        heading: '',
        message: ''
    }
    const setAlert = (level:string, message:string, heading='') => currentMessage = {level, message, heading }
    const resetAlert = () => currentMessage = {level: 'info', message: '', heading: ''}

    let registryApiKey = ''
    let registryEmailAddress = ''
    let registryPassword = ''
    let registryAgreeTerms = false
    const registryFormSchema = yup.object().shape({
        apiKey: yup.string().required(),
        email: yup.string().email().required(),
        password: yup.string().required()
    })
    const submitRegistryForm = () => {
        if (!registryAgreeTerms) {
            setAlert('error', 'You must agree to the terms to proceed.', 'Terms of Service')
            return
        }
        resetAlert()
        const formData = {
            apiKey: registryApiKey,
            email: registryEmailAddress,
            password: registryPassword
        }
        registryFormSchema.validate(formData).catch((err) => {
            setAlert('error', String(err))
            return
        }).then(async (valid) => {
            const url = `${PUBLIC_UI_API_BASEURL}/StagingApi/Login`
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            const responseData = await response.json()
            if (!responseData['Valid']) {
                setAlert('error', responseData["Messages"][0], 'Authentication error:')
                return
            }

            // reset form and save user
            let registryApiKey = ''
            let registryEmailAddress = ''
            let registryPassword = ''
            let registryAgreeTerms = false
            publisherUser.set({user: responseData['Data']})
        })
    }

    const publisherUrl = new URL(PUBLIC_PUBLISHER_API_BASEURL)
    const accountSettingsUrl = new URL('/accounts/Dashboard', publisherUrl.origin).href
    let userPromise = new Promise((resolve, reject) => {}) // use await block to show loading spinner to start

    onMount(() => {
        userPromise = getUser()
        publisherSetupStep.set(1)
    })

    let selectedOrg = ''
    let credentialsLoading = new Promise((resolve, reject) => {}) // credentials list starts in loading state
    
    $: if (!!selectedOrg) { 
        setPublisherSelection(selectedOrg)
    }

    const handlePreviewCredentials = () => {
        credentialsLoading = updateOrgCredentials() // eventually resolves to true once loaded
        publisherSetupStep.set(3)
    }
    
</script>

<h2 class="my-4 text-3xl font-extrabold tracking-tight leading-none text-gray-900 lg:text-4xl dark:text-white">Publisher Configuration</h2>

<div id="publisherConfigContent" aria-label="form" class="focus:outline-none w-full bg-white dark:bg-midnight p-10">
    <div class="md:flex items-center border-b pb-6 border-gray-200">
        <ConfigurationStep stepNumber='01' stepName="Connect Account" isActive={$publisherSetupStep<=1} />
        <ConfigurationStep stepNumber='02' stepName="Choose Organization" isActive={$publisherSetupStep==2} />
        <ConfigurationStep stepNumber='03' stepName="Organization Details" isActive={$publisherSetupStep==3} />
    </div>

    <!-- STEP 0: Automated checking if the user is already authenticated -->
    {#if $publisherSetupStep==0}
    <div id="publishersetup-step0" transition:fade="{{ duration: 400 }}">
        <h3 aria-label="source type" class="focus:outline-none text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12">Connect your Publisher Account: </h3>
        <div class="mt-2">
            <LoadingSpinner />
        </div>
        <div class="md:flex items-center border-b pb-6 border-gray-200">
            <NextPrevButton on:click={() => null} isNext={true} isActive={false} />
        </div>
    </div>

    <!-- STEP 1: Show connected account data or allow user to connect account -->
    {:else if $publisherSetupStep==1}
    <div id="registrysetup-step1" in:fade="{{ duration: 200, delay: 401 }}" out:fly="{{ x: -400 }}">

        {#if !$publisherUser.user }
            <!-- auto-loading the user not possible, but they can authenticate manually -->
            <h3 aria-label="source type" class="focus:outline-none text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12">Connect your Publisher Account: </h3>

            <p class="focus:outline-none text-sm font-light leading-none text-gray-600 dark:text-white mt-2">
                Connect to the 
                <a href="{PUBLIC_PUBLISHER_API_BASEURL}" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                    Credential Engine Publisher {PUBLIC_PUBLISHER_API_ENV_LABEL}
                </a> ({publisherUrl.hostname}).
            </p>
            <p class="focus:outline-none text-sm font-light leading-none text-gray-600 dark:text-white mt-2">
                Authenticate with the publisher using the organization API key in your 
                <a href="{accountSettingsUrl}" class="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="new">
                    Account Settings
                </a>
                ({publisherUrl.hostname}) and your email and password.
            </p>
            <div class="mt-8 md:flex items-center">
                <div class="flex flex-col">
                    <label for="input_registryapikey" class="mb-3 text-sm leading-none text-gray-800 dark:text-white">Organization API Key</label>
                    <input id="input_registryapikey" type="password" autocomplete="off" aria-label="Enter Organization API Key" class="focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64 bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200" bind:value={registryApiKey} />
                </div>
            </div>
            <div class="mt-8 md:flex items-center">
                <div class="flex flex-col">
                    <label for="input_registryemail" class="mb-3 text-sm leading-none text-gray-800 dark:text-white">Email</label>
                    <input id="input_registryemail" type="email" aria-label="Enter publisher account email" class="focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64 bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200" bind:value={registryEmailAddress} />
                </div>
            </div>
            <div class="mt-8 md:flex items-center">
                <div class="flex flex-col">
                    <label for="input_registrypassword" class="mb-3 text-sm leading-none text-gray-800 dark:text-white">Password</label>
                    <input id="input_registrypassword" type="password" aria-label="Enter publisher account password" class="focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64 bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200" bind:value={registryPassword} />
                </div>
            </div>

            <div class="mt-8">
                <div class="py-4 flex items-center">
                    <div class="bg-white dark:bg-gray-800 border rounded-sm border-gray-400 dark:border-gray-700 w-4 h-4 flex flex-shrink-0 justify-center items-center relative">
                        <input aria-labelledby="agree" bind:checked={registryAgreeTerms} type="checkbox" class="focus:outline-none focus:ring-2 focus:ring-gray-700 checkbox focus:opacity-100 opacity-0 absolute cursor-pointer w-full h-full" />
                        <div class="check-icon hidden bg-blue-500 text-white rounded-sm">
                            <img src="https://tuk-cdn.s3.amazonaws.com/can-uploader/form_layout-svg1.svg" alt="check-icon">
                        </div>
                    </div>
                    <p id="agree" class="focus:outline-none text-sm leading-none ml-2">I agree with the <a href="http://credentialengine.org/terms/" class="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="new">terms of service</a></p>
                </div>
            </div>

            {#if currentMessage.message}
                <Alert level={currentMessage.level} message={currentMessage.message} heading={currentMessage.heading} />
            {/if}

            <div class="md:flex items-center border-b pb-6 border-gray-200">
                <NextPrevButton on:click={submitRegistryForm} isNext={true} isActive={true} />
            </div>
        {:else}
            <!-- User is authenticated -->
            <h3 aria-label="source type" class="focus:outline-none text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12">Authenticated User: </h3>
            <p class="focus:outline-none text-sm font-light leading-tight text-gray-600 dark:text-gray-400 mt-4">Your API Key will be used to interact with the publisher and upload credentials.</p>

            <h4 aria-label="source type" class="focus:outline-none text-xl font-bold text-gray-800 dark:text-gray-100 mt-12">
                {$publisherUser.user.Name}
            </h4>
            <p class="focus:outline-none text-sm font-light leading-tight text-gray-600 dark:text-gray-400 mt-4">
                {$publisherUser.user.Email} {#if $publisherUser.user.IsSiteStaff}(staff){/if}
            </p>
            {#if $publisherUser.user.Organizations?.length}
                <p class="focus:outline-none text-sm font-light leading-tight text-gray-600 dark:text-gray-400 mt-4">
                    {$publisherUser.user.Organizations.length} {$publisherUser.user.Organizations.length !== 1 ? 'Organizations' : 'Organization'}:
                    {$publisherUser.user.Organizations.map((o) => o.Name).join(', ')}
                </p>
            {/if}

            <div class="md:flex items-center border-b pb-6 border-gray-200">
                <NextPrevButton on:click={() => publisherUser.set({})} isNext={false} isActive={true} label="Reset User" />
                <NextPrevButton on:click={() => publisherSetupStep.set(2)} isNext={true} isActive={true} />
            </div>
        {/if}
        
    </div>

    <!-- STEP 2: Choose which of a user's organizations to use -->
    {:else if $publisherSetupStep==2}
    <div id="registrysetup-step2" in:fade="{{ duration: 200, delay: 401 }}" out:fly="{{ x: -400 }}">
        <h3 aria-label="source type" class="focus:outline-none text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12">Choose Organization: </h3>
        <p class="focus:outline-none text-sm font-light leading-tight text-gray-600 dark:text-gray-400 mt-4">Credentials will be saved to this organization in the publisher, where you can finalize them.</p>

        {#if $publisherUser.user?.Organizations?.length}
            {#each $publisherUser.user?.Organizations as org}
                <div class="flex items-center mb-4">
                    <input id={`orgSelect-${org.CTID}`} type="radio" bind:group={selectedOrg} value={org.CTID} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                    <label for={`orgSelect-${org.CTID}`} class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                        {org.Name} ({org.CTID})
                    </label>
                </div>
            {/each}
        {/if}

        <div class="md:flex items-center border-b pb-6 border-gray-200">
            <NextPrevButton on:click={() => publisherSetupStep.set(1)} isNext={false} />
            <NextPrevButton on:click={() => handlePreviewCredentials()} isNext={true} isActive={!!selectedOrg} />
        </div>
    </div>

    <!-- Preview Org Data and Credentials -->
    {:else if $publisherSetupStep==3}
    <div id="registrysetup-step3" in:fade="{{ duration: 200, delay: 401 }}" out:fly="{{ x: -400 }}">
        <h3 aria-label="source type" class="focus:outline-none text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12">Selected Organization: </h3>
        <p class="focus:outline-none text-sm font-light leading-tight text-gray-600 dark:text-gray-400 mt-4">Credentials will be saved to this organization in the publisher, where you can finalize them.</p>

        <h4 aria-label="source type" class="focus:outline-none text-xl font-bold text-gray-800 dark:text-gray-100 mt-12">{$publisherOrganization.org?.Name}</h4>
        <p class="focus:outline-none text-sm font-light leading-tight text-gray-600 dark:text-gray-400 mt-4">{$publisherOrganization.org?.CTID}</p>

        <h4 aria-label="source type" class="focus:outline-none text-xl font-bold text-gray-800 dark:text-gray-100 mt-12">Credentials</h4>
        {#await credentialsLoading}
            <div class="mt-2">
                <LoadingSpinner />
            </div>
        {:then value} 
            <ul class="space-y-1 max-w-md list-disc list-inside text-gray-500 dark:text-gray-400">
            {#each $publisherCredentials.credentials as credential}
                <li>
                    <span class="text-sm font-light text-gray-500 dark:text-gray-400">
                        <a href={`${PUBLIC_PUBLISHER_API_BASEURL}/credential/${credential.Id}`} target="new" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">{credential.Name}</a> ({credential.CTID})
                    </span><br />
                    <span class="text-sm font-light text-gray-500 dark:text-gray-400">{credential.Description}</span>
                </li>
            {/each}
            </ul>
        {/await}

        <div class="md:flex items-center border-b pb-6 border-gray-200">
            <NextPrevButton on:click={ () => {resetPublisherSelection(); publisherSetupStep.set(2);} } isNext={false} />
        </div>
    </div>
    {/if}

</div>

<style lang="postcss">
    #publisherConfigContent {
        /* TODO make this work, maybe use an absolute height -- doesn't work on auto height elements */
        transition: max-height 6.8s ease-in-out; 
    }
</style>