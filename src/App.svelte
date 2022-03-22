<script lang="ts">
import { onMount } from "svelte";
import { getPixelsOnLine, HSVtoRGB } from "./utils";


	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let points: number[][] = [];

	onMount(() => {
		ctx = canvas.getContext('2d');
	})

	const createPoint = (x: number, y: number, timeValue: number) => [x, y, timeValue];

	const parsePointX = (point: number[]) => point[0];

	const parsePointY = (point: number[]) => point[1];
	
	const parsePointTime = (point: number[]) => point[2];

	const findDist = (x1: number, x2: number, y1: number, y2: number) => Math.sqrt(Math.abs(x2-x1)**2 + Math.abs(y2-y1)**2);

	const findClosestPoint = (pointX: number, pointY: number) => {
		if (points.length == 0)
			return null;
		let prev = points[0];
		let prevX: number;
		let prevY: number;
		let prevDist: number;
		const updatePrevValues = () => {
			prevX = parsePointX(prev);
			prevY = parsePointY(prev);
			prevDist = findDist(prevX, pointX, prevY, pointY);
		}
		updatePrevValues();
		for (const point of points) {
			const X = parsePointX(point);
			const Y = parsePointY(point);
			const dist = findDist(X, pointX, Y, pointY);
			if (dist < prevDist) {
				prev = point;
				updatePrevValues();
			}
		}
		return prev;
	}

	let lastPoint = null;

	const addPoint = (x: number, y: number) => {
		// something is pressed
		if (lastPoint == null) {
			lastPoint = findClosestPoint(x, y);
		}
		if (lastPoint != null) {
			const lpX = parsePointX(lastPoint)
			const lpY = parsePointY(lastPoint)
			if (lpX == x && lpY == y) {
				return;
			}
		}
		const point = createPoint(x, y, lastPoint != null ? parsePointTime(lastPoint)+1 : 0);
		points.push(point);
		lastPoint = point;

		if (parsePointX(point) != x)
			debugger;


		const pointTime = parsePointTime(point);
		const color = HSVtoRGB(pointTime / 1000, 1, 1);
		ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 255)`;
		ctx.fillRect( x, y, 1, 1 );
	}

	let lastX = null;
	let lastY = null;

	const mouseMove = (e) => {
		let rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		if (e.buttons != 0) {
			if (e.shiftKey) {
				return;
			}
			if (lastX != null) {
				getPixelsOnLine(lastX, lastY, x, y, addPoint);
			}
			lastX = x;
			lastY = y;
		} else {
			lastPoint = null;
			lastX = null;
		}
	}
</script>

<main>
	<div class="overlay">
		<img src="treeoutlines.png" />
		<canvas width="486" height="743" bind:this={canvas} on:mousemove={mouseMove} />
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
	}
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
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