<script lang="ts">
    import PublisherConfig from "$lib/partials/PublisherConfig.svelte"
    import BadgeSourceConfig from "$lib/partials/BadgeSourceConfig.svelte"
    import ConfigurationStep from "$lib/components/ConfigurationStep.svelte"
    import NextPrevButton from "$lib/components/NextPrevButton.svelte"
</script>

<h1 class="mb-4 text-3xl font-extrabold text-gray-900 lg:text-4xl dark:text-white">
    Publish Badges to the Credential Registry Publisher
</h1>
<p class="mb-4 text-lg font-normal text-gray-500 lg:text-lg dark:text-gray-400">
    This app will help you publish new and updated Open Badges in the leading educational credential trust registry.
</p>
<p class="mb-4 text-lg font-normal text-gray-500 lg:text-lg dark:text-gray-400">
    Configure your Registry Publisher account and badge data source to begin. Once you upload the tools to the Publisher, you can finalize publication to the Registry there.
</p>


<section id="publisher-destination-configuration" class="mt-8">
    <PublisherConfig />
</section>

<section id="badge-source-configuration" class="mt-12">
    <BadgeSourceConfig />
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
