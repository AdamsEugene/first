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
	let currentMonth: number = $state(today.getMonth());
	let currentYear: number = $state(today.getFullYear());
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

		let dates: Date[] = [];
		const currentDate = new Date(start);

		// Get initial selection
		while (currentDate <= end) {
			dates.push(new Date(currentDate));
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Extend to next multiple of 7 if needed
		if (dates.length > 7) {
			const daysNeeded = Math.ceil(dates.length / 7) * 7;
			const lastDate = dates[dates.length - 1];

			while (dates.length < daysNeeded) {
				const nextDate = new Date(lastDate);
				nextDate.setDate(lastDate.getDate() + (dates.length - dates.indexOf(lastDate)));
				dates.push(nextDate);
			}
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
<div
	class="min-w-[300px] overflow-hidden rounded-3xl font-sans text-white/80"
	onmouseleave={handleDragEnd}
	onmouseup={handleMouseUp}
>
	<div class="flex items-center justify-between p-4">
		<h2 class="text-lg font-semibold">
			{months[currentDate.getMonth()]}
			{currentDate.getFullYear()}
		</h2>
		<div>
			<button
				onclick={prevMonth}
				class="cursor-pointer rounded-full border-none px-4 py-2 hover:bg-[#1e2c3b]/50"
			>
				&lt;
			</button>
			<button
				onclick={nextMonth}
				class="cursor-pointer rounded-full border-none px-4 py-2 hover:bg-[#1e2c3b]/50"
			>
				&gt;
			</button>
		</div>
	</div>

	<div class="grid grid-cols-7 p-2 text-center">
		{#each weekDays as day}
			<div class="text-sm font-bold">{day}</div>
		{/each}
	</div>

	<div class="grid grid-cols-7 gap-[1px]">
		{#each days as { date, isCurrentMonth, isToday, month, year } (date + '' + isCurrentMonth + '' + isToday + '' + month + '' + year)}
			<button
				class="
          cursor-pointer rounded p-2 text-center text-xs hover:bg-[#1e2c3b]/50
          {!isCurrentMonth ? 'text-gray-600' : ''}
          {selectedDates.some(
					(selectedDate) =>
						selectedDate.getDate() === date &&
						selectedDate.getMonth() === month &&
						selectedDate.getFullYear() === year
				)
					? '!bg-[#1e2c3b] text-white hover:bg-[#1e2c3b]/90'
					: ''}
        "
				onmousedown={() => handleDragStart(date, month, year, isCurrentMonth)}
				onmouseenter={() => handleDragMove(date, month, year, isCurrentMonth)}
				onmouseup={handleDragEnd}
			>
				<div
					class="flex h-6 w-6 items-center justify-center rounded-full p-2 {isToday &&
					isCurrentMonth
						? '!bg-[#1e2c3b] text-white hover:bg-black/60'
						: ''}"
				>
					{date}
				</div>
			</button>
		{/each}
	</div>
</div>
