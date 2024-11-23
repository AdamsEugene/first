<script lang="ts">
	let { bind } = $props<{ bind: string }>();
</script>

<input
	bind:value={bind}
	class="flex-1 bg-transparent outline-none placeholder:text-gray-500"
	placeholder="Add location"
/>
