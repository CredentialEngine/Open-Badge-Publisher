<script lang="ts">
	export let level: string = 'info';
	export let message: string = '';
	export let heading: string = '';
</script>

<div class="p-4 mb-4 text-sm rounded-lg {level}" role="alert">
	{#if heading}<span class="font-medium">{heading}</span>{/if}
	{message}
	<slot name="detail" />
</div>

<style lang="postcss">
	.info {
		@apply text-blue-700 bg-blue-100;
	}

	.warning {
		@apply text-yellow-700 bg-yellow-100;
	}

	.success {
		@apply text-green-700 bg-green-100;
	}

	.error {
		@apply text-red-700 bg-red-100;
	}
</style>
