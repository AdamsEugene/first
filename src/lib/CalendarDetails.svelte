<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Modal from './components/Modal.svelte';
	import { storedSelectedDays, setModalState } from '../lib/utils/store';
	import { fade, slide } from 'svelte/transition';
	import InDay from './components/InDay.svelte';

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
		id?: string;
		endDate?: DAYS;
	};

	let selectedKeys = $derived<DAYS[]>($storedSelectedDays);
	let storedSelectedToDates = $derived(
		$storedSelectedDays?.map((date) => new Date(date.year, date.month, date.date)) || []
	);

	let { selectedDates = null } = $props<{ selectedDates: DateRange | null }>();

	let today = new Date();
	let generatedDays: DAYS[] = $state([]);
	let currentMonth = $state(today.getMonth());
	let currentYear = $state(today.getFullYear());

	let selectedDate: string | null = $state(null);
	let isModalOpen = $state(false);
	let selectedDayInfo = $state<DAYS | null>(null);

	let isDragging = $state(false);
	let isCorrectSelection = $state(false);
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

	const events = [
		{
			title:
				'Nkrumah Adams Eugene and Jared Ghobrial, 1:45pm, Google Meet (instructions in description)',
			startTime: '13:45',
			endTime: '14:45',
			color: '#0284c7' // Could use Tailwind classes instead
		}
	];

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

	let dayKey = $derived((day: DAYS) => `${day?.date}-${day?.month}-${day?.year}`);

	function setSelectedDate(day: DAYS, event: MouseEvent) {
		if (!day.isCurrentMonth) return;
		selectedDate = dayKey(day);
		const element = event.currentTarget as HTMLElement;
		const id = element.id;
		clickPosition = element.getBoundingClientRect();
		selectedDayInfo = { ...day, id };

		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
		setModalState.update(() => ({ show: false }));
	}

	let rowCount = $derived(Math.ceil(generatedDays.length / 7));
	let colCount = $derived(weekDays.length);
	let doNotRegenerate = $derived(
		days?.length > 1
			? false
			: generatedDays.some(
					({ date, month, year }) =>
						days?.[0]?.day === date && days?.[0]?.month === month && days?.[0]?.year === year
				)
	);

	$effect.pre(() => {
		if (!days?.length || doNotRegenerate) return;

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
		if (!isCurrentMonth) {
			isCorrectSelection = false;
			return;
		}
		isCorrectSelection = true;
		isDragging = true;
		dragStart = new Date(year, month, date);
		dragEnd = dragStart;
		updateSelectedDates();
	}

	function handleDragMove(days: DAYS) {
		const { date, month, year, isCurrentMonth } = days;
		if (!isDragging || !isCurrentMonth) {
			isCorrectSelection = false;
			return;
		}
		isCorrectSelection = true;
		dragEnd = new Date(year, month, date);
		updateSelectedDates();
	}

	function handleDragEnd() {
		isDragging = false;
		// storedSelectedDays.update(() => _selectedDates);
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
		storedSelectedDays.update(() => []);

		// console.log(_selectedDates);
	}

	function handleMouseUp() {
		if (isCorrectSelection) {
			const firstDate = _selectedDates[0];
			const lastDate = _selectedDates.at(-1);
			if (!lastDate || !firstDate) return;
			const startDate = constructKey(firstDate);
			const endDate = constructKey(lastDate);
			startDate.endDate = endDate;
			attachModal(endDate);
			selectedDayInfo = startDate;
			isModalOpen = true;
		}
		if (isDragging) handleDragEnd();
	}

	function constructKey(date: Date): DAYS {
		const d = new Date();
		if (!date)
			return {
				date: d.getDate(),
				month: d.getMonth(),
				year: d.getFullYear(),
				isCurrentMonth: false,
				isToday: false
			};
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
		const id = newDate ? dayKey(newDate) : dayKey(selectedKeys?.[0]);
		const element = document.getElementById(id);
		if (selectedDayInfo) selectedDayInfo = { ...selectedDayInfo, id: element?.id };
		if (element) clickPosition = element.getBoundingClientRect();
	}

	let isPartOfSelectedDay = $derived((selectedDays: Date[], day: DAYS) =>
		selectedDays.some(
			(selectedDate) =>
				selectedDate.getDate() === day.date &&
				selectedDate.getMonth() === day.month &&
				selectedDate.getFullYear() === day.year
		)
	);

	let generateStartMiddleClass = $derived((selectedDays: Date[], day: DAYS) => {
		if (selectedDays.length === 1) return 'just_one';

		const matchIndex = selectedDays.findIndex(
			(selectedDate) =>
				selectedDate.getDate() === day.date &&
				selectedDate.getMonth() === day.month &&
				selectedDate.getFullYear() === day.year
		);

		if (matchIndex === -1) return '';
		if (matchIndex === 0) return 'start';
		if (matchIndex === selectedDays.length - 1) return 'end';
		return 'middle';
	});

	let paddingForTitle = $derived((selectedDays: Date[], day: DAYS) => {
		const position = generateStartMiddleClass(selectedDays, day);
		return (
			{
				start: 'pl-2',
				end: 'pr-2',
				just_one: 'px-2',
				middle: 'px-0',
				'': 'px-2'
			}[position] || 'px-2'
		);
	});

	let roundedForTitle = $derived((selectedDays: Date[], day: DAYS) => {
		const position = generateStartMiddleClass(selectedDays, day);
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

	let paddingForTitleCont = $derived((selectedDays: Date[], day: DAYS) => {
		const position = generateStartMiddleClass(selectedDays, day);
		return ['middle', 'end'].includes(position) ? 'px-3' : '';
	});

	let datesToUse = $derived(_selectedDates.length > 0 ? _selectedDates : storedSelectedToDates);

	$effect(() => {
		selectedDayInfo = selectedKeys?.[0];
		if (selectedKeys?.length > 1) _selectedDates = [];
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
		class="h-[calc(95vh-74px)] w-full overflow-hidden rounded-3xl border border-gray-600 bg-[#232426C9]/90 shadow-2xl"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		{#if generatedDays.length > 0}
			{#if selectedKeys?.length > 1 && selectedKeys?.length <= 7}
				{#key generatedDays}
					<InDay {events} {rowCount} {weekDays} {generatedDays} />
				{/key}
			{:else}
				{#key generatedDays}
					<div
						class="grid h-[calc(95vh-74px)]"
						style="grid-template-rows: repeat({rowCount}, 1fr); grid-template-columns: repeat({colCount}, minmax(0, 1fr)) "
						onmouseleave={handleDragEnd}
						onmouseup={handleMouseUp}
						transition:fade={{ duration: 300 }}
					>
						{#each generatedDays as day, index (dayKey(day))}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								id={dayKey(day)}
								class="group relative flex w-full cursor-pointer
							 select-none flex-col gap-2
							 rounded-xl border border-gray-600 py-2
							 text-white/80 transition-all duration-300
							 ease-in-out hover:scale-[0.999] hover:bg-[#1e2c3b]/20
							 {!day.isCurrentMonth ? 'cursor-not-allowed' : ''}
							 {paddingForTitle(datesToUse, day)}
							 {(selectedDate === dayKey(day) && isModalOpen) ||
								(dayKey(day) === dayKey(selectedKeys?.[0]) && $setModalState.show)
									? '!bg-[#1e2c3b]/20 text-white'
									: ''}
								 
				   "
								onmousedown={() => handleDragStart(day)}
								onmouseenter={() => handleDragMove(day)}
								onmouseup={handleDragEnd}
								onclick={(e) => setSelectedDate(day, e)}
							>
								<div class="flex w-full justify-center text-sm uppercase">{weekDays[index]}</div>
								<div
									class="flex rounded-full p-1 text-center
					 text-sm
					 font-medium transition-all duration-300 ease-in-out
					 group-hover:text-white
					 {!day.isCurrentMonth ? '!text-white/25' : ''}
					 {paddingForTitleCont(datesToUse, day)}
					 {day.isToday && day.isCurrentMonth
										? 'h-10 w-10 items-center justify-center  bg-black/70 text-white'
										: ''}"
								>
									{day.date}
								</div>
								{#if isPartOfSelectedDay(datesToUse, day) && (isModalOpen || isDragging || $setModalState.show)}
									<div
										class="w-full bg-teal-900 px-2 py-[2px] text-xs
									{roundedForTitle(datesToUse, day)}"
										in:fade={{ duration: 500 }}
									>
										(no title)
									</div>
								{/if}
							</div>
							<!-- <div class="w-full bg-orange-900 px-2 py-[2px] text-xs" in:fade={{ duration: 500 }}>
								 holiday
							 </div> -->
						{/each}
					</div>
				{/key}
			{/if}
		{:else}
			<div class="loading">Loading...</div>
		{/if}
	</div>
</div>

{#if isModalOpen || $setModalState.show}
	<Modal {closeModal} {selectedDayInfo} {clickPosition} />
{/if}
