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

	let { events, weekDays, rowCount, generatedDays } = $props<{
		events: Event[];
		rowCount: number;
		weekDays: string[];
		generatedDays: DAYS[];
	}>();

	const hours = Array.from({ length: 24 }, (_, i) => {
		const hour = i === 0 ? 'GMT+00' : i % 12 || 12;
		const ampm = i < 12 ? 'AM' : 'PM';
		return i === 0 ? hour : `${hour} ${ampm}`;
	});

	// Generate 15-minute intervals for each hour
	const timeIntervals = Array.from({ length: 24 * 4 }, (_, i) => {
		const isHourMark = i % 4 === 0;
		const minute = (i % 4) * 15;
		const hour = Math.floor(i / 4);
		return { isHourMark, minute, hour };
	});
	// console.log(timeIntervals);

	function getEventPosition(event: Event) {
		const [startHour] = event.startTime.split(':').map(Number);
		const [endHour] = event.endTime.split(':').map(Number);

		const top = startHour * 60 + 'px';
		const height = (endHour - startHour) * 60 + 'px';

		return { top, height };
	}

	function handleTimeClick(week: string, hour: string | number, minute: number) {
		console.log({ week, hour, minute });
	}
</script>

<div
	class="ml-[60px] grid h-20 overflow-y-auto"
	style="grid-template-rows: repeat({rowCount}, 1fr); grid-template-columns: repeat({weekDays.length}, minmax(0, 1fr)) "
>
	{#each weekDays as week, index}
		<div class="flex w-full flex-col items-center gap-2 pt-3 text-xs uppercase">
			<span> {week}</span>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full text-xl
                {generatedDays[index].date === 3 ? 'bg-black/70 ' : 'bg-black/10'} "
			>
				{generatedDays[index].date}
			</div>
		</div>
	{/each}
</div>

<div class="flex h-[80vh] w-full overflow-y-auto">
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
		style="grid-template-rows: repeat({rowCount}, 1fr); grid-template-columns: repeat({weekDays.length}, minmax(0, 1fr)) "
	>
		{#each weekDays as week, index}
			<div
				class="pointer-events-auto relative row-span-full flex text-gray-400
                "
			>
				<!-- Grid lines -->
				<div class="pointer-events-auto absolute inset-0 z-10">
					{#each timeIntervals as { hour, isHourMark, minute }}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="h-[15px] border-l-2 border-t-2
                            {index === weekDays.length - 1 ? 'border-r-2' : ''}
                            {isHourMark ? 'border-t-gray-600' : 'border-t-white/0'}
                            border-gray-600"
							onclick={() => handleTimeClick(week, hour, minute)}
						></div>
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
