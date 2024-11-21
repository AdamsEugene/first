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

	function setSelectedDate(day: DAYS) {
		selectedDate = dayKey(day);
		selectedDayInfo = day;
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
	}

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
	<div class="grid h-[8vh] grid-cols-7 p-2 text-center">
		{#each weekDays as day}
			<div class="flex items-center justify-center font-bold">{day}</div>
		{/each}
	</div>

	<div class="grid h-[87vh] grid-cols-7 grid-rows-5 gap-[1px] p-[1px] text-center">
		{#if generatedDays.length > 0}
			{#each generatedDays as day (dayKey(day))}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="
            group flex cursor-pointer items-center
            justify-center rounded-xl border border-gray-300 bg-white
            p-2 transition-[background-color,transform,box-shadow] duration-300
            ease-in-out hover:scale-[0.97] hover:bg-[#1e2c3b]/20
            hover:shadow-lg
            {day.isToday && day.isCurrentMonth ? 'bg-black/70 text-white' : ''}
			{selectedDate === dayKey(day) ? 'scale-[0.9] !bg-[#1e2c3b]/90 text-white' : ''}
          "
					onclick={() => setSelectedDate(day)}
				>
					<p
						class="flex h-14 w-14 items-center justify-center rounded-full p-4
            font-medium
            transition-transform duration-300 ease-in-out
            group-hover:text-white
            {day.isToday && day.isCurrentMonth ? 'bg-black/70 text-white' : ''}"
					>
						{day.date}
					</p>
				</div>
			{/each}
		{:else}
			<div class="loading">Loading...</div>
		{/if}
	</div>
</div>

{#if isModalOpen}
	<!-- Modal Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore element_invalid_self_closing_tag -->
	<div class="fixed inset-0 bg-black/50 transition-opacity" onclick={closeModal} />

	<!-- Modal Content -->
	<div
		class="fixed left-1/2 top-1/2 w-full max-w-[425px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl"
	>
		<!-- Header -->
		<div class="mb-6 flex items-center gap-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e2c3b] text-white">
				{selectedDayInfo?.date}
			</div>
			<div class="flex flex-col items-start">
				<span class="text-lg font-semibold">
					{new Date(
						selectedDayInfo?.year ?? 0,
						selectedDayInfo?.month ?? 0,
						selectedDayInfo?.date ?? 0
					).toLocaleDateString('en-US', { weekday: 'long' })}
				</span>
				<span class="text-sm text-gray-500">
					{new Date(
						selectedDayInfo?.year ?? 0,
						selectedDayInfo?.month ?? 0,
						selectedDayInfo?.date ?? 0
					).toLocaleDateString('en-US', {
						month: 'long',
						day: 'numeric',
						year: 'numeric'
					})}
				</span>
			</div>
		</div>

		<!-- Form -->
		<div class="grid gap-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<label class="text-right text-sm font-medium">Add title</label>
				<input
					class="col-span-3 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1e2c3b] focus:ring-1 focus:ring-[#1e2c3b]"
					placeholder="Add title and time"
				/>
			</div>

			<div class="grid grid-cols-4 items-center gap-4">
				<label class="text-right text-sm font-medium">Time</label>
				<div class="col-span-3 flex gap-2">
					<input
						type="time"
						class="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1e2c3b] focus:ring-1 focus:ring-[#1e2c3b]"
					/>
					<span class="flex items-center">-</span>
					<input
						type="time"
						class="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1e2c3b] focus:ring-1 focus:ring-[#1e2c3b]"
					/>
				</div>
			</div>

			<div class="grid grid-cols-4 items-start gap-4">
				<label class="text-right text-sm font-medium">Description</label>
				<textarea
					class="col-span-3 min-h-[100px] rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1e2c3b] focus:ring-1 focus:ring-[#1e2c3b]"
					placeholder="Add description"
				/>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-6 flex justify-end gap-2">
			<button
				class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
				onclick={closeModal}
			>
				Cancel
			</button>
			<button
				class="rounded-md bg-[#1e2c3b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e2c3b]/90"
			>
				Save
			</button>
		</div>
	</div>
{/if}
