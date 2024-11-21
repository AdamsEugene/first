<script lang="ts">
	let { width, height, ...other } = $props();
	let src =
		'https://img.freepik.com/free-photo/abstract-autumn-beauty-multi-colored-leaf-vein-pattern-generated-by-ai_188544-9871.jpg?t=st=1731801364~exp=1731804964~hmac=60829f0dc2853358e90bfd226f40e16bdab01f14354d92e39c33e25426cd6665&w=1380';
</script>

<img {src} alt="this is an" srcset="" {width} {height} {...other} />
