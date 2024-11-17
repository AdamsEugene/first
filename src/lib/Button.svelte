<script>
	let { title = 'Click', ...others } = $props();
</script>

<button {...others} class="rounded-lg bg-green-500 px-5 py-4 text-2xl text-white">{title}</button>
