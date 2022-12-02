<script lang="ts">
	import PublisherConfig from '$lib/partials/PublisherConfig.svelte';
	import BadgeSourceConfig from '$lib/partials/BadgeSourceConfig.svelte';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';

	import BodyText from '$lib/components/typography/BodyText.svelte';
</script>

<BodyText>
	This app can helps publish new and updated Open Badges to the Credential Registry. After importing
	your badges here and pushing them to the Publisher, you can continue in the Publisher to approve
	finalize publication to the Registry.
</BodyText>

<section id="publisher-destination-configuration" class="mt-8">
	<PublisherConfig />
</section>

<section id="badge-source-configuration" class="mt-12">
	<BadgeSourceConfig />
</section>

<section id="proofing" class="mt-10">
	<h2
		class="my-4 text-3xl lg:text-4xl font-extrabold tracking-tight leading-none text-darkestgray dark:text-lightgray"
	>
		Preview Data
	</h2>
	<div aria-label="form" class="focus:outline-none w-full bg-white dark:bg-midnight p-10">
		<div class="md:flex items-center border-b pb-6 border-gray-200">
			<ConfigurationStep stepNumber="5" stepName="Preview Data" isActive={false} />
		</div>

		<div>
			<h3
				aria-label="source type"
				class="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-12"
			>
				No data yet
			</h3>

			<BodyText>
				Connect your badge system to preview data and make final adjustments for publication.
			</BodyText>
		</div>
	</div>
</section>
