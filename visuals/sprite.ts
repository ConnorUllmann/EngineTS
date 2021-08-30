import { RNG } from '@engine-ts/core/rng';
import { clamp, DeepReadonly, rng } from '@engine-ts/core/utils';
import { World } from '@engine-ts/core/world';
import { Geometry } from '@engine-ts/geometry/geometry';
import { IPoint } from '@engine-ts/geometry/interfaces';
import { LoopTimer, Timer } from '@engine-ts/tools/timer';
import { WeightRange } from '@engine-ts/tools/weight-range';
import { ImagesCameraContext } from './camera-context';
import { Draw } from './draw';

export interface ISpriteFrame {
    indices: IPoint,
    timeWeight?: number, // defaults to 1 if not set
}

export class SpriteAnimation {
    private weightRange: WeightRange<IPoint>;
    private readonly timer: Timer;

    // speed can be negative
    // completion will also count backwards, non-looping animations will need to be set to completion=1 to do their animation
    public speed: number = 1;

    get seconds(): number { return this.timer.seconds; }
    get completion(): number { return this.timer.value; }
    set completion(value: number) { this.timer.value = clamp(value, 0, 1);}
    get finished(): boolean { return this.timer.finished; }
    get currentIndices(): IPoint | null { return this.weightRange.value(this.timer.value); }
    get currentFrameIndex(): number | null { return this.weightRange.index(this.timer.value); }
    set currentFrameIndex(frameIndex: number | null) { this.timer.value = this.weightRange.normal(frameIndex ?? 0); }
    get frameCount(): number { return this.weightRange.range.length; }

    constructor(
        frames: DeepReadonly<ISpriteFrame[]>,
        seconds: number,
        loop: boolean=true,
        completion: number=0,
    ) {
        this.timer = loop ? new LoopTimer(seconds) : new Timer(seconds);
        this.completion = completion;
        this.weightRange = new WeightRange<IPoint>(...frames.map(o => ({ value: o.indices, weight: o.timeWeight ?? 1 })))
    }

    update(deltaMs: number) { this.timer.update(deltaMs * this.speed); }
    reset() { this.timer.reset(); }
    randomize(_rng?: RNG) { this.timer.value = (_rng ?? rng).random(); }
}

export class Sprite {
    private readonly animationByName: { [animationName: string]: SpriteAnimation } = {};
    private _currentAnimationName: string;
    public get currentAnimationName(): string { return this._currentAnimationName; }

    public get currentAnimationCompletion(): number { 
        if(this._currentAnimationName in this.animationByName)
            return this.animationByName[this._currentAnimationName].completion;
        return 0;
    }
    public set currentAnimationCompletion(completion: number) { 
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].completion = completion;
    }
    public get currentAnimationSpeed(): number { 
        if(this._currentAnimationName in this.animationByName)
            return this.animationByName[this._currentAnimationName].speed;
        return 0;
    }
    public set currentAnimationSpeed(speed: number) { 
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].speed = speed;
    }
    public get currentAnimationFrameIndex(): number | null {
        if(this._currentAnimationName in this.animationByName)
            return this.animationByName[this._currentAnimationName].currentFrameIndex;
        return null;
    }
    public set currentAnimationFrameIndex(frameIndex: number | null) {
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].currentFrameIndex = (frameIndex ?? 0) % this.animationByName[this._currentAnimationName].frameCount;
    }
    public get currentAnimationFrameCount(): number | null {
        if(this._currentAnimationName in this.animationByName)
            return this.animationByName[this._currentAnimationName].frameCount;
        return null;
    }

    constructor(
        public readonly world: World,
        public readonly imageName: string,
        public readonly wFrame: number,
        public readonly hFrame: number,
    ) {}

    get isCurrentAnimationFinished(): boolean {
        if(!(this._currentAnimationName in this.animationByName))
            return false;
        return this.animationByName[this._currentAnimationName].finished;
    }

    addAnimation(animationName: string, animation: SpriteAnimation): this {
        this.animationByName[animationName] = animation;
        return this;
    }

    // forceChange = restart the animation if it's already the animation that's playing
    setAnimation(animationName: string, forceChange=false): this {
        if(!forceChange && animationName === this._currentAnimationName)
            return this;
        
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].reset();
        this._currentAnimationName = animationName;
        return this;
    }

    getAnimation(animationName: string): SpriteAnimation | null {
        return this.animationByName[animationName] ?? null;
    }

    resetCurrentAnimation(): this {
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].reset();
        return this;
    }

    update() {
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].update(this.world.delta);
    }

    draw(position: IPoint,
        scale: IPoint=Geometry.Point.One,
        angle: number=0,
        center?:IPoint,
        alpha:number=1,
        cameraContext: ImagesCameraContext=this.world,
    ) {
        if(this._currentAnimationName in this.animationByName) {
            const animation = this.animationByName[this._currentAnimationName];
            const currentIndices = animation.currentIndices;
            if(currentIndices != null)
                this.drawFrame(position, currentIndices.x, currentIndices.y, scale, angle, center, alpha, cameraContext);
        } else if(this._currentAnimationName == null) {
            this.drawFrame(position, 0, 0, scale, angle, center, alpha, cameraContext);
        }
    }

    private drawFrame(
        position: IPoint,
        xIndex: number,
        yIndex: number,
        scale: IPoint=Geometry.Point.One,
        angle: number=0,
        center?:IPoint,
        alpha:number=1,
        cameraContext: ImagesCameraContext=this.world,
    ) {
        Draw.ImagePart(
            cameraContext,
            this.imageName,
            position,
            xIndex * this.wFrame,
            yIndex * this.hFrame,
            this.wFrame,
            this.hFrame,
            scale,
            angle,
            center,
            alpha
        );
    }
}