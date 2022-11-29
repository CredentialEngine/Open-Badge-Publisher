<script lang="ts">
	import '../app.css';
	import Icon from 'svelte-icons-pack/Icon.svelte';
	import FiSquare from 'svelte-icons-pack/fi/FiSquare.js';
	import FiCheckSquare from 'svelte-icons-pack/fi/FiCheckSquare.js';
	import FiChevronRight from 'svelte-icons-pack/fi/FiChevronRight';
	import FiChevronDown from 'svelte-icons-pack/fi/FiChevronDown';
</script>

<div class="flex flex-no-wrap">
	<div class="bg-lightgray dark:bg-gray-900 container mx-auto py-10 md:w-4/5 w-11/12 px-6">
		<main class="w-full h-full">
			<slot />
		</main>
	</div>

	<!-- SIDEBAR CHECKLIST -->
	<aside
		class="w-64 absolute sm:relative bg-lightgray dark:bg-midnight shadow md:h-full flex-col justify-between hidden sm:flex"
		id="steps-checklist"
	>
		<h2 class="m-2 text-2xl font-extrabold text-gray-900 lg:text-3xl dark:text-white">
			Publishing Steps
		</h2>
		<ul class="space-y-2">
			<li>
				<p
					class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<Icon src={FiChevronRight} />
					<span class="ml-3">Connect to Registry</span>
				</p>
			</li>
			<li>
				<p
					class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<Icon src={FiChevronRight} />
					<span class="ml-3">Choose Badge Source</span>
				</p>
			</li>
			<li>
				<p
					class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<Icon src={FiChevronRight} />
					<span class="ml-3">Configure Badge Source</span>
				</p>
			</li>
			<li>
				<p
					class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<Icon src={FiChevronRight} />
					<span class="ml-3">Populate Badge Source Data</span>
				</p>
			</li>
			<li>
				<p
					class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<Icon src={FiChevronRight} />
					<span class="ml-3">Preview Data</span>
				</p>
			</li>
		</ul>
	</aside>
</div>
