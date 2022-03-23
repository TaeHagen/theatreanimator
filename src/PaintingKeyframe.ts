import type { Path } from "./Path";
import { Point, PointUtils } from "./Point";

export class PaintingKeyframe {
    constructor (public point: Point) {};
    
    speed: number = 500;

    flatten() {
        return {
            point: PointUtils.flatten(this.point),
            speed: this.speed
        }
    }

    static restore(data: any) {
        const p = new PaintingKeyframe(PointUtils.restore(data.point))
        p.speed = data.speed;
        return p;
    }

    apply(path: Path) {
        path.effectivePointsPerSeconds = this.speed;
    }
}