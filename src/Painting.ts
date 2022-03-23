import { Path } from "./Path";

export class Painting {
    paths: Path[] = [new Path()];

    addPath() {
        const path = new Path();
        this.paths.push(path);
        return path;
    }

    flatten() {
        return {
            paths: this.paths.map(p => p.flatten()),
        }
    }

    get clean() {
        return this.paths.every(p => p.clean);
    }

    static restore(data: any) {
        const painting = new Painting();
        painting.paths = data.paths.map(p => Path.restore(p));
        return painting;
    }
}