<script lang="ts">
	import { onMount } from 'svelte';

	interface DateRange {
		allDates: Date[];
		start: Date;
		end: Date;
	}

	interface DayInfo {
		day: number;
		month: number;
		year: number;
	}

	type DAYS = {
		date: number;
		isCurrentMonth: boolean;
		isToday: boolean;
		month: number;
		year: number;
	};

	let { selectedDates = null } = $props<{ selectedDates: DateRange | null }>();

	let today = new Date();
	let generatedDays: DAYS[] = $state([]);
	let currentMonth = $state(today.getMonth());
	let currentYear = $state(today.getFullYear());

	let allDates = $derived((selectedDates as DateRange)?.allDates ?? []);
	let days = $derived<DayInfo[]>(
		allDates.map((date: Date) => ({
			day: date.getDate(),
			month: date.getMonth(),
			year: date.getFullYear()
		}))
	);

	const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	function generateCalendar(month: number, year: number) {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const prevMonthLastDay = new Date(year, month, 0);

		const isThisMonth = year === today.getFullYear() && month === today.getMonth();

		let calendarDays: DAYS[] = [];

		// Add previous month's days
		for (let i = firstDay.getDay(); i > 0; i--) {
			calendarDays.push({
				date: prevMonthLastDay.getDate() - i + 1,
				isCurrentMonth: false,
				isToday: isThisMonth && i === today.getDate(),
				month: prevMonthLastDay.getMonth(),
				year: prevMonthLastDay.getFullYear()
			});
		}

		// Add current month's days
		for (let i = 1; i <= lastDay.getDate(); i++) {
			calendarDays.push({
				date: i,
				isCurrentMonth: true,
				isToday: isThisMonth && i === today.getDate(),
				month,
				year
			});
		}

		// Update state with new array
		generatedDays = [...calendarDays];
	}

	let dayKey = $derived((day: DAYS) => `${day.date}-${day.month}-${day.year}`);

	$effect(() => {
		if (days && days.length > 0) {
			const firstDay = days[0];
			generateCalendar(firstDay.month, firstDay.year);
		}
	});

	onMount(() => {
		generateCalendar(currentMonth, currentYear);
	});
</script>

<div class="weekdays">
	{#each weekDays as day}
		<div class="weekday">{day}</div>
	{/each}
</div>

<div class="days">
	{#if generatedDays.length > 0}
		{#each generatedDays as day (dayKey(day))}
			<div class="day" class:is-today={day.isToday && day.isCurrentMonth}>
				{day.date}
			</div>
		{/each}
	{:else}
		<div class="loading">Loading...</div>
	{/if}
</div>

<style>
	.weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		text-align: center;
		padding: 0.5rem;
		background-color: #e0e0e0;
	}

	.weekday {
		font-weight: bold;
	}

	.days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		text-align: center;
		padding: 0.5rem;
		background-color: #ddd;
	}

	.day {
		padding: 0.5rem;
	}

	.day:global(.is-today) {
		background-color: rgb(140, 234, 232);
		border-radius: 50%;
	}
</style>
