<script lang="ts">
	interface DateRange {
		allDates: Date[];
		start: Date;
		end: Date;
	}

	interface DayInfo {
		day: number;
		month: number;
	}

	let { selectedDates = null } = $props<{ selectedDates: DateRange | null }>();

	let allDates = $derived((selectedDates as DateRange)?.allDates ?? []);
	let days = $derived<DayInfo[]>(
		allDates.map((date: Date) => ({
			day: date.getDate(),
			month: date.getMonth()
		}))
	);

	const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<h1>details</h1>

<div class="weekdays">
	{#each weekDays as day}
		<div class="weekday">{day}</div>
	{/each}
</div>

<div class="days">
	{#if days && days.length > 0}
		{#each days as { day, month } (day)}
			<div class="day">{day}</div>
		{/each}
	{:else}
		<div class="no-dates">No dates selected</div>
	{/if}
</div>

<style>
	.weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		text-align: center;
		padding: 0.5rem;
		background-color: #e0e0e0;
	}

	.weekday {
		font-weight: bold;
	}

	.days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		text-align: center;
		padding: 0.5rem;
		background-color: #ddd;
	}

	.day {
		padding: 0.5rem;
	}

	.no-dates {
		grid-column: 1 / -1;
		text-align: center;
		padding: 1rem;
		color: #666;
	}
</style>
