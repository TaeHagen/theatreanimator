import type { Subscription } from "rxjs";
import type { Path } from "./Path";
import { Point, PointUtils } from "./Point";
import { HSVtoRGB } from "./utils";

export class PathCreatePrinter {
    private ctx: CanvasRenderingContext2D;
    constructor(private canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d');
    }

    private currentPathSubscriptions: Subscription[] = [];

    private _currentPath: Path;

    set currentPath(value: Path) {
        this._currentPath = value;
        this.currentPathSubscriptions.forEach(i => i.unsubscribe())
        this.redrawPath();
        if (value == null)
            return;
        this.currentPathSubscriptions.push(value.newPoint$.subscribe(p => this.drawPoint(p)));
        this.currentPathSubscriptions.push(value.changed$.subscribe(() => this.redrawPath()))
    }
    get currentPath() {
        return this._currentPath
    }

    redrawPath() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.currentPath == null)
            return;
        for (const p of this.currentPath.points)
            this.drawPoint(p);
    }

    drawPoint(point: Point) {
        const pointTime = PointUtils.parsePointTime(point);
		const color = HSVtoRGB(pointTime / 1000, 1, 1);
		this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 255)`;
        this.ctx.beginPath();
        this.ctx.arc(PointUtils.parsePointX(point), PointUtils.parsePointY(point), PointUtils.parseBrushSize(point), 0, 2 * Math.PI, false);
        this.ctx.fill();
    }
}