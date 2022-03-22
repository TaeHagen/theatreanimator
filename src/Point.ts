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
    }
}