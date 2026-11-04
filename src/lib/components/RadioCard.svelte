<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Tag from '#lib/components/Tag.svelte';

	export let formName: string | undefined = undefined;
	export let name: string;
	export let value: string;
	export let groupValue: string = '';
	export let label: string;
	export let description: string | undefined = undefined;

	const dispatch = createEventDispatcher();
	const handleClick = () => {
		dispatch('select', { value: value });
	};
</script>

<li class="mb-2 md:md-0">
	<input
		type="radio"
		class="sr-only peer"
		form={formName || undefined}
		{name}
		{value}
		checked={value === groupValue}
		id={`${name}-${value}`}
		on:change={handleClick}
	/>
	<label
		tabindex="-1"
		for={`${name}-${value}`}
		class="inline-flex justify-between items-center p-5 w-full h-full text-midnight bg-white rounded-lg border border-gray-200 cursor-pointer peer-checked:border-midnight hover:text-gray-600 hover:bg-gray-100"
	>
		<div class="block">
			<div class="w-full text-lg font-semibold">
				<slot name="label">{label}</slot>
				{#if value == groupValue}
					<Tag class="bg-superaqua text-midnight">Selected</Tag>
				{/if}
			</div>
			<div class="w-full text-sm">
				<slot name="content">{description}</slot>
			</div>
		</div>
	</label>
</li>
