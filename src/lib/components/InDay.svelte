<script lang="ts">
	type Event = {
		title: string;
		startTime: string;
		endTime: string;
		color?: string;
	};

	type DAYS = {
		date: number;
		isCurrentMonth: boolean;
		isToday: boolean;
		month: number;
		year: number;
		id?: string;
		endDate?: DAYS;
	};

	type SelectedTime = {
		week: string;
		hour: string | number;
		minute: number;
		ampm: 'am' | 'pm';
	};

	type TimeIntervals = {
		isHourMark: boolean;
		minute: number;
		hour: number;
		ampm: 'am' | 'pm';
	};

	let { events, weekDays, rowCount, generatedDays } = $props<{
		events: Event[];
		rowCount: number;
		weekDays: string[];
		generatedDays: DAYS[];
	}>();

	let selectedTimes = $state<SelectedTime[]>();
	let isDragging = $state(false);
	let isCorrectSelection = $state(false);
	let dragStart: SelectedTime | null = $state(null);
	let dragEnd: SelectedTime | null = $state(null);

	const hours = Array.from({ length: 24 }, (_, i) => {
		const hour = i === 0 ? 'GMT+00' : i % 12 || 12;
		const ampm = i < 12 ? 'AM' : 'PM';
		return i === 0 ? hour : `${hour} ${ampm}`;
	});

	// Generate 15-minute intervals for each hour
	const timeIntervals: TimeIntervals[] = Array.from({ length: 24 * 4 }, (_, i) => {
		const isHourMark = i % 4 === 0;
		const minute = (i % 4) * 15;
		const hour = Math.floor(i / 4);
		const ampm = i < 12 ? 'am' : ('pm' as const);
		return { isHourMark, minute, hour, ampm };
	});

	function getEventPosition(event: Event) {
		const [startHour] = event.startTime.split(':').map(Number);
		const [endHour] = event.endTime.split(':').map(Number);

		const top = startHour * 60 + 'px';
		const height = (endHour - startHour) * 60 + 'px';

		return { top, height };
	}

	function handleTimeClick(item: SelectedTime) {
		const { ampm, hour, minute, week } = item;
		if (selectedTimes) selectedTimes.push({ week, hour, minute, ampm });
		else selectedTimes = [{ week, hour, minute, ampm }];
	}

	function handleDragStart(item: SelectedTime) {
		isCorrectSelection = true;
		isDragging = true;
		dragStart = item;
		dragEnd = dragStart;
		updateSelectedDates();
	}

	function handleDragMove(item: SelectedTime) {
		if (!isDragging) {
			isCorrectSelection = false;
			return;
		}
		isCorrectSelection = true;
		dragEnd = item;
		updateSelectedDates();
	}

	function handleDragEnd() {
		isDragging = false;
	}

	function updateSelectedDates() {
		if (!dragStart || !dragEnd) return;

		const startHour = parseInt(dragStart.hour.toString());
		const endHour = parseInt(dragEnd.hour.toString());

		// Convert to 24-hour format if PM
		let start24Hour = dragStart.ampm === 'pm' && startHour !== 12 ? startHour + 12 : startHour;
		let end24Hour = dragEnd.ampm === 'pm' && endHour !== 12 ? endHour + 12 : endHour;

		// Calculate total minutes
		let startMinutes = start24Hour * 60 + dragStart.minute;
		let endMinutes = end24Hour * 60 + dragEnd.minute;

		// Swap if dragging from bottom up
		if (startMinutes > endMinutes) {
			[startMinutes, endMinutes] = [endMinutes, startMinutes];
			// Also swap week if needed
			const weekToUse = dragEnd.week;
			dragEnd.week = dragStart.week;
			dragStart.week = weekToUse;
		}

		const _selectedTimes: SelectedTime[] = [];
		let currentMinute = startMinutes;

		while (currentMinute <= endMinutes) {
			const hour = Math.floor(currentMinute / 60);
			const minute = currentMinute % 60;
			const is24Hour = hour >= 12;

			_selectedTimes.push({
				week: dragStart.week,
				hour: is24Hour ? (hour === 12 ? 12 : hour - 12) : hour === 0 ? 12 : hour,
				minute: minute,
				ampm: is24Hour ? 'pm' : 'am'
			});

			currentMinute += 15;
		}

		selectedTimes = _selectedTimes;
	}

	function handleMouseUp() {
		if (isCorrectSelection) {
		}
		if (isDragging) handleDragEnd();
	}

	let isSelectedDays = $derived((selected: SelectedTime) =>
		selectedTimes?.some(
			({ hour, minute, week }) =>
				selected.hour === hour && selected.minute === minute && selected.week === week
		)
	);

	let selectedDate = $derived(selectedTimes?.[0]);
	// $inspect(selectedDate);
</script>

<div
	class="ml-[60px] grid h-20 select-none overflow-y-auto"
	style="grid-template-rows: repeat({rowCount}, 1fr); grid-template-columns: repeat({weekDays.length}, minmax(0, 1fr)) "
>
	{#each weekDays as week, index}
		<div class="flex w-full flex-col items-center gap-2 pt-3 text-xs uppercase">
			<span> {week}</span>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full text-xl
                {week === selectedDate?.week ? 'bg-black/70 ' : 'bg-black/10'} "
			>
				{generatedDays[index].date}
			</div>
		</div>
	{/each}
</div>

<div class="flex h-[80vh] w-full select-none overflow-y-auto">
	<!-- Time markers -->
	<div class="-mt-[6px] h-full w-[60px] pt-3">
		{#each hours as hour}
			<div class="sticky top-0 z-10 flex h-[60px] justify-end bg-inherit text-xs">
				<span class="h-min w-full bg-[#232426C9]/70 text-right">{hour}</span>
			</div>
		{/each}
	</div>
	<div
		class="grid w-full px-4 pb-4 pt-3"
		style="grid-template-rows: repeat({rowCount}, 1fr); grid-template-columns: repeat({weekDays.length}, minmax(0, 1fr))"
	>
		{#each weekDays as week, index}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="pointer-events-auto relative row-span-full flex text-gray-400
                "
				onmouseleave={handleDragEnd}
				onmouseup={handleMouseUp}
			>
				<!-- Grid lines -->
				<div class="pointer-events-auto absolute inset-0 z-10">
					{#each timeIntervals as { hour, isHourMark, minute, ampm }}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="h-[15px] border-l-2 border-t-2 text-xs
                            {index === weekDays.length - 1 ? 'border-r-2' : ''}
                            {isHourMark ? 'border-t-gray-600' : 'border-t-0'}
                            {isSelectedDays({ hour, week, minute, ampm }) ? '' : ''}
                            border-gray-600"
							onmousedown={() => handleDragStart({ week, hour, minute, ampm })}
							onmouseenter={() => handleDragMove({ week, hour, minute, ampm })}
							onmouseup={handleDragEnd}
							onclick={() => handleTimeClick({ week, hour, minute, ampm })}
						>
							{#if isSelectedDays({ hour, week, minute, ampm })}
								<div class="rounded-3xl bg-[#1e2c3b] px-4 text-white">
									(no title), {hour === 0 ? 12 : hour}
									{minute ? `: ${minute}${ampm}` : ''}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Events -->
				<div class="pointer-events-auto absolute inset-0">
					{#each events as event}
						{@const position = getEventPosition(event)}
						<div
							class="absolute inset-x-0 overflow-hidden rounded bg-sky-600/50 p-2 text-xs text-white"
							style="top: {position.top}; height: {position.height};"
						>
							<span class="block truncate">
								{event.title}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
