<script lang="ts">
	import type { PageData } from './$types';
	import Counter from '$lib/Counter.svelte';
	import Image from '$lib/Image.svelte';

	let { data }: { data: PageData } = $props();
	let name = 'Adams';
	let number = $state(1);

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
</script>

<h1>Welcome to SvelteKit</h1>
<h2>hello {name}</h2>
<!-- <h1>{data.title}</h1>
<div>{@html data.content}</div> -->
<a href="/about">About my site</a>
<ul>
	{#each numbers as number}
		<li>{getNumberName(number)}</li>
	{/each}
</ul>
<input type="number" name="number" id="number" bind:value={number} max="10" min="1" />
<p>You entered {enteredNumber}</p>
<Counter />
<Image height={50} width={90} />
