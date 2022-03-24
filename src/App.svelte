<script lang="ts">
import { interval } from "rxjs";

import { onMount } from "svelte";
import { HistoryManager } from "./HistoryManager";
import { Painting } from "./Painting";
import { PaintingKeyframe } from "./PaintingKeyframe";
import { PaintingViewPrinter } from "./PaintingViewPrinter";
import type { Path } from "./Path";
import { PathCreatePrinter } from "./PathCreatePrinter";
import { asAny, getPixelsOnLine, readFile, readFileBin, saveData } from "./utils";
import { PointUtils } from "./Point";
import PointView from "./PointView.svelte";
import { FrameByFrameCanvasRecorder } from "./recorder";


	let canvas: HTMLCanvasElement;
	let previewCanvas: HTMLCanvasElement;
	let image: HTMLImageElement;

	let lastX: number = null;
	let lastY: number = null;
	let imageWidth = 0;
	let imageHeight = 0;

	let painting = new Painting();
	let printer: PathCreatePrinter;
	let previewPrinter: PaintingViewPrinter;
	$: previewPrinter != null ? previewPrinter.painting = painting : null

	let historyManager = new HistoryManager();

	let currentPath: Path;
	$: currentPath, printer != null ? printer.currentPath = currentPath : null

	let currentFile: File;
	let currentFileUrl: string;
	$: {
		if (currentFileUrl != null) {
			URL.revokeObjectURL(currentFileUrl);
			currentFileUrl = null;
		}
		if (currentFile != null) {
			currentFileUrl = URL.createObjectURL(currentFile);
		}
	}

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

	let name: string = "";

	const downloadName = () => {
		return name != "" ? name : "Animation";
	}

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
				case "p":
					currentPath = painting.addPath();
					painting = painting;
					e.preventDefault();
					break;
			}
		}
	}
</script>

<main>
	<div class="sidebar">
		<div class="sidebartop">
			<input type="text" bind:value={name} placeholder="Project Name" />
			<div class="topbar">
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
					}}><span class="material-icons">play_arrow</span></button>
				{:else}
					<button on:click={() => {
						window.cancelAnimationFrame(animationFrame);
						animationFrame = -1
					}}><span class="material-icons">stop</span></button>
				{/if}
				<button on:click={() => {
					readFileBin(f => {
						if (!painting.clean && confirm("Are you sure you have saved?")) {
							painting = new Painting();
							chooseFirstPath();
						}
						currentFile = f;
					});
				}} title="Open image"><span class="material-icons">image</span></button>
				<button on:click={() => {
					var json = JSON.stringify(painting.flatten()),
					blob = new Blob([json], {type: "octet/stream"})
					saveFile(blob, downloadName())
				}}><span class="material-icons">download</span></button>
				<button on:click={() => {
					if (!painting.clean && !confirm("Are you sure you have saved?")) {
						return;
					}
					readFile((d, n) => {
						painting = Painting.restore(d)
						name = n;
						chooseFirstPath();
					});
				}}><span class="material-icons">upload</span></button>
				<button on:click={() => {
					if (confirm("Are you sure you have saved?")) {
						painting = new Painting();
						chooseFirstPath();
					}
				}} title="Clear all layers"><span class="material-icons">layers_clear</span></button>
				<button on:click={() => {
					erasing = false;
				}} class={!erasing ? "selected" : ""}><span class="material-icons">brush</span></button>
				<button on:click={() => {
					erasing = true;
				}} title="Erase" class={erasing ? "selected" : ""}><span class="material-icons">clear</span></button>
				<button on:click={async () => {
					const fps = 60;
					const recorder = new FrameByFrameCanvasRecorder(previewCanvas, fps);
					previewPrinter.prepare();
					while(previewPrinter.drawNextFrame(1/fps)) {
						await recorder.recordFrame()
					}
					const blob = await recorder.export();
					saveFile(blob, `${downloadName()}.webm`)
				}} title="Render"><span class="material-icons">movie</span></button>
			</div>
			<div style="text-align:right">
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
			</div>
			{#if currentPath != null}
				<span class="miniheader">Path name</span>
				<input type="text" bind:value={currentPath.name} on:change={() => painting = painting} />
				<span class="miniheader">Speed</span>
				<input type="range" min="1" max="1500" bind:value={currentPath.pointsPerSecond} />
				<span class="miniheader">Start delay (ms)</span>
				<input type="number" bind:value={currentPath.delay} /><br>
				<button on:click={() => {
					painting.paths.splice(painting.paths.indexOf(currentPath), 1)
					currentPath = null;
					painting = painting
				}} style="background-color: #e53e3e; margin-top: 15px;">Delete path</button>
			{/if}
		</div>
		<div class="footer">
			<span class="miniheader">Brush size</span>
			<input type="range" min="1" max="20" bind:value={strokeWidth} />
			<span class="miniheader">Background color</span>
			<input type="color" bind:value={painting.backgroundColor} />
		</div>
	</div>
	<div class="imagesContainer">
		<div class="overlay image" style="cursor: {
			`url('data:image/svg+xml;utf8,<svg stroke="%23000000" fill="transparent" height="${strokeWidth*2}" viewBox="0 0 ${strokeWidth*2} ${strokeWidth*2}" width="${strokeWidth*2}" xmlns="http://www.w3.org/2000/svg"><circle cx="${strokeWidth}" cy="${strokeWidth}" r="${strokeWidth}"/></svg>') ${strokeWidth} ${strokeWidth}, auto`
		};">
			<img src={currentFileUrl} bind:this={image} on:load={() => {
				imageWidth = image.width;
				imageHeight = image.height;
			}} style="background-color: {painting.backgroundColor}" />
			<canvas width={imageWidth} height={imageHeight} bind:this={canvas} on:mousemove={mouseMove} on:wheel={e => {
				strokeWidth += e.deltaY > 0 ? -1 : 1;
				e.preventDefault()
			}} />
			<PointView path={currentPath} /> 
		</div>
		<div class="image">
			<canvas width={imageWidth} height={imageHeight} bind:this={previewCanvas} style="background-color: {painting.backgroundColor}" />
		</div>
	</div>
</main>

<style>
	.overlay {
		position: relative;
		display: inline-block;
	}
	.imagesContainer {
		display: flex;
		flex-grow: 1;
	}
	.image {
		margin: auto;
	}
	.overlay > canvas {
		position: absolute;
		left: 0;
		opacity: 0.5;
	}
	.sidebar {
		max-width: 350px;
		background-color: #4d4d4d;
		padding: 10px;
		display: flex;
		flex-direction: column;
	}
	.sidebar select, input, button {
		background-color: #3b3b3b;
		color: white;
	}
	.sidebar input::placeholder {
		color: white;
	}
	.sidebar button:hover {
		background-color: #424242;
	}
	.sidebar input {
		width: 100%;
	}

	input[type='range']::-webkit-slider-runnable-track {
		background: #3b3b3b;
		-webkit-appearance: none;
    }
	input[type='range'] {
		-webkit-appearance: none;
		overflow: hidden;
		padding-left: 0;
		padding-right: 0;
	}
	input[type='range']::-webkit-slider-thumb {
      width: 10px;
      -webkit-appearance: none;
      height: 10px;
      background: #42A5F5;
	  box-shadow: -800px 0 0 800px #42A5F5;
    }
	input[type="color"] {
		-webkit-appearance: none;
		border: none;
		height: 32px;
		padding: 0;
	}
	input[type="color"]::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	input[type="color"]::-webkit-color-swatch {
		border: none;
		border-radius: 10px;
	}
	.selected {
		color: #42A5F5 !important;
	}
	.topbar {
		display: flex;
		overflow-x: auto;
	}
	.topbar > button {
		background: transparent;
		border: none;
		padding: 8px;
		color: white;
		border-radius: 10px;
		line-height: 0;
	}
	select {
		margin-bottom: 0;
	}
	.sidebartop {
		flex-grow: 1;
	}
	.topbar > button:hover {
		background-color: #cccccc33;
	}
	main {
		display: flex;
		justify-content: center;
		height: 100%;
		background-color: #3b3b3b;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.miniheader {
		color: #ccc;
		font-size: 14px;
		display: block;
		padding: 5px;
		margin-bottom: 2px;
		margin-top:10px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>