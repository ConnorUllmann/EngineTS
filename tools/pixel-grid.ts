import { Color } from '@engine-ts/visuals/color';
import { IPoint, IRectangle } from '@engine-ts/geometry/interfaces';
import { Geometry } from '@engine-ts/geometry/geometry';
import { IGrid, Grid } from '@engine-ts/geometry/grid';
import { Point } from '@engine-ts/geometry/point';
import { CompassDirection, CompassDirectionGroup } from '@engine-ts/geometry/compass';
import { DeepReadonly } from '@engine-ts/core/utils';
import { CameraContext } from '@engine-ts/visuals/camera-context';

export class PixelGrid implements IGrid<Color> {
    public context: OffscreenCanvasRenderingContext2D;
    private imageData: ImageData;
    public imageSmoothingEnabled: boolean = false;

    public get w(): number { return this.canvas.width; }
    public get h(): number { return this.canvas.height; }

    constructor(public readonly canvas: OffscreenCanvas) {
        this.context = canvas.getContext("2d")!;
        this.refreshImageData();
    }

    private transformXYToIndex({ x, y }: IPoint): number {
        return 4 * (Math.floor(x) + Math.floor(y) * this.w);
    };

    private transformIndexToXY(index: number): IPoint {
        index /= 4;
        return {
            x: index % this.w,
            y: Math.floor(index / this.w)
        };
    };

    // TODO: optional rectangle input to define what part of the image to use (null means all of it)
    public refreshImageData(): this {
        this.imageData = this.getImageData();
        return this;
    };

    // TODO: optional rectangle input to define what part of the image to use (null means all of it)
    public getImageData() {
        return this.context.getImageData(0, 0, this.w, this.h);
    };

    // Applies the changes made to the pixels in the grid to the actual canvas itself
    public putImageData(): this {
        this.context.putImageData(this.imageData, 0, 0);
        return this;
    };

    // filter = Function that takes in an (x, y) position and a function which can retrieve the color of any pixel
    //          in the canvas given its (x, y) position. It returns the resulting filtered Color.
    public applyFilter(filter: (position: IPoint, getColor: (position: IPoint) => Color | null) => DeepReadonly<Color>) {
        this.setEach((position) => filter(position, (position) => this.get(position)));
        this.putImageData();
    };

    // Necessary if you're going to use the values of neighboring pixels so that they aren't partially updated
    // Note: it's slower than .applyFilter()
    public applyFilterWithBuffer(filter: (position: IPoint, getColor: (position: IPoint) => Color | null) => DeepReadonly<Color>): this {
        const pixelGridTemp = new PixelGrid(this.canvas);
        pixelGridTemp.setEach((position) => filter(position, (p) => this.get(p)));
        this.setEach((position) => pixelGridTemp.get(position)!);
        this.putImageData();
        return this;
    };

    public renderToContext(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
        position: IPoint=Geometry.Point.Zero,
        scale: IPoint=Geometry.Point.One,
        section: IRectangle={ x:0, y:0, w:this.canvas.width, h:this.canvas.height }
    ) {
        context.drawImage(this.canvas,
            section.x, section.y, section.w, section.h,
            position.x, position.y, section.w * scale.x, section.h * scale.y);
    };

    public draw(cameraContext: CameraContext, position: IPoint=Geometry.Point.Zero, scale: IPoint=Geometry.Point.One, section?: IRectangle) {
        const imageSmoothingEnabled = cameraContext.context.imageSmoothingEnabled;
        cameraContext.context.imageSmoothingEnabled = this.imageSmoothingEnabled;
        if(section != null)
            this.renderToContext(cameraContext.context, Geometry.Point.Subtract(position, cameraContext.camera), scale, section);
        else
            this.renderToContext(cameraContext.context, Geometry.Point.Subtract(position, cameraContext.camera), scale);
        cameraContext.context.imageSmoothingEnabled = imageSmoothingEnabled;
    };

    public isInside({ x, y }: IPoint): boolean {
        return y >= 0 && y < this.h && x >= 0 && x < this.w;
    }

    public set(position: IPoint, color: DeepReadonly<Color>): this {
        if(this.isInside(position)) {
            const index = this.transformXYToIndex(position);
            this.imageData.data[index] = color.red;
            this.imageData.data[index+1] = color.green;
            this.imageData.data[index+2] = color.blue;
            this.imageData.data[index+3] = color.alpha * 255;
        }
        return this;
    };

    public get(position: IPoint): Color | null {
        if(!this.isInside(position))
            return null;
        const index = this.transformXYToIndex(position);
        return new Color(
            this.imageData.data[index],
            this.imageData.data[index+1],
            this.imageData.data[index+2],
            this.imageData.data[index+3] / 255
        );
    };

    public getNeighbors(position: IPoint, relativePoints: IPoint[]): { position: IPoint, tile: Color | null }[] {
        return Grid.GetNeighbors<Color>(this, position, relativePoints);
    }

    public getCompassDirectionNeighbors(position: IPoint, compassDirections: CompassDirection[]): { position: IPoint, tile: Color | null }[] {
        return Grid.GetCompassDirectionNeighbors<Color>(this, position, compassDirections);
    }

    public getCompassDirectionGroupNeighbors(position: IPoint, directionalNeighbors: CompassDirectionGroup=CompassDirectionGroup.CARDINAL): { position: IPoint, tile: Color | null }[] {
        return Grid.GetCompassDirectionGroupNeighbors<Color>(this, position, directionalNeighbors);
    }

    public setEach(getColor: (position: IPoint) => DeepReadonly<Color>): this {
        const position = new Point();
        for(let y = 0; y < this.h; y++)
        for(let x = 0; x < this.w; x++) {
            position.setToXY(x, y);
            this.set(position, getColor(position));
        }
        return this;
    };

    public forEachWithGetter(pixelCall: (position: IPoint, getColor: (position: IPoint) => Color) => void): this {
        const position = new Point();
        for(let y = 0; y < this.h; y++)
        for(let x = 0; x < this.w; x++) {
            position.setToXY(x, y);
            pixelCall(position, (p) => this.get(p)!);
        }
        return this;
    }

    public forEach(pixelCall: (color: Color, position: IPoint) => void): this {
        const position = new Point();
        for(let y = 0; y < this.h; y++)
        for(let x = 0; x < this.w; x++) {
            position.setToXY(x, y);
            pixelCall(this.get(position)!, position);
        }
        return this;
    };

    public map<U>(getColor: (position: IPoint, color: Color) => U): U[] {
        const results: U[] = [];
        const position = new Point();
        for(let y = 0; y < this.h; y++)
        for(let x = 0; x < this.w; x++) {
            position.setToXY(x, y);
            results.push(getColor(position, this.get(position)!));
        }
        return results;
    }
}