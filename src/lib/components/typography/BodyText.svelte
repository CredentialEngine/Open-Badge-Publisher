<script lang="ts">
	export let gray: boolean = false;
</script>

<p class={`my-2 text-sm max-w-prose font-normal ${!!gray ? 'text-midgray' : 'text-midnight'}`}>
	<slot />
</p>
