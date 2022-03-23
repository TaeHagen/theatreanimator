<script lang="ts">
import { interval } from "rxjs";

import { onMount } from "svelte";
import { HistoryManager } from "./HistoryManager";
import { Painting } from "./Painting";
import { PaintingKeyframe } from "./PaintingKeyframe";
import { PaintingViewPrinter } from "./PaintingViewPrinter";
import type { Path } from "./Path";
import { PathCreatePrinter } from "./PathCreatePrinter";
import { asAny, getPixelsOnLine, readFile, saveData } from "./utils";
import { PointUtils } from "./Point";
import PointView from "./PointView.svelte";
import { FrameByFrameCanvasRecorder } from "./recorder";


	let canvas: HTMLCanvasElement;
	let previewCanvas: HTMLCanvasElement;
	let image: HTMLImageElement;

	let lastX: number = null;
	let lastY: number = null;

	let painting = new Painting();
	let printer: PathCreatePrinter;
	let previewPrinter: PaintingViewPrinter;
	$: previewPrinter != null ? previewPrinter.painting = painting : null

	let historyManager = new HistoryManager();

	let currentPath: Path;
	$: currentPath, printer != null ? printer.currentPath = currentPath : null

	const chooseFirstPath = () => {
		if (painting.paths.length > 0) {
			currentPath = painting.paths[0];
		}
	}
	chooseFirstPath();

	let animationFrame: number = -1;
	let lastFrame: number = -1;

	let strokeWidth = 10;

	let erasing = false;

	let saveFile = saveData();
	
	onMount(async () => {
		printer = new PathCreatePrinter(canvas);
		previewPrinter = new PaintingViewPrinter(previewCanvas);
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
				getPixelsOnLine(lastX, lastY, mouseX, mouseY, (x1, y1) => erasing ? currentPath.eraseRadius(x1, y1, strokeWidth) : currentPath.addPoint(x1, y1, strokeWidth));
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
					e.preventDefault();
					break;
				case "Z":
				case "y":
					historyManager.redo();
					e.preventDefault();
					break;
				case "k":
					if (currentPath == null)
						return;
					currentPath.addKeyframe(mouseX, mouseY, strokeWidth);
					e.preventDefault();
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
		<button on:click={() => {
			erasing = !erasing;
		}}>{erasing ? "Erasing" : "Drawing"}</button>
		<button on:click={() => {
			var json = JSON.stringify(painting.flatten()),
            blob = new Blob([json], {type: "octet/stream"})
			saveFile(blob, "animation")
		}}>Save</button>
		<button on:click={() => {
			readFile(d => {
				painting = Painting.restore(d)
				chooseFirstPath();
			});
		}}>Open</button>
		<button on:click={async () => {
			const fps = 60;
			const recorder = new FrameByFrameCanvasRecorder(previewCanvas, fps);
			previewPrinter.prepare();
			while(previewPrinter.drawNextFrame(1/fps)) {
				await recorder.recordFrame()
			}
			const blob = await recorder.export();
			saveFile(blob, "animation.webm")
		}}>Render</button>
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
			<input type="range" min="1" max="1500" bind:value={currentPath.pointsPerSecond} />
			<input type="number" bind:value={currentPath.delay} />
		{/if}
		<input type="range" min="1" max="20" bind:value={strokeWidth} />
	</div>
	<div class="overlay" style="cursor: {
		`url('data:image/svg+xml;utf8,<svg stroke="%23000000" fill="transparent" height="${strokeWidth*2}" viewBox="0 0 ${strokeWidth*2} ${strokeWidth*2}" width="${strokeWidth*2}" xmlns="http://www.w3.org/2000/svg"><circle cx="${strokeWidth}" cy="${strokeWidth}" r="${strokeWidth}"/></svg>') ${strokeWidth} ${strokeWidth}, auto`
	};">
		<img src="treeoutlines.png" bind:this={image} />
		<canvas width="486" height="743" bind:this={canvas} on:mousemove={mouseMove} on:wheel={e => {
			strokeWidth += e.deltaY > 0 ? -1 : 1;
			e.preventDefault()
		}} />
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