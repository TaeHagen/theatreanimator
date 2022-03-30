import type { Painting } from "./Painting";
import type { Path } from "./Path";
import { Point, PointUtils } from "./Point";

export class PaintingViewPrinter {
    private ctx: CanvasRenderingContext2D;
    constructor(private canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d');
    }
    painting: Painting
    image: CanvasImageSource
    doneImage: CanvasImageSource
    backgroundImage: CanvasImageSource

    allPointsCanvas: HTMLCanvasElement;

    totalPoints = 0;
    pathProgress = new Map<Path, number>();
    pathPoints = new Map<Path, Point[]>();

    timeWarp = 1;
    endTime = 0;

    allDrawn() {
        for (const points of this.pathPoints.values()){
            if (points.length > 0)
                return false;
        }
        return true;
    }

    willDrawEndFade() {
        return this.doneImage != null;
    }

    drawAllPoints(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d");
        for (const path of this.painting.paths) {
            ctx.save();
            ctx.beginPath();
            
            for (const point of path.points)
                this.drawPoint(point, ctx);

            ctx.clip();
            ctx.fillStyle = this.painting.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            if (this.backgroundImage != null)
                this.ctx.drawImage(this.backgroundImage, 0, 0);
            ctx.drawImage(this.image, 0, 0);
            ctx.restore();
        }
    }

    drawNextFrame(secSinceLastFrame: number): boolean {
        secSinceLastFrame *= this.timeWarp;
        this.secSinceStart += secSinceLastFrame;
        const points = this.pointsForPaths(secSinceLastFrame);
        if (this.allDrawn()) {
            if (this.endTime <= this.painting.fadeTime && this.willDrawEndFade()) {
                this.endTime += secSinceLastFrame / this.timeWarp;
                this.ctx.fillStyle = this.painting.backgroundColor;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
                this.ctx.drawImage(this.allPointsCanvas, 0, 0);
                this.ctx.globalAlpha = this.endTime / this.painting.fadeTime;
                this.ctx.drawImage(this.doneImage, 0, 0);
                this.ctx.globalAlpha = 1;
                return true;
            }
            return false;
        }

        // creates a path, calls drawPoint() to draw any number of points into that path, then clips into it
        // then draws the background with clip and restores it
        
        for (const path of points) {
            if (path.perfect) {
                for (const point of path.points) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.drawPoint(point);
                    this.ctx.clip();
                    this.ctx.fillStyle = this.painting.backgroundColor;
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
                    if (this.backgroundImage != null)
                        this.ctx.drawImage(this.backgroundImage, 0, 0);
                    this.ctx.drawImage(this.image, 0, 0);
                    this.ctx.restore();
                }
            } else {
                this.ctx.save();
                this.ctx.beginPath();
                
                for (const point of path.points) 
                    this.drawPoint(point);
                
                this.ctx.clip();
                this.ctx.fillStyle = this.painting.backgroundColor;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
                if (this.backgroundImage != null)
                    this.ctx.drawImage(this.backgroundImage, 0, 0);
                this.ctx.drawImage(this.image, 0, 0);
                this.ctx.restore();
            }
        }
        
        return true;
    }

    secSinceStart = 0;

    countTime(fps: number): number {
        const secPerFrame = 1/fps;
        this.prepare(0, undefined, false);
        let time = 0;
        while (!this.allDrawn()) {
            this.pointsForPaths(secPerFrame);
            time += secPerFrame;
        }
        return time;
    }

    pointsForPaths(secSinceLastFrame: number) {
        return this.painting.paths.map(path => {
            if (this.secSinceStart < path.delay/1000)
                return null;
            let prog = this.pathProgress.get(path) ?? 0;
            prog += secSinceLastFrame * path.effectivePointsPerSeconds;
            this.pathProgress.set(path, prog);
            path.applyKeyframesForPoint(prog);
            let points = this.pathPoints.get(path) ?? path.points;
            let wanted: Point[] = [];
            points = points.filter(p => {
                const use = PointUtils.parsePointTime(p) <= prog;
                if (use)
                    wanted.push(p)
                return !use;
            });
            this.pathPoints.set(path, points);
            return {
                points: wanted,
                perfect: path.perfectRendering
            }
        }).filter(p => p != null);
    }

    prepare(desiredTime = this.painting.desiredTime, fps = 60, canvas = true) {
        this.timeWarp = 1;
        this.endTime = 0;
        this.allPointsCanvas = document.createElement("canvas");
        this.allPointsCanvas.width = this.canvas.width;
        this.allPointsCanvas.height = this.canvas.height;
        this.drawAllPoints(this.allPointsCanvas);
        if (desiredTime != 0) {
            const time = this.countTime(fps);
            this.timeWarp = time / desiredTime;
        }
        if (canvas) {
            this.ctx.fillStyle = this.painting.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.backgroundImage != null)
                this.ctx.drawImage(this.backgroundImage, 0, 0);
        }
        this.totalPoints = this.painting.paths.reduce((prev, curr) => prev + curr.points.length, 0);
        this.pathProgress.clear();
        this.secSinceStart = 0;
        this.pathProgress.clear();
        for (const path of this.painting.paths) {
            this.pathPoints.set(path, path.points);
        }
    }

    drawPoint(point: Point, ctx: CanvasRenderingContext2D = this.ctx) {
        ctx.arc(PointUtils.parsePointX(point), PointUtils.parsePointY(point), PointUtils.parseBrushSize(point), 0, 2 * Math.PI);
    }
}