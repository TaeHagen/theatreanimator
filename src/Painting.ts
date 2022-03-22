import { Path } from "./Path";

export class Painting {
    paths: Path[] = [];

    addPath() {
        const path = new Path();
        this.paths.push(path);
        return path;
    }
}