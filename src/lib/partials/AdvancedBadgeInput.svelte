<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import { validateSingleBadge, type BadgeClassBasic } from '$lib/utils/badges.js';
	import { error } from '@sveltejs/kit';
	import { advancedBadges, advancedBadgesFound } from '$lib/stores/badgeSourceStore.js';
	import abbreviate from '$lib/utils/abbreviate.js';
	import { pluralize } from '$lib/utils/pluralize.js';
	import * as yup from 'yup';

	let inputValue = '';
	let inputLocked = false;
	let errors: Array<Array<string>> = [];

	const validate = async () => {
		inputLocked = true;
		let value: unknown;
		errors = [];
		$advancedBadges = [];

		try {
			value = JSON.parse(inputValue);
		} catch {
			errors = [['JSON Parse Error: Could not parse data as JSON. Edit your entry and try again.']];
		}

		const validateOne = async (c, i: number) => {
			console.log('Gonna try validating...');
			console.log(c);
			try {
				let validationResults = await validateSingleBadge(c);
				let av: Array<BadgeClassBasic | null> = $advancedBadges.filter((a) => true);
				av[i] = validationResults;
				$advancedBadges = av;
				validationResults;
			} catch (e) {
				if (e instanceof yup.ValidationError) {
					errors[i] = e.errors;
				}
			}
		};

		if (Array.isArray(value)) {
			errors =
				value.map((c) => {
					return [];
				}) || [];
			$advancedBadges = value.map((c) => null);
			value.forEach(async (c, i) => {
				validateOne(c, i);
			});
		} else if (typeof value === 'object') {
			errors = [[]];
			$advancedBadges = [];
			validateOne(value, 0);
		}
	};
</script>

<Heading
	><h3>Input badges manually <Tag class="bg-superaqua text-midnight">Advanced</Tag></h3>
</Heading>

<BodyText>
	Paste an individual badge or an array of multiple badges as JSON data from any platform in OB 2.0
	or 3.0 format. 3.0 is not yet released in its final version, and support is experimental. Most
	badge configuration options are supported. The data should match the 2.0 format of a <a
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
	class:border-red-500={errors.some((e) => e.length)}
	class:cursor-not-allowed={inputLocked}
	bind:value={inputValue}
	disabled={inputLocked}
/>
<div class="flex flex-row space-x-2">
	<Button buttonType="primary" on:click={validate} disabled={inputLocked}>Import</Button>
	<Button
		buttonType="default"
		disabled={!inputLocked}
		on:click={() => {
			inputLocked = false;
		}}>Reset</Button
	>
</div>

<div class="my-4">
	{#each errors as errorsForBadge, i}
		{#if errorsForBadge.length}
			<Alert level="error" heading={errors.length == 1 ? 'Error' : `Errors for badge ${i + 1}`}>
				<span slot="detail">
					{#each Object.entries(errorsForBadge) as entry}
						<br /><span class="font-medium">{entry[0]}:</span> <span>{entry[1]}</span>
					{/each}
				</span>
			</Alert>
		{/if}
	{/each}
</div>

{#if inputLocked}
	<Heading
		><h4>
			{$advancedBadgesFound.length}
			{pluralize($advancedBadgesFound.length, 'badge')} found in input
		</h4></Heading
	>

	<div class="my-4">
		<ul class="mt-6 md:grid gap-6 w-full grid-cols-2 xl:grid-cols-3">
			{#each $advancedBadgesFound as b, i}
				{#if b}
					<li class="mb-2 md:md-0 border border-gray-200 p-2">
						<Heading><h4>{b.name}</h4></Heading>
						<BodyText gray={true}><span class="text-sm">{b.id}</span></BodyText>
						<BodyText>{abbreviate(b.description, 50)}</BodyText>
					</li>
				{/if}
			{/each}
		</ul>
	</div>
{/if}
