import { writable } from 'svelte/store';

export const selectedDay = writable(new Date());

export const setModalState = writable(false);
