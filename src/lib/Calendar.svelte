<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import {
		Plus,
		ChevronRight,
		ChevronLeft,
		ChevronDown,
		ChevronUp,
		Calendar,
		CalendarCheck,
		CircleCheck,
		Upload,
		User
	} from 'lucide-svelte';

	import { setModalState, storedSelectedDays } from '../lib/utils/store';
	import Dropdown from './components/Dropdown.svelte';

	type DAYS = {
		date: number;
		isCurrentMonth: boolean;
		isToday: boolean;
		month: number;
		year: number;
		id?: string;
		endDate?: DAYS;
	};

	const options = [
		{ id: 'new', label: 'New Item', icon: Plus, onClick: () => {} },
		{ id: 'import', label: 'Import', icon: Upload, onClick: () => {} }
	];

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
		updateSelectedDates();
	}

	function handleDragMove(date: number, month: number, year: number, isCurrentMonth: boolean) {
		if (!isDragging || !isCurrentMonth) return;
		dragEnd = new Date(year, month, date);
		updateSelectedDates();
	}

	function handleDragEnd() {
		let constructedKeys = selectedDates.map((day) => constructKey(day));
		if (constructedKeys.length > 1) constructedKeys[0].endDate = constructedKeys.at(-1);
		storedSelectedDays.update(() => constructedKeys);
		isDragging = false;
	}

	function constructKey(date: Date): DAYS {
		return {
			date: date.getDate(),
			month: date.getMonth(),
			year: date.getFullYear(),
			isCurrentMonth: false,
			isToday: false
		};
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

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (isDropdownOpen && !target.closest('.relative')) {
			isDropdownOpen = false;
		}
	}

	function setSelectedDate(type: 'event' | 'task' | 'appointment', event?: MouseEvent) {
		setModalState.update(() => ({ show: true, type }));
	}

	let generateStartMiddleClass = $derived((day: DAYS) => {
		if (selectedDates.length === 1) return 'just_one';

		const matchIndex = selectedDates.findIndex(
			(selectedDate) =>
				selectedDate.getDate() === day.date &&
				selectedDate.getMonth() === day.month &&
				selectedDate.getFullYear() === day.year
		);

		if (matchIndex === -1) return '';
		if (matchIndex === 0) return 'start';
		if (matchIndex === selectedDates.length - 1) return 'end';
		return 'middle';
	});

	let roundedForTitle = $derived((day: DAYS) => {
		const position = generateStartMiddleClass(day);
		return (
			{
				start: 'rounded-l-3xl',
				end: 'rounded-r-3xl',
				just_one: 'rounded-3xl',
				middle: '',
				'': ''
			}[position] || ''
		);
	});

	let isPartOfSelectedDay = $derived((day: DAYS) =>
		selectedDates.some(
			(selectedDate) =>
				selectedDate.getDate() === day.date &&
				selectedDate.getMonth() === day.month &&
				selectedDate.getFullYear() === day.year
		)
	);

	let ChevronIcon = $derived(isDropdownOpen ? ChevronUp : ChevronDown);

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
	class="flex min-w-[220px] flex-col gap-8 rounded-3xl font-sans text-white/80"
	onmouseleave={handleDragEnd}
	onmouseup={handleMouseUp}
>
	<div class="relative">
		<button
			class="flex items-center gap-3 rounded-3xl bg-[#1e2c3b] p-4 text-white transition-colors hover:bg-[#1e2c3b]/90"
			onclick={() => (isDropdownOpen = !isDropdownOpen)}
		>
			<Plus />
			<span>Create</span>
			<ChevronIcon size={18} />
		</button>

		{#if isDropdownOpen}
			<div
				class="absolute right-0 mt-2 min-w-56 rounded-lg border border-[#1e2c3b]/90 bg-slate-950 p-2 shadow-lg"
				transition:fly={{ y: 5, duration: 200 }}
			>
				<button
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-[#1e2c3b]/20 hover:text-white"
					onclick={() => {
						setSelectedDate('event');
						isDropdownOpen = false;
					}}
				>
					<Calendar size={22} />
					Event
				</button>

				<button
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-[#1e2c3b]/20 hover:text-white"
					onclick={() => {
						setSelectedDate('task');
						isDropdownOpen = false;
					}}
				>
					<CalendarCheck size={22} />
					Task
				</button>

				<button
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-[#1e2c3b]/20 hover:text-white"
					onclick={() => {
						setSelectedDate('appointment');
						isDropdownOpen = false;
					}}
				>
					<CircleCheck size={22} />
					Appointment Schedule
				</button>
			</div>
		{/if}
	</div>

	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between pl-1">
			<h2 class="text-sm font-semibold">
				{months[currentDate.getMonth()]}
				{currentDate.getFullYear()}
			</h2>
			<div class="flex items-center gap-2">
				<ChevronLeft onclick={prevMonth} size={18} />
				<ChevronRight onclick={nextMonth} size={18} />
			</div>
		</div>

		<div class="grid w-full grid-cols-7 text-center">
			{#each weekDays as day}
				<div class="text-xs uppercase">{day}</div>
			{/each}
		</div>

		<div class="grid grid-cols-7 gap-[1px]">
			{#each days as { date, isCurrentMonth, isToday, month, year } (date + '' + isCurrentMonth + '' + isToday + '' + month + '' + year)}
				<button
					class="
          cursor-pointer rounded p-2 text-center text-xs hover:bg-[#1e2c3b]/50
		  {roundedForTitle({ date, isCurrentMonth, isToday, month, year })}
          {!isCurrentMonth ? 'text-gray-600' : ''}
          {isPartOfSelectedDay({ date, isCurrentMonth, isToday, month, year })
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
</div>

<!-- <Dropdown
  {options}
  label="Create"
  buttonIcon={Plus}
/> -->
