import { Point } from '../geometry/point';
import { IPoint } from '@engine-ts/geometry/interfaces';
import { Camera } from './camera';
import { DeepReadonly, enumToList } from './utils';

export enum MouseButton {
    Left = 0,
    Right = 2
}
export const MouseButtons = enumToList(MouseButton);

export enum MouseScroll {
    Up = 'Up',
    Down = 'Down',
}
export const MouseScrolls = enumToList(MouseScroll);

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
    readonly scrollPrevious: DeepReadonly<IPoint>
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
    scrollPrevious: Point = new Point();
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
        this.scrollPrevious.setTo(this.scroll);
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
    public scrollPrevious: Point = new Point();
    public get touchscreen(): boolean { return 'ontouchstart' in document.documentElement; }

    // position relative to the screen, e.g. always (0, 0) whenever the mouse is on the top-left pixel
    public get screenPosition(): DeepReadonly<IPoint> { return this; }
    // position in the world relative to the camera
    private readonly _worldPosition = new Point();
    public get worldPosition(): DeepReadonly<IPoint> { return this._worldPosition.setToXY(this.camera.x + this.x, this.camera.y + this.y); }

    public active = true;

    public get onCanvas(): boolean {
        return this.focus 
            && this.x != null 
            && this.y != null 
            && this.x >= 0 
            && this.x < this.camera.w 
            && this.y >= 0 && this.y < this.camera.h;
    }

    public mouseMoveHandler = (mouseEvent: MouseEvent) => {
        if(!this.active)
            return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasScale = this.camera.canvasScale;
        if(canvasScale.x == canvasScale.y) {
            this.x = (mouseEvent.clientX - rect.left) * canvasScale.x;
            this.y = (mouseEvent.clientY - rect.top) * canvasScale.y;
        } else {
            if(this.canvas.style.objectFit === 'contain') {
                const wExpected = this.canvas.clientHeight / this.canvas.height * this.canvas.width;
                if(this.canvas.clientWidth > wExpected) {
                    const smallerCanvasScale = canvasScale.y;
                    const marginsWidthTotal = this.canvas.clientWidth - wExpected;
                    this.x = (mouseEvent.clientX - (rect.left + marginsWidthTotal/2)) * smallerCanvasScale
                    this.y = (mouseEvent.clientY - rect.top) * smallerCanvasScale
                } else {
                    const hExpected = this.canvas.clientWidth / this.canvas.width * this.canvas.height;
                    const smallerCanvasScale = canvasScale.x;
                    const marginsHeightTotal = this.canvas.clientHeight - hExpected;
                    this.x = (mouseEvent.clientX - rect.left) * smallerCanvasScale
                    this.y = (mouseEvent.clientY - (rect.top + marginsHeightTotal/2)) * smallerCanvasScale
                }
            } else {
                const clientScaledWidth = this.canvas.clientWidth / this.canvas.clientHeight * this.camera.h;
                const marginsWidthTotal = clientScaledWidth - this.camera.w;
                const xMouseShifted = (mouseEvent.clientX - rect.left) * canvasScale.y
                this.x = xMouseShifted - marginsWidthTotal/2;
                this.y = (mouseEvent.clientY - rect.top) * canvasScale.y;
            }
        }
        this.moved = true;
    }
    public touchStartHandler = (touchEvent: TouchEvent) => {
        if(!this.active)
            return;
        
        this.leftMouseDownEvent();
    }
    public touchEndHandler = (touchEvent: TouchEvent) => {
        if(!this.active)
            return;
        
        this.leftMouseUpEvent();
    }
    public mouseUpHandler = (mouseEvent: MouseEvent) => {
        if(!this.active)
            return;
        
        switch(mouseEvent.button) {
            case MouseButton.Left:
                this.leftMouseUpEvent();
                break;
            case MouseButton.Right:
                this.rightMouseUpEvent();
                break;
        }
    }
    public mouseDownHandler = (mouseEvent: MouseEvent) => {
        if(!this.active)
            return;
        
        switch(mouseEvent.button) {
            case MouseButton.Left:
                this.leftMouseDownEvent();
                break;
            case MouseButton.Right:
                this.rightMouseDownEvent();
                break;
        }
    }
    public mouseOutHandler = (mouseEvent: MouseEvent) => {
        if(!this.active)
            return;
        
        this.focus = false;
    }
    public mouseOverHandler = (mouseEvent: MouseEvent) => {
        if(!this.active)
            return;
        
        this.focus = true;
    }
    public wheelHandler = (wheelEvent: WheelEvent) => {
        if(!this.active)
            return;
        
        this.scroll.y = wheelEvent.deltaY;
    }

    constructor(private readonly canvas: HTMLCanvasElement, private readonly camera: Camera) { super(); }

    private started = false;

    destroy() {
        if(!this.started)
            return;
        
        this.started = false;

        if(this.touchscreen) {
            document.body.removeEventListener("touchstart", this.touchStartHandler);
            document.body.removeEventListener("touchend", this.touchEndHandler);
        }
        
        document.body.removeEventListener("mouseup", this.mouseUpHandler);
        document.body.removeEventListener("mousedown", this.mouseDownHandler);

        this.canvas.removeEventListener('mousemove', this.mouseMoveHandler, false);
        this.canvas.removeEventListener("mouseout", this.mouseOutHandler);
        this.canvas.removeEventListener("mouseover", this.mouseOverHandler);
        this.canvas.removeEventListener('wheel', this.wheelHandler);
    }

    start() {
        if(this.started)
            return;
        
        this.started = true;
        
        if(this.touchscreen) {
            document.body.addEventListener("touchstart", this.touchStartHandler);
            document.body.addEventListener("touchend", this.touchEndHandler);
        }
        
        document.body.addEventListener("mouseup", this.mouseUpHandler);
        document.body.addEventListener("mousedown", this.mouseDownHandler);

        this.canvas.addEventListener('mousemove', this.mouseMoveHandler, false);
        this.canvas.addEventListener("mouseout", this.mouseOutHandler);
        this.canvas.addEventListener("mouseover", this.mouseOverHandler);
        this.canvas.addEventListener('wheel', this.wheelHandler);
        this.update();
    };

    public resetInputs(): void {
        this.leftReleased = false;
        this.leftDown = false;
        this.leftPressed = false;
        this.rightReleased = false;
        this.rightDown = false;
        this.rightPressed = false;
        this.scrollPrevious.x = 0;
        this.scrollPrevious.y = 0;
        this.scroll.x = 0;
        this.scroll.y = 0;
        this.moved = false;
        this.focus = false;
    }

    public update(): void {
        this.leftReleased = false;
        this.leftPressed = false;
        this.rightReleased = false;
        this.rightPressed = false;
        this.scrollPrevious.x = this.scroll.x;
        this.scrollPrevious.y = this.scroll.y;
        this.scroll.x = 0;
        this.scroll.y = 0;
        this.moved = false;
    }

    public allPressed(): (MouseButton | MouseScroll)[] {
        const result: (MouseButton | MouseScroll)[] = [];
        if(this.leftPressed)
            result.push(MouseButton.Left);
        if(this.rightPressed)
            result.push(MouseButton.Right);
        if(this.scroll.y > 0 && this.scrollPrevious.y <= 0)
            result.push(MouseScroll.Down);
        if(this.scroll.y < 0 && this.scrollPrevious.y >= 0)
            result.push(MouseScroll.Up);
        return result;
    }

    public allDown(): (MouseButton | MouseScroll)[] {
        const result: (MouseButton | MouseScroll)[] = [];
        if(this.leftDown)
            result.push(MouseButton.Left);
        if(this.rightDown)
            result.push(MouseButton.Right);
        if(this.scroll.y > 0)
            result.push(MouseScroll.Down);
        if(this.scroll.y < 0)
            result.push(MouseScroll.Up);
        return result;
    }

    public allReleased(): (MouseButton | MouseScroll)[] {
        const result: (MouseButton | MouseScroll)[] = [];
        if(this.leftReleased)
            result.push(MouseButton.Left);
        if(this.rightReleased)
            result.push(MouseButton.Right);
        if(this.scroll.y <= 0 && this.scrollPrevious.y > 0)
            result.push(MouseScroll.Down);
        if(this.scroll.y >= 0 && this.scrollPrevious.y < 0)
            result.push(MouseScroll.Up);
        return result;
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