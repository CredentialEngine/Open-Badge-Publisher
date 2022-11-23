<script lang="ts">
    export let isActive: boolean = true
    export let isNext: boolean = true
    export let label: string = ''

    const enabledClassList = "flex items-center justify-center py-4 px-7 focus:outline-none bg-white border rounded border-gray-400 mt-7 md:mt-14 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
    const disabledClassList = "flex items-center justify-center py-4 px-7 focus:outline-none bg-white border rounded border-gray-400 mt-7 md:mt-14 text-gray-400 focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
</script>

{#if isNext}
<button
        on:click
        aria-label="Next step"
        disabled={!isActive}
        class={isActive ? enabledClassList : disabledClassList}
>
    <span class="text-sm font-medium text-center capitalize">{#if label}{label}{:else}Next Step{/if}</span>
    <svg class="mt-1 ml-3" width="12" height="8" viewBox="0 0 12 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8.01 3H0V5H8.01V8L12 4L8.01 0V3Z" fill="currentColor" /></svg>
</button>

{:else}
<button
        on:click
        aria-label="Next step"
        disabled={!isActive}
        class={isActive ? enabledClassList : disabledClassList}
        class:isPrev={true}
>
    <svg class="mt-1 mr-3" width="12" height="8" viewBox="0 0 12 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8.01 3H0V5H8.01V8L12 4L8.01 0V3Z" fill="currentColor" /></svg>
    <span class="text-sm font-medium text-center capitalize">{#if label}{label}{:else}Previous Step{/if}</span>
</button>
{/if}

<style lang="postcss">
    .isPrev svg {
        transform: rotate(180deg);
    }

    button:first-child {
        @apply mr-3;
    }

</style>