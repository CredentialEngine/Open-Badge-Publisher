import { writable } from 'svelte/store';

enum BadgeSourceTypeOptions {
	None,
	Canvas,
	Credly,
	JSON
}

interface CanvasOptions {
	apiKey: string;
	accessToken?: string;
	selectedRegion: string;
	termsAgree: boolean;
}

interface CredlyOptions {
	apiKey: string;
}

export const badgeSourceType = writable(BadgeSourceTypeOptions['None']);
export const credlyOptions = writable<CredlyOptions>({ apiKey: '' });
export const badgeSetupStep = writable(1);

const canvasOptionsStore = () => {
	const { subscribe, set, update } = writable<CanvasOptions>({
		apiKey: '',
		selectedRegion: '',
		termsAgree: false
	});

	return {
		subscribe,
		increment: () => update((n) => n + 1),
		decrement: () => update((n) => n - 1),
		reset: () => set(0)
	};
};

export const canvasOptions = canvasOptionsStore();
