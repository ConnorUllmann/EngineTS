import { Point } from '../geometry/point';
import { Geometry } from '@engine-ts/geometry/geometry';
import { IPoint } from '@engine-ts/geometry/interfaces';
import { Camera } from './camera';
import { DeepReadonly } from './utils';

export enum MouseButton {
    Left = 0,
    Right = 2
}

export interface IMouse {
    readonly leftReleased: boolean
    readonly leftPressed: boolean
    readonly rightReleased: boolean
    readonly rightPressed: boolean
    readonly leftDown: boolean
    readonly rightDown: boolean
    readonly moved: boolean
    readonly focus: boolean
    readonly scroll: DeepReadonly<IPoint>
    readonly touchscreen: boolean
    readonly screenPosition: DeepReadonly<IPoint>
    readonly worldPosition: DeepReadonly<IPoint>
    readonly onCanvas: boolean
}

export class MouseSnapshot implements IMouse {
    leftReleased: boolean = false;
    leftPressed: boolean = false;
    rightReleased: boolean = false;
    rightPressed: boolean = false;
    leftDown: boolean = false;
    rightDown: boolean = false;
    moved: boolean = false;
    focus: boolean = false;
    scroll: Point = new Point();
    touchscreen: boolean = false;
    screenPosition: Point = new Point();
    worldPosition: Point = new Point();
    onCanvas: boolean = false;

    public update(snapshot: IMouse): this {
        this.leftReleased = snapshot.leftReleased;
        this.leftPressed = snapshot.leftPressed;
        this.rightReleased = snapshot.rightReleased;
        this.rightPressed = snapshot.rightPressed;
        this.leftDown = snapshot.leftDown;
        this.rightDown = snapshot.rightDown;
        this.moved = snapshot.moved;
        this.focus = snapshot.focus;
        this.scroll.setTo(snapshot.scroll);
        this.touchscreen = snapshot.touchscreen;
        this.screenPosition.setTo(snapshot.screenPosition);
        this.worldPosition.setTo(snapshot.worldPosition);
        this.onCanvas = snapshot.onCanvas;
        return this;
    }
}

export class Mouse extends Point implements IMouse {
    public leftReleased: boolean = false;
    public leftPressed: boolean = false;    
    public rightReleased: boolean = false;    
    public rightPressed: boolean = false;
    public leftDown: boolean = false;
    public rightDown: boolean = false;
    public moved: boolean = false;
    public focus: boolean = false;
    public scroll: Point = new Point();
    public get touchscreen(): boolean { return 'ontouchstart' in document.documentElement; }

    // position relative to the screen, e.g. always (0, 0) whenever the mouse is on the top-left pixel
    public get screenPosition(): DeepReadonly<IPoint> { return this; }
    // position in the world relative to the camera
    private readonly _worldPosition = new Point();
    public get worldPosition(): DeepReadonly<IPoint> { return this._worldPosition.setToXY(this.camera.x + this.x, this.camera.y + this.y); }

    public get onCanvas(): boolean {
        return this.focus 
            && this.x != null 
            && this.y != null 
            && this.x >= 0 
            && this.x < this.camera.w 
            && this.y >= 0 && this.y < this.camera.h;
    }

    constructor(private readonly canvas: HTMLCanvasElement, private readonly camera: Camera) { super(); }

    public start(): void {
        const mouse = this;
        this.canvas.addEventListener('mousemove', (mouseEvent: MouseEvent) => {
            const rect = mouse.canvas.getBoundingClientRect();
            const canvasScale = mouse.camera.canvasScale;
            if(canvasScale.x == canvasScale.y) {
                mouse.x = (mouseEvent.clientX - rect.left) * canvasScale.x;
                mouse.y = (mouseEvent.clientY - rect.top) * canvasScale.y;
            } else {
                if(mouse.canvas.style.objectFit === 'contain') {
                    const wExpected = mouse.canvas.clientHeight / mouse.canvas.height * mouse.canvas.width;
                    if(mouse.canvas.clientWidth > wExpected) {
                        const smallerCanvasScale = canvasScale.y;
                        const marginsWidthTotal = mouse.canvas.clientWidth - wExpected;
                        mouse.x = (mouseEvent.clientX - (rect.left + marginsWidthTotal/2)) * smallerCanvasScale
                        mouse.y = (mouseEvent.clientY - rect.top) * smallerCanvasScale
                    } else {
                        const hExpected = mouse.canvas.clientWidth / mouse.canvas.width * mouse.canvas.height;
                        const smallerCanvasScale = canvasScale.x;
                        const marginsHeightTotal = mouse.canvas.clientHeight - hExpected;
                        mouse.x = (mouseEvent.clientX - rect.left) * smallerCanvasScale
                        mouse.y = (mouseEvent.clientY - (rect.top + marginsHeightTotal/2)) * smallerCanvasScale
                    }                    
                } else {
                    const clientScaledWidth = mouse.canvas.clientWidth / mouse.canvas.clientHeight * mouse.camera.h;
                    const marginsWidthTotal = clientScaledWidth - mouse.camera.w;
                    const xMouseShifted = (mouseEvent.clientX - rect.left) * canvasScale.y
                    mouse.x = xMouseShifted - marginsWidthTotal/2;
                    mouse.y = (mouseEvent.clientY - rect.top) * canvasScale.y;
                }
            }
            this.moved = true;
        }, false);

        if(this.touchscreen) {
            document.body.addEventListener("touchstart", (touchEvent: TouchEvent) => mouse.leftMouseDownEvent());
            document.body.addEventListener("touchend", (touchEvent: TouchEvent) => mouse.leftMouseUpEvent());
        }
        
        document.body.addEventListener("mouseup", (mouseEvent: MouseEvent) => {
            switch(mouseEvent.button) {
                case MouseButton.Left:
                    mouse.leftMouseUpEvent();
                    break;
                case MouseButton.Right:
                    mouse.rightMouseUpEvent();
                    break;
            }
        });
        document.body.addEventListener("mousedown", (mouseEvent: MouseEvent) => {
            switch(mouseEvent.button) {
                case MouseButton.Left:
                    mouse.leftMouseDownEvent();
                    break;
                case MouseButton.Right:
                    mouse.rightMouseDownEvent();
                    break;
            }
        });
        this.canvas.addEventListener ("mouseout", (mouseEvent: MouseEvent) => mouse.focus = false);
        this.canvas.addEventListener ("mouseover", (mouseEvent: MouseEvent) => mouse.focus = true);
        this.canvas.addEventListener('wheel', (wheelEvent: WheelEvent) => mouse.scroll.y = wheelEvent.deltaY);
        this.update();
    };

    public update(): void {
        this.leftReleased = false;
        this.leftPressed = false;
        this.rightReleased = false;
        this.rightPressed = false;
        this.scroll.x = 0;
        this.scroll.y = 0;
        this.moved = false;
    }

    private leftMouseDownEvent(): void {
        this.leftPressed = true;
        this.leftDown = true;
    };

    private leftMouseUpEvent(): void {
        this.leftReleased = true;
        this.leftDown = false;
    };

    private rightMouseDownEvent(): void {
        this.rightPressed = true;
        this.rightDown = true;
    };

    private rightMouseUpEvent(): void {
        this.rightReleased = true;
        this.rightDown = false;
    };
}