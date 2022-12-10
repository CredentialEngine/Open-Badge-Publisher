<script lang="ts">
	import '../app.css';
	import Icon from 'svelte-icons-pack/Icon.svelte';
	import FiSquare from 'svelte-icons-pack/fi/FiSquare.js';
	import FiCheckSquare from 'svelte-icons-pack/fi/FiCheckSquare.js';
	import FiChevronRight from 'svelte-icons-pack/fi/FiChevronRight';
	import FiChevronDown from 'svelte-icons-pack/fi/FiChevronDown';
</script>

<div class="rainbow" />
<div class="bg-gold drop-shadow-md">
	<div class="max-w-5xl conatiner mx-auto p-6">
		<h1 class="text-midnight text-xl md:text-3xl font-extrabold lg:text-4xl dark:text-white">
			Publish Badges to the Credential Registry
		</h1>
	</div>
</div>
<div class="dark:bg-gray-900">
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
