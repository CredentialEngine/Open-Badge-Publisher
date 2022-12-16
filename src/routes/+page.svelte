<script lang="ts">
	import { error } from '@sveltejs/kit';
	import PublisherConfig from '$lib/partials/PublisherConfig.svelte';
	import BadgeSourceConfig from '$lib/partials/BadgeSourceConfig.svelte';
	import DataProofing from '$lib/partials/DataProofing.svelte';

	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';

	import BodyText from '$lib/components/typography/BodyText.svelte';

	import {
		PUBLIC_UI_API_BASEURL,
		PUBLIC_PUBLISHER_API_BASEURL,
		PUBLIC_PUBLISHER_API_ENV_LABEL
	} from '$env/static/public';

	if (!PUBLIC_UI_API_BASEURL || !PUBLIC_PUBLISHER_API_BASEURL || !PUBLIC_PUBLISHER_API_ENV_LABEL)
		throw error(404, {
			message:
				'Application environment settings not properly configured. Follow instructions on setting up the .env'
		});
</script>

<BodyText>
	This app can help publish new and updated Open Badges to the Credential Registry. After importing
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
	<DataProofing />
</section>
