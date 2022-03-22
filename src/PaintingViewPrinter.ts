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

    alreadyPainted: Point[] = [];
    totalPoints = 0;
    pathProgress = new Map<Path, number>();

    drawNextFrame(secSinceLastFrame: number): boolean {
        console.log(secSinceLastFrame);
        const points = this.pointsForPaths(secSinceLastFrame);
        if (this.alreadyPainted.length == this.totalPoints)
            return false;

        // creates a path, calls drawPoint() to draw any number of points into that path, then clips into it
        // then draws the background with clip and restores it
        
        for (const path of points) {
            this.ctx.save();
            this.ctx.beginPath();
            
            for (const point of path)
                this.drawPoint(point);

            this.ctx.clip();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.ctx.drawImage(this.image, 0, 0);
            this.ctx.restore();
        }
        
        return true;
    }

    pointsForPaths(secSinceLastFrame: number) {
        return this.painting.paths.map(path => {
            let prog = this.pathProgress.get(path) ?? 0;
            prog += secSinceLastFrame * path.pointsPerSecond;
            this.pathProgress.set(path, prog);
            return path.points.filter(p => PointUtils.parsePointTime(p) <= prog && !this.alreadyPainted.includes(p));
        });
    }

    prepare() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.alreadyPainted = [];
        this.totalPoints = this.painting.paths.reduce((prev, curr) => prev + curr.points.length, 0);
        this.pathProgress.clear();
    }

    drawPoint(point: Point) {
        this.ctx.arc(PointUtils.parsePointX(point), PointUtils.parsePointY(point), PointUtils.parseBrushSize(point), 0, 2 * Math.PI);
        this.alreadyPainted.push(point);
    }
}