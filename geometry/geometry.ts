import { RNG } from '@engine-ts/core/rng';
import { tau, clamp, moduloSafe, binomialCoefficient, Halign, Valign, DeepReadonly, rng, angle90 } from '@engine-ts/core/utils';
import { ISegment, IPoint, ICircle, ITriangle, IRectangle, IPointPair, IPolygon, ILine, PointPairType, IRay, IRaycastResult } from './interfaces';

export type BoundableShape = IPoint | ITriangle | IRectangle | ICircle | IPolygon | ISegment;
export type Shape = BoundableShape | IRay | ILine;

interface IGeometryStatic<T> {
    Translate: (t: DeepReadonly<T>, offset: DeepReadonly<IPoint>) => T,
    Hash: (t: DeepReadonly<T>) => string,
    // Can't add Rotate because a rectangle can't truly rotate (must be aligned with x/y axes)
    //Rotate: (t: T, angle: number, center?: DeepReadonly<IPoint>) => T,
}

interface IPointListStatic<T> extends IGeometryStatic<T> {
    Segments: (t: DeepReadonly<T>, offset?:DeepReadonly<IPoint>) => ISegment[],
    Vertices: (t: DeepReadonly<T>, offset?:DeepReadonly<IPoint>) => IPoint[],
    Circumcircle: (t: DeepReadonly<T>) => ICircle | null,
    Supertriangle: (t: DeepReadonly<T>) => ITriangle | null,
    Triangulation: (t: DeepReadonly<T>) => ITriangle[],
    Bounds: (t: DeepReadonly<T>) => IRectangle,
    Hash: (t: DeepReadonly<T>) => string
}

interface IPointsStatic extends IPointListStatic<IPoint[]> {
    Sum: (points: DeepReadonly<DeepReadonly<IPoint>[]>) => IPoint,
    BezierPoint: (points: DeepReadonly<DeepReadonly<IPoint>[]>, t: number) => IPoint,
    Bezier: (points: DeepReadonly<DeepReadonly<IPoint>[]>, count: number) => IPoint[]
}

interface IShapeStatic<T> extends IPointListStatic<T> {
    Midpoint: (o: DeepReadonly<T>) => IPoint | null,
    Area: (o: DeepReadonly<T>) => number,
}

interface ITriangleStatic extends IShapeStatic<ITriangle> {
    Midpoint: (o: DeepReadonly<ITriangle>) => IPoint,
    AreaSigned: (triangle: DeepReadonly<ITriangle>) => number,
    
    // TODO: add these to IShapeStatic<T>
    Perimeter: (triangle: DeepReadonly<ITriangle>) => number,
    Semiperimeter: (triangle: DeepReadonly<ITriangle>) => number,

    Incenter: (triangle: DeepReadonly<ITriangle>) => IPoint,
    Inradius: (triangle: DeepReadonly<ITriangle>) => number,
    InscribedCircle: (triangle: DeepReadonly<ITriangle>) => ICircle,
    Circumcircle: (t: DeepReadonly<ITriangle>) => ICircle,
    AngleA: (triangle: DeepReadonly<ITriangle>) => number,
    AngleB: (triangle: DeepReadonly<ITriangle>) => number,
    AngleC: (triangle: DeepReadonly<ITriangle>) => number,
    LengthAB: (triangle: DeepReadonly<ITriangle>) => number,
    LengthBC: (triangle: DeepReadonly<ITriangle>) => number,
    LengthCA: (triangle: DeepReadonly<ITriangle>) => number,
    AngleBisector: (bisectionVertex: DeepReadonly<IPoint>, previousVertex: DeepReadonly<IPoint>, nextVertex: DeepReadonly<IPoint>)=> IRay,
    AngleBisectorA: (triangle: DeepReadonly<ITriangle>) => IRay,
    AngleBisectorB: (triangle: DeepReadonly<ITriangle>) => IRay,
    AngleBisectorC: (triangle: DeepReadonly<ITriangle>) => IRay,
    PerpendicularBisectorAB: (triangle: DeepReadonly<ITriangle>) => ILine,
    PerpendicularBisectorBC: (triangle: DeepReadonly<ITriangle>) => ILine,
    PerpendicularBisectorCA: (triangle: DeepReadonly<ITriangle>) => ILine,
    Rotate: (triangle: DeepReadonly<ITriangle>, angle: number, center?: DeepReadonly<IPoint>) => ITriangle
}

interface IRectangleStatic extends IShapeStatic<IRectangle> {
    Midpoint: (o: DeepReadonly<IRectangle>) => IPoint,
    BoundsRectangles: (rectangles: DeepReadonly<DeepReadonly<IRectangle>[]>) => IRectangle,
    Scale: (rectangle: DeepReadonly<IRectangle>, scalar: number | DeepReadonly<IPoint>, center?: DeepReadonly<IPoint>) => IRectangle,
    // Expands this rectangle by the given amount on each side (if hAmount isn't specified, wAmount will be used)
    Expand: (rectangle: DeepReadonly<IRectangle>, wAmount: number, hAmount?: number) => IRectangle,
    RandomPointInside: (rectangle: DeepReadonly<IRectangle>, rng?: RNG) => IPoint,
    ClosestPointOutside: (rectangle: DeepReadonly<IRectangle>, position: IPoint) => IPoint,
    ClosestPointInside: (rectangle: DeepReadonly<IRectangle>, position: IPoint) => IPoint,
    Square: (center: DeepReadonly<IPoint>, sideLength: number) => IRectangle,
    Circumcircle: (t: DeepReadonly<IRectangle>) => ICircle,
    Translate: (rectangle: DeepReadonly<IRectangle>, translation: DeepReadonly<IPoint>) => IRectangle,
    Align: (rectangle: DeepReadonly<IRectangle>, halign: Halign, valign: Valign) => IRectangle,
    Center: (rectangle: DeepReadonly<IRectangle>) => IPoint,
    TopLeft: (rectangle: DeepReadonly<IRectangle>) => IPoint,
    TopRight: (rectangle: DeepReadonly<IRectangle>) => IPoint,
    BottomLeft: (rectangle: DeepReadonly<IRectangle>) => IPoint,
    BottomRight: (rectangle: DeepReadonly<IRectangle>) => IPoint,
    xLeft: (rectangle: DeepReadonly<IRectangle>) => number,
    xRight: (rectangle: DeepReadonly<IRectangle>) => number,
    yTop: (rectangle: DeepReadonly<IRectangle>) => number,
    yBottom: (rectangle: DeepReadonly<IRectangle>) => number,
}

interface IPolygonStatic extends IShapeStatic<IPolygon> {
    WindingNumber: (polygon: DeepReadonly<IPolygon>, point: DeepReadonly<IPoint>) => number,
    Rotate: (polygon: DeepReadonly<IPolygon>, angle: number, center?: DeepReadonly<IPoint>) => IPolygon
    // TODO: function for creating regular polygons (copy "_getRegularPolygonPoints" in Draw.ts)
}

interface ICircleStatic extends IGeometryStatic<ICircle> {
    Circumcircle: (circle: DeepReadonly<ICircle>) => ICircle,
    Supertriangle: (o: DeepReadonly<ICircle>) => ITriangle,
    Midpoint: (o: DeepReadonly<ICircle>) => IPoint,
    Area: (o: DeepReadonly<ICircle>) => number,
    Circumference: (o: DeepReadonly<ICircle>) => number,
    Bounds: (o: DeepReadonly<ICircle>) => IRectangle,
    RandomPointInside: (circle: DeepReadonly<ICircle>, rng?: RNG) => IPoint,
    Rotate: (circle: DeepReadonly<ICircle>, angle: number, center?: DeepReadonly<IPoint>) => ICircle,
    // returns the points on 'circle' that are tangent when they form a segment with 'point'
    TangentPoints: (circle: DeepReadonly<ICircle>, point: DeepReadonly<IPoint>) => { a: IPoint, b: IPoint } | null
}

interface IPointStatic extends IGeometryStatic<IPoint> {
    readonly Zero: DeepReadonly<{ x: 0, y: 0 }>,
    readonly One: DeepReadonly<{ x: 1, y: 1 }>,
    readonly Up: DeepReadonly<{ x: 0, y: -1 }>,
    readonly Down: DeepReadonly<{ x: 0, y: 1 }>,
    readonly Left: DeepReadonly<{ x: -1, y: 0 }>,
    readonly Right: DeepReadonly<{ x: 1, y: 0 }>,
    readonly UpRight: DeepReadonly<{ x: 1, y: -1 }>,
    readonly UpLeft: DeepReadonly<{ x: -1, y: -1 }>,
    readonly DownRight: DeepReadonly<{ x: 1, y: 1 }>,
    readonly DownLeft: DeepReadonly<{ x: -1, y: 1 }>,
    readonly CardinalDirections: DeepReadonly<[
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
    ]>,
    AreEqual: (a?: DeepReadonly<IPoint> | null, b?: DeepReadonly<IPoint> | null) => boolean,
    DistanceSq: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number,
    Distance: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number,
    Add: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => IPoint,
    Subtract: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => IPoint,
    Midpoint: (...points: DeepReadonly<DeepReadonly<IPoint>[]>) => IPoint | null,
    Angle: (point: DeepReadonly<IPoint>) => number,
    AngleTo: (to: DeepReadonly<IPoint>, from: DeepReadonly<IPoint>) => number,
    Scale: (point: DeepReadonly<IPoint>, scalar: number | DeepReadonly<IPoint>, from?: DeepReadonly<IPoint>) => IPoint,
    LengthSq: (point: DeepReadonly<IPoint>) => number,
    Length: (point: DeepReadonly<IPoint>) => number,
    Dot: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number,
    Cross: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number,
    Project: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => IPoint,
    Normalized: (point: DeepReadonly<IPoint>, length?: number) => IPoint,
    Rotate: (point: DeepReadonly<IPoint>, angle: number, center?: DeepReadonly<IPoint>) => IPoint,
    Negative: (point: DeepReadonly<IPoint>) => IPoint,
    Wiggle: (point: DeepReadonly<IPoint>, angleRangeMax: number, center?: DeepReadonly<IPoint>, rng?: RNG) => IPoint,
    Towardness: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number,
    Lerp: (from: DeepReadonly<IPoint>, to: DeepReadonly<IPoint>, t: number) => IPoint,
    Flip: (point: DeepReadonly<IPoint>, center?: DeepReadonly<IPoint>) => IPoint,
    Reflect: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>) => IPoint,
    ClampedInRectangle: (point: DeepReadonly<IPoint>, rectangle: DeepReadonly<IRectangle>) => IPoint,
    Vector: (length: number, angle: number) => IPoint,
    UnitVector: (angle: number) => IPoint,
    IsLeftCenterRightOf: (point: DeepReadonly<IPoint>, { a, b }: DeepReadonly<IPointPair>) => number,
    IsLeftOf: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>) => boolean,
    IsColinearWith: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>) => boolean,
    InsideSegmentIfColinear: (point: DeepReadonly<IPoint>, pair: DeepReadonly<ISegment>) => boolean,
    InsideRayIfColinear: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IRay>) => boolean,
    IsRightOf: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>) => boolean,
    // Returns a list of the velocity vectors a projectile would need in order to hit the (xTarget, yTarget) from (xStart, yStart)
    // given the speed of the shot and gravity. Returns 0, 1, or 2 Points (if two points, the highest-arching vector is first)
    LaunchVectors: (start: DeepReadonly<IPoint>, target: DeepReadonly<IPoint>, gravityMagnitude: number, velocityMagnitude: number) => IPoint[],
    // Returns the velocity vector a projectile would need in order to hit the (xTarget, yTarget) from (xStart, yStart)
    // given the angle of the shot and gravity.
    // Returns null if not possible. If gravityMagnitude > 0, then using angle = -Math.PI/4 will determine the speed of a shot upward at 45 degrees
    LaunchVector: (start: DeepReadonly<IPoint>, target: DeepReadonly<IPoint>, gravityMagnitude: number, angle: number) => IPoint | null,
    // Returns the velocity vector a projectile would need in order to hit the (xTarget, yTarget) from (xStart, yStart)
    // given the angle of the shot when facing to the right (and reflected over the y-axis if facing the wrong direction) and gravity.
    // Returns null if not possible. If gravityMagnitude > 0, then using angle = -Math.PI/4 will determine the speed of a shot upward at 45 degrees
    LaunchVectorReflective: (start: DeepReadonly<IPoint>, target: DeepReadonly<IPoint>, gravityMagnitude: number, angle: number) => IPoint | null,
}

interface IPointPairStatic<T extends IPointPair> {
    AreEqual: (pairA: DeepReadonly<T>, pairB: DeepReadonly<T>) => boolean,
    YatX: (pair: DeepReadonly<T>, x: number) => number | null,
    XatY: (pair: DeepReadonly<T>, y: number) => number | null,
    Slope: (pair: DeepReadonly<T>) => number,
    Hash: (pair: DeepReadonly<T>) => string,
    Translate: (pair: DeepReadonly<T>, offset: DeepReadonly<IPoint>) => T,
    ClosestPointTo: (pair: DeepReadonly<T>, point: DeepReadonly<IPoint>) => IPoint
}

interface ILineStatic extends IPointPairStatic<ILine> {
    Yintercept: (line: DeepReadonly<ILine>) => number
    YatX: (pair: DeepReadonly<ILine>, x: number) => number,
    XatY: (pair: DeepReadonly<ILine>, y: number) => number,
};

interface IRayStatic extends IPointPairStatic<IRay> {
    DefaultMaxDistance: number,
    AsSegment: (ray: DeepReadonly<IRay>, length: number) => ISegment,
    PointAtDistance: (ray: DeepReadonly<IRay>, length: number) => IPoint,
    Cast: (ray: DeepReadonly<IRay>, segments: DeepReadonly<DeepReadonly<ISegment>[]>, maxDistance: number) => IRaycastResult<ISegment> | null,
};

interface ISegmentStatic extends IPointPairStatic<ISegment> {
    Midpoint: (segment: DeepReadonly<ISegment>) => IPoint,
    PerpendicularBisector: (segment: DeepReadonly<ISegment>) => ILine,
    SharedVertex: (segmentA: DeepReadonly<ISegment>, segmentB: DeepReadonly<ISegment>) => IPoint | null,
    Bounds: (segment: DeepReadonly<ISegment>) => IRectangle,
}

export class Geometry {

    private static readonly HashDecimalDigits: number = 6;
    private static readonly Tolerance: number = 0.00000001;

    public static IsWithinToleranceOf(a: number, b: number=0): boolean {
        return Math.abs(a - b) < this.Tolerance;
    }

    public static DistanceSq(ax: number, ay: number, bx: number=0, by: number=0): number {
        return (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
    }
    public static Distance(ax: number, ay: number, bx: number=0, by: number=0): number {
        return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
    }
    public static Angle(x: number, y: number): number {
        return Math.atan2(y, x);
    }
    public static AngleDifference(to: number, from: number): number {
        return moduloSafe(to - from - Math.PI, tau) - Math.PI;
    }
    public static ReflectAngleOverXAxis(angle: number): number {
        return moduloSafe(-angle, tau);
    }
    public static ReflectAngleOverYAxis(angle: number): number {
        return moduloSafe(Math.PI - angle, tau);
    }
    public static AngleUpwardness(angle: number): number {
        return Math.abs(Geometry.AngleDifference(angle, angle90)) / (angle90) / 2
    }

    public static Point: IPointStatic = {
        Zero: { x: 0, y: 0 },
        One: { x: 1, y: 1 },
        Up: { x: 0, y: -1 },
        Down: { x: 0, y: 1 },
        Left: { x: -1, y: 0 },
        Right: { x: 1, y: 0 },
        UpRight: { x: 1, y: -1 },
        UpLeft: { x: -1, y: -1 },
        DownRight: { x: 1, y: 1 },
        DownLeft: { x: -1, y: 1 },
        CardinalDirections: [
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
        ],
        AreEqual: (a?: DeepReadonly<IPoint> | null, b?: DeepReadonly<IPoint> | null) => {
            if(a == null && b == null)
                return true;
            if(a == null || b == null)
                return false;
            return Geometry.IsWithinToleranceOf(Geometry.Point.DistanceSq(a, b))
        },
        Hash: (point: DeepReadonly<IPoint>) => `${point.x.toFixed(Geometry.HashDecimalDigits)},${point.y.toFixed(Geometry.HashDecimalDigits)}`,
        DistanceSq: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number => Geometry.DistanceSq(a.x, a.y, b.x, b.y),
        Distance: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number => Math.sqrt(Geometry.Point.DistanceSq(a, b)),
        Add: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): IPoint => ({ x: a.x + b.x, y: a.y + b.y }),
        Translate: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): IPoint => ({ x: a.x + b.x, y: a.y + b.y }),
        Subtract: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): IPoint => ({ x: a.x - b.x, y: a.y - b.y }),
        Midpoint: (...points: DeepReadonly<DeepReadonly<IPoint>[]>): IPoint | null => {
            if(points.length <= 0)
                return null;
            const sum = { x: 0, y: 0 };
            points.forEach(point => { sum.x += point.x; sum.y += point.y; });
            return {
                x: sum.x / points.length,
                y: sum.y / points.length
            };
        },
        Angle: (point: DeepReadonly<IPoint>): number => Math.atan2(point.y, point.x),
        AngleTo: (to: DeepReadonly<IPoint>, from: DeepReadonly<IPoint>): number => Math.atan2(to.y - from.y, to.x - from.x),
        Scale: (point: DeepReadonly<IPoint>, scalar: number | IPoint, from?: DeepReadonly<IPoint>): IPoint => {
            return from != null
                ? (typeof scalar === "number"
                    ? { x: (point.x - from.x) * scalar + from.x, y: (point.y - from.y) * scalar + from.y }
                    : { x: (point.x - from.x) * scalar.x + from.x, y: (point.y - from.y) * scalar.y + from.y })
                : (typeof scalar === "number"
                    ? { x: point.x * scalar, y: point.y * scalar }
                    : { x: point.x * scalar.x, y: point.y * scalar.y })
        },
        LengthSq: (point: DeepReadonly<IPoint>): number => point.x * point.x + point.y * point.y,
        Length: (point: DeepReadonly<IPoint>): number => Math.sqrt(Geometry.Point.LengthSq(point)),
        Dot: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number => a.x * b.x + a.y * b.y,
        Cross: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number => a.x * b.y - b.x * a.y,
        Project: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): IPoint => { 
            return Geometry.Point.Scale(b, Geometry.Point.Dot(a, b) / Math.max(Geometry.Point.LengthSq(b), Geometry.Tolerance)); 
        },
        Normalized: (point: DeepReadonly<IPoint>, length?: number): IPoint => {
            if((point.x === 0 && point.y === 0) || length === 0)
                return { x: 0, y: 0 };
            const temp = (length == undefined ? 1 : length) / Geometry.Point.Length(point);
            return { x: point.x * temp, y: point.y * temp };
        },
        Rotate: (point: DeepReadonly<IPoint>, angle: number, center?: DeepReadonly<IPoint>): IPoint => {
            const x = point.x - (center ? center.x : 0);
            const y = point.y - (center ? center.y : 0);
            return {
                x: (center ? center.x : 0) + x * Math.cos(angle) - y * Math.sin(angle),
                y: (center ? center.y : 0) + y * Math.cos(angle) + x * Math.sin(angle)
            };
        },
        // same as rotating a vector 180 degrees
        Negative: (point: DeepReadonly<IPoint>): IPoint => ({ x: -point.x, y: -point.y }),
        // rotates the point randomly in the range given about the center, or the origin if it is not defined
        Wiggle: (point: DeepReadonly<IPoint>, angleRangeMax: number, center?: DeepReadonly<IPoint>, _rng?: RNG): IPoint => Geometry.Point.Rotate(point, angleRangeMax * ((_rng ?? rng)?.random() - 0.5), center),
        // Returns how much a (as a vector) faces in the direction of b (as a vector)
        // -1 = a faces opposite the direction of b
        // 0 = a faces perpendicular to the direction of b
        // 1 = a faces the exact same direction as b
        Towardness: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number => Geometry.Point.Dot(Geometry.Point.Normalized(a), Geometry.Point.Normalized(b)),
        // t = 0 =  from
        // t = 0.5 = midpoint between from and to
        // t = 1 = to
        Lerp: (from: DeepReadonly<IPoint>, to: DeepReadonly<IPoint>, t: number): IPoint => Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Subtract(to, from), t), from),
        // returns a version of this point which is flipped over (rotated 180 degrees around) the given point
        // (or the origin if none is provided). Provided because it is faster than using rotate/reflect.
        Flip: (point: DeepReadonly<IPoint>, center?: DeepReadonly<IPoint>): IPoint => { 
            return center
                ? { x: 2 * center.x - point.x, y: 2 * center.y - point.y } 
                : Geometry.Point.Negative(point);
        },
        // reflects the given point over the given line
        Reflect: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>): IPoint => {
            // use the Line method for Rays & Segments too
            const reflectionPoint = Geometry.Line.ClosestPointTo(pair, point);
            return Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Subtract(reflectionPoint, point), 2), point);
        },
        ClampedInRectangle: (point: DeepReadonly<IPoint>, rectangle: DeepReadonly<IRectangle>): IPoint => ({
            x: clamp(point.x, rectangle.x, rectangle.x + rectangle.w),
            y: clamp(point.y, rectangle.y, rectangle.y + rectangle.h)
        }),
        Vector: (length: number, angle: number): IPoint => ({ x: Math.cos(angle) * length, y: Math.sin(angle) * length }),
        UnitVector: (angle: number): IPoint => Geometry.Point.Vector(1, angle),
        // if result is > 0, then this point is left of the line/segment/ray formed by the two points.
        // if result is < 0, then this point is right of the line/segment/ray formed by the two points. 
        // if result == 0, then it is colinear with the two points.
        IsLeftCenterRightOf: (point: DeepReadonly<IPoint>, { a, b }: DeepReadonly<IPointPair>): number => Math.sign((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)),
        IsLeftOf: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>): boolean => Geometry.Point.IsLeftCenterRightOf(point, pair) > 0,
        IsColinearWith: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>): boolean => Geometry.IsWithinToleranceOf(Geometry.Point.IsLeftCenterRightOf(point, pair)),
        InsideSegmentIfColinear: (point: DeepReadonly<IPoint>, pair: DeepReadonly<ISegment>): boolean => {
            let ap = Geometry.Point.Subtract(point, pair.a);
            let ab = Geometry.Point.Subtract(pair.b, pair.a);
            let v = Geometry.Point.Dot(ap, ab);
            return v >= 0 && v <= Geometry.Point.LengthSq(ab);
        },
        InsideRayIfColinear: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IRay>): boolean => {
            let ap = Geometry.Point.Subtract(point, pair.a);
            let ab = Geometry.Point.Subtract(pair.b, pair.a);
            let v = Geometry.Point.Dot(ap, ab);
            return v >= 0;
        },
        IsRightOf: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>): boolean => Geometry.Point.IsLeftCenterRightOf(point, pair) < 0,
        // Returns a list of the velocity vectors a projectile would need in order to hit 'target' from 'start'
        // given the speed of the shot and gravity. Returns 0, 1, or 2 Points (if two points, the highest-arching vector is first)
        LaunchVectors: (start: DeepReadonly<IPoint>, target: DeepReadonly<IPoint>, gravityMagnitude: number, velocityMagnitude: number) => {
            if(velocityMagnitude === 0)
                return [];
    
            const diff = Geometry.Point.Subtract(target, start);
            if(gravityMagnitude === 0)
                return [Geometry.Point.Normalized(diff, velocityMagnitude)];
    
            const g = -gravityMagnitude;
            const v = velocityMagnitude;
            const v2 = v * v;
            const sqrt = v2 * v2 - g * (g * diff.x * diff.x + 2 * diff.y * v2);
    
            if(diff.x === 0 && sqrt === 0)
                return [Geometry.Point.Vector(Math.sign(diff.x) * v, -angle90)];
    
            if(diff.x === 0)
                return diff.y > 0
                    ? [{ x: 0, y: v}]
                    : diff.y < 0
                        ? [{ x: 0, y: -v }]
                        : [{ x: 0, y: v }, { x: 0, y: -v }];
    
            if (sqrt < 0)
                return [];
    
            return [
                Geometry.Point.Vector(Math.sign(diff.x) * v, Math.atan((v2 + Math.sqrt(sqrt))/(g * diff.x))),
                Geometry.Point.Vector(Math.sign(diff.x) * v, Math.atan((v2 - Math.sqrt(sqrt))/(g * diff.x)))
            ];
        },
        LaunchVector: (start: DeepReadonly<IPoint>, target: DeepReadonly<IPoint>, gravityMagnitude: number, angle: number) => {
            const x0r = start.x;
            const y0r = start.y;
            const x1r = target.x;
            const y1r = target.y;
            const a = gravityMagnitude;
    
            const xrDiff = x1r - x0r;
            const yrDiff = y1r - y0r;
    
            const x0 = x0r;
            const y0 = y0r;
            const x1 = x1r;
            const y1 = -yrDiff + y0r;
    
            const cos = Math.cos(-angle);
            const sin = Math.sin(-angle);
    
            if(Math.sign(cos) != Math.sign(xrDiff))
                return null;
    
            const sqrt = a * (x1 * x1 - 2 * x1 * x0 + x0 * x0) / (2 * cos * ((x1 - x0) * sin + (y0 - y1) * cos));
            if(sqrt < 0)
                return null;
            
            const v = Math.sqrt(sqrt);
            const vx = v * cos;
            const vy = -v * sin;
            return { x: vx, y: vy };
        },
        LaunchVectorReflective: (start: DeepReadonly<IPoint>, target: DeepReadonly<IPoint>, gravityMagnitude: number, angle: number) => {
            const xrDiff = target.x - start.x;
            const x1 = Math.abs(xrDiff) + start.x;
            const y1 = target.y;
    
            const launchVector = Geometry.Point.LaunchVector(start, { x: x1, y: y1 }, gravityMagnitude, angle);
            return launchVector == null ? null : { x: launchVector.x * Math.sign(xrDiff), y: launchVector.y };
        }
    };

    public static PointPair = {
        YatX: (pair: DeepReadonly<IPointPair>, x: number): number => {
            const slope = Geometry.Line.Slope(pair);
            return slope === Number.POSITIVE_INFINITY
                ? Number.POSITIVE_INFINITY
                : slope === Number.NEGATIVE_INFINITY
                    ? Number.NEGATIVE_INFINITY
                    : pair.a.y + (x - pair.a.x) * slope;
        },
        XatY: (pair: DeepReadonly<IPointPair>, y: number): number => {
            const slope = Geometry.Line.Slope(pair);
            return slope === Number.POSITIVE_INFINITY || slope === Number.NEGATIVE_INFINITY
                ? pair.a.x
                : pair.a.x + (y - pair.a.y) / slope;
        },
        Slope: (pair: DeepReadonly<IPointPair>): number => pair.b.x !== pair.a.x 
            ? (pair.b.y - pair.a.y) / (pair.b.x - pair.a.x) 
            : (pair.b.y > pair.a.y 
                ? Number.NEGATIVE_INFINITY 
                : Number.POSITIVE_INFINITY)
    }

    public static Line: ILineStatic = {
        AreEqual: (lineA: DeepReadonly<ILine>, lineB: DeepReadonly<ILine>): boolean => Geometry.Line.Hash(lineA) === Geometry.Line.Hash(lineB),
        YatX: (line: DeepReadonly<ILine>, x: number): number => Geometry.PointPair.YatX(line, x),
        XatY: (line: DeepReadonly<ILine>, y: number): number => Geometry.PointPair.XatY(line, y),
        Slope: (line: DeepReadonly<ILine>): number => Geometry.PointPair.Slope(line),
        Hash: (line: DeepReadonly<ILine>): string => `${Geometry.Line.Slope(line).toFixed(6)}${Geometry.Line.YatX(line, 0).toFixed(6)}`,
        Translate: (line: DeepReadonly<ILine>, offset: DeepReadonly<IPoint>) => ({
                a: Geometry.Point.Add(line.a, offset),
                b: Geometry.Point.Add(line.b, offset)
            }),
        ClosestPointTo: (line: DeepReadonly<ILine>, point: DeepReadonly<IPoint>): IPoint =>
            Geometry.Point.Add(line.a,
                Geometry.Point.Project(
                    Geometry.Point.Subtract(point, line.a), 
                    Geometry.Point.Subtract(line.b, line.a)
                )
            ),
        Yintercept: (line: DeepReadonly<ILine>): number => Geometry.Line.YatX(line, 0)
    };

    public static Ray: IRayStatic = {
        AreEqual: (rayA: DeepReadonly<IRay>, rayB: DeepReadonly<IRay>): boolean => Geometry.Ray.Hash(rayA) === Geometry.Ray.Hash(rayB),
        YatX: (ray: DeepReadonly<IRay>, x: number): number | null => Math.sign(x - ray.a.x) * Math.sign(ray.b.x - ray.a.x) === -1 ? null : Geometry.PointPair.YatX(ray, x),
        XatY: (ray: DeepReadonly<IRay>, y: number): number | null => Math.sign(y - ray.a.y) * Math.sign(ray.b.y - ray.a.y) === -1 ? null : Geometry.PointPair.XatY(ray, y),
        Slope: (ray: DeepReadonly<IRay>): number => Geometry.PointPair.Slope(ray),
        Hash: (ray: DeepReadonly<IRay>): string => Geometry.Points.Hash([ray.a, Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a)), ray.a)]),
        DefaultMaxDistance: 1000000,
        AsSegment: (ray: DeepReadonly<IRay>, length: number=Geometry.Ray.DefaultMaxDistance): ISegment => ({
            a: ray.a, 
            b: Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a), length), ray.a)
        }),
        PointAtDistance: (ray: DeepReadonly<IRay>, length: number=Geometry.Ray.DefaultMaxDistance): IPoint => {
            return Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a), length), ray.a);
        },
        Cast: (ray: DeepReadonly<IRay>, segments: DeepReadonly<DeepReadonly<ISegment>[]>, maxDistance: number=Geometry.Ray.DefaultMaxDistance): IRaycastResult<ISegment> | null => {
            const raySegment = Geometry.Ray.AsSegment(ray, maxDistance);
            const segmentIntersection = segments
                .map(segment => ({ segment, intersection: Geometry.Intersection.SegmentSegment(raySegment, segment) }))
                .filter(({ segment, intersection }) => intersection != null && segment != null)
                .minOf(({ intersection }) => Geometry.Point.DistanceSq(intersection!, ray.a));
            return segmentIntersection == null || segmentIntersection.intersection == null
                ? null 
                : {
                    contactPoint: segmentIntersection.intersection,
                    segmentHit: segmentIntersection.segment
                };
        },
        Translate: (ray: DeepReadonly<IRay>, offset: DeepReadonly<IPoint>) => ({
                a: Geometry.Point.Add(ray.a, offset),
                b: Geometry.Point.Add(ray.b, offset)
            }),
        ClosestPointTo: ({ a, b }: DeepReadonly<IRay>, point: DeepReadonly<IPoint>): IPoint => {
            const ab = Geometry.Point.Subtract(b, a);
            const ret = Geometry.Point.Add(Geometry.Point.Project(Geometry.Point.Subtract(point, a), ab), a);
            const r = Geometry.Point.Dot(Geometry.Point.Subtract(ret, a), ab);
            return r < 0 ? a : ret;
        }
    };

    public static Segment: ISegmentStatic = {
        AreEqual: (segmentA: DeepReadonly<ISegment>, segmentB: DeepReadonly<ISegment>): boolean => Geometry.Segment.Hash(segmentA) === Geometry.Segment.Hash(segmentB),
        YatX: (segment: DeepReadonly<ISegment>, x: number): number | null => 
            Math.sign(x - segment.a.x) * Math.sign(segment.b.x - segment.a.x) === -1 &&
            Math.sign(x - segment.b.x) * Math.sign(segment.a.x - segment.b.x) === -1
                ? Geometry.PointPair.YatX(segment, x)
                : null,
        XatY: (segment: DeepReadonly<ISegment>, y: number): number | null =>
            Math.sign(y - segment.a.y) * Math.sign(segment.b.y - segment.a.y) === -1 &&
            Math.sign(y - segment.b.y) * Math.sign(segment.a.y - segment.b.y) === -1
                ? Geometry.PointPair.XatY(segment, y) 
                : null,
        Slope: (segment: DeepReadonly<ISegment>): number => Geometry.PointPair.Slope(segment),
        Hash: (segment: DeepReadonly<ISegment>): string => Geometry.Points.Hash([segment.a, segment.b]),
        Translate: (segment: DeepReadonly<ISegment>, offset: DeepReadonly<IPoint>) => ({
                a: Geometry.Point.Add(segment.a, offset),
                b: Geometry.Point.Add(segment.b, offset)
            }),
        ClosestPointTo: ({ a, b }: DeepReadonly<ISegment>, point: DeepReadonly<IPoint>): IPoint => {
            const ab = Geometry.Point.Subtract(b, a);
            const ret = Geometry.Point.Add(Geometry.Point.Project(Geometry.Point.Subtract(point, a), ab), a);
            const r = Geometry.Point.Dot(Geometry.Point.Subtract(ret, a), ab);
            if(r < 0) return a;
            if(r > Geometry.Point.LengthSq(ab)) return b;
            return ret;
        },
        Midpoint: (segment: DeepReadonly<ISegment>): IPoint => ({ 
            x: (segment.a.x + segment.b.x) / 2,
            y: (segment.a.y + segment.b.y) / 2
        }),
        PerpendicularBisector: (segment: DeepReadonly<ISegment>): ILine => {
            const midpoint = Geometry.Segment.Midpoint(segment);
            return {
                a: midpoint,
                b: Geometry.Point.Add(
                    midpoint, 
                    Geometry.Point.Rotate(
                        Geometry.Point.Subtract(segment.b, segment.a),
                        angle90))
            };
        },
        SharedVertex: (segmentA: DeepReadonly<ISegment>, segmentB: DeepReadonly<ISegment>): IPoint | null =>
            Geometry.Point.AreEqual(segmentA.a, segmentB.a) || Geometry.Point.AreEqual(segmentA.a, segmentB.b)
                ? segmentA.a
                : Geometry.Point.AreEqual(segmentA.b, segmentB.a) || Geometry.Point.AreEqual(segmentA.b, segmentB.b)
                    ? segmentA.b
                    : null,
        Bounds: (segment: DeepReadonly<ISegment>): IRectangle => { 
            const x = Math.min(segment.a.x, segment.b.x);
            const y = Math.min(segment.a.y, segment.b.y);
            const w = Math.max(segment.a.x, segment.b.x) - x;
            const h = Math.max(segment.a.y, segment.b.y) - y;
            return { x, y, w, h };
        }
    };

    public static Triangle: ITriangleStatic = {
        Segments: (triangle: DeepReadonly<ITriangle>, offset: DeepReadonly<IPoint>=Geometry.Point.Zero): ISegment[] => Geometry.Points.Segments(Geometry.Triangle.Vertices(triangle, offset)),
        Vertices: (triangle: DeepReadonly<ITriangle>, offset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint[] => [
            { x: triangle.a.x + offset.x, y: triangle.a.y + offset.y },
            { x: triangle.b.x + offset.x, y: triangle.b.y + offset.y },
            { x: triangle.c.x + offset.x, y: triangle.c.y + offset.y },
        ],
        Circumcircle: (triangle: DeepReadonly<ITriangle>): ICircle => {
            const intersection = Geometry.Intersection.LineLine(
                Geometry.Segment.PerpendicularBisector({ a: triangle.a, b: triangle.b }),
                Geometry.Segment.PerpendicularBisector({ a: triangle.b, b: triangle.c})
            );
            if(!intersection)
                throw "No intersection found!";
            
            return {
                x: intersection.x, 
                y: intersection.y, 
                r: Geometry.Point.Distance(triangle.a, intersection)
            };
        },
        Supertriangle: (triangle: DeepReadonly<ITriangle>): ITriangle => triangle,
        Triangulation: (triangle: DeepReadonly<ITriangle>): ITriangle[] => [triangle],
        Bounds: (triangle: DeepReadonly<ITriangle>): IRectangle => Geometry.Points.Bounds(Geometry.Triangle.Vertices(triangle)),
        Midpoint: (triangle: DeepReadonly<ITriangle>): IPoint => Geometry.Point.Midpoint(...Geometry.Triangle.Vertices(triangle))!,
        Area: (triangle: DeepReadonly<ITriangle>): number => Math.abs(Geometry.Triangle.AreaSigned(triangle)),
        AreaSigned: (triangle: DeepReadonly<ITriangle>): number => 0.5 * (
            -triangle.b.y * triangle.c.x 
            + triangle.a.y * (-triangle.b.x + triangle.c.x) 
            + triangle.a.x * (triangle.b.y - triangle.c.y) 
            + triangle.b.x * triangle.c.y
        ),
        Perimeter: (triangle: DeepReadonly<ITriangle>): number => Geometry.Triangle.LengthAB(triangle) + Geometry.Triangle.LengthBC(triangle) + Geometry.Triangle.LengthCA(triangle),
        Semiperimeter: (triangle: DeepReadonly<ITriangle>): number => Geometry.Triangle.Perimeter(triangle) / 2,
        Hash: (triangle: DeepReadonly<ITriangle>): string => Geometry.Points.Hash(Geometry.Triangle.Vertices(triangle)),
        Incenter: (triangle: DeepReadonly<ITriangle>): IPoint => {
            const bisectorA = Geometry.Triangle.AngleBisectorA(triangle);
            const bisectorB = Geometry.Triangle.AngleBisectorB(triangle);
            const intersection = Geometry.Intersection.RayRay(bisectorA, bisectorB);
            if(!intersection)
                throw `No intersection found between angle bisectors of points "a" and "b" in triangle (${triangle.a}, ${triangle.b}, ${triangle.c}`;
            return intersection;
		},
        Inradius: (triangle: DeepReadonly<ITriangle>): number => {
            const lengthAB = Geometry.Triangle.LengthAB(triangle);
            const lengthBC = Geometry.Triangle.LengthBC(triangle);
            const lengthCA = Geometry.Triangle.LengthCA(triangle);
            const s = (lengthAB + lengthBC + lengthCA) / 2;
            return Math.sqrt(s * (s - lengthAB) * (s - lengthBC) * (s - lengthCA)) / s;
		},
        InscribedCircle: (triangle: DeepReadonly<ITriangle>): ICircle => {
            const { x, y } = Geometry.Triangle.Incenter(triangle);
            const radius = Geometry.Triangle.Inradius(triangle);
            return { x, y, r: radius };
		},
        AngleA: (triangle: DeepReadonly<ITriangle>): number => {
            const angleAB = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.b, triangle.a));
            const angleAC = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.c, triangle.a));
            return Math.abs(angleAC - angleAB);
		},
        AngleB: (triangle: DeepReadonly<ITriangle>): number => {
            const angleBC = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.c, triangle.b));
            const angleBA = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.a, triangle.b));
            return Math.abs(angleBA - angleBC);
		},
        AngleC: (triangle: DeepReadonly<ITriangle>): number => {
            const angleCA = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.a, triangle.c));
            const angleCB = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.b, triangle.c));
            return Math.abs(angleCB - angleCA);
		},
        LengthAB: (triangle: DeepReadonly<ITriangle>): number => Geometry.Point.Distance(triangle.a, triangle.b),
        LengthBC: (triangle: DeepReadonly<ITriangle>): number => Geometry.Point.Distance(triangle.b, triangle.c),
        LengthCA: (triangle: DeepReadonly<ITriangle>): number => Geometry.Point.Distance(triangle.c, triangle.a),
        // returns the angle bisector of a given vertex ( vertices ordered: a => b => c )
        AngleBisector: (bisectionVertex: DeepReadonly<IPoint>, previousVertex: DeepReadonly<IPoint>, nextVertex: DeepReadonly<IPoint>): IRay => {
            const angleAB = Geometry.Point.Angle(Geometry.Point.Subtract(nextVertex, bisectionVertex));
            const angleAC = Geometry.Point.Angle(Geometry.Point.Subtract(previousVertex, bisectionVertex));
            const angleBisector = moduloSafe(Geometry.AngleDifference(angleAC, angleAB) / 2 + angleAB, tau);
            return { 
                a: bisectionVertex,
                b: Geometry.Point.Add(bisectionVertex, Geometry.Point.Vector(1, angleBisector))
            }
        },
        AngleBisectorA: ({ a, b, c }: DeepReadonly<ITriangle>): IRay => Geometry.Triangle.AngleBisector(a, c, b),
        AngleBisectorB: ({ a, b, c }: DeepReadonly<ITriangle>): IRay => Geometry.Triangle.AngleBisector(b, a, c),
        AngleBisectorC: ({ a, b, c }: DeepReadonly<ITriangle>): IRay => Geometry.Triangle.AngleBisector(c, b, a),
        PerpendicularBisectorAB: (triangle: DeepReadonly<ITriangle>): ILine => Geometry.Segment.PerpendicularBisector({ a: triangle.a, b: triangle.b }),
        PerpendicularBisectorBC: (triangle: DeepReadonly<ITriangle>): ILine => Geometry.Segment.PerpendicularBisector({ a: triangle.b, b: triangle.c }),
        PerpendicularBisectorCA: (triangle: DeepReadonly<ITriangle>): ILine => Geometry.Segment.PerpendicularBisector({ a: triangle.c, b: triangle.a }),
        Translate: (triangle: DeepReadonly<ITriangle>, position: DeepReadonly<IPoint>): ITriangle => ({
            a: Geometry.Point.Add(triangle.a, position),
            b: Geometry.Point.Add(triangle.b, position),
            c: Geometry.Point.Add(triangle.c, position),
        }),
        Rotate: ({ a, b, c }: DeepReadonly<ITriangle>, angle: number, center?: DeepReadonly<IPoint>) => ({
            a: Geometry.Point.Rotate(a, angle, center),
            b: Geometry.Point.Rotate(b, angle, center),
            c: Geometry.Point.Rotate(c, angle, center)
        })
    };

    public static Rectangle: IRectangleStatic = {
        Segments: (rectangle: DeepReadonly<IRectangle>, offset: DeepReadonly<IPoint>=Geometry.Point.Zero): ISegment[] => Geometry.Points.Segments(Geometry.Rectangle.Vertices(rectangle, offset)),
        Vertices: (rectangle: DeepReadonly<IRectangle>, offset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint[] => [
            { x: rectangle.x + offset.x, y: rectangle.y + offset.y },
            { x: rectangle.x + rectangle.w + offset.x, y: rectangle.y + offset.y },
            { x: rectangle.x + rectangle.w + offset.x, y: rectangle.y + rectangle.h + offset.y },
            { x: rectangle.x + offset.x, y: rectangle.y + rectangle.h + offset.y }
        ],
        Circumcircle: (rectangle: DeepReadonly<IRectangle>): ICircle => ({
            x: rectangle.x + rectangle.w/2,
            y: rectangle.y + rectangle.h/2,
            r: Geometry.Point.Length({ x: rectangle.w/2, y: rectangle.h/2 })
        }),
        Supertriangle: (rectangle: DeepReadonly<IRectangle>): ITriangle | null => Geometry.Points.Supertriangle(Geometry.Rectangle.Vertices(rectangle)),
        Triangulation: (rectangle: DeepReadonly<IRectangle>): ITriangle[] => {
            const corners = Geometry.Rectangle.Vertices(rectangle);
            return [
                { a: corners[1], b: corners[0], c: corners[2] },
                { a: corners[0], b: corners[3], c: corners[2] }
            ];
        },
        Bounds: (rectangle: DeepReadonly<IRectangle>): IRectangle => rectangle,
        BoundsRectangles: (rectangles: DeepReadonly<IRectangle>[]) => {
            if(rectangles == null || rectangles.length <= 0)
                return { x: 0, y: 0, w: 0, h: 0 };
            let xMin = rectangles[0].x;
            let yMin = rectangles[0].y;
            let xMax = rectangles[0].x + rectangles[0].w;
            let yMax = rectangles[0].y + rectangles[0].h;
            for(let i = 1; i < rectangles.length; i++) {
                const rectangle = rectangles[i];
                xMin = Math.min(rectangle.x, xMin);
                yMin = Math.min(rectangle.y, yMin);
                xMax = Math.max(rectangle.x + rectangle.w, xMax);
                yMax = Math.max(rectangle.y + rectangle.h, yMax);
            }
            return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
        },
        Midpoint: (rectangle: DeepReadonly<IRectangle>): IPoint => ({ x: rectangle.x + rectangle.w/2, y: rectangle.y + rectangle.h/2 }),
        Area: (rectangle: DeepReadonly<IRectangle>): number => rectangle.w * rectangle.h,
        Hash: (rectangle: DeepReadonly<IRectangle>): string => Geometry.Points.Hash(Geometry.Rectangle.Vertices(rectangle)),
        // Expands the size of this rectangle by the given amount relative to its current size.
        // "center" defines the position the rectangle is expanding from (if undefined, the top-left of the rectangle is used)
        Scale: (rectangle: DeepReadonly<IRectangle>, scalar: number | IPoint, center?: DeepReadonly<IPoint>): IRectangle => {
            if(scalar === 1)
                return rectangle;

            const position = center
                ? Geometry.Point.Add(
                        Geometry.Point.Scale(
                            Geometry.Point.Subtract(rectangle, center),
                            scalar
                        ),
                        center
                    )
                : rectangle;
            
            return typeof scalar === "number"
                ? {
                    x: position.x,
                    y: position.y,
                    w: rectangle.w * scalar,
                    h: rectangle.h * scalar
                }
                : {
                    x: position.x,
                    y: position.y,
                    w: rectangle.w * scalar.x,
                    h: rectangle.h * scalar.y
                }
        },
        Expand: (rectangle: DeepReadonly<IRectangle>, wAmount: number, hAmount: number=wAmount): IRectangle => ({
            x: rectangle.x - wAmount,
            y: rectangle.y - hAmount,
            w: rectangle.w + 2 * wAmount,
            h: rectangle.h + 2 * hAmount
        }),
        RandomPointInside: (rectangle: DeepReadonly<IRectangle>, _rng?: RNG): IPoint => ({
            x: rectangle.x + (_rng ?? rng)?.random() * rectangle.w,
            y: rectangle.y + (_rng ?? rng)?.random() * rectangle.h
        }),
        // Returns the closest point to "position" that is on or outside of "rectangle"
        ClosestPointOutside: (rectangle: DeepReadonly<IRectangle>, position: IPoint): IPoint => {
            if(!Geometry.Collide.RectanglePoint(rectangle, position))
                return { x: position.x, y: position.y };
            const yTopDiff = Math.abs(position.y - rectangle.y);
            const yBottomDiff = Math.abs(rectangle.y + rectangle.h - position.y);
            const xLeftDiff = Math.abs(position.x - rectangle.x);
            const xRightDiff = Math.abs(rectangle.x + rectangle.w - position.x);
            const min = Math.min(yTopDiff, yBottomDiff, xLeftDiff, xRightDiff);
            if(min == yTopDiff) {
                return { x: position.x, y: rectangle.y };
            } else if(min == yBottomDiff) {
                return { x: position.x, y: rectangle.y + rectangle.h };
            } else if(min == xLeftDiff) {
                return { x: rectangle.x, y: position.y };
            }
            return { x: rectangle.x + rectangle.w, y: position.y };
        },
        // Returns the closest point to "position" that is on or inside of "rectangle"
        ClosestPointInside: (rectangle: DeepReadonly<IRectangle>, position: IPoint): IPoint => ({
            x: clamp(position.x, rectangle.x, rectangle.x + rectangle.w),
            y: clamp(position.y, rectangle.y, rectangle.y + rectangle.h),
        }),
        Square: (center: DeepReadonly<IPoint>, sideLength: number): IRectangle => ({
            x: center.x - sideLength/2,
            y: center.y - sideLength/2,
            w: sideLength,
            h: sideLength
        }),
        Translate: (rectangle: DeepReadonly<IRectangle>, translation: DeepReadonly<IPoint>): IRectangle => ({
            x: rectangle.x + translation.x,
            y: rectangle.y + translation.y,
            w: rectangle.w,
            h: rectangle.h
        }),
        Align: (rectangle: DeepReadonly<IRectangle>, halign: Halign, valign: Valign): IRectangle => {
            const offset = { x: 0, y: 0 };
            switch(halign) {
                case Halign.CENTER:
                    offset.x -= rectangle.w/2;
                    break;
                case Halign.RIGHT:
                    offset.x -= rectangle.w;
                    break;
                case Halign.LEFT:
                default:
                    break;
            }
            switch(valign) {
                case Valign.MIDDLE:
                    offset.y -= rectangle.h/2;
                    break;
                case Valign.BOTTOM:
                    offset.y -= rectangle.h;
                    break;
                case Valign.TOP:
                default:
                    break;
            }
            return Geometry.Rectangle.Translate(rectangle, offset);
        },
        Center: (rectangle: DeepReadonly<IRectangle>): IPoint => ({
            x: rectangle.x + rectangle.w/2,
            y: rectangle.y + rectangle.h/2
        }),
        TopLeft: (rectangle: DeepReadonly<IRectangle>): IPoint => rectangle,
        TopRight: (rectangle: DeepReadonly<IRectangle>): IPoint => ({
            x: rectangle.x + rectangle.w,
            y: rectangle.y
        }),
        BottomLeft: (rectangle: DeepReadonly<IRectangle>): IPoint => ({
            x: rectangle.x,
            y: rectangle.y + rectangle.h
        }),
        BottomRight: (rectangle: DeepReadonly<IRectangle>): IPoint => ({
            x: rectangle.x + rectangle.w,
            y: rectangle.y + rectangle.h
        }),
        xLeft: (rectangle: DeepReadonly<IRectangle>): number => rectangle.x,
        xRight: (rectangle: DeepReadonly<IRectangle>): number => rectangle.x + rectangle.w,
        yTop: (rectangle: DeepReadonly<IRectangle>) => rectangle.y,
        yBottom: (rectangle: DeepReadonly<IRectangle>) => rectangle.y + rectangle.h,
    }

    public static Polygon: IPolygonStatic = {
        Segments: (polygon: DeepReadonly<IPolygon>, offset?: DeepReadonly<IPoint>): ISegment[] => Geometry.Points.Segments(offset ? Geometry.Polygon.Vertices(polygon, offset) : polygon.vertices),
        Vertices: (polygon: DeepReadonly<IPolygon>, offset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint[] => polygon.vertices.map(o => ({ x: o.x + offset.x, y: o.y + offset.y })),
        Circumcircle: (polygon: DeepReadonly<IPolygon>): ICircle | null => Geometry.Points.Circumcircle(polygon.vertices),
        Supertriangle: (polygon: DeepReadonly<IPolygon>): ITriangle | null => Geometry.Points.Supertriangle(polygon.vertices),
        Triangulation: (polygon: DeepReadonly<IPolygon>): ITriangle[] => Geometry.Points.Triangulation(polygon.vertices),
        Bounds: (polygon: DeepReadonly<IPolygon>): IRectangle => Geometry.Points.Bounds(polygon.vertices),
        Midpoint: (polygon: DeepReadonly<IPolygon>): IPoint | null => Geometry.Point.Midpoint(...polygon.vertices),
        Area: (polygon: DeepReadonly<IPolygon>): number => Geometry.Polygon.Triangulation(polygon).map(o => Geometry.Triangle.Area(o)).sum() ?? 0,
        Rotate: (polygon: DeepReadonly<IPolygon>, angle: number, center?: DeepReadonly<IPoint>): IPolygon => ({ vertices: polygon.vertices.map(o => Geometry.Point.Rotate(o, angle, center)) }),
        Translate: (polygon: DeepReadonly<IPolygon>, position: DeepReadonly<IPoint>): IPolygon => ({ vertices: polygon.vertices.map(o => Geometry.Point.Add(o, position)) }),
        Hash: (polygon: DeepReadonly<IPolygon>): string => Geometry.Points.Hash(polygon.vertices),
        WindingNumber: (polygon: DeepReadonly<IPolygon>, point: DeepReadonly<IPoint>) : number => {
            // https://twitter.com/FreyaHolmer/status/1232826293902888960
            // http://geomalgorithms.com/a03-_inclusion.html
            let windingNumber = 0;
            for(let i = 0; i < polygon.vertices.length; i++) {
                const currentVertex = polygon.vertices[i];
                const nextVertex = polygon.vertices[(i+1)%polygon.vertices.length];
                if(currentVertex.y <= point.y) {
                    if(nextVertex.y > point.y) {
                        if(Geometry.Point.IsLeftOf(point, { a: currentVertex, b: nextVertex })) {
                            windingNumber++;
                        }
                    }
                }
                else {
                    if(nextVertex.y <= point.y) {
                        if(Geometry.Point.IsRightOf(point,{ a: currentVertex, b: nextVertex })) {
                            windingNumber--;
                        }
                    }
                }
            }
            return windingNumber;
        }
    }

    public static Circle: ICircleStatic = {
        Circumcircle: (circle: DeepReadonly<ICircle>): ICircle => circle,
        Supertriangle: (circle: DeepReadonly<ICircle>): ITriangle => ({
            a: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Up, circle.r * 2), circle),
            b: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau/3), circle.r * 2), circle),
            c: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau*2/3), circle.r * 2), circle)
        }),
        Bounds: (circle: DeepReadonly<ICircle>): IRectangle => ({
            x: circle.x - circle.r,
            y: circle.y - circle.r,
            w: circle.r * 2,
            h: circle.r * 2
        }),
        Midpoint: (circle: DeepReadonly<ICircle>): IPoint => circle,
        Area: (circle: DeepReadonly<ICircle>): number => Math.PI * circle.r * circle.r,
        Circumference: (circle: DeepReadonly<ICircle>): number => tau * circle.r,
        Hash: (circle: DeepReadonly<ICircle>): string => `${Geometry.Point.Hash(circle)},${circle.r.toFixed(Geometry.HashDecimalDigits)}`,
        RandomPointInside: (circle: DeepReadonly<ICircle>, _rng?: RNG): IPoint => Geometry.Point.Add(circle, Geometry.Point.Vector(circle.r * (_rng ?? rng)?.random(), tau * (_rng ?? rng)?.random())),
        Translate: (circle: DeepReadonly<ICircle>, translation: DeepReadonly<IPoint>): ICircle => ({ x: circle.x + translation.x, y: circle.y + translation.y, r: circle.r }),
        Rotate: (circle: DeepReadonly<ICircle>, angle: number, center?: DeepReadonly<IPoint>): ICircle => ({
            ...Geometry.Point.Rotate(circle, angle, center),
            r: circle.r
        }),
        TangentPoints: (circle: DeepReadonly<ICircle>, point: DeepReadonly<IPoint>): { a: IPoint, b: IPoint } | null => {
            const distanceSq = Geometry.Point.DistanceSq(circle, point);
            if(distanceSq <= 0 || circle.r <= 0 || distanceSq < circle.r * circle.r)
                return null;
            const angle = Geometry.Point.Angle(Geometry.Point.Subtract(point, circle));
            const angleDiff = Math.acos(circle.r / Math.sqrt(distanceSq));
            return {
                a: Geometry.Point.Add(circle, Geometry.Point.Vector(circle.r, angle + angleDiff)),
                b: Geometry.Point.Add(circle, Geometry.Point.Vector(circle.r, angle - angleDiff))
            }
        }
    }

    public static Points: IPointsStatic = {
        Segments: (points: DeepReadonly<DeepReadonly<IPoint>[]>, offset: DeepReadonly<IPoint>=Geometry.Point.Zero, closed: boolean=true): ISegment[] => { 
            const segments: ISegment[] = [];
            for(let i = 0; i < points.length; i++) {
                if(i == points.length-1 && !closed)
                    break;
                const j = (i + 1) % points.length;
                segments.push({
                    a: {
                        x: points[i].x + offset.x,
                        y: points[i].y + offset.y
                    },
                    b: {
                        x: points[j].x + offset.x,
                        y: points[j].y + offset.y
                    }
                });
            }
            return segments;
        },
        Vertices: (points: DeepReadonly<DeepReadonly<IPoint>[]>, offset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint[] => points.map(o => ({ x: o.x + offset.x, y: o.y + offset.y })),
        Circumcircle: (points: DeepReadonly<DeepReadonly<IPoint>[]>): ICircle | null => {
            // Doesn't necessarily fit tightly, but is guaranteed to contain all the points
            const center = Geometry.Point.Midpoint(...points);
            if(center == null)
                return null;
            const furthest = points.maxOf(o => Geometry.Point.DistanceSq(center, o));
            if(furthest == null)
                return null;
            const radius = Geometry.Point.Distance(furthest, center);
            return { x: center.x, y: center.y, r: radius };
        },
        Supertriangle: (points: DeepReadonly<DeepReadonly<IPoint>[]>): ITriangle | null => {
            const circumcircle = Geometry.Points.Circumcircle(points);
            if(circumcircle == null)
                return null;
            const diameter = circumcircle.r * 2;
            return {
                a: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Up, diameter), circumcircle),
                b: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau/3), diameter), circumcircle),
                c: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau*2/3), diameter), circumcircle)
            };
        },
        Triangulation: (points: DeepReadonly<DeepReadonly<IPoint>[]>): ITriangle[] => {
            // http://paulbourke.net/papers/triangulate/
    
            // add supertriangle to points and triangles lists
            const supertriangle: ITriangle | null = Geometry.Points.Supertriangle(points);
            if(!supertriangle)
                return [];
            const supertriangleVertices = Geometry.Triangle.Vertices(supertriangle);
            const triangles: ITriangle[] = [supertriangle];
            const pointsTemp = [
                ...points,
                ...supertriangleVertices
            ]
    
            // create new points because they'll be added to the later triangles anyway
            pointsTemp.forEach(point => {
    
                // find all triangles whose circumcircle collides with the given point, remove them, and aggregate their segments into a list
                const segments: ISegment[] = [];
                triangles.removeWhere(triangle => {
                    const circumcircle = Geometry.Triangle.Circumcircle(triangle);
                    if(circumcircle) {
                        const collides = Geometry.Collide.CirclePoint(circumcircle, point);
                        if(collides) {
                            segments.push(...Geometry.Triangle.Segments(triangle));
                            return true;
                        }
                    }
                    return false;
                });
    
                // remove all internal segments (those that appear twice in the list)
                segments.removeWhere(segmentA => {
                    const hash = Geometry.Segment.Hash(segmentA);
                    const equivalentSegments = segments.filter(segmentB => Geometry.Segment.Hash(segmentB) === hash);
                    return equivalentSegments.length >= 2;
                });
    
                // form triangles out of each segment and the given point and add them to the triangles list
                const newTriangles: ITriangle[] = segments
                    .filter(segment => 
                        !Geometry.Point.AreEqual(segment.a, segment.b) &&
                        !Geometry.Point.AreEqual(segment.a, point) &&
                        !Geometry.Point.AreEqual(segment.b, point)
                    ).map(segment => ({
                        a: segment.b,
                        b: segment.a,
                        c: point
                    }));
                triangles.push(...newTriangles);
            });
    
            // remove any triangles that share a vertex with the supertriangle
            triangles.removeWhere(triangle => 
                supertriangleVertices.any(stVertex => 
                    Geometry.Triangle.Vertices(triangle).any(vertex => 
                        Geometry.Point.AreEqual(stVertex, vertex))));
            
            // return the input list to its original form
            pointsTemp.pop();
            pointsTemp.pop();
            pointsTemp.pop();
    
            return triangles;
        },
        Bounds: (points: DeepReadonly<DeepReadonly<IPoint>[]>): IRectangle => {
            if(points == null)
                return { x: 0, y: 0, w: 0, h: 0 };
            const xMin = points.minOf(o => o.x)?.x ?? 0;
            const yMin = points.minOf(o => o.y)?.y ?? 0;
            const xMax = points.maxOf(o => o.x)?.x ?? 0;
            const yMax = points.maxOf(o => o.y)?.y ?? 0;
            return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
        },
        Hash: (points: DeepReadonly<DeepReadonly<IPoint>[]>): string => points.clone()
            .sort((a, b) => a.y == b.y ? a.x - b.x : a.y - b.y)
            .map(o => Geometry.Point.Hash(o))
            .join(';'),
        Translate: (points: DeepReadonly<DeepReadonly<IPoint>[]>, offset: DeepReadonly<IPoint>): IPoint[] => points.map(o => Geometry.Point.Translate(o, offset)),
        Sum: (points: DeepReadonly<DeepReadonly<IPoint>[]>): IPoint => {
            const sum = { x: 0, y: 0 };
            points.forEach(point => {
                sum.x += point.x;
                sum.y += point.y;
            });
            return sum;
        },
        BezierPoint: (points: DeepReadonly<DeepReadonly<IPoint>[]>, t: number): IPoint => {
            const n = points.length - 1;
            let sum = { x: 0, y: 0 };
            for(let i = 0; i < points.length; i++)
            {
                const point = points[i];
                const binomial = binomialCoefficient(n, i);
                const scalar = binomial * Math.pow(1 - t, n - i) * Math.pow(t, i);
                const pointToAdd = Geometry.Point.Scale(point, scalar);
                sum.x += pointToAdd.x;
                sum.y += pointToAdd.y;
            }
            return sum;
        },
        // count must be greater than 1
        Bezier: (points: DeepReadonly<DeepReadonly<IPoint>[]>, count: number): IPoint[] => {
            const pointFirst = points.first();
            if(pointFirst == null || count < 1)
                return [];
            if(count === 1)
                return [pointFirst];
            const bezierPoints: IPoint[] = [];
            const coarseness = 1 / (count-1);
            for(let i = 0; i <= 1; i += coarseness)
                bezierPoints.push(Geometry.Points.BezierPoint(points, i));
            return bezierPoints;
        }
    }

    private static IsRectangle(o: any): o is IRectangle { return o.x != null && o.y != null && o.w != null && o.h != null; }
    private static IsCircle(o: any): o is ICircle { return o.x != null && o.y != null && o.r != null; }
    private static IsTriangle(o: any): o is ITriangle { return o.a != null && o.b != null && o.c != null; }
    private static IsPolygon(o: any): o is IPolygon { return o.vertices != null; }
    private static IsLine(o: any): o is ILine { return o.a != null && o.b != null && o.type == PointPairType.LINE; }
    private static IsRay(o: any): o is IRay { return o.a != null && o.b != null && o.type == PointPairType.RAY; }
    // if the "type" field is omitted from a PointPair, it is treated as a Segment by default
    private static IsSegment(o: any): o is ISegment { return o.a != null && o.b != null && (o.type == null || o.type == PointPairType.SEGMENT); }
    private static IsPoint(o: any): o is IPoint { return o.x != null && o.y != null && o.w === undefined && o.r === undefined; }

    public static Bounds(shape?: DeepReadonly<BoundableShape>): IRectangle
    public static Bounds(shape?: DeepReadonly<BoundableShape> | null): IRectangle | null
    public static Bounds(shape?: DeepReadonly<BoundableShape> | null): IRectangle | null {
        if(!shape)
            null;
        
        if(Geometry.IsRectangle(shape)) {
            return Geometry.Rectangle.Bounds(shape);
        } else if(Geometry.IsCircle(shape)) {
            return Geometry.Circle.Bounds(shape);
        } else if(Geometry.IsTriangle(shape)) {
            return Geometry.Triangle.Bounds(shape);
        } else if(Geometry.IsPolygon(shape)) {
            return Geometry.Polygon.Bounds(shape);
        } else if(Geometry.IsSegment(shape)) {
            return Geometry.Segment.Bounds(shape);
        } else if(Geometry.IsPoint(shape)) {
            return { x: shape.x, y: shape.y, w: 0, h: 0 };
        } 
        return null;
    }

    public static CollideExplicit = {
        RectanglePoint: (ax: number, ay: number, aw: number, ah: number, bx: number, by: number): boolean => {
            return bx >= ax
                && by >= ay
                && bx < ax + aw
                && by < ay + ah;
        },
        RectangleRectangle: (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number,): boolean => {
            return ax + aw > bx 
                && ay + ah > by 
                && ax < bx + bw 
                && ay < by + bh
        },
        CirclePoint: (cx: number, cy: number, cr: number, px: number, py: number): boolean => {
            return (cx - px) * (cx - px) + (cy - py) * (cy - py) <= cr * cr;
        }
    }

    // TODO:
    //  1. test all collisions (most ray/segment/line vs shape collisions are untested)
    //  2. add matching collision functions which operate only on number arguments and use them here
    //  3. create matching functions in Geometry.Intersection that actually returns intersection points, if any
    public static Collide = {
        PointSegment: (a: DeepReadonly<IPoint>, b: DeepReadonly<ISegment>, aOffset?: DeepReadonly<IPoint>, bOffset?: DeepReadonly<IPoint>): boolean => {
            if(aOffset) a = Geometry.Point.Translate(a, aOffset);
            if(bOffset) b = Geometry.Segment.Translate(b, bOffset);
            return Geometry.Point.IsColinearWith(a, b) && Geometry.Point.InsideSegmentIfColinear(a, b)
        },
        TriangleSegment: (a: DeepReadonly<ITriangle>, b: DeepReadonly<ISegment>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.TrianglePoint(a, b.a, aOffset, bOffset) || Geometry.Triangle.Segments(a, aOffset).any(o => Geometry.Collide.SegmentSegment(b, o, bOffset)),
        CircleSegment: (a: DeepReadonly<ICircle>, b: DeepReadonly<ISegment>, aOffset?: DeepReadonly<IPoint>, bOffset?: DeepReadonly<IPoint>): boolean => {
            if(aOffset) a = Geometry.Circle.Translate(a, aOffset);
            if(bOffset) b = Geometry.Segment.Translate(b, bOffset);
            return Geometry.Collide.CirclePoint(a, Geometry.Segment.ClosestPointTo(b, a))
        },
        PolygonSegment: (a: DeepReadonly<IPolygon>, b: DeepReadonly<ISegment>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.PolygonPoint(a, b.a, aOffset, bOffset) || Geometry.Polygon.Segments(a, aOffset).any(o => Geometry.Collide.SegmentSegment(b, o, bOffset)),
        PointRay: (a: DeepReadonly<IPoint>, b: DeepReadonly<IRay>, aOffset?: DeepReadonly<IPoint>, bOffset?: DeepReadonly<IPoint>): boolean => {
            if(aOffset) a = Geometry.Point.Translate(a, aOffset);
            if(bOffset) b = Geometry.Ray.Translate(b, bOffset);
            return Geometry.Point.IsColinearWith(a, b) && Geometry.Point.InsideRayIfColinear(a, b)
        },
        TriangleRay: (a: DeepReadonly<ITriangle>, b: DeepReadonly<IRay>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.TrianglePoint(a, b.a, aOffset, bOffset) || Geometry.Triangle.Segments(a, aOffset).any(o => Geometry.Collide.RaySegment(b, o, bOffset)),
        CircleRay: (a: DeepReadonly<ICircle>, b: DeepReadonly<IRay>, aOffset?: DeepReadonly<IPoint>, bOffset?: DeepReadonly<IPoint>): boolean => {
            if(aOffset) a = Geometry.Circle.Translate(a, aOffset);
            if(bOffset) b = Geometry.Ray.Translate(b, bOffset);
            return Geometry.Collide.CirclePoint(a, Geometry.Ray.ClosestPointTo(b, a))
        },
        PolygonRay: (a: DeepReadonly<IPolygon>, b: DeepReadonly<IRay>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.PolygonPoint(a, b.a, aOffset, bOffset) || Geometry.Polygon.Segments(a, aOffset).any(o => Geometry.Collide.RaySegment(b, o, bOffset)),
        PointLine: (a: DeepReadonly<IPoint>, b: DeepReadonly<ILine>, aOffset?: DeepReadonly<IPoint>, bOffset?: DeepReadonly<IPoint>): boolean => {
            if(aOffset) a = Geometry.Point.Translate(a, aOffset);
            if(bOffset) b = Geometry.Line.Translate(b, bOffset);
            return Geometry.Point.IsColinearWith(a, b)
        },
        TriangleLine: (a: DeepReadonly<ITriangle>, b: DeepReadonly<ILine>, aOffset?: DeepReadonly<IPoint>, bOffset?: DeepReadonly<IPoint>): boolean => Geometry.Collide.TrianglePoint(a, b.a, aOffset, bOffset) || Geometry.Triangle.Segments(a, aOffset).any(o => Geometry.Collide.LineSegment(b, o, bOffset)),
        CircleLine: (a: DeepReadonly<ICircle>, b: DeepReadonly<ILine>, aOffset?: DeepReadonly<IPoint>, bOffset?: DeepReadonly<IPoint>): boolean => {
            if(aOffset) a = Geometry.Circle.Translate(a, aOffset);
            if(bOffset) b = Geometry.Line.Translate(b, bOffset);
            return Geometry.Collide.CirclePoint(a, Geometry.Line.ClosestPointTo(b, a))
        },
        PolygonLine: (a: DeepReadonly<IPolygon>, b: DeepReadonly<ILine>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.PolygonPoint(a, b.a, aOffset, bOffset) || Geometry.Polygon.Segments(a, aOffset).any(o => Geometry.Collide.LineSegment(b, o, bOffset)),
        PointPoint: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Point.AreEqual(Geometry.Point.Add(a, aOffset), Geometry.Point.Add(b, bOffset)),
        LineLine: (a: DeepReadonly<ILine>, b: DeepReadonly<ILine>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.LineLine(a, b, aOffset, bOffset) != null,
        LineRay: (a: DeepReadonly<ILine>, b: DeepReadonly<IRay>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.LineRay(a, b, aOffset, bOffset) != null,
        LineSegment: (a: DeepReadonly<ILine>, b: DeepReadonly<ISegment>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.LineSegment(a, b, aOffset, bOffset) != null,
        RayRay: (a: DeepReadonly<IRay>, b: DeepReadonly<IRay>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.RayRay(a, b, aOffset, bOffset) != null,
        RaySegment: (a: DeepReadonly<IRay>, b: DeepReadonly<ISegment>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.RaySegment(a, b, aOffset, bOffset) != null,
        SegmentSegment: (a: DeepReadonly<ISegment>, b: DeepReadonly<ISegment>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.SegmentSegment(a, b, aOffset, bOffset) != null,
        SegmentsSegments: (segmentsA: DeepReadonly<DeepReadonly<ISegment>[]>, segmentsB: DeepReadonly<DeepReadonly<ISegment>[]>): boolean =>
            segmentsA.any(segmentA => segmentsB.any(segmentB => Geometry.Collide.SegmentSegment(segmentA, segmentB))),
        RectangleRectangle: (rectangleA: DeepReadonly<IRectangle>, rectangleB: DeepReadonly<IRectangle>, rectangleAOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, rectangleBOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => {
            const ax = rectangleA.x + rectangleAOffset.x;
            const ay = rectangleA.y + rectangleAOffset.y;
            const bx = rectangleB.x + rectangleBOffset.x;
            const by = rectangleB.y + rectangleBOffset.y;
            return ax + rectangleA.w > rectangleB.x 
                && ay + rectangleA.h > rectangleB.y 
                && ax < bx + rectangleB.w 
                && ay < by + rectangleB.h
        },
        RectangleCircle: (rectangle: DeepReadonly<IRectangle>, circle: DeepReadonly<ICircle>, rectangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, circleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, rectangleAngle: number=0): boolean => {
            // The rectangle's (x, y) position is its top-left corner if it were not rotated,
            // however the rectangle still rotates about its center (by "rectangleAngle" radians)
            //https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
            const halfW = rectangle.w/2;
            const halfH = rectangle.h/2;
            const rx = rectangle.x + rectangleOffset.x;
            const ry = rectangle.y + rectangleOffset.y;
            let circlePosition = {
                x: circle.x + circleOffset.x,
                y: circle.y + circleOffset.y
            };
            if(rectangleAngle != 0) 
                circlePosition = Geometry.Point.Rotate(circlePosition, -rectangleAngle, { x: rx + halfW, y: ry + halfH });
            const xCircleDistance = Math.abs(circlePosition.x - (rx + halfW));
            const yCircleDistance = Math.abs(circlePosition.y - (ry + halfH));
    
            if (xCircleDistance > halfW + circle.r || yCircleDistance > halfH + circle.r)
                return false;
            if (xCircleDistance <= halfW || yCircleDistance <= halfH)
                return true;
    
            const cornerDistanceSq =
                (xCircleDistance - halfW) * (xCircleDistance - halfW) +
                (yCircleDistance - halfH) * (yCircleDistance - halfH);
            return cornerDistanceSq <= (circle.r * circle.r);
        },
        RectangleTriangle: (rectangle: DeepReadonly<IRectangle>, triangle: DeepReadonly<ITriangle>, rectangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, triangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => 
            Geometry.Collide.SegmentsSegments(Geometry.Triangle.Segments(triangle, triangleOffset), Geometry.Rectangle.Segments(rectangle, rectangleOffset))
            || Geometry.Collide.TrianglePoint(triangle, rectangle)
            || Geometry.Collide.RectanglePoint(rectangle, triangle.a),
        RectanglePolygon: (rectangle: DeepReadonly<IRectangle>, polygon: DeepReadonly<IPolygon>, rectangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, polygonOffset?: DeepReadonly<IPoint>): boolean =>
            Geometry.Collide.SegmentsSegments(Geometry.Polygon.Segments(polygon, polygonOffset), Geometry.Rectangle.Segments(rectangle, rectangleOffset))
            || Geometry.Collide.PolygonPoint(polygon, rectangle)
            || (polygon.vertices.length > 0 && Geometry.Collide.RectanglePoint(rectangle, polygon.vertices[0])),
        RectangleSegment: (rectangle: DeepReadonly<IRectangle>, segment: DeepReadonly<ISegment>, rectangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, segmentOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => {
            return Geometry.Collide.RectanglePoint(rectangle, segment.a, rectangleOffset, segmentOffset) || Geometry.Collide.RectanglePoint(rectangle, segment.b, rectangleOffset, segmentOffset) || Geometry.Rectangle.Segments(rectangle).any(s => Geometry.Collide.SegmentSegment(s, segment, rectangleOffset, segmentOffset))
        },
        RectangleLine: (rectangle: DeepReadonly<IRectangle>, line: DeepReadonly<ILine>, rectangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, lineOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.Rectangle.Segments(rectangle).any(s => Geometry.Collide.LineSegment(line, s, lineOffset, rectangleOffset)),
        RectangleRay: (rectangle: DeepReadonly<IRectangle>, ray: DeepReadonly<IRay>, rectangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, rayOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.Rectangle.Segments(rectangle).any(s => Geometry.Collide.RaySegment(ray, s, rayOffset, rectangleOffset)),
        RectanglePoint: (rectangle: DeepReadonly<IRectangle>, point: DeepReadonly<IPoint>, rectangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, pointOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean =>
            point.x + pointOffset.x >= rectangle.x + rectangleOffset.x
             && point.y + pointOffset.y >= rectangle.y + rectangleOffset.y
             && point.x + pointOffset.x < rectangle.x + rectangleOffset.x + rectangle.w
             && point.y + pointOffset.y < rectangle.y + rectangleOffset.y + rectangle.h,
        CircleCircle: (circleA: DeepReadonly<ICircle>, circleB: DeepReadonly<ICircle>, circleAOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, circleBOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.DistanceSq(circleA.x + circleAOffset.x, circleA.y + circleAOffset.y, circleB.x + circleBOffset.x, circleB.y + circleBOffset.y) <= (circleA.r + circleB.r) * (circleA.r + circleB.r),
        CircleTriangle: (circle: DeepReadonly<ICircle>, triangle: DeepReadonly<ITriangle>, circleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, triangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => 
            Geometry.Triangle.Segments(triangle).any(segment => Geometry.Intersection.CircleSegment(circle, segment, circleOffset, triangleOffset).length > 0)
            || Geometry.Collide.TrianglePoint(triangle, circle)
            || Geometry.Collide.CirclePoint(circle, triangle.a),
        CirclePolygon: (circle: DeepReadonly<ICircle>, polygon: DeepReadonly<IPolygon>, circleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, polygonOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => 
            Geometry.Polygon.Segments(polygon).any(segment => Geometry.Intersection.CircleSegment(circle, segment, circleOffset, polygonOffset).length > 0)
            || Geometry.Collide.PolygonPoint(polygon, circle, polygonOffset, circleOffset)
            || (polygon.vertices.length > 0 && Geometry.Collide.CirclePoint(circle, polygon.vertices[0], circleOffset, polygonOffset)),
        CirclePoint: (circle: DeepReadonly<ICircle>, point: DeepReadonly<IPoint>, circleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, pointOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.DistanceSq(point.x + pointOffset.x, point.y + pointOffset.y, circle.x + circleOffset.x, circle.y + circleOffset.y) <= circle.r * circle.r,
        TriangleTriangle: (triangleA: DeepReadonly<ITriangle>, triangleB: DeepReadonly<ITriangle>, triangleAOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, triangleBOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => 
            Geometry.Collide.SegmentsSegments(Geometry.Triangle.Segments(triangleA, triangleAOffset), Geometry.Triangle.Segments(triangleB, triangleBOffset))
            || Geometry.Collide.TrianglePoint(triangleA, triangleB.a, triangleAOffset, triangleBOffset)
            || Geometry.Collide.TrianglePoint(triangleB, triangleA.a, triangleBOffset, triangleAOffset),
        TrianglePolygon: (triangle: DeepReadonly<ITriangle>, polygon: DeepReadonly<IPolygon>, triangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, polygonOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.Collide.SegmentsSegments(Geometry.Polygon.Segments(polygon, polygonOffset), Geometry.Triangle.Segments(triangle, triangleOffset))
            || Geometry.Collide.PolygonPoint(polygon, triangle.a, polygonOffset, triangleOffset)
            || (polygon.vertices.length > 0 && Geometry.Collide.TrianglePoint(triangle, polygon.vertices[0], triangleOffset, polygonOffset)),
        TrianglePoint: (triangle: DeepReadonly<ITriangle>, point: DeepReadonly<IPoint>, triangleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, pointOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => {
            const triangleAx = triangle.a.x + triangleOffset.x;
            const triangleAy = triangle.a.y + triangleOffset.y;
            const triangleBx = triangle.b.x + triangleOffset.x;
            const triangleBy = triangle.b.y + triangleOffset.y;
            const triangleCx = triangle.c.x + triangleOffset.x;
            const triangleCy = triangle.c.y + triangleOffset.y;
            const pointX = point.x + pointOffset.x;
            const pointY = point.y + pointOffset.y;
            // https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
            const areaSigned2xInverse =  1 / (
                -triangleBy * triangleCx 
                + triangleAy * (-triangleBx + triangleCx) 
                + triangleAx * (triangleBy - triangleCy) 
                + triangleBx * triangleCy
            );
            const s = areaSigned2xInverse*(triangleAy*triangleCx - triangleAx*triangleCy + (triangleCy - triangleAy)*pointX + (triangleAx - triangleCx)*pointY);
            const t = areaSigned2xInverse*(triangleAx*triangleBy - triangleAy*triangleBx + (triangleAy - triangleBy)*pointX + (triangleBx - triangleAx)*pointY);
            return s > 0 && t > 0 && 1 - s - t > 0;
        },
        PolygonPolygon: (polygonA: DeepReadonly<IPolygon>, polygonB: DeepReadonly<IPolygon>, polygonAOffset?: DeepReadonly<IPoint>, polygonBOffset?: DeepReadonly<IPoint>): boolean =>
            Geometry.Collide.SegmentsSegments(Geometry.Polygon.Segments(polygonA, polygonAOffset), Geometry.Polygon.Segments(polygonB, polygonBOffset))
            || (polygonB.vertices.length > 0 && Geometry.Collide.PolygonPoint(polygonA, polygonB.vertices[0], polygonAOffset ?? Geometry.Point.Zero, polygonBOffset ?? Geometry.Point.Zero))
            || (polygonA.vertices.length > 0 && Geometry.Collide.PolygonPoint(polygonB, polygonA.vertices[0], polygonBOffset ?? Geometry.Point.Zero, polygonAOffset ?? Geometry.Point.Zero)),
        PolygonPoint: (polygon: DeepReadonly<IPolygon>, point: DeepReadonly<IPoint>, polygonOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, pointOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => {            
            point = {
                x: point.x + pointOffset.x - polygonOffset.x,
                y: point.y + pointOffset.y - polygonOffset.y
            }
            return Geometry.Polygon.WindingNumber(polygon, point) != 0
        },
        AnyAny: (a?: DeepReadonly<Shape>, b?: DeepReadonly<Shape>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): boolean => {
            if(a == null || b == null)
                return false;
                    
            if(Geometry.IsRectangle(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleRectangle(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.RectangleCircle(a, b, aOffset, bOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.RectangleTriangle(a, b, aOffset, bOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.RectanglePolygon(a, b, aOffset, bOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.RectangleSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.RectangleRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.RectangleLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.RectanglePoint(a, b, aOffset, bOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
                    
            if(Geometry.IsCircle(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleCircle(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleCircle(a, b, aOffset, bOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.CircleTriangle(a, b, aOffset, bOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.CirclePolygon(a, b, aOffset, bOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.CircleSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.CircleRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.CircleLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.CirclePoint(a, b, aOffset, bOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
                    
            if(Geometry.IsTriangle(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleTriangle(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleTriangle(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TriangleTriangle(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.TrianglePolygon(a, b, aOffset, bOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.TriangleSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.TriangleRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.TriangleLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.TrianglePoint(a, b, aOffset, bOffset);
                } 
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
                    
            if(Geometry.IsPolygon(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectanglePolygon(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CirclePolygon(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TrianglePolygon(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonPolygon(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.PolygonSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.PolygonRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.PolygonLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PolygonPoint(a, b, aOffset, bOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
            
            if(Geometry.IsSegment(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TriangleSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.SegmentSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.RaySegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.LineSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PointSegment(b, a, bOffset, aOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
            
            if(Geometry.IsRay(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TriangleRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.RaySegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.RayRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.LineRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PointRay(b, a, bOffset, aOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
            
            if(Geometry.IsLine(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TriangleLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.LineSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.LineRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.LineLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PointLine(b, a, bOffset, aOffset);
                } 
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
                    
            if(Geometry.IsPoint(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectanglePoint(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CirclePoint(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TrianglePoint(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonPoint(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.PointSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.PointRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.PointLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PointPoint(a, b, aOffset, bOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }

            throw `Unfamiliar colliding shape a = ${JSON.stringify(a)}`;
        }
    }


    // given 3 colinear points, returns true if "b" and "c" are on the same side of "a"
    // returns true when "b" or "c" is equal to "a"
    // i.e. used to check if a point has exceeded the endpoint of a PointPair
    //  a = endpoint of PointPair being checked
    //  b = other endpoint of the same PointPair
    //  c = point being checked against the PointPair)
    // TODO: rename 
    private static isSameSideOfPoint = (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>, c: DeepReadonly<IPoint>, aOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, bOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, cOffset: DeepReadonly<IPoint>=Geometry.Point.Zero) => {
        const ax = a.x + aOffset.x;
        const ay = a.y + aOffset.y;
        const bx = b.x + bOffset.x;
        const by = b.y + bOffset.y;
        const cx = c.x + cOffset.x;
        const cy = c.y + cOffset.y;
        return Geometry.IsWithinToleranceOf(ax, bx)
            ? (Math.sign(cy - ay) === Math.sign(by - ay) || Geometry.IsWithinToleranceOf(ay, cy) || Geometry.IsWithinToleranceOf(ay, by))
            : (Math.sign(cx - ax) === Math.sign(bx - ax) || Geometry.IsWithinToleranceOf(ax, cx) || Geometry.IsWithinToleranceOf(ax, bx));
    }

    // TODO:
    //  1. test what happens when the lines/rays/segments are directly atop one another
    //  2. add shape vs. shape intersections as well
    public static Intersection = {
        CirclePointPair: (circle: DeepReadonly<ICircle>, pair: DeepReadonly<IPointPair>, circleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, pairOffset?: DeepReadonly<IPoint>): IPoint[] => {
            if(pairOffset)
                pair = {
                    a: {
                        x: pair.a.x + pairOffset.x,
                        y: pair.a.y + pairOffset.y,
                    },
                    b: {
                        x: pair.b.x + pairOffset.x,
                        y: pair.b.y + pairOffset.y,
                    }
                };
            const cx = circle.x + circleOffset.x;
            const cy = circle.y + circleOffset.y;
            const b = Geometry.Line.Yintercept(pair);
            const m = Geometry.Line.Slope(pair);
            const t = 1 + m * m;
            const u = 2 * b * m - 2 * cy * m - 2 * cx;
            const v = cx * cx + b * b + cy * cy - circle.r * circle.r - 2 * b * cy;

            const sq = u * u - 4 * t * v;
            if(sq < 0)
                return [];
            
            if(sq == 0) {
                const x = -u / (2 * t);
                const y = m * x + b;
                return [{ x, y }];
            }

            const sqrt = Math.sqrt(sq);
            const x1 = (-u + sqrt) / (2 * t);
            const y1 = m * x1 + b;
            const x2 = (-u - sqrt) / (2 * t);
            const y2 = m * x2 + b;
            return [
                { x: x1, y: y1 },
                { x: x2, y: y2 }
            ];
        },
        CircleLine: (circle: DeepReadonly<ICircle>, line: DeepReadonly<ILine>, circleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, lineOffset?: DeepReadonly<IPoint>): IPoint[] =>
            Geometry.Intersection.CirclePointPair(circle, line, circleOffset, lineOffset),
        CircleRay: (circle: DeepReadonly<ICircle>, ray: DeepReadonly<IRay>, circleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, rayOffset?: DeepReadonly<IPoint>): IPoint[] =>
            Geometry.Intersection.CirclePointPair(circle, ray, circleOffset, rayOffset)
                .filter(o => Geometry.isSameSideOfPoint(ray.a, ray.b, o, rayOffset ?? Geometry.Point.Zero, rayOffset ?? Geometry.Point.Zero, circleOffset)),
        CircleSegment: (circle: DeepReadonly<ICircle>, segment: DeepReadonly<ISegment>, circleOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, segmentOffset?: DeepReadonly<IPoint>): IPoint[] =>
            Geometry.Intersection.CirclePointPair(circle, segment, circleOffset, segmentOffset)
                .filter(o =>
                    Geometry.isSameSideOfPoint(segment.a, segment.b, o, segmentOffset ?? Geometry.Point.Zero, segmentOffset ?? Geometry.Point.Zero, circleOffset) && 
                    Geometry.isSameSideOfPoint(segment.b, segment.a, o, segmentOffset ?? Geometry.Point.Zero, segmentOffset ?? Geometry.Point.Zero, circleOffset)
                ),
        LineLine: (lineA: DeepReadonly<ILine>, lineB: DeepReadonly<ILine>, lineAOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, lineBOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(lineA, PointPairType.LINE, lineB, PointPairType.LINE, lineAOffset, lineBOffset),
        LineRay: (line: DeepReadonly<ILine>, ray: DeepReadonly<IRay>, lineOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, rayOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(line, PointPairType.LINE, ray, PointPairType.RAY, lineOffset, rayOffset),
        LineSegment: (line: DeepReadonly<ILine>, segment: DeepReadonly<ISegment>, lineOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, segmentOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(line, PointPairType.LINE, segment, PointPairType.SEGMENT, lineOffset, segmentOffset),
        RayRay: (rayA: DeepReadonly<IRay>, rayB: DeepReadonly<IRay>, rayAOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, rayBOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(rayA, PointPairType.RAY, rayB, PointPairType.RAY, rayAOffset, rayBOffset),
        RaySegment: (ray: DeepReadonly<IRay>, segment: DeepReadonly<ISegment>, rayOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, segmentOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(ray, PointPairType.RAY, segment, PointPairType.SEGMENT, rayOffset, segmentOffset),
        SegmentSegment: (segmentA: DeepReadonly<ISegment>, segmentB: DeepReadonly<ISegment>, segmentAOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, segmentBOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(segmentA, PointPairType.SEGMENT, segmentB, PointPairType.SEGMENT, segmentAOffset, segmentBOffset),
        SegmentsSegments: (segmentsA: DeepReadonly<DeepReadonly<ISegment>[]>, segmentsB: DeepReadonly<DeepReadonly<ISegment>[]>, segmentsAOffset: DeepReadonly<IPoint>=Geometry.Point.Zero, segmentsBOffset: DeepReadonly<IPoint>=Geometry.Point.Zero): IPoint[] =>
            segmentsA.map(segmentA => 
                segmentsB.map(segmentB => 
                    Geometry.Intersection.SegmentSegment(segmentA, segmentB, segmentsAOffset, segmentsBOffset)
                ).filter(o => o != null)
            ).flattened() as IPoint[],
        PolygonPolygon: (polygonA: DeepReadonly<IPolygon>, polygonB: DeepReadonly<IPolygon>, polygonAOffset?: DeepReadonly<IPoint>, polygonBOffset?: DeepReadonly<IPoint>): IPoint[] =>
            Geometry.Intersection.SegmentsSegments(Geometry.Polygon.Segments(polygonA, polygonAOffset), Geometry.Polygon.Segments(polygonB, polygonBOffset)),
        PointPair: (
            first: DeepReadonly<IPointPair>, firstType: PointPairType, 
            second: DeepReadonly<IPointPair>, secondType: PointPairType,
            firstOffset: DeepReadonly<IPoint>=Geometry.Point.Zero,
            secondOffset: DeepReadonly<IPoint>=Geometry.Point.Zero
        ): IPoint | null => {
            if(firstOffset && !Geometry.Point.AreEqual(firstOffset, Geometry.Point.Zero))
                first = {
                    a: {
                        x: first.a.x + firstOffset.x,
                        y: first.a.y + firstOffset.y,
                    },
                    b: {
                        x: first.b.x + firstOffset.x,
                        y: first.b.y + firstOffset.y,
                    }
                }
            if(secondOffset && !Geometry.Point.AreEqual(secondOffset, Geometry.Point.Zero))
                second = {
                    a: {
                        x: second.a.x + secondOffset.x,
                        y: second.a.y + secondOffset.y,
                    },
                    b: {
                        x: second.b.x + secondOffset.x,
                        y: second.b.y + secondOffset.y,
                    }
                }
            const yFirstLineDiff = first.b.y - first.a.y;
            const xFirstLineDiff = first.a.x - first.b.x;
            const cFirst = first.b.x * first.a.y - first.a.x * first.b.y;
            const ySecondLineDiff = second.b.y - second.a.y;
            const xSecondLineDiff = second.a.x - second.b.x;
            const cSecond = second.b.x * second.a.y - second.a.x * second.b.y;
    
            const denominator = yFirstLineDiff * xSecondLineDiff - ySecondLineDiff * xFirstLineDiff;
            if (denominator === 0)
                return null;
            const intersection = {
                x: (xFirstLineDiff * cSecond - xSecondLineDiff * cFirst) / denominator,
                y: (ySecondLineDiff * cFirst - yFirstLineDiff * cSecond) / denominator
            };

            if(firstType === PointPairType.LINE && secondType === PointPairType.LINE)
                return intersection;
    
            const beyondFirstA = !Geometry.isSameSideOfPoint(first.a, first.b, intersection);
            const beyondFirstB = !Geometry.isSameSideOfPoint(first.b, first.a, intersection);
            const beyondSecondA = !Geometry.isSameSideOfPoint(second.a, second.b, intersection);
            const beyondSecondB = !Geometry.isSameSideOfPoint(second.b, second.a, intersection)
    
            return firstType === PointPairType.SEGMENT && (beyondFirstA || beyondFirstB)
                || firstType === PointPairType.RAY && beyondFirstA
                || secondType === PointPairType.SEGMENT && (beyondSecondA || beyondSecondB)
                || secondType === PointPairType.RAY && beyondSecondA
                    ? null
                    : intersection;
        }
    }
}
