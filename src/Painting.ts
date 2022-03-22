import { Path } from "./Path";

export class Painting {
    paths: Path[] = [new Path()];

    addPath() {
        const path = new Path();
        this.paths.push(path);
        return path;
    }
}