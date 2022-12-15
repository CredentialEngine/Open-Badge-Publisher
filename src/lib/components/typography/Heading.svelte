<script lang="ts">
</script>

<div class="ce-heading">
	<slot />
</div>

<style lang="postcss" global>
	.ce-heading h1 {
		@apply my-4 text-3xl font-extrabold text-gray-900;
	}

	.ce-heading h2 {
		@apply my-4 text-3xl font-extrabold text-gray-900;
	}

	.ce-heading h3 {
		@apply text-2xl font-bold text-gray-800 mt-4;
	}

	.ce-heading h4 {
		@apply text-xl font-bold text-gray-800 mt-4;
	}

	.dark .ce-heading h1,
	.dark .ce-heading h2,
	.dark .ce-heading h3,
	.dark .ce-heading h4 {
		@apply text-lightgray;
	}
</style>
