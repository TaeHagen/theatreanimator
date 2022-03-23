export type Point = number[];

export const PointUtils = {
    createPoint(x: number, y: number, timeValue: number, brushSize: number) {
        return [x, y, timeValue, brushSize];
    },
	parsePointX(point: Point) {
        return point[0];
    },
	parsePointY(point: Point) {
        return point[1];
    },
	parsePointTime(point: Point) {
        return point[2];
    },
    parseBrushSize(point: Point) {
        return point[3];
    },
    flatten(point: Point) {
        return {
            x: PointUtils.parsePointX(point),
            y: PointUtils.parsePointY(point),
            time: PointUtils.parsePointTime(point),
            brushSize: PointUtils.parseBrushSize(point),
        }
    },
    restore(data: any): Point {
        return PointUtils.createPoint(data.x, data.y, data.time, data.brushSize);
    }
}