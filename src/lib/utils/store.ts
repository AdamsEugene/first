import { writable } from 'svelte/store';

type DAYS = {
	date: number;
	isCurrentMonth: boolean;
	isToday: boolean;
	month: number;
	year: number;
	id?: string;
	endDate?: DAYS;
};

export const storedSelectedDays = writable<DAYS[]>();

export const setModalState = writable<{ show: boolean; type?: 'event' | 'task' | 'appointment' }>({
	show: false,
	type: 'event'
});
