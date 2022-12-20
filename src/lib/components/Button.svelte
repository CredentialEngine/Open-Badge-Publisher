<script lang="ts">
	let klass = '';
	export { klass as class };
	export let disabled: boolean = false;
	export let type = 'button';
	export let buttonType: 'primary' | 'default' | 'danger' = 'default';

	const baseClass =
		'text-sm focus:ring-4 focus:outline-none rounded-lg text-center font-medium px-5 py-2.5';
	const defaultClasses = {
		default:
			'text-gray-900 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-gray-200 rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 dark:focus:ring-gray-700',
		primary:
			'text-white bg-blue-700 hover:bg-blue-800  focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800',
		danger:
			'text-red-600 bg-white hover:bg-red-100 hover:text-red-700 focus:ring-red-200 border-2 border-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900 dark:hover:text-white dark:border-red-400 focus:outline-none dark:focus:ring-red-700'
	};
	const disabledClasses = {
		default: '',
		primary: '',
		danger: ''
	};
	const activeClasses = {
		default: '',
		primary: '',
		danger: ''
	};

	const getClass = () => {
		return `${baseClass} ${defaultClasses[buttonType]} ${
			disabled ? disabledClasses[buttonType] : activeClasses[buttonType]
		}`;
	};
</script>

<button class={getClass()} {type} {disabled} aria-disabled={disabled} on:click {...$$restProps}>
	<slot />
</button>
