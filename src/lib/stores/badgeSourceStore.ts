import { writable } from 'svelte/store'

enum BadgeSourceTypeOptions {
    None, Canvas, Credly, JSON
}

interface CanvasOptions {
    apiKey: string;
    accessToken?: string;
}

interface CredlyOptions {
    apiKey: string;
}

export const badgeSourceType = writable(BadgeSourceTypeOptions['None'])
export const canvasOptions = writable<CanvasOptions>({apiKey: ''})
export const credlyOptions = writable<CredlyOptions>({apiKey: ''})
export const badgeSetupStep = writable(1);