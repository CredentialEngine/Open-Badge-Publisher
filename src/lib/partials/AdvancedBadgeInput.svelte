<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Tag from '$lib/components/Tag.svelte';

	let inputValue = '';
	let errors: Array<{ [key: string]: string }> = [];

	const validate = () => {
		let value: unknown;
		errors = [];
		try {
			value = JSON.parse(inputValue);
		} catch {
			errors = [
				{ 'JSON Parse Error': 'Could not parse data as JSON. Edit your entry and try again.' }
			];
		}
	};
</script>

<Heading
	><h3>Input Badges manually <Tag class="bg-superaqua text-midnight">Advanced</Tag></h3>
</Heading>

<BodyText>
	Paste an individual badge or an array of multiple badges as JSON data from any platform in OB 2.0
	or 3.0 format. Most badge configuration options are supported. The data should match the 2.0
	format of a <a
		href="https://openbadgespec.org/#BadgeClass"
		target="new"
		class="text-midnight underline hover:no-underline">BadgeClass</a
	>
	or the 3.0 format of an
	<a
		href="https://1edtech.github.io/openbadges-specification/ob_v3p0.html#achievement"
		target="new"
		class="text-midnight underline hover:no-underline">Achievement</a
	>.
</BodyText>

<textarea
	id="advancedJsonInput"
	rows="12"
	class="block p-2.5 my-4 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
	class:border-red-500={errors.length > 0}
	bind:value={inputValue}
/>
<Button buttonType="primary" on:click={validate}>Import</Button>

<div class="my-4">
	{#each errors as errorsForBadge, i}
		<Alert level="error" heading={errors.length == 1 ? 'Error' : `Errors for badge ${i + 1}`}>
			<span slot="detail">
				{#each Object.entries(errorsForBadge) as entry}
					<br /><span class="font-medium">{entry[0]}:</span> <span>{entry[1]}</span>
				{/each}
			</span>
		</Alert>
	{/each}
</div>
