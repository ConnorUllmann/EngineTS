import { Rectangle } from '../geometry/rectangle';
import { Point } from '../geometry/point';
import { IPoint, IRectangle } from '@engine-ts/geometry/interfaces';
import { Geometry } from '@engine-ts/geometry/geometry';

export class Camera extends Rectangle {
    public get w(): number { return this.canvas.width; }
    public get h(): number { return this.canvas.height; }

    // TODO: add ability to set zoom level; check if setting screen resolution is all you need to do?

    constructor(private readonly canvas: { width: number, height: number, clientWidth: number, clientHeight: number }) {
        super(0, 0, canvas.width, canvas.height);
    }

    public get canvasScale(): Point {
        return new Point(
            this.w / this.canvas.clientWidth,
            this.h / this.canvas.clientHeight
        );
    }

    public isRectangleVisible(rectangle: IRectangle, margin: number=0): boolean {
        return Geometry.CollideExplicit.RectangleRectangle(
            this.x - margin,
            this.y - margin,
            this.w + 2 * margin,
            this.h + 2 * margin,
            rectangle.x,
            rectangle.y,
            rectangle.w,
            rectangle.h
        )
    }
    
    public isPointVisible(position: IPoint, margin: number=0): boolean {
        return Geometry.CollideExplicit.RectanglePoint(
            this.x - margin,
            this.y - margin,
            this.w + 2 * margin,
            this.h + 2 * margin,
            position.x,
            position.y,
        )
    }
}