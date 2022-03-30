import { Subject } from "rxjs";
import type { UndoState } from "./HistoryManager";
import { PaintingKeyframe } from "./PaintingKeyframe";
import { Point, PointUtils } from "./Point";
import { HSVtoRGB } from "./utils";

let ID_COUNTER = 0;

export class Path {

	id: number = ID_COUNTER++;
	name: string = "New Path";

    points: Point[] = [];
	transaction: Point[] = [];
	eraseTransaction: Point[] = [];
	keyframes: PaintingKeyframe[] = [];

	get clean() {
		return this.points.length == 0 && this.keyframes.length == 0;
	}

	pointsPerSecond: number = 250;
	effectivePointsPerSeconds: number = this.pointsPerSecond;

	delay: number = 0;

	findDist(x1: number, x2: number, y1: number, y2: number) {
        return Math.sqrt(Math.abs(x2-x1)**2 + Math.abs(y2-y1)**2);
    }

	isPointInPath(x: number, y: number) {
		return this.points.some(p => this.findDist(PointUtils.parsePointX(p), x, PointUtils.parsePointY(p), y) <= PointUtils.parseBrushSize(p));
	}

	applyKeyframesForPoint(point: number) {
		this.effectivePointsPerSeconds = this.pointsPerSecond;
		this.keyframes.filter(k => PointUtils.parsePointTime(k.point) <= point).map(k => k.apply(this));
	}

	flatten() {
		return {
			points: this.points.map(p => PointUtils.flatten(p)),
			keyframes: this.keyframes.map(k => k.flatten()),
			pointsPerSecond: this.pointsPerSecond,
			name: this.name,
			id: this.id,
			delay: this.delay
		}
	}

	static restore(data: any) {
		const path = new Path();
		path.points = data.points.map(p => PointUtils.restore(p));
		path.keyframes = data.keyframes.map(k => PaintingKeyframe.restore(k));
		path.pointsPerSecond = data.pointsPerSecond;
		path.name = data.name;
		path.id = data.id;
		path.delay = data.delay;
		return path;
	}

	findClosestPoint(pointX: number, pointY: number) {
		if (this.points.length == 0)
			return null;
		let prev = this.points[0];
		let prevX: number;
		let prevY: number;
		let prevDist: number;
		const updatePrevValues = () => {
			prevX = PointUtils.parsePointX(prev);
			prevY = PointUtils.parsePointY(prev);
			prevDist = this.findDist(prevX, pointX, prevY, pointY);
		}
		updatePrevValues();
		for (const point of this.points) {
			const X = PointUtils.parsePointX(point);
			const Y = PointUtils.parsePointY(point);
			const dist = this.findDist(X, pointX, Y, pointY);
			if (dist < prevDist) {
				prev = point;
				updatePrevValues();
			}
		}
		return prev;
	}

	lastPoint: Point = null;

	newPoint$ = new Subject<Point>();
	newKeyframe$ = new Subject<PaintingKeyframe>();
	changed$ = new Subject<void>(); // the whole thing needs to be redrawn

	addPoint(x: number, y: number, brushSize: number) {
		// something is pressed
		this.lastPoint = this.findClosestPoint(x, y);
		if (this.lastPoint != null) {
			const lpX = PointUtils.parsePointX(this.lastPoint)
			const lpY = PointUtils.parsePointY(this.lastPoint)
			if (lpX == x && lpY == y) {
				return;
			}
		}
		const point = PointUtils.createPoint(x, y, this.lastPoint != null ? PointUtils.parsePointTime(this.lastPoint)+1 : 0, brushSize);
		this.points.push(point);
		this.transaction.push(point);
		this.lastPoint = point;

		this.newPoint$.next(point);
	}

	eraseRadius(x: number, y: number, brushSize: number) {
		this.points = this.points.filter(p => {
			const res = this.findDist(x, PointUtils.parsePointX(p), y, PointUtils.parsePointY(p)) > brushSize;
			if (!res)
				this.eraseTransaction.push(p);
			return res;
		});
		this.changed$.next();
	}

	addKeyframe(x: number, y: number, brushSize: number) {
		const keyframe = new PaintingKeyframe(
			PointUtils.createPoint(x, y, PointUtils.parsePointTime(this.findClosestPoint(x, y))+1 ?? 0, brushSize)
		);
		this.keyframes.push(keyframe);
		this.newKeyframe$.next(keyframe);
	}

	finishTransaction(): UndoState {
		const state = this.transaction;
		const eraseState = this.eraseTransaction;
		this.transaction = [];
		this.eraseTransaction = [];
		return {
			name: "Add stroke",
			undo: () => {
				this.points = this.points.filter(p => !state.includes(p)).concat(eraseState);
				this.changed$.next();
			},
			redo: () => {
				this.points = this.points.concat(state).filter(p => !eraseState.includes(p));
				this.changed$.next();
			}
		}
	}

	strokeDone() {
		this.lastPoint = null;
	}
}