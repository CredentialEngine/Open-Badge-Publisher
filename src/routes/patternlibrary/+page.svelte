<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';
	import ConfigurationStep from '$lib/components/ConfigurationStep.svelte';
	import NextPrevButton from '$lib/components/NextPrevButton.svelte';
</script>

<h1 class="my-4 text-3xl font-extrabold text-gray-900 lg:text-4xl">Pattern Library</h1>

<p class="my-4 text-lg font-normal text-gray-500 lg:text-lg">
	Here is a page that allows designers and developers to collaborate to demo components. It shows
	components, documents how to use them, and shows code examples
</p>

<h2 class="my-4 text-3xl font-extrabold tracking-tight leading-none text-gray-900 lg:text-4xl">
	Configuration Step
</h2>

<p class="text-sm font-light leading-tight text-gray-600 mt-4">
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

<h2 class="my-4 text-3xl font-extrabold tracking-tight leading-none text-gray-900 lg:text-4xl">
	Alerts
</h2>

<div class="my-4">
	<Alert level="warning" message="This is your last warning! but it's not an error." />
</div>
<div class="my-4">
	<Alert level="error" message="Now we're in an error state" heading="Error" />
</div>
<div class="my-4">
	<Alert level="info" message="Helpful info" />
</div>
<div class="my-4">
	<Alert level="success" message="You did it all right." heading="Success!" />
</div>
