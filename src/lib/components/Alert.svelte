<script lang="ts">
    export let level: string = 'info'
    export let message: string = ''
    export let heading: string = ''
</script>

<div class="p-4 mb-4 text-sm rounded-lg {level}" role="alert">
    {#if heading}<span class="font-medium">{heading}</span>{/if} {message}
</div>

<style lang="postcss">
    .info { @apply text-blue-700 bg-blue-100; }
    .dark .info { @apply bg-blue-200 text-blue-800; }

    .warning { @apply text-yellow-700 bg-yellow-100; }
    .dark .warning { @apply bg-yellow-200 text-yellow-800; }

    .success { @apply text-green-700 bg-green-100; }
    .dark .success { @apply bg-green-200 text-green-800; }

    .error { @apply text-red-700 bg-red-100; }
    .dark .error { @apply bg-red-200 text-red-800; }
</style>