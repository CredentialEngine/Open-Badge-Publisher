<script lang="ts">
    import BadgeSource from "$lib/partials/BadgeSource.svelte"
    import ConfigurationStep from "$lib/components/ConfigurationStep.svelte"
    import NextPrevButton from "$lib/components/NextPrevButton.svelte"

    let registryApiKey = ''
</script>

<h1 class="mb-4 text-3xl font-extrabold text-gray-900 lg:text-4xl dark:text-white">Publish Badges to the Credential Registry Publisher</h1>
<p class="mb-4 text-lg font-normal text-gray-500 lg:text-lg dark:text-gray-400">This app will help you publish new and updated Open Badges in the leading educational credential trust registry.</p>
<p class="mb-4 text-lg font-normal text-gray-500 lg:text-lg dark:text-gray-400">Configure your badge source and Registry account to begin.</p>


<section id="registry-destination-configuration" class="mt-10">
    <h2 class="my-4 text-3xl font-extrabold tracking-tight leading-none text-gray-900 lg:text-4xl dark:text-white">Publisher Configuration</h2>

    <div aria-label="form" class="focus:outline-none w-full bg-white dark:bg-midnight p-10">
        <div class="md:flex items-center border-b pb-6 border-gray-200">
            <ConfigurationStep stepNumber='01' stepName="Connect to Registry" isActive={true} />
        </div>
    

        <div id="registrysetup-step4">
            <h3 aria-label="source type" class="focus:outline-none text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12">Connect your Publisher Account: </h3>

            <p class="focus:outline-none text-sm font-light leading-none text-gray-600 dark:text-white mt-0.5">API key</p>
            <div class="mt-8 md:flex items-center">
                <div class="flex flex-col">
                    <label for="input_registryapikey" class="mb-3 text-sm leading-none text-gray-800 dark:text-white">API Key</label>
                    <input id="input_registryapikey" type="password" autocomplete="off" aria-label="Enter first name" class="focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64 bg-gray-100 text-sm font-medium leading-none text-gray-800 p-3 border rounded border-gray-200" bind:value={registryApiKey} />
                </div>
            </div>

            <div class="mt-12">
                <div class="py-4 flex items-center">
                    <div class="bg-white dark:bg-gray-800 border rounded-sm border-gray-400 dark:border-gray-700 w-4 h-4 flex flex-shrink-0 justify-center items-center relative">
                        <input aria-labelledby="agree"  checked type="checkbox" class="focus:outline-none focus:ring-2 focus:ring-gray-700 checkbox focus:opacity-100 opacity-0 absolute cursor-pointer w-full h-full" />
                        <div class="check-icon hidden bg-blue-500 text-white rounded-sm">
                            <img src="https://tuk-cdn.s3.amazonaws.com/can-uploader/form_layout-svg1.svg" alt="check-icon">
                        </div>
                    </div>
                    <p id="agree" class="focus:outline-none text-sm leading-none ml-2">I agree with the <span class="text-indigo-700">terms of service</span></p>
                </div>
            </div>
            
            <div class="md:flex items-center border-b pb-6 border-gray-200">
                <NextPrevButton on:click={() => null} isNext={true} />
            </div>
        </div>

    </div>

    
</section>

<section id="badge-source-configuration" class="mt-12">
    <BadgeSource />
</section>

<section id="proofing" class="mt-10">
<h2 class="my-4 text-3xl font-extrabold tracking-tight leading-none text-gray-900 lg:text-4xl dark:text-white">Preview Data</h2>
<div aria-label="form" class="focus:outline-none w-full bg-white dark:bg-midnight p-10">
    <div class="md:flex items-center border-b pb-6 border-gray-200">
        <ConfigurationStep stepNumber='05' stepName="Preview Data" isActive={false} />
    </div>

    <div>
        <h3 aria-label="source type" class="focus:outline-none text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12">No data yet </h3>

        <p class="focus:outline-none text-sm font-light leading-none text-gray-600 dark:text-white mt-0.5">Connect your badge system to preview data and make final adjustments for publication.</p>
    </div>

</section>
