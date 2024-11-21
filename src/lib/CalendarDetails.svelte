<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from './Modal.svelte';

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

	let selectedDate: string | null = $state(null);
	let isModalOpen = $state(false);
	let selectedDayInfo = $state<DAYS | null>(null);

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
		selectedDate = dayKey(day);
		selectedDayInfo = day;
		const element = event.currentTarget as HTMLElement;
		clickPosition = element.getBoundingClientRect();
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
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
	});

	onMount(() => {
		generateCalendar(currentMonth, currentYear);
	});
</script>

<div class="flex w-full flex-col gap-4 text-white/80">
	<div class="h-14">something</div>

	<div class="w-full overflow-clip rounded-3xl border border-[#1e2c3b] bg-[#232426C9]/90">
		<!-- <div
			class="grid h-[8vh] p-2 text-center text-white"
			style="grid-template-columns: repeat({colCount()}, minmax(0, 1fr))"
		>
			{#each weekDays as day}
				<div class="flex items-center justify-center font-bold">{day}</div>
			{/each}
		</div> -->

		<div
			class="grid h-[calc(95vh-74px)]"
			style="grid-template-rows: repeat({rowCount()}, 1fr); grid-template-columns: repeat({colCount()}, minmax(0, 1fr))"
		>
			{#if generatedDays.length > 0}
				{#each generatedDays as day, index (dayKey(day))}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="group flex w-full
				 cursor-pointer flex-col
				rounded-xl border border-[#1e2c3b] p-2
				text-white/80 transition-[background-color,transform,box-shadow] duration-300
				ease-in-out hover:scale-[0.97] hover:bg-[#1e2c3b]/20
				hover:shadow-lg
				{selectedDate === dayKey(day) ? '!bg-[#1e2c3b]/20 text-white' : ''}
			  "
						onclick={(e) => setSelectedDate(day, e)}
					>
						<div class="flex w-full justify-center">{weekDays[index]}</div>
						<div
							class="flex h-14 w-14 items-center justify-center rounded-full p-4 text-center
				font-medium
				transition-transform duration-300 ease-in-out
				group-hover:text-white
				{day.isToday && day.isCurrentMonth ? 'bg-black/70 text-white' : ''}"
						>
							{day.date}
						</div>
					</div>
				{/each}
			{:else}
				<div class="loading">Loading...</div>
			{/if}
		</div>
	</div>
</div>

{#if isModalOpen}
	<Modal {closeModal} {selectedDayInfo} {clickPosition} />
{/if}
