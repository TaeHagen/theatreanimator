import type { Path } from "./Path";
import type { Point } from "./Point";

export class PaintingKeyframe {
    constructor (public point: Point) {};
    
    speed: number = 500;

    apply(path: Path) {
        path.pointsPerSecond = this.speed;
    }
}