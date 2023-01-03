<script lang="ts">
	export let stepNumber: string;
	export let isActive: boolean = false;
	export let stepName: string = 'Step';

	$: bgColor = isActive ? 'bg-tahiti' : 'bg-gray-100';
</script>

<div class="configuration-step flex items-center md:mt-0 mt-4">
	<div class="w-8 h-8 {bgColor} rounded flex items-center justify-center">
		<p
			class={isActive
				? 'text-base font-medium leading-none text-white'
				: 'text-base font-medium leading-none text-gray-700'}
		>
			{stepNumber}
		</p>
	</div>
	<p class="text-base ml-3 mr-5 font-medium leading-4 text-gray-800">
		{stepName}
	</p>
</div>
