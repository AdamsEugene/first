<script lang="ts">
	import { onMount } from 'svelte';

	type DAYS = {
		date: number;
		isCurrentMonth: boolean;
		isToday: boolean;
		month: number;
		year: number;
	};

	let { onDateSelect = () => {} } = $props();

	let today = new Date();
	let currentDate = $state(new Date());
	let currentMonth: number = $state(4);
	let currentYear: number = $state(2024);
	let days: Array<DAYS> = $state([]);

	let isDragging = $state(false);
	let dragStart: Date | null = $state(null);
	let dragEnd: Date | null = $state(null);
	let selectedDates = $state<Date[]>([]);

	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	// console.log(today.getDate());

	const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	function generateCalendar(month: number, year: number) {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const prevMonthLastDay = new Date(year, month, 0);
		const nextMonthFirstDay = new Date(year, month + 1, 1);

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

		// Add next month's days
		const remainingDays = 42 - calendarDays.length;
		for (let i = 1; i <= remainingDays; i++) {
			calendarDays.push({
				date: i,
				isCurrentMonth: false,
				isToday: isThisMonth && i === today.getDate(),
				month: nextMonthFirstDay.getMonth(),
				year: nextMonthFirstDay.getFullYear()
			});
		}

		days = calendarDays;
		// console.log(calendarDays);
	}

	function handleDateClick(date: number, isCurrentMonth: boolean) {
		if (isCurrentMonth) {
			onDateSelect(new Date(currentYear, currentMonth, date));
		}
	}

	function prevMonth() {
		const newDate = new Date(currentYear, currentMonth - 1);
		currentDate = newDate;
		currentMonth = newDate.getMonth();
		currentYear = newDate.getFullYear();
		generateCalendar(currentMonth, currentYear);
	}

	function nextMonth() {
		const newDate = new Date(currentYear, currentMonth + 1);
		currentDate = newDate;
		currentMonth = newDate.getMonth();
		currentYear = newDate.getFullYear();
		generateCalendar(currentMonth, currentYear);
	}

	function handleDragStart(date: number, month: number, year: number, isCurrentMonth: boolean) {
		if (!isCurrentMonth) return;
		isDragging = true;
		dragStart = new Date(year, month, date);
		dragEnd = dragStart;
		updateSelectedDates();
	}

	function handleDragMove(date: number, month: number, year: number, isCurrentMonth: boolean) {
		if (!isDragging || !isCurrentMonth) return;
		dragEnd = new Date(year, month, date);
		updateSelectedDates();
	}

	function handleDragEnd() {
		isDragging = false;
	}

	function updateSelectedDates() {
		if (!dragStart || !dragEnd) return;

		const start = dragStart < dragEnd ? dragStart : dragEnd;
		const end = dragStart < dragEnd ? dragEnd : dragStart;

		const dates: Date[] = [];
		const currentDate = new Date(start);

		while (currentDate <= end) {
			dates.push(new Date(currentDate));
			currentDate.setDate(currentDate.getDate() + 1);
		}

		selectedDates = dates;
	}

	function handleMouseUp() {
		if (isDragging) {
			handleDragEnd();
		}
	}

	$effect(() => {
		if (selectedDates.length > 0 && !isDragging) {
			const currentSelectedDate = {
				start: selectedDates[0],
				end: selectedDates[selectedDates.length - 1],
				allDates: selectedDates
			};
			onDateSelect(currentSelectedDate);
		}
	});

	onMount(() => {
		currentMonth = currentDate.getMonth();
		currentYear = currentDate.getFullYear();
		generateCalendar(currentMonth, currentYear);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="calendar" onmouseleave={handleDragEnd} onmouseup={handleMouseUp}>
	<div class="calendar-header">
		<button onclick={prevMonth}>&lt;</button>
		<h2>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
		<button onclick={nextMonth}>&gt;</button>
	</div>

	<div class="weekdays">
		{#each weekDays as day}
			<div class="weekday">{day}</div>
		{/each}
	</div>

	<div class="days">
		{#each days as { date, isCurrentMonth, isToday, month, year } (date + '' + isCurrentMonth + '' + isToday + '' + month + '' + year)}
			<button
				class="day"
				class:current-month={isCurrentMonth}
				class:is-today={isToday && isCurrentMonth}
				class:selected={selectedDates.some(
					(selectedDate) =>
						selectedDate.getDate() === date &&
						selectedDate.getMonth() === month &&
						selectedDate.getFullYear() === year
				)}
				onmousedown={() => handleDragStart(date, month, year, isCurrentMonth)}
				onmouseenter={() => handleDragMove(date, month, year, isCurrentMonth)}
				onmouseup={handleDragEnd}
			>
				{date}
			</button>
		{/each}
	</div>
</div>

<style>
	.calendar {
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
		font-family: Arial, sans-serif;
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: #f0f0f0;
	}

	.calendar-header button {
		padding: 0.5rem 1rem;
		border: none;
		background-color: #fff;
		cursor: pointer;
	}

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
		background-color: #ddd;
	}

	.day {
		padding: 0.5rem;
		text-align: center;
		background-color: #fff;
		cursor: pointer;
	}

	.day:global(:not(.current-month)) {
		color: #999;
	}

	.day:global(.is-today) {
		background-color: greenyellow;
		border-radius: 50%;
	}

	.day:hover {
		background-color: #f0f0f0;
	}

	.selected {
		background-color: #007bff;
		color: white !important;
	}

	.selected:hover {
		background-color: #0056b3;
	}

	.day:global(.in-range) {
		background-color: #e6f3ff;
	}

	.day:global(.drag-start),
	.day:global(.drag-end) {
		background-color: #007bff;
		color: white;
		border-radius: 50%;
	}
</style>
