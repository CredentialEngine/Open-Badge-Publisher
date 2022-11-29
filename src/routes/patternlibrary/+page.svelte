<script lang="ts">
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';
</script>

<h1 class="my-4 text-3xl font-extrabold text-gray-900 lg:text-4xl dark:text-white">
	Pattern Library
</h1>

<p class="my-4 text-lg font-normal text-gray-500 lg:text-lg dark:text-gray-400">
	Here is a page that allows designers and developers to collaborate to demo components. It shows
	components, documents how to use them, and shows code examples
</p>

<h2
	class="my-4 text-3xl font-extrabold tracking-tight leading-none text-gray-900 lg:text-4xl dark:text-white"
>
	Configuration Step
</h2>

<p
	tabindex="0"
	class="focus:outline-none text-sm font-light leading-tight text-gray-600 dark:text-gray-400 mt-4"
>
	A ConfigurationStep can be active or not, and it has a step number.
</p>
<div class="md:flex items-center border-b pb-6 border-gray-200">
	<ConfigurationStep stepName="Step 1" stepNumber="01" isActive={true} />
	<ConfigurationStep stepName="Step 2" stepNumber="02" isActive={false} />
</div>

<textarea>
	<div class="md:flex items-center border-b pb-6 border-gray-200"> <ConfigurationStep stepName="Step
	1" stepNumber="01" isActive={true}></ConfigurationStep> <ConfigurationStep stepName="Step 2"
	stepNumber="02" isActive={false}></ConfigurationStep> </div>
</textarea>
