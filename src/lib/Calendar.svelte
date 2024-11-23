<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { setModalState, selectedDay } from '../lib/utils/store';
	import { fly } from 'svelte/transition';

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

	let isDropdownOpen = $state(false);

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
		selectedDay.update(() => dragStart as Date);
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

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (isDropdownOpen && !target.closest('.relative')) {
			isDropdownOpen = false;
		}
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

	function setSelectedDate(type: 'event' | 'task' | 'appointment', event?: MouseEvent) {
		console.log($selectedDay);
		setModalState.update(() => true);

		// isModalOpen = true;
		// eventType = type === 'task' ? 'Task' : 'Event';
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

	onMount(async () => {
		currentMonth = currentDate.getMonth();
		currentYear = currentDate.getFullYear();
		generateCalendar(currentMonth, currentYear);
		await tick();

		document.addEventListener('click', handleClickOutside);
	});

	// onDestroy(async () => {
	// 	await tick();
	// 	// document.removeEventListener('click', handleClickOutside);
	// });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex min-w-[220px] flex-col gap-2 rounded-3xl font-sans text-white/80"
	onmouseleave={handleDragEnd}
	onmouseup={handleMouseUp}
>
	<div class="relative">
		<button
			class="rounded-3xl bg-[#1e2c3b] p-4 text-white transition-colors hover:bg-[#1e2c3b]/90"
			onclick={() => (isDropdownOpen = !isDropdownOpen)}
		>
			+ Create
		</button>

		{#if isDropdownOpen}
			<div
				class="absolute right-0 mt-2 w-56 rounded-lg border border-[#1e2c3b]/90 bg-slate-950 p-2 shadow-lg"
				transition:fly={{ y: 5, duration: 200 }}
			>
				<button
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-[#1e2c3b]/20 hover:text-white"
					onclick={() => {
						setSelectedDate('event');
						isDropdownOpen = false;
					}}
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Event
				</button>

				<button
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-[#1e2c3b]/20 hover:text-white"
					onclick={() => {
						setSelectedDate('task');
						isDropdownOpen = false;
					}}
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Task
				</button>

				<button
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-[#1e2c3b]/20 hover:text-white"
					onclick={() => {
						setSelectedDate('appointment');
						isDropdownOpen = false;
					}}
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Appointment Schedule
				</button>
			</div>
		{/if}
	</div>
	<div class="flex items-center justify-between pl-1">
		<h2 class="text-sm font-semibold">
			{months[currentDate.getMonth()]}
			{currentDate.getFullYear()}
		</h2>
		<div>
			<button
				onclick={prevMonth}
				class="cursor-pointer rounded-full border-none bg-[#1e2c3b]/50 px-2 py-[2px] text-sm hover:bg-[#1e2c3b]/90"
			>
				&lt;
			</button>
			<button
				onclick={nextMonth}
				class="cursor-pointer rounded-full border-none bg-[#1e2c3b]/50 px-2 py-[2px] text-sm hover:bg-[#1e2c3b]/90"
			>
				&gt;
			</button>
		</div>
	</div>

	<div class="grid w-full grid-cols-7 text-center">
		{#each weekDays as day}
			<div class="text-xs">{day}</div>
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
					class="flex items-center justify-center rounded-full {isToday && isCurrentMonth
						? '!bg-[#1e2c3b] text-xs text-white hover:bg-black/60'
						: ''}"
				>
					{date}
				</div>
			</button>
		{/each}
	</div>
</div>
