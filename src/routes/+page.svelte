<script lang="ts">
	import { error } from '@sveltejs/kit';
	import { slide } from 'svelte/transition';
	import PublisherConfig from '$lib/partials/PublisherConfig.svelte';
	import BadgeSourceConfig from '$lib/partials/BadgeSourceConfig.svelte';
	import DataProofing from '$lib/partials/DataProofing.svelte';
	import Reviewing from '$lib/partials/Reviewing.svelte';

	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';

	import {
		PUBLIC_UI_API_BASEURL,
		PUBLIC_PUBLISHER_API_BASEURL,
		PUBLIC_PUBLISHER_API_ENV_LABEL
	} from '$env/static/public';
	import { publisherOrganization, reviewingStep } from '$lib/stores/publisherStore.js';
	import { processLoginResponse } from '$lib/auth/oauth.js';
	import Heading from '$lib/components/typography/Heading.svelte';
	import { onMount } from 'svelte';

	if (!PUBLIC_UI_API_BASEURL || !PUBLIC_PUBLISHER_API_BASEURL || !PUBLIC_PUBLISHER_API_ENV_LABEL)
		throw error(404, {
			message:
				'Application environment settings not properly configured. Follow instructions on setting up the .env'
		});

	onMount(async () => {
		if (window.location.search.includes('code=')) processLoginResponse();
	});
</script>

<BodyText>
	This app can help publish new and updated Open Badges to the Credential Registry. After importing
	your badges here and pushing them to the Publisher, you can continue in the Publisher to approve
	final publication to the Registry.
</BodyText>

<section id="publisher-destination-configuration" class="mt-8">
	<PublisherConfig />
</section>

<section id="badge-source-configuration" class="mt-12">
	<BadgeSourceConfig />
</section>

<section id="proofing" class="mt-10">
	<DataProofing />
</section>

<section id="reviewing" class="mt-10">
	<Reviewing />
</section>

{#if $reviewingStep > 0}
	<section id="reviewing" class="mt-10">
		<div id="allDone" class="focus:outline-none w-full bg-white p-4 sm:p-10" transition:slide>
			<div class="flex items-center md:items-end flex-col justify-between md:flex-row">
				<div>
					<Heading><h3>Badge import complete.</h3></Heading>
					<BodyText
						>Selected badges have been saved to the publisher. Your organization admin can now
						approve them for final publication to the Credential Registry.</BodyText
					>
				</div>
				<div>
					<a
						href={`${PUBLIC_PUBLISHER_API_BASEURL}/summary/organization/${$publisherOrganization.org?.Id}`}
						target="new"
						class="mt-4 focus:ring-4 focus:outline-none rounded text-center font-medium px-5 py-2 focus:ring-midnight-600 border border-midnight text-white bg-midnight hover:bg-midnight-700"
					>
						Continue in Publisher
					</a>
				</div>
			</div>
		</div>
	</section>
{/if}
