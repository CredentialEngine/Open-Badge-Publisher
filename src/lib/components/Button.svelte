<script lang="ts">
	let klass = '';
	export { klass as class };
	export let disabled: boolean = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let buttonType: 'primary' | 'default' | 'danger' = 'default';

	let finishedClass = '';
	const baseClass =
		'text-sm focus:ring-4 focus:outline-none rounded text-center font-medium px-5 py-2 ' + klass;
	const defaultClasses = {
		default: 'focus:ring-gray-200 border',
		primary: 'focus:ring-midnight-600 border border-midnight',
		danger: 'text-red-600 focus:ring-red-200 border-2 border-red-600 focus:outline-none'
	};
	const disabledClasses = {
		default: 'text-midgray border-midgray bg-white cursor-not-allowed',
		primary: 'text-white bg-midgray border-midgray cursor-not-allowed',
		danger: 'bg-gray-100 cursor-not-allowed'
	};
	const activeClasses = {
		default: 'text-midnight bg-white border-midnight hover:bg-gray-100',
		primary: 'text-white bg-midnight hover:bg-midnight-700',
		danger: 'bg-white hover:bg-red-100 hover:text-red-700'
	};

	$: {
		finishedClass = `${baseClass} ${defaultClasses[buttonType]} ${
			disabled ? disabledClasses[buttonType] : activeClasses[buttonType]
		}`;
	}
</script>

<button class={finishedClass} {type} {disabled} aria-disabled={disabled} on:click {...$$restProps}>
	<slot />
</button>
