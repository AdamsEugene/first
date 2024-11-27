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

	function getEventPosition(event: Event) {
		const [startHour] = event.startTime.split(':').map(Number);
		const [endHour] = event.endTime.split(':').map(Number);

		const top = startHour * 60 + 'px';
		const height = (endHour - startHour) * 60 + 'px';

		return { top, height };
	}
</script>

<div
	class="ml-[60px] grid h-24 overflow-y-auto"
	style="grid-template-rows: repeat({rowCount}, 1fr); grid-template-columns: repeat({weekDays.length}, minmax(0, 1fr)) "
>
	{#each weekDays as week, index}
		<div class="flex w-full flex-col items-center gap-2 pt-3 text-xs uppercase">
			<span> {week}</span>
			<div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-xl">
				{generatedDays[index].date}
			</div>
		</div>
	{/each}
</div>

<div class="flex h-[80vh] w-full overflow-y-auto">
	<!-- Time markers -->
	<div class=" -left-[60px] -top-2.5 h-full w-[60px]">
		{#each hours as hour}
			<div class="flex h-[50px] justify-end text-xs">
				<span>{hour}</span>
			</div>
		{/each}
	</div>
	<div
		class="grid w-full px-4 pb-4"
		style="grid-template-rows: repeat({rowCount}, 1fr); grid-template-columns: repeat({weekDays.length}, minmax(0, 1fr)) "
	>
		{#each weekDays as week, index}
			<div
				class="relative row-span-full flex text-gray-400
                "
			>
				<!-- Grid lines -->
				<div class="absolute inset-0">
					{#each hours as hour}
						<div
							class="h-[50px] border-l border-t {index === weekDays.length - 1
								? 'border-r'
								: ''} border-gray-700"
						></div>
					{/each}
				</div>

				<!-- Events -->
				<div class="absolute inset-0">
					{#each events as event}
						{@const position = getEventPosition(event)}
						<div
							class="absolute inset-x-0 overflow-hidden rounded bg-sky-600 p-2 text-sm text-white"
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
