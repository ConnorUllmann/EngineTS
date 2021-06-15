import { Color } from './color';
import { World } from '@engine-ts/core/world';
import { tau, Halign, Valign, DeepReadonly, enumToList } from '@engine-ts/core/utils';
import { ColorStopArray } from './color-stop-array';
import { BlendMode } from './blend-mode';
import { ICircle, IPoint, ITriangle, IRectangle, ILine, IRay, ISegment, IPolygon } from '@engine-ts/geometry/interfaces';
// TODO: use IPoint everywhere instead
import { Point } from '@engine-ts/geometry/point';
import { Geometry, Shape } from '@engine-ts/geometry/geometry';
import { Images } from '@engine-ts/core/images';

export type FillStyle = DeepReadonly<Color> | string | null;
export type StrokeStyle = FillStyle;
export type HalignAll = Halign | "left" | "center" | "right" | "start" | "end";
export type ValignAll = Valign | "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";

export interface CameraContext {
    camera: IPoint,
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
}

export interface ImagesCameraContext extends CameraContext {
    images: Images
}

export enum OutlinePlacement {
    FullyInner='FullyInner',
    FullyOuter='FullyOuter',
    InnerFirst='InnerFirst',
    OuterFirst='OuterFirst',
    Default='Default',
}
export const OutlinePlacements = enumToList(OutlinePlacement);

// TODO: remove world from this doc and instead create a world.draw property which has all these
// same functions and simply calls the below functions after applying the world's camera position, zoom level, etc.
export class Draw {
    // TODO: add generic shape-drawing function
    // public static shape(world: CameraContext, shape: Shape, fillStyle: FillStyle=null) {}


    // "position" refers to the top-left corner of the image in world space
    // "center" refers to the point in world space around which to rotate the image were it to be drawn at "position"
    public static image(world: ImagesCameraContext, imageName: string, position: DeepReadonly<IPoint>, scale: DeepReadonly<IPoint>=Geometry.Point.One, angle: number=0, center?:DeepReadonly<IPoint>, alpha:number=1) {
        const context = world.context;
        const image = world.images.get(imageName);
        if(!image) {
            return;
        }

        const w = Math.abs(scale.x * (image.width as number));
        const h = Math.abs(scale.y * (image.height as number));

        const globalAlphaPrevious = context.globalAlpha;
        context.globalAlpha = alpha;

        const cx = (center?.x ?? (position.x + w/2)) - world.camera.x;
        const cy = (center?.y ?? (position.y + h/2)) - world.camera.y;
        const px = position.x + w/2 - world.camera.x;
        const py = position.y + h/2 - world.camera.y;
        context.translate(cx, cy);
        if(angle !== 0)
            context.rotate(angle);
        context.scale(Math.sign(scale.x), Math.sign(scale.y));
        context.translate(px - cx, py - cy);
        context.drawImage(image, -w/2, -h/2, w, h);
        context.resetTransform();

        context.globalAlpha = globalAlphaPrevious;
    }
    
    // "position" refers to the top-left corner of the image in world space
    // "center" refers to the point in world space around which to rotate the image were it to be drawn at "position"
    public static imagePart(world: ImagesCameraContext, imageName: string, position: DeepReadonly<IPoint>, sx: number, sy: number, sw: number, sh: number, scale: DeepReadonly<IPoint>=Geometry.Point.One, angle: number=0, center?:DeepReadonly<IPoint>, alpha:number=1) {
        const context = world.context;
        const image = world.images.get(imageName);
        if(!image) {
            return;
        }
        const w = Math.abs(scale.x * sw);
        const h = Math.abs(scale.y * sh);

        const globalAlphaPrevious = context.globalAlpha;
        context.globalAlpha = alpha;

        const cx = (center?.x ?? (position.x + w/2)) - world.camera.x;
        const cy = (center?.y ?? (position.y + h/2)) - world.camera.y;
        const px = position.x + w/2 - world.camera.x;
        const py = position.y + h/2 - world.camera.y;
        context.translate(cx, cy);
        if(angle !== 0)
            context.rotate(angle);
        context.scale(Math.sign(scale.x), Math.sign(scale.y));
        context.translate(px - cx, py - cy);
        context.drawImage(image, sx, sy, sw, sh, -w/2, -h/2, w, h);
        context.resetTransform();

        context.globalAlpha = globalAlphaPrevious;
    }

    private static styleToString(style: FillStyle | StrokeStyle): string {
        return style instanceof Color ? Color.ToString(style) : (style as string).toString();
    }

    public static circleArc(world: CameraContext, circle: DeepReadonly<ICircle>, startAngle: number, endAngle: number, fillStyle: FillStyle=null) {
        if(circle.r <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.arc(circle.x - world.camera.x, circle.y - world.camera.y, circle.r, startAngle, endAngle);
        if(fillStyle)
            context.fillStyle = this.styleToString(fillStyle);
        context.fill();
    }

    public static circleArcOutline(world: CameraContext, circle: DeepReadonly<ICircle>, startAngle: number, endAngle: number, strokeStyle: StrokeStyle=null, lineWidth: number=1, outlinePlacement: OutlinePlacement=OutlinePlacement.Default) {
        if(lineWidth <= 0)
            return;
        const r = this.applyOutlinePlacement(circle.r, lineWidth, outlinePlacement);
        if(r <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.arc(circle.x - world.camera.x, circle.y - world.camera.y, r, startAngle, endAngle);
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.lineWidth = lineWidth;
        context.stroke();
    }

    public static circle(world: CameraContext, circle: DeepReadonly<ICircle>, fillStyle: FillStyle=null) {
        this.circleArc(world, circle, 0, tau, fillStyle);
    };

    public static circleOutline(world: CameraContext, circle: DeepReadonly<ICircle>, strokeStyle: StrokeStyle=null, lineWidth: number=1, outlinePlacement: OutlinePlacement=OutlinePlacement.Default) {
        if(lineWidth <= 0)
            return;
        const r = this.applyOutlinePlacement(circle.r, lineWidth, outlinePlacement);
        if(r <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.arc(circle.x - world.camera.x, circle.y - world.camera.y, r, 0, tau);
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.stroke();
    };

    // same as circleOutline except you specify the inner and outer radii
    public static ring(world: CameraContext, position: DeepReadonly<IPoint>, innerRadius: number, outerRadius: number, strokeStyle: StrokeStyle=null) {
        if(outerRadius < innerRadius) {
            const temp = outerRadius;
            outerRadius = innerRadius;
            innerRadius = temp;
        }
        if(outerRadius <= 0)
            return;
        const lineWidth = outerRadius - innerRadius;
        const radius = (outerRadius + innerRadius) / 2;
        Draw.circleOutline(world, { x: position.x, y: position.y, r: radius }, strokeStyle, lineWidth);
    };

    public static ovalArc(world: CameraContext, position: DeepReadonly<IPoint>, xRadius: number, yRadius: number, startAngle: number, endAngle: number, fillStyle: FillStyle=null, angle: number=0) {
        if(xRadius <= 0 || yRadius <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.ellipse(position.x - world.camera.x, position.y - world.camera.y, xRadius, yRadius, angle, startAngle, endAngle);
        if(fillStyle)
            context.fillStyle = this.styleToString(fillStyle);
        context.fill();
    };

    public static oval(world: CameraContext, position: DeepReadonly<IPoint>, xRadius: number, yRadius: number, fillStyle: FillStyle=null, angle: number=0) {
        this.ovalArc(world, position, xRadius, yRadius, 0, tau, fillStyle, angle);
    };

    public static ovalOutline(world: CameraContext, position: DeepReadonly<IPoint>, xRadius: number, yRadius: number, strokeStyle: StrokeStyle=null, angle: number=0, lineWidth: number=1, outlinePlacement: OutlinePlacement=OutlinePlacement.Default) {
        xRadius = this.applyOutlinePlacement(xRadius, lineWidth, outlinePlacement);
        yRadius = this.applyOutlinePlacement(yRadius, lineWidth, outlinePlacement);
        if(xRadius <= 0 || yRadius <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.ellipse(position.x - world.camera.x, position.y - world.camera.y, xRadius, yRadius, angle, 0, tau);
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.stroke();
    };

    public static triangle(world: CameraContext, triangle: DeepReadonly<ITriangle>, fillStyle: FillStyle=null) {
        const context = world.context;
        context.beginPath();
        context.moveTo(triangle.a.x - world.camera.x, triangle.a.y - world.camera.y);
        context.lineTo(triangle.b.x - world.camera.x, triangle.b.y - world.camera.y);
        context.lineTo(triangle.c.x - world.camera.x, triangle.c.y - world.camera.y);
        if(fillStyle)
            context.fillStyle = this.styleToString(fillStyle);
        context.fill();
    };

    public static triangleOutline(world: CameraContext, triangle: DeepReadonly<ITriangle>, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        const context = world.context;
        context.beginPath();
        context.moveTo(triangle.a.x - world.camera.x, triangle.a.y - world.camera.y);
        context.lineTo(triangle.b.x - world.camera.x, triangle.b.y - world.camera.y);
        context.lineTo(triangle.c.x - world.camera.x, triangle.c.y - world.camera.y);
        context.closePath();
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.stroke();
    };

    public static polygon(world: CameraContext, { vertices }: DeepReadonly<IPolygon>, fillStyle: FillStyle=null) {
        const vertexFirst = vertices.first();
        if(vertexFirst == null)
            return;
        const context = world.context;
        context.beginPath();
        context.moveTo(vertexFirst.x - world.camera.x, vertexFirst.y - world.camera.y);
        for(let i = 1; i < vertices.length; i++)
            context.lineTo(vertices[i].x - world.camera.x, vertices[i].y - world.camera.y);
        context.closePath();
        if(fillStyle)
            context.fillStyle = this.styleToString(fillStyle);
        context.fill();
    };

    public static polygonOutline(world: CameraContext, { vertices }: DeepReadonly<IPolygon>, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        const vertexFirst = vertices.first();
        if(vertexFirst == null)
            return;
        const context = world.context;
        context.beginPath();
        context.moveTo(vertexFirst.x - world.camera.x, vertexFirst.y - world.camera.y);
        for(let i = 1; i < vertices.length; i++)
            context.lineTo(vertices[i].x - world.camera.x, vertices[i].y - world.camera.y);
        context.closePath();
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.stroke();
    };

    public static regularPolygon(world: CameraContext, position: DeepReadonly<IPoint>, radius: number, sides: number, fillStyle: FillStyle=null, angle: number=0) {
        const context = world.context;
        const points = Draw._getRegularPolygonPoints(position, radius, sides, angle);
        if(points.length <= 0)
            return;
        context.beginPath();
        for(let i = 0; i < points.length; i++)
        {
            const point = points[i].subtract(world.camera);
            if(i === 0)
                context.moveTo(point.x, point.y);
            else
                context.lineTo(point.x, point.y);
        }
        if(fillStyle)
            context.fillStyle = this.styleToString(fillStyle);
        context.fill();
    };

    public static regularPolygonOutline(world: CameraContext, position: DeepReadonly<IPoint>, radius: number, sides: number, strokeStyle: StrokeStyle=null, angle: number=0, lineWidth: number=1) {
        const context = world.context;
        const points = Draw._getRegularPolygonPoints(position, radius, sides, angle);
        const pointFirst = points.first();
        if(pointFirst == null)
            return;
        points.push(pointFirst);
        context.beginPath();
        for(let i = 0; i < points.length; i++)
        {
            const point = points[i].subtract(world.camera);
            if(i === 0)
                context.moveTo(point.x, point.y);
            else
                context.lineTo(point.x, point.y);
        }
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.stroke();
    };

    private static _getRegularPolygonPoints(position: DeepReadonly<IPoint>, radius: number, sides: number, angle: number): Point[] {
        if(sides <= 0)
            throw `Cannot create a regular polygon with ${sides} sides`;
        const points: Point[] = [];
        for(let i = 0; i < sides; i++)
        {
            const angleToCorner = tau * i / sides + angle;
            const point = Point.Vector(radius, angleToCorner).add(position);
            points.push(point);
        }
        return points;
    };

    public static rectangle(world: CameraContext, rectangle: DeepReadonly<IRectangle>, fillStyle: FillStyle=null, angle: number=0, center?: DeepReadonly<IPoint>) {        
        const context = world.context;
        if(fillStyle)
            context.fillStyle = this.styleToString(fillStyle);

        if(angle === 0) {
            context.fillRect(rectangle.x - world.camera.x, rectangle.y - world.camera.y, rectangle.w, rectangle.h);
            return;
        }
        
        center = center || Geometry.Rectangle.Center(rectangle);
        center = Geometry.Point.Subtract(center, world.camera)
        context.translate(center.x, center.y);
        context.rotate(angle);
        context.fillRect(rectangle.x - world.camera.x - center.x, rectangle.y - world.camera.y - center.y, rectangle.w, rectangle.h);
        context.resetTransform();
    };
    
    private static applyOutlinePlacement(value: number, lineWidth: number, outlinePlacement: OutlinePlacement): number {
        switch(outlinePlacement) {
            case OutlinePlacement.FullyInner:
                return value - lineWidth/2;
            case OutlinePlacement.FullyOuter:
                return value + lineWidth/2;
            case OutlinePlacement.InnerFirst:
                return value - 0.5 + 0.5 * Math.abs(lineWidth % 2 - 1)
            case OutlinePlacement.OuterFirst:
                return value + 0.5 - 0.5 * Math.abs(lineWidth % 2 - 1)
            default:
                return value;
        }
    }

    public static rectangleOutline(world: CameraContext, rectangle: DeepReadonly<IRectangle>, strokeStyle: StrokeStyle=null, angle: number = 0, lineWidth: number=1, outlinePlacement: OutlinePlacement=OutlinePlacement.InnerFirst) {
        let points: IPoint[] = Geometry.Rectangle.Vertices(Geometry.Rectangle.Expand(rectangle, this.applyOutlinePlacement(0, lineWidth, outlinePlacement)))
        if(angle !== 0) {
            const center = new Point(rectangle.x + rectangle.w/2, rectangle.y + rectangle.h/2);
            points = points.map(point => Geometry.Point.Rotate(point, angle, center));
        }
        Draw.path(world, points, strokeStyle, lineWidth, true);
    };
    
    public static rectangleGradientVertical(world: CameraContext, rectangle: DeepReadonly<IRectangle>, colorStopArray: DeepReadonly<ColorStopArray>) {
        const context = world.context;
        const diff = new Point(rectangle.x, rectangle.y).subtract(world.camera);
        const gradient = context.createLinearGradient(diff.x, diff.y, diff.x, diff.y + rectangle.h);
        ColorStopArray.ApplyToGradient(colorStopArray, gradient);
        context.fillStyle = gradient;
        context.fillRect(diff.x, diff.y, rectangle.w, rectangle.h);
    };
    
    public static rectangleGradientHorizontal(world: CameraContext, rectangle: DeepReadonly<IRectangle>, colorStopArray: DeepReadonly<ColorStopArray>) {
        const context = world.context;
        const diff = new Point(rectangle.x, rectangle.y).subtract(world.camera);
        const gradient = context.createLinearGradient(diff.x, diff.y, diff.x + rectangle.w, diff.y);
        ColorStopArray.ApplyToGradient(colorStopArray, gradient);
        context.fillStyle = gradient;
        context.fillRect(diff.x, diff.y, rectangle.w, rectangle.h);
    };
    
    public static circleArcGradient(world: CameraContext, circle: DeepReadonly<ICircle>, colorStopArray: DeepReadonly<ColorStopArray>, startAngle: number=0, endAngle: number=tau, alpha: number=1) {
        const context = world.context;
        const diff = new Point(circle.x, circle.y).subtract(world.camera);

        const globalAlphaPrevious = context.globalAlpha;
        context.globalAlpha = alpha;

        const gradient = context.createRadialGradient(diff.x, diff.y, 0, diff.x, diff.y, circle.r);
        ColorStopArray.ApplyToGradient(colorStopArray, gradient);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(circle.x - world.camera.x, circle.y - world.camera.y, circle.r, startAngle, endAngle);
        context.fill();

        context.globalAlpha = globalAlphaPrevious;        
    };

    private static rectangleRoundedPath(world: CameraContext, rectangle: DeepReadonly<IRectangle>, radius: number, angle: number, center: DeepReadonly<IPoint> | undefined, lineWidth: number, outlinePlacement: OutlinePlacement) {
        const context = world.context;
        const outlinePlacementDiff = this.applyOutlinePlacement(0, lineWidth, outlinePlacement);
        radius += outlinePlacementDiff;
        rectangle = Geometry.Rectangle.Expand(rectangle, outlinePlacementDiff);
        center = center || Geometry.Point.Subtract(Geometry.Rectangle.Center(rectangle), world.camera);
        context.translate(center.x, center.y);
        context.rotate(angle);

        const xOffset = -world.camera.x - center.x;
        const yOffset = -world.camera.y - center.y;
        const xRightHor = rectangle.x + rectangle.w + xOffset;
        const xRightVer = xRightHor - radius;
        const xLeftHor = rectangle.x + xOffset;
        const xLeftVer = xLeftHor + radius;
        const yTopVer = rectangle.y + yOffset;
        const yTopHor = yTopVer + radius;
        const yBottomVer = rectangle.y + rectangle.h + yOffset;
        const yBottomHor = yBottomVer - radius;
        context.beginPath();
        context.moveTo(xLeftVer, yTopVer);
        context.lineTo(xRightVer, yTopVer);
        context.quadraticCurveTo(xRightHor, yTopVer, xRightHor, yTopHor);
        context.lineTo(xRightHor, yBottomHor);
        context.quadraticCurveTo(xRightHor, yBottomVer, xRightVer, yBottomVer);
        context.lineTo(xLeftVer, yBottomVer);
        context.quadraticCurveTo(xLeftHor, yBottomVer, xLeftHor, yBottomHor);
        context.lineTo(xLeftHor, yTopHor);
        context.quadraticCurveTo(xLeftHor, yTopVer, xLeftVer, yTopVer);

        context.resetTransform();
    }

    public static rectangleRounded(world: CameraContext, rectangle: DeepReadonly<IRectangle>, radius: number, fillStyle: FillStyle=null, angle: number=0, center?: DeepReadonly<IPoint>) {
        const context = world.context;
        this.rectangleRoundedPath(world, rectangle, radius, angle, center, 1, OutlinePlacement.Default);
        if(fillStyle)
            context.fillStyle = this.styleToString(fillStyle);
        context.fill();
    }

    public static rectangleRoundedOutline(world: CameraContext, rectangle: DeepReadonly<IRectangle>, radius: number, strokeStyle: StrokeStyle=null, angle: number=0, center?: DeepReadonly<IPoint>, lineWidth: number=1, outlinePlacement: OutlinePlacement=OutlinePlacement.InnerFirst) {
        const context = world.context;
        this.rectangleRoundedPath(world, rectangle, radius, angle, center, lineWidth, outlinePlacement);
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.stroke();
    }

    public static line(world: World, line: DeepReadonly<ILine>, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        if(lineWidth <= 0)
            return;

        const points = world.camera.lineIntersections(line);
        if(points.length < 2)
            return;

        const context = world.context;
        context.beginPath();
        context.moveTo(points[0].x - world.camera.x, points[0].y - world.camera.y);
        context.lineTo(points[1].x - world.camera.x, points[1].y - world.camera.y);
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.lineWidth = lineWidth;
        context.stroke();
    };

    public static ray(world: World, ray: DeepReadonly<IRay>, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        if(lineWidth <= 0)
            return;

        const context = world.context;
        const points = world.camera.rayIntersections(ray);
        if(points.length === 1) {
            context.beginPath();
            context.moveTo(ray.a.x - world.camera.x, ray.a.y - world.camera.y);
            context.lineTo(points[0].x - world.camera.x, points[0].y - world.camera.y);
            if(strokeStyle)
                context.strokeStyle = this.styleToString(strokeStyle);
            context.lineWidth = lineWidth;
            context.stroke();
            return;
        }  

        if(points.length !== 2)
            return;

        context.beginPath();
        context.moveTo(points[0].x - world.camera.x, points[0].y - world.camera.y);
        context.lineTo(points[1].x - world.camera.x, points[1].y - world.camera.y);
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.lineWidth = lineWidth;
        context.stroke();
    };

    public static segment(world: CameraContext, segment: DeepReadonly<ISegment>, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        if(lineWidth <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.moveTo(segment.a.x - world.camera.x, segment.a.y - world.camera.y);
        context.lineTo(segment.b.x - world.camera.x, segment.b.y - world.camera.y);
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.lineWidth = lineWidth;
        context.stroke();
    };

    public static path(world: CameraContext, points: DeepReadonly<IPoint[]>, strokeStyle: StrokeStyle=null, lineWidth: number=1, closePath: boolean=false) {
        if(lineWidth <= 0 || points.length <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.moveTo(points[0].x - world.camera.x, points[0].y - world.camera.y);
        for(let i = 1; i < points.length; i++)
            context.lineTo(points[i].x - world.camera.x, points[i].y - world.camera.y);
        if(closePath)
            context.closePath();
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.lineWidth = lineWidth;
        context.stroke();
    };

    // TODO: add closePath argument
    public static bezierPath(world: CameraContext, points: DeepReadonly<IPoint[]>, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        if(lineWidth <= 0 || points.length <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.moveTo(points[0].x - world.camera.x, points[0].y - world.camera.y);
        for(let i = 1; i < points.length-1; i++) {
            const previous = points[i-1];
            const current = points[i];
            const next = points[i+1];
            const xPreviousMid = (previous.x + current.x) / 2;
            const yPreviousMid = (previous.y + current.y) / 2;
            const xNextMid = (next.x + current.x) / 2;
            const yNextMid = (next.y + current.y) / 2;
            context.bezierCurveTo(
                xPreviousMid - world.camera.x, yPreviousMid - world.camera.y,
                current.x - world.camera.x, current.y - world.camera.y,
                xNextMid - world.camera.x, yNextMid - world.camera.y
            );
            if(i === points.length-2) {
                context.lineTo(next.x - world.camera.x, next.y - world.camera.y);
            }
        }
        if(strokeStyle)
            context.strokeStyle = this.styleToString(strokeStyle);
        context.lineWidth = lineWidth;
        context.stroke();
    };

    public static text(world: CameraContext, text: string, position: DeepReadonly<IPoint>, fillStyle: FillStyle=null, font: string | null=null, halign:HalignAll="left", valign:ValignAll="top", angle: number=0, center?: DeepReadonly<IPoint>) {
        const context = world.context;
        Draw.textStyle(world, fillStyle, font, halign, valign);
        if(angle !== 0) {
            const xCenter = center != null
                ? (center.x - world.camera.x)
                : (position.x + Draw.textWidth(world, text)/2 - world.camera.x)
            const yCenter = center != null
                ? (center.y - world.camera.y)
                : (position.y + Draw.textHeight(world)/2 - world.camera.y)
            context.translate(xCenter, yCenter);
            context.rotate(angle);
            context.fillText(text, position.x - world.camera.x - xCenter, position.y - world.camera.y - yCenter);
            context.resetTransform();
            return;
        }
        context.fillText(text, position.x - world.camera.x, position.y - world.camera.y);
    };

    public static textStyle(world: CameraContext, fillStyle: FillStyle=null, font: string | null=null, halign?: HalignAll, valign?: ValignAll) {
        const context = world.context;
        if(font)
            context.font = font;
        if(halign)
            context.textAlign = halign;
        if(fillStyle)
            context.fillStyle = this.styleToString(fillStyle);
        if(valign)
            context.textBaseline = valign;
    };

    public static textWidth(world: CameraContext, text: string, font: string | null=null) {
        const context = world.context;
        if(font)
            context.font = font;
        return context.measureText(text).width;
    };

    // uses width of a capital 'M' to estimate height of text
    public static textHeight(world: CameraContext, font: string | null=null) {
        const context = world.context;
        if(font)
            context.font = font;
        return context.measureText('M').width;
    }

    // Example:
    // Draw.applyBlendMode(world, BlendMode.Overlay, () =>
    // {
    //     Draw.circle(world, 50, 50, 10, Color.red);
    // });
    public static applyBlendMode({ context }: Pick<CameraContext, 'context'>, blendMode: BlendMode, drawCall: () => void)
    {
        const blendModeOriginal = context.globalCompositeOperation.toString();
        context.globalCompositeOperation = blendMode;
        drawCall();
        context.globalCompositeOperation = blendModeOriginal;
    };

    public static applyShadow({ context }: CameraContext, shadowColor: FillStyle, shadowBlur: number, shadowOffset: IPoint=Geometry.Point.Zero, drawCall: () => void) {
        const previousShadowColor = context.shadowColor;
        const previousShadowOffsetX = context.shadowOffsetX;
        const previousShadowOffsetY = context.shadowOffsetY;
        const previousShadowBlur = context.shadowBlur;
        if(shadowColor)
            context.shadowColor = this.styleToString(shadowColor);
        context.shadowOffsetX = shadowOffset.x;
        context.shadowOffsetY = shadowOffset.y;
        context.shadowBlur = shadowBlur;
        drawCall();
        context.shadowColor = previousShadowColor;
        context.shadowOffsetX = previousShadowOffsetX;
        context.shadowOffsetY = previousShadowOffsetY;
        context.shadowBlur = previousShadowBlur;
    }
}