<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onDestroy, onMount } from 'svelte';

	interface Option {
		id: string;
		label: string;
		icon?: any;
		onClick: () => void;
		disabled?: boolean;
	}

	let {
		label = '',
		options = [],
		buttonIcon,
		buttonClass = '',
		dropdownClass = '',
		position = 'right',
		width = 'min-w-56',
		closeOnClick = true,
		renderButton,
		renderHeader,
		renderFooter
	} = $props<{
		label?: string;
		options: Option[];
		buttonIcon?: any;
		buttonClass?: string;
		dropdownClass?: string;
		position?: 'right' | 'left' | 'center';
		width?: string;
		closeOnClick?: boolean;
		renderButton?: () => any;
		renderHeader?: () => any;
		renderFooter?: () => any;
	}>();

	let isOpen = $state(false);

	let positionClass = $derived(() => {
		switch (position) {
			case 'left':
				return 'left-0';
			case 'center':
				return 'left-1/2 -translate-x-1/2';
			default:
				return 'right-0';
		}
	});

	function handleClick(option: Option) {
		if (option.disabled) return;
		option.onClick();
		if (closeOnClick) isOpen = false;
	}

	let dropdownRef: HTMLDivElement;

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	let ButtonIcon = $derived(buttonIcon);

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="relative" bind:this={dropdownRef}>
	{#if renderButton}
		{@render renderButton()}
	{:else}
		<button
			class="flex items-center gap-2 rounded-md bg-[#1e2c3b] px-4 py-2 text-white transition-colors hover:bg-[#1e2c3b]/90 disabled:opacity-50 {buttonClass}"
			onclick={() => (isOpen = !isOpen)}
		>
			{#if buttonIcon}
				<ButtonIcon size={18} />
			{/if}
			{#if label}
				<span>{label}</span>
			{/if}
		</button>
	{/if}

	{#if isOpen}
		<div
			class="absolute z-50 mt-2 {width} {positionClass} rounded-lg border border-[#1e2c3b]/90 bg-slate-950 p-2 shadow-lg {dropdownClass}"
			transition:fly={{ y: 5, duration: 200 }}
		>
			{#if renderHeader}
				{@render renderHeader()}
			{/if}

			{#each options as option (option.id)}
				<button
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-400 transition-colors
            {option.disabled
						? 'cursor-not-allowed opacity-50'
						: 'hover:bg-[#1e2c3b]/20 hover:text-white'}"
					onclick={() => handleClick(option)}
					disabled={option.disabled}
				>
					{#if option.icon}
						<option.icon size={20} />
					{/if}
					{option.label}
				</button>
			{/each}

			{#if renderFooter}
				{@render renderFooter()}
			{/if}
		</div>
	{/if}
</div>
