<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	export let isActive: boolean = true;
	export let isNext: boolean = true;
	export let label: string = '';
</script>

{#if isNext}
	<Button on:click disabled={!isActive} class="flex items-center justify-center">
		<span class="text-base font-bold text-center capitalize"
			>{#if label}{label}{:else}Next Step{/if}</span
		>
		<svg
			class="mt-1 ml-3"
			width="12"
			height="8"
			viewBox="0 0 12 8"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			><path d="M8.01 3H0V5H8.01V8L12 4L8.01 0V3Z" fill="currentColor" /></svg
		>
	</Button>
{:else}
	<Button on:click disabled={!isActive} class="flex items-center justify-center">
		<svg
			class="mt-1 mr-3 isPrev"
			width="12"
			height="8"
			viewBox="0 0 12 8"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			><path d="M8.01 3H0V5H8.01V8L12 4L8.01 0V3Z" fill="currentColor" /></svg
		>
		<span class="text-base font-bold text-center capitalize"
			>{#if label}{label}{:else}Previous Step{/if}</span
		>
	</Button>
{/if}

<style lang="postcss">
	.isPrev {
		transform: rotate(180deg);
	}
</style>
