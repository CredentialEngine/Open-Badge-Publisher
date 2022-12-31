<script lang="ts">
	import { PUBLIC_BASEURL, PUBLIC_PUBLISHER_API_BASEURL } from '$env/static/public';
	import '../app.css';
	import Button from '$lib/components/Button.svelte';

	let showReturnToPublisher = PUBLIC_BASEURL?.includes('credentialengine.org') || false;
</script>

<div class="rainbow" />
<div class="bg-gold drop-shadow-md">
	{#if showReturnToPublisher}
		<div class="max-w-5xl container mx-auto p-6 md:flex flex-row justify-between">
			<div>
				<h1 class="block text-midnight text-xl md:text-3xl font-extrabold lg:text-4xl">
					Publish Badges to the Credential Registry
				</h1>
			</div>
			<div>
				<a
					href={PUBLIC_PUBLISHER_API_BASEURL || '#'}
					class="block text-midnight text-sm underline hover:no-underline md:text-base"
				>
					Exit <span class="md:sr-only">Return to Publisher</span>
				</a>
			</div>
		</div>
	{:else}
		<div class="max-w-5xl container mx-auto p-6">
			<h1 class="text-midnight text-xl md:text-3xl font-extrabold lg:text-4xl">
				Publish Badges to the Credential Registry
			</h1>
		</div>
	{/if}
</div>
<div>
	<div class="max-w-5xl container mx-auto p-2 sm:p-6">
		<main class="w-full h-full">
			<slot />
		</main>
	</div>
</div>

<style>
	.rainbow {
		height: 10px;
		background-image: linear-gradient(
			60deg,
			#342a3f 14%,
			#2d2c59 14.1%,
			#2d2c59 28%,
			#0f3e63 28.1%,
			#0f3e63 42%,
			#235c5d 42.1%,
			#235c5d 56%,
			#45a085 56.1%,
			#45a085 70%,
			#badca3 70.1%,
			#badca3 84%,
			#97b753 84.1%
		);
	}
</style>
