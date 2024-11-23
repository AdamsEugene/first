<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly, scale } from 'svelte/transition';
	import { throttle } from '../utils/functions';
	import Textarea from './Textarea.svelte';
	import Input from './Input.svelte';

	let { closeModal, selectedDayInfo, clickPosition } = $props<{
		closeModal: () => void;
		selectedDayInfo: any;
		clickPosition: DOMRect | null;
	}>();

	let modalPosition = $state({ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' });
	let observer: ResizeObserver | null = null;

	let showTimePicker = $state(false);
	let selectedHour = $state('12');
	let selectedMinute = $state('00');
	let selectedPeriod = $state('AM');

	let eventType = $state<'Event' | 'Task' | 'Schedule'>('Event'); // or 'Task'
	let guests = $state<string[]>([]);
	let location = $state('');
	let meetLink = $state(false);
	let title = $state('');

	let showTaskLists = $state(false);
	let visibility = $state('Free');
	let repeatOption = $state('Does not repeat');
	// svelte-ignore non_reactive_update
	let direction = 'left';

	function toggleEventType(type: 'Event' | 'Task' | 'Schedule') {
		eventType = type;
	}

	function addGuest(email: string) {
		guests = [...guests, email];
	}

	function removeGuest(email: string) {
		guests = guests.filter((g) => g !== email);
	}

	function toggleTimePicker() {
		showTimePicker = !showTimePicker;
	}

	const calculatePositionThrottled = throttle(() => {
		if (!clickPosition) {
			modalPosition = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
			return;
		}

		const modalWidth = 500;
		const modalHeight = 665;
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		const shouldShowOnLeft =
			clickPosition.left + clickPosition.width + modalWidth + 20 > windowWidth;

		let left = shouldShowOnLeft
			? `${clickPosition.left - modalWidth - 10}px`
			: `${clickPosition.left + clickPosition.width + 10}px`;

		direction = shouldShowOnLeft ? 'left' : 'right';

		let top = `${clickPosition.top}px`;
		let transform = 'none';

		const elementPosition = Math.round(clickPosition.top * 2 + clickPosition.height);
		const viewportHeight = Math.round(windowHeight);

		const isInMiddleRange = Math.abs(elementPosition - viewportHeight - 72) <= 10;

		if (isInMiddleRange) {
			top = `${clickPosition.top + clickPosition.height / 2}px`;
			transform = 'translateY(-50%)';
		} else if (clickPosition.top + modalHeight > windowHeight) {
			top = `${clickPosition.top + clickPosition.height}px`;
			transform = 'translateY(-100%)';
		}

		modalPosition = { left, top, transform };
	}, 100);

	function setupPositionObservers() {
		window.addEventListener('resize', calculatePositionThrottled);

		observer = new ResizeObserver(calculatePositionThrottled);
		const modalElement = document.querySelector('.modal');
		if (modalElement) {
			observer.observe(modalElement);
		}
	}

	function cleanupPositionObservers() {
		window.removeEventListener('resize', calculatePositionThrottled);
		calculatePositionThrottled.cancel();
		if (observer) {
			observer.disconnect();
			observer = null;
		}
	}

	function flyAndScale(
		node: HTMLElement,
		{ x = 0, y = 0, duration = 300, delay = 0, startScale = 0.95 }
	) {
		return {
			duration,
			delay,
			css: (t: number) => {
				const eased = cubicOut(t);
				return `
                // transform: translate(${1 - t}px, ${1 - t}px) scale(${startScale + (1 - startScale) * eased});
                opacity: ${t};
            `;
			}
		};
	}

	// In your component initialization
	onMount(() => {
		setupPositionObservers();
	});

	// In your component cleanup
	onDestroy(() => {
		cleanupPositionObservers();
	});
</script>

<!-- Modal Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<div
	class="fixed inset-0 bg-black/10 transition-opacity"
	onclick={closeModal}
	transition:fade={{ duration: 200 }}
/>

<!-- Modal Content -->
<div
	class="modal absolute w-full max-w-[500px] rounded-3xl bg-slate-950 p-6 text-white/80 shadow-xl transition-all"
	style="left: {modalPosition.left}; top: {modalPosition.top}; transform: {modalPosition.transform}"
	transition:flyAndScale={{ x: 0, duration: 300, startScale: 0.9 }}
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
		<div class="grid w-full grid-cols-4 items-center gap-4">
			<input
				id="title"
				class="col-span-4 rounded-md border border-[#1e2c3b]/90 bg-slate-950/30 px-3 py-2 text-sm outline-none focus:border-[#1e2c3b] focus:ring-1 focus:ring-[#1e2c3b]"
				placeholder="Add title and time"
			/>
		</div>

		<!-- Event/Task Toggle -->
		<div class="mb-2 flex gap-2 rounded-lg bg-slate-900/50 p-1">
			<button
				class="flex-1 rounded-md px-3 py-1 text-sm transition-colors {eventType === 'Event'
					? 'bg-[#1e2c3b] text-white'
					: 'text-gray-400 hover:text-white'}"
				onclick={() => toggleEventType('Event')}
			>
				Event
			</button>
			<button
				class="flex-1 rounded-md px-3 py-1 text-sm transition-colors {eventType === 'Task'
					? 'bg-[#1e2c3b] text-white'
					: 'text-gray-400 hover:text-white'}"
				onclick={() => toggleEventType('Task')}
			>
				Task
			</button>
			<button
				class="flex-1 rounded-md px-3 py-1 text-sm transition-colors {eventType === 'Task'
					? 'bg-[#1e2c3b] text-white'
					: 'text-gray-400 hover:text-white'}"
				onclick={() => toggleEventType('Schedule')}
			>
				Schedule
			</button>
		</div>

		<div class="grid w-full grid-cols-5 items-center gap-4">
			<div class="col-span-5 flex w-full gap-2">
				<div class="relative w-full">
					<!-- Date Display -->
					<div class="flex items-center gap-2 text-sm text-gray-400">
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<span>
							{new Date(
								selectedDayInfo?.year ?? 0,
								selectedDayInfo?.month ?? 0,
								selectedDayInfo?.date ?? 0
							).toLocaleDateString('en-US', {
								weekday: 'long',
								month: 'long',
								day: 'numeric',
								year: 'numeric'
							})}
						</span>
						<button
							class="ml-auto rounded px-2 py-1 text-sm hover:bg-[#1e2c3b]/20"
							onclick={toggleTimePicker}
						>
							Add time
						</button>
					</div>

					{#if showTimePicker}
						<div
							class="absolute left-0 top-full mt-2 w-64 rounded-lg border border-[#1e2c3b]/90 bg-slate-950 p-4 shadow-lg"
						>
							<div class="grid grid-cols-3 gap-4">
								<!-- Hours -->
								<div class="flex flex-col gap-2">
									<label for="Hour" class="text-xs text-gray-400">Hour</label>
									<div class="h-32 overflow-y-auto rounded-md border border-[#1e2c3b]/50">
										{#each Array.from( { length: 12 }, (_, i) => String(i + 1).padStart(2, '0') ) as hour}
											<button
												class="w-full px-2 py-1 text-left text-sm text-gray-300 hover:bg-[#1e2c3b]/20
                                {selectedHour === hour ? 'bg-[#1e2c3b]/40' : ''}"
												onclick={() => (selectedHour = hour)}
											>
												{hour}
											</button>
										{/each}
									</div>
								</div>

								<!-- Minutes -->
								<div class="flex flex-col gap-2">
									<label for="Minute" class="text-xs text-gray-400">Minute</label>
									<div class="h-32 overflow-y-auto rounded-md border border-[#1e2c3b]/50">
										{#each Array.from( { length: 60 }, (_, i) => String(i).padStart(2, '0') ) as minute}
											<button
												class="w-full px-2 py-1 text-left text-sm text-gray-300 hover:bg-[#1e2c3b]/20
                                {selectedMinute === minute ? 'bg-[#1e2c3b]/40' : ''}"
												onclick={() => (selectedMinute = minute)}
											>
												{minute}
											</button>
										{/each}
									</div>
								</div>

								<!-- AM/PM -->
								<div class="flex flex-col gap-2">
									<label for="Period" class="text-xs text-gray-400">Period</label>
									<div class="rounded-md border border-[#1e2c3b]/50">
										{#each ['AM', 'PM'] as period}
											<button
												class="w-full px-2 py-1 text-sm text-gray-300 hover:bg-[#1e2c3b]/20
                                {selectedPeriod === period ? 'bg-[#1e2c3b]/40' : ''}"
												onclick={() => (selectedPeriod = period)}
											>
												{period}
											</button>
										{/each}
									</div>
								</div>
							</div>

							<div class="mt-4 flex justify-end gap-2">
								<button
									class="rounded px-3 py-1 text-sm text-gray-400 hover:bg-[#1e2c3b]/20"
									onclick={toggleTimePicker}
								>
									Cancel
								</button>
								<button
									class="rounded bg-[#1e2c3b] px-3 py-1 text-sm text-white hover:bg-[#1e2c3b]/90"
									onclick={toggleTimePicker}
								>
									OK
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Guest List -->
		{#if eventType === 'Event'}
			<div class="flex items-center gap-2 text-sm text-gray-400">
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<input
					class="flex-1 bg-transparent outline-none placeholder:text-gray-500"
					placeholder="Add guests"
				/>
			</div>
		{/if}

		<!-- Meet Link -->
		{#if eventType === 'Event'}
			<div class="flex items-center gap-2 text-sm text-gray-400">
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<button
					class="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-400 hover:bg-[#1e2c3b]/20"
				>
					Add Google Meet video conferencing
				</button>
			</div>
		{/if}

		<!-- Location -->
		{#if eventType === 'Event'}
			<div class="flex items-center gap-2 text-sm text-gray-400">
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<Input bind={location} />
			</div>
		{/if}

		<!-- Description -->
		<div class="flex items-start gap-2">
			<svg class="mt-1 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path
					d="M4 6h16M4 12h16M4 18h7"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<Textarea />
		</div>

		{#if eventType === 'Task'}
			<div class="flex items-center gap-2">
				<button
					class="flex items-center gap-2 rounded-md bg-slate-900/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1e2c3b]/20"
					onclick={() => (showTaskLists = !showTaskLists)}
				>
					My Tasks
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path
							d="M19 9l-7 7-7-7"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>

			{#if showTaskLists}
				<div
					class="absolute left-0 mt-2 w-48 rounded-lg border border-[#1e2c3b]/90 bg-slate-950 p-2 shadow-lg"
					transition:fly={{ y: 10, duration: 200 }}
				>
					<button
						class="w-full rounded px-3 py-1.5 text-left text-sm text-gray-400 hover:bg-[#1e2c3b]/20"
					>
						My Tasks
					</button>
					<button
						class="w-full rounded px-3 py-1.5 text-left text-sm text-gray-400 hover:bg-[#1e2c3b]/20"
					>
						Work Tasks
					</button>
					<button
						class="w-full rounded px-3 py-1.5 text-left text-sm text-gray-400 hover:bg-[#1e2c3b]/20"
					>
						Personal Tasks
					</button>
				</div>
			{/if}
		{/if}

		<div class="mt-4 flex items-center gap-4 border-t border-[#1e2c3b]/50 pt-4">
			<div class="flex items-center gap-2">
				<svg class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<select
					bind:value={repeatOption}
					class="bg-transparent text-sm text-gray-400 outline-none hover:text-white"
				>
					<option>Does not repeat</option>
					<option>Daily</option>
					<option>Weekly</option>
					<option>Monthly</option>
					<option>Yearly</option>
					<option>Custom</option>
				</select>
			</div>

			<div class="flex items-center gap-2">
				<svg class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<select
					bind:value={visibility}
					class="bg-transparent text-sm text-gray-400 outline-none hover:text-white"
				>
					<option>Free</option>
					<option>Busy</option>
					<option>Private</option>
				</select>
			</div>

			{#if eventType === 'Event'}
				<div class="flex items-center gap-2">
					<svg class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path
							d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<button class="text-sm text-gray-400 hover:text-white"> Do not notify </button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Footer -->
	<div class="mt-6 flex items-center justify-between">
		<!-- More options -->
		<button class="text-sm text-gray-400 hover:text-white"> More options </button>

		<!-- Action buttons -->
		<div class="flex gap-2">
			<button
				class="rounded-md border border-[#1e2c3b] px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-[#1e2c3b]/20"
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
</div>

<style>
	.transition-all {
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 300ms;
	}
</style>
