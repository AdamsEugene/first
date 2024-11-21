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

<div class="w-full">
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
</div>

<style>
	.weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		text-align: center;
		padding: 0.5rem;
		background-color: #e0e0e0;
		height: 8vh; /* Added fixed height for header */
	}

	.weekday {
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-template-rows: repeat(6, 1fr); /* Added to ensure 6 equal rows */
		gap: 1px;
		text-align: center;
		background-color: #ddd;
		height: 92vh; /* Takes remaining viewport height */
		padding: 1px; /* Reduced padding to maximize space */
	}

	.day {
		padding: 0.5rem;
		border: 1px solid #ccc;
		background-color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Removed fixed height to allow grid to control sizing */
	}

	.day:global(.is-today) {
		background-color: rgb(140, 234, 232);
		border-radius: 50%;
	}
</style>
