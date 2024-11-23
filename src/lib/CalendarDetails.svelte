<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Modal from './components/Modal.svelte';
	import { selectedDay, setModalState } from '../lib/utils/store';
	import { fade } from 'svelte/transition';

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

	let selectedKey = $derived<DAYS>(constructKey($selectedDay));

	let { selectedDates = null } = $props<{ selectedDates: DateRange | null }>();

	let today = new Date();
	let generatedDays: DAYS[] = $state([]);
	let currentMonth = $state(today.getMonth());
	let currentYear = $state(today.getFullYear());

	let selectedDate: string | null = $state(null);
	let isModalOpen = $state(false);
	let selectedDayInfo = $state<DAYS | null>(null);

	let isDragging = $state(false);
	let dragStart: Date | null = $state(null);
	let dragEnd: Date | null = $state(null);
	let _selectedDates = $state<Date[]>([]);

	let allDates = $derived((selectedDates as DateRange)?.allDates ?? []);
	let days = $derived<DayInfo[]>(
		allDates.map((date: Date) => ({
			day: date.getDate(),
			month: date.getMonth(),
			year: date.getFullYear()
		}))
	);

	let clickPosition: DOMRect | null = $state(null);

	let weekDays = $state(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

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
		const remainingDays = 35 - calendarDays.length;
		for (let i = 1; i <= remainingDays; i++) {
			calendarDays.push({
				date: i,
				isCurrentMonth: false,
				isToday: isThisMonth && i === today.getDate(),
				month: nextMonthFirstDay.getMonth(),
				year: nextMonthFirstDay.getFullYear()
			});
		}

		if (calendarDays.length > 35) {
			const extraDays = calendarDays.length - 35;
			calendarDays = calendarDays.slice(extraDays);
		}

		// Update state with new array
		generatedDays = [...calendarDays];
	}

	let dayKey = $derived((day: DAYS) => `${day.date}-${day.month}-${day.year}`);

	function setSelectedDate(day: DAYS, event: MouseEvent) {
		if (!day.isCurrentMonth) return;
		selectedDate = dayKey(day);
		selectedDayInfo = day;
		const element = event.currentTarget as HTMLElement;
		clickPosition = element.getBoundingClientRect();
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
		setModalState.update(() => false);
	}

	let rowCount = $derived(() => Math.ceil(generatedDays.length / 7));
	let colCount = $derived(() => weekDays.length);

	$effect.pre(() => {
		if (!days || days.length === 0) return;

		if (days.length === 1) {
			const firstDay = days[0];
			weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			generateCalendar(firstDay.month, firstDay.year);
			return;
		}

		const allSelectedDays = [...days];
		const { day, month, year } = allSelectedDays[0];
		const firstDate = new Date(year, month, day);
		const startDayIndex = firstDate.getDay();
		const fullWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

		// Update weekDays first
		if (allSelectedDays.length < 7) {
			let newWeekDays = fullWeekDays.slice(startDayIndex, startDayIndex + allSelectedDays.length);
			if (newWeekDays.length < allSelectedDays.length) {
				const remainingWeeks = fullWeekDays.slice(0, allSelectedDays.length - newWeekDays.length);
				newWeekDays = [...newWeekDays, ...remainingWeeks];
			}
			weekDays = newWeekDays;
		} else {
			weekDays = [...fullWeekDays.slice(startDayIndex), ...fullWeekDays.slice(0, startDayIndex)];
		}

		// Then update generatedDays
		generatedDays = allSelectedDays.map(({ day, month, year }) => ({
			date: day,
			isCurrentMonth: true,
			isToday:
				year === today.getFullYear() && month === today.getMonth() && day === today.getDate(),
			month,
			year
		}));
		attachModal(constructKey(firstDate));
	});

	function handleDragStart(days: DAYS) {
		const { date, month, year, isCurrentMonth } = days;
		if (!isCurrentMonth) return;
		isDragging = true;
		dragStart = new Date(year, month, date);
		dragEnd = dragStart;
		selectedDay.update(() => dragStart as Date);
		updateSelectedDates();
	}

	function handleDragMove(days: DAYS) {
		const { date, month, year, isCurrentMonth } = days;
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

		// // Extend to next multiple of 7 if needed
		// if (dates.length > 7) {
		// 	const daysNeeded = Math.ceil(dates.length / 7) * 7;
		// 	const lastDate = dates[dates.length - 1];

		// 	while (dates.length < daysNeeded) {
		// 		const nextDate = new Date(lastDate);
		// 		nextDate.setDate(lastDate.getDate() + (dates.length - dates.indexOf(lastDate)));
		// 		dates.push(nextDate);
		// 	}
		// }

		_selectedDates = dates;

		// console.log(_selectedDates);
	}

	function handleMouseUp() {
		if (isDragging) {
			handleDragEnd();
		}
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

	async function attachModal(newDate?: DAYS) {
		await tick();
		const id = newDate ? dayKey(newDate) : dayKey(selectedKey);
		const element = document.getElementById(id);

		if (element) clickPosition = element.getBoundingClientRect();
	}

	let isPartOfSelectedDay = $derived((day: DAYS) =>
		_selectedDates.some(
			(selectedDate) =>
				selectedDate.getDate() === day.date &&
				selectedDate.getMonth() === day.month &&
				selectedDate.getFullYear() === day.year
		)
	);

	let generateStartMiddleClass = $derived((day: DAYS) => {
		if (_selectedDates.length === 1) return 'just_one';

		const matchIndex = _selectedDates.findIndex(
			(selectedDate) =>
				selectedDate.getDate() === day.date &&
				selectedDate.getMonth() === day.month &&
				selectedDate.getFullYear() === day.year
		);

		if (matchIndex === -1) return '';
		if (matchIndex === 0) return 'start';
		if (matchIndex === _selectedDates.length - 1) return 'end';
		return 'middle';
	});

	let paddingForTitle = $derived((day: DAYS) =>
		generateStartMiddleClass(day) === 'start'
			? 'pl-2'
			: generateStartMiddleClass(day) === 'end'
				? 'pr-2'
				: generateStartMiddleClass(day) === 'just_one'
					? 'px-2'
					: generateStartMiddleClass(day) === 'middle'
						? 'px-0'
						: 'px-2'
	);

	let roundedForTitle = $derived((day: DAYS) =>
		generateStartMiddleClass(day) === 'start'
			? 'rounded-l-3xl'
			: generateStartMiddleClass(day) === 'end'
				? 'rounded-r-3xl'
				: generateStartMiddleClass(day) === 'just_one'
					? 'rounded-3xl'
					: ''
	);

	let paddingForTitleCont = $derived((day: DAYS) =>
		generateStartMiddleClass(day) === 'middle'
			? 'px-3'
			: generateStartMiddleClass(day) === 'end'
				? 'px-3'
				: ''
	);

	$effect(() => {
		selectedDayInfo = selectedKey;
		attachModal();
	});

	onMount(async () => {
		generateCalendar(currentMonth, currentYear);
		await tick();
		attachModal();
	});
</script>

<div class="flex w-full flex-col gap-4 text-white/80">
	<div class="h-14">something</div>

	<div
		class="w-full overflow-clip rounded-3xl border border-[#1e2c3b] bg-[#232426C9]/90 shadow-2xl"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="grid h-[calc(95vh-74px)]"
			style="grid-template-rows: repeat({rowCount()}, 1fr); grid-template-columns: repeat({colCount()}, minmax(0, 1fr))"
			onmouseleave={handleDragEnd}
			onmouseup={handleMouseUp}
		>
			{#if generatedDays.length > 0}
				{#each generatedDays as day, index (dayKey(day))}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						id={dayKey(day)}
						class="group relative flex w-full cursor-pointer
						select-none flex-col gap-2 rounded-xl
						border border-[#1e2c3b] py-2
						text-white/80 transition-all duration-300
						ease-in-out hover:scale-[0.97] hover:bg-[#1e2c3b]/20
						hover:shadow-lg
						{!day.isCurrentMonth ? 'cursor-not-allowed' : ''}
						{paddingForTitle(day)}
						{(selectedDate === dayKey(day) && isModalOpen) ||
						(dayKey(day) === dayKey(selectedKey) && $setModalState)
							? '!bg-[#1e2c3b]/20 text-white'
							: ''}
							
			  "
						onmousedown={() => handleDragStart(day)}
						onmouseenter={() => handleDragMove(day)}
						onmouseup={handleDragEnd}
						onclick={(e) => setSelectedDate(day, e)}
					>
						<div class="flex w-full justify-center text-sm">{weekDays[index]}</div>
						<div
							class="flex rounded-full p-1 text-center
				text-sm
				font-medium transition-all duration-300 ease-in-out
				group-hover:text-white
				{!day.isCurrentMonth ? 'text-white/25' : ''}
				{paddingForTitleCont(day)}
				{day.isToday && day.isCurrentMonth
								? 'h-10 w-10 items-center justify-center  bg-black/70 text-white'
								: ''}"
						>
							{day.date}
						</div>
						{#if isPartOfSelectedDay(day)}
							<div
								class="w-full bg-teal-900 px-2 py-[2px] text-xs {roundedForTitle(day)}"
								in:fade={{ duration: 500 }}
							>
								(no title)
							</div>
						{/if}
					</div>
				{/each}
			{:else}
				<div class="loading">Loading...</div>
			{/if}
		</div>
	</div>
</div>

{#if isModalOpen || $setModalState}
	<Modal {closeModal} {selectedDayInfo} {clickPosition} />
{/if}

<!-- {
							? '!bg-[#1e2c3b] text-white hover:bg-[#1e2c3b]/90'
							: ''} -->
