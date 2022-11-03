<script lang="ts">
    import "../app.css";
    import Icon from 'svelte-icons-pack/Icon.svelte';
    import FiSquare from 'svelte-icons-pack/fi/FiSquare';
</script>

<div class="flex flex-no-wrap">

    <div class="bg-lightgray dark:bg-gray-900 container mx-auto py-10 md:w-4/5 w-11/12 px-6">
        <main class="w-full h-full">
            <slot />
        </main>
    </div>

    <!-- SIDEBAR CHECKLIST -->
    <aside class="w-64 absolute sm:relative bg-lightgray dark:bg-midnight shadow md:h-full flex-col justify-between hidden sm:flex" id="steps-checklist">
        <h2 class="m-2 text-3xl font-extrabold text-gray-900 lg:text-4xl dark:text-white">Checklist</h2>
        <ul class="space-y-2">
            <li>
                <a href="#" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                <Icon src={FiSquare} />
                <span class="ml-3">Connect to Registry</span>
                </a>
            </li>
            <li>
            <a href="#" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                <Icon src={FiSquare} />
                <span class="ml-3">Choose Badge Source</span>
            </a>
            </li>
            <li>
                <a href="#" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                <Icon src={FiSquare} />
                <span class="ml-3">Configure Badge Source</span>
                </a>
            </li>
            <li>
                <a href="#" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                <Icon src={FiSquare} />
                <span class="ml-3">Populate Badge Source Data</span>
                </a>
            </li>
            <li>
                <a href="#" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                <Icon src={FiSquare} />
                <span class="ml-3">Preview Data</span>
                </a>
            </li>
        </ul>
    </aside>

</div>
