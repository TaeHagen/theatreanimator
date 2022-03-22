<script lang="ts">
    import type { Path } from "./Path";
    import { PointUtils } from "./Point";
    import type { Subscription } from "rxjs";
import type { PaintingKeyframe } from "./PaintingKeyframe";

    export let path: Path;
    let subs: Subscription[] = [];

    $: {
        subs.forEach((s) => s.unsubscribe());
        subs = [];
        if (path != null) {
            subs.push(path.newKeyframe$.subscribe(k => {
                path = path;
                changeSpeed(k);
            }));
            subs.push(path.changed$.subscribe(k => {
                path = path;
            }))
        }
    }

    const changeSpeed = (keyframe: PaintingKeyframe) => {
        keyframe.speed = parseInt(prompt("New speed", keyframe.speed.toString()));
    }
</script>

{#if path != null}
    {#each path.keyframes as keyframe}
        <span
            class="keyframe"
            style="top: {PointUtils.parsePointY(
                keyframe.point
            )-5}px; left: {PointUtils.parsePointX(
                keyframe.point
            )-5}px;"
            on:click={() => {
                changeSpeed(keyframe)
            }}
        />
    {/each}
{/if}

<style>
    .keyframe {
		width: 10px;
		height: 10px;
		background: red;
		position: absolute;
	}
</style>