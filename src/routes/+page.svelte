<script lang="ts">
	interface DateRange {
		allDates: Date[];
		start: Date;
		end: Date;
	}

	import type { PageData } from './$types';
	import Counter from '$lib/Counter.svelte';
	import Image from '$lib/Image.svelte';
	import Button from '$lib/Button.svelte';
	import Calendar from '$lib/Calendar.svelte';
	import CalendarDetails from '$lib/CalendarDetails.svelte';

	let { data }: { data: PageData } = $props();
	let name = 'Adams';
	let number = $state(1);
	let selectedDates: DateRange | null = $state(null);

	function handleDateSelect(date: DateRange) {
		selectedDates = date;
		// console.log('Selected date:', date);
	}

	let numbers = $state([1, 2, 3, 4, 5]);
	function getNumberName(index: number) {
		let numberNames = [
			'one',
			'two',
			'three',
			'four',
			'five',
			'six',
			'seven',
			'eight',
			'nine',
			'ten'
		];

		return numberNames.at(index);
	}

	let enteredNumber = $derived(getNumberName(number - 1));
	let total = $derived(numbers.reduce((num, cur) => num + cur, 0));

	const handleButtonClick = () => {
		if (numbers.length > 10) return;
		const lastIndex = numbers.at(-1);
		if (lastIndex) numbers.push(lastIndex + 1);
	};
</script>

<!-- <h1>Welcome to SvelteKit</h1> -->
<!-- <h2>hello {name}</h2> -->
<!-- <h1>{data.title}</h1>
<div>{@html data.content}</div> -->
<!-- <a href="/about">About my site</a> -->
<!-- <ul>
	{#each numbers as number}
		<li>{getNumberName(number)}</li>
	{/each}
</ul> -->
<!-- <input type="number" name="number" id="number" bind:value={number} max="10" min="1" /> -->
<!-- <p>You entered {enteredNumber}</p> -->
<!-- <Counter /> -->
<!-- <Image height={50} width={90} /> -->
<!-- <Button title="Add new number" onclick={handleButtonClick} /> -->
<!-- <Button title={String(total)} /> -->
<Calendar onDateSelect={handleDateSelect} />
<CalendarDetails {selectedDates} />
