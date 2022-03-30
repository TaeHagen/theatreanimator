import { Path } from "./Path";

export class Painting {
    paths: Path[] = [new Path()];
    backgroundColor: string = "#FFFFFF";
    desiredTime: number = 0;
    fadeTime: number = 1;

    addPath() {
        const path = new Path();
        this.paths.push(path);
        return path;
    }

    findPathAtPoint(x: number, y: number) {
        return this.paths.find(p => p.isPointInPath(x, y));
    }

    flatten() {
        return {
            paths: this.paths.map(p => p.flatten()),
            backgroundColor: this.backgroundColor,
            desiredTime: this.desiredTime,
            fadeTime: this.fadeTime
        }
    }

    get clean() {
        return this.paths.every(p => p.clean);
    }

    static restore(data: any) {
        const painting = new Painting();
        painting.paths = data.paths.map(p => Path.restore(p));
        painting.backgroundColor = data.backgroundColor;
        if (data.desiredTime != null)
            painting.desiredTime = data.desiredTime;
        if (data.fadeTime != null)
            painting.fadeTime = data.fadeTime;
        return painting;
    }
}