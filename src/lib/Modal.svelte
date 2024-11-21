<script lang="ts">
	let { closeModal, selectedDayInfo, clickPosition } = $props<{
		closeModal: () => void;
		selectedDayInfo: any;
		clickPosition: DOMRect | null;
	}>();

	let showTimePicker = $state(false);
	let selectedHour = $state('12');
	let selectedMinute = $state('00');
	let selectedPeriod = $state('AM');

	function toggleTimePicker() {
		showTimePicker = !showTimePicker;
	}

	let modalPosition = $derived(() => {
		if (!clickPosition) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

		const modalWidth = 425; // max-w-[425px]
		const modalHeight = 400; // approximate height of modal
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		// Check if modal should be placed on left or right of the clicked element
		const shouldShowOnLeft =
			clickPosition.left + clickPosition.width + modalWidth + 20 > windowWidth;

		// Calculate left position
		let left = shouldShowOnLeft
			? `${clickPosition.left - modalWidth - 10}px` // 10px gap
			: `${clickPosition.left + clickPosition.width + 10}px`;

		// Calculate top position
		let top = `${clickPosition.top}px`;
		let transform = 'none';

		// Adjust if modal would go below viewport
		if (clickPosition.top + modalHeight > windowHeight) {
			top = `${clickPosition.top + clickPosition.height}px`;
			transform = 'translateY(-100%)';
		}

		return { left, top, transform };
	});
</script>

<!-- Modal Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<div class="fixed inset-0 bg-black/30 transition-opacity" onclick={closeModal} />

<!-- Modal Content -->
<div
	class="fixed w-full max-w-[425px] rounded-3xl bg-slate-950 p-6 text-white/80 shadow-xl"
	style="left: {modalPosition().left}; top: {modalPosition().top}; transform: {modalPosition()
		.transform}"
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
			<label for="title" class="text-right text-sm font-medium">Add title</label>
			<input
				id="title"
				class="col-span-3 rounded-md border border-[#1e2c3b]/90 bg-slate-950/30 px-3 py-2 text-sm outline-none focus:border-[#1e2c3b] focus:ring-1 focus:ring-[#1e2c3b]"
				placeholder="Add title and time"
			/>
		</div>

		<div class="grid w-full grid-cols-4 items-center gap-4">
			<label for="Time" class="text-right text-sm font-medium">Time</label>
			<div class="col-span-3 flex w-full gap-2">
				<div class="relative w-full">
					<input
						type="text"
						readonly
						value={`${selectedHour}:${selectedMinute} ${selectedPeriod}`}
						class="w-full cursor-pointer rounded-md border border-[#1e2c3b]/90 bg-slate-950/35 px-3 py-2 text-sm text-gray-300 outline-none focus:border-[#1e2c3b] focus:ring-1 focus:ring-[#1e2c3b]"
						onclick={toggleTimePicker}
					/>

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

		<div class="grid w-full grid-cols-4 items-start gap-4">
			<label for="Description" class="text-right text-sm font-medium">Description</label>
			<textarea
				id="Description"
				class="col-span-3 min-h-[100px] rounded-md border border-[#1e2c3b]/90 bg-slate-950/35 px-3 py-2 text-sm outline-none focus:border-[#1e2c3b] focus:ring-1 focus:ring-[#1e2c3b]"
				placeholder="Add description"
			></textarea>
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
