<script lang="ts">
import { interval } from "rxjs";

import { onMount } from "svelte";
import { HistoryManager } from "./HistoryManager";
import { Painting } from "./Painting";
import { PaintingKeyframe } from "./PaintingKeyframe";
import { PaintingViewPrinter } from "./PaintingViewPrinter";
import type { Path } from "./Path";
import { PathCreatePrinter } from "./PathCreatePrinter";
import { getPixelsOnLine } from "./utils";
import { PointUtils } from "./Point";
import PointView from "./PointView.svelte";


	let canvas: HTMLCanvasElement;
	let previewCanvas: HTMLCanvasElement;
	let image: HTMLImageElement;

	let lastX: number = null;
	let lastY: number = null;

	let painting = new Painting();
	let printer: PathCreatePrinter;
	let previewPrinter: PaintingViewPrinter;

	let historyManager = new HistoryManager();

	let currentPath: Path;
	$: currentPath, printer != null ? printer.currentPath = currentPath : null

	if (painting.paths.length > 0 && currentPath == null) {
		currentPath = painting.paths[0];
	}

	let animationFrame: number = -1;
	let lastFrame: number = -1;

	let strokeWidth = 10;
	
	onMount(() => {
		printer = new PathCreatePrinter(canvas);
		previewPrinter = new PaintingViewPrinter(previewCanvas);
		previewPrinter.painting = painting;
		previewPrinter.image = image;
	})

	let mouseX = 0;
	let mouseY = 0;

	const mouseMove = (e) => {
		if (currentPath == null) {
			return;
		}
		let rect = canvas.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
		if (e.buttons != 0) {
			if (lastX != null) {
				getPixelsOnLine(lastX, lastY, mouseX, mouseY, (x1, y1) => currentPath.addPoint(x1, y1, strokeWidth));
			}
			lastX = mouseX;
			lastY = mouseY;
		} else {
			if (lastX != null) {
				historyManager.pushState(currentPath.finishTransaction());
			}
			currentPath.strokeDone();
			lastX = null;
		}
	}

	document.onkeydown = e => {
		if (e.target !== document.body) return; // don't capture when in text fields
		if (e.ctrlKey) {
			switch (e.key) {
				case "z":
					historyManager.undo();
					break;
				case "Z":
				case "y":
					historyManager.redo();
					break;
				case "k":
					if (currentPath == null)
						return;
					currentPath.addKeyframe(mouseX, mouseY, strokeWidth);
					break;
			}
		}
	}
</script>

<main>
	<div>
		{#if animationFrame == -1}
			<button on:click={() => {
				previewPrinter.prepare();
				lastFrame = -1;
				const nextFrame = () => animationFrame = window.requestAnimationFrame(t => {
					if (lastFrame != -1) {
						if (previewPrinter.drawNextFrame((t - lastFrame) / 1000)) {
							nextFrame()
						} else {
							animationFrame = -1;
						}
					} else {
						lastFrame = t
						nextFrame();
					}
					lastFrame = t
				})
				nextFrame();
			}}>Play</button>
		{:else}
			<button on:click={() => {
				window.cancelAnimationFrame(animationFrame);
				animationFrame = -1
			}}>Stop</button>
		{/if}
		<select value={currentPath?.id ?? -1} on:change={e => {
			const value = e.currentTarget.value;
			if (value == "-1") {
				currentPath = null;
			} else if (value == "-2") {
				currentPath = painting.addPath();
			} else {
				currentPath = painting.paths.find(p => p.id == parseInt(value))
			}
			painting = painting; // refresh
		}}>
			{#each painting.paths as path}
				<option value={path.id}>
					{path.name}
				</option>
			{/each}
			<option value={-1}></option>
			<option value={-2}>Add Path</option>
		</select>
		{#if currentPath != null}
			<input type="text" bind:value={currentPath.name} on:change={() => painting = painting} />
			<button on:click={() => {
				painting.paths.splice(painting.paths.indexOf(currentPath), 1)
				currentPath = null;
				painting = painting
			}}>Delete path</button>
			<input type="range" min="1" max="500" bind:value={currentPath.pointsPerSecond} />
		{/if}
		<input type="range" min="1" max="20" bind:value={strokeWidth} />
	</div>
	<div class="overlay">
		<img src="treeoutlines.png" bind:this={image} />
		<canvas width="486" height="743" bind:this={canvas} on:mousemove={mouseMove} />
		<PointView path={currentPath} /> 
	</div>
	<div>
		<canvas width="486" height="743" bind:this={previewCanvas} />
	</div>
</main>

<style>
	.overlay {
		position: relative;
		display: inline-block;
	}
	.overlay > canvas {
		position: absolute;
		left: 0;
		opacity: 0.5;
	}
	main {
		display: flex;
		justify-content: center;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>