import { Geometry } from '../geometry/geometry';
import { IPoint } from '../geometry/interfaces';
import { Color } from '../visuals/color';
import { Camera } from './camera';
import { IComponent } from './component';
import { Entity } from './entity';
import { Gamepads } from './gamepads';
import { Keyboard } from './keyboard';
import { Mouse } from './mouse';
import { Sounds } from './sounds';
import { DeepReadonly } from './utils';

export enum InputType {
  Gamepad,
  Keyboard,
}

export class World {
  public readonly canvas: HTMLCanvasElement;
  public readonly context: CanvasRenderingContext2D;

  public readonly sounds: Sounds;
  public readonly camera: Camera;
  private readonly _mouse: Mouse;
  public get mouse(): Mouse {
    return this._mouse;
  }
  public readonly keyboard: Keyboard;
  public readonly gamepads: Gamepads;

  public readonly entities: Entity[] = [];
  private readonly entityById: { [id: number]: Entity } = {};
  private readonly entitiesByClass: { [key: string]: Entity[] } = {};

  private readonly entityToAddById: { [id: number]: Entity } = {};
  private readonly entityToRemoveById: { [id: number]: Entity } = {};

  private nextEntityId: number = 0;

  public paused: boolean = false;
  public framesSinceStart = 0;
  public get millisecondsPerFrame(): number {
    return 1000 / this.fps;
  }
  public get millisecondsSinceStart(): number {
    return this._firstUpdateTimestamp == null ? 0 : Date.now() - this._firstUpdateTimestamp;
  }
  private _isFirstFrame: boolean = true;
  public get isFirstFrame(): boolean {
    return this._isFirstFrame;
  }
  public _firstUpdateTimestamp: number | null = null;
  public get firstUpdateTimestamp(): number | null {
    return this._firstUpdateTimestamp;
  }
  public _lastUpdatePerformanceTimestamp: number = 0;
  public _delta: number = 0;
  public fixedFrameRate: boolean = true;
  public get delta(): number {
    return this.fixedFrameRate ? this.millisecondsPerFrame : this._delta;
  }
  public get deltaNormal(): number {
    return this.delta / this.millisecondsPerFrame;
  }
  public lastFrameFps: number = 0;
  public _millisecondsLastUpdate: number = 0;
  public get millisecondsLastUpdate(): number {
    return this._millisecondsLastUpdate;
  }

  public backgroundColor: DeepReadonly<Color> | (() => DeepReadonly<Color>) | null = Color.lightGrey;

  // can be set externally to evaluate whether entities should be updated/drawn this frame
  // mouse/keyboard/gamepad updates will still be received during the period this function returns false
  public canUpdateEntities: (() => boolean) | null = null;

  // if assigned, only this entity will update & draw
  public singletonEntity: Entity | null = null;

  private interval: any | null = null;

  public lastInputTypeUsed = InputType.Keyboard;

  // create in ngOnInit and not in the component's constructor
  constructor(
    canvasIdOrElement: string | HTMLCanvasElement,
    canvasResolutionWidth: number = 1280,
    canvasResolutionHeight: number = 960,
    alpha: boolean = true,
    public readonly fps: number = 60
  ) {
    console.log(`World started using canvas with id '${canvasIdOrElement}'`);
    this.canvas =
      canvasIdOrElement instanceof HTMLCanvasElement
        ? canvasIdOrElement
        : (document.getElementById(canvasIdOrElement) as HTMLCanvasElement);
    if (this.canvas == null) throw `Canvas does not exist`;
    if (!this.canvas.getContext) throw `Cannot retrieve canvas context'`;
    const context = this.canvas.getContext('2d', { alpha });
    if (context == null) throw `Cannot retrieve 2D rendering context for canvas`;
    this.context = context;
    this.canvas.oncontextmenu = () => false;

    this.setCanvasResolution(canvasResolutionWidth, canvasResolutionHeight);

    this.sounds = new Sounds();
    this.camera = new Camera(this.canvas);
    this._mouse = new Mouse(this.canvas, this.camera);
    this.keyboard = new Keyboard();
    this.gamepads = new Gamepads();

    this._mouse.start();
    this.keyboard.start();
    this.gamepads.start();

    this.startLoop();
  }

  // removes all references to all entities without destroying them
  public dereferenceAllEntities() {
    this.entities.clear();
    Object.keys(this.entityById).forEach(key => delete this.entityById[key]);
    Object.keys(this.entitiesByClass).forEach(key => delete this.entitiesByClass[key]);
    Object.keys(this.entityToAddById).forEach(key => delete this.entityToAddById[key]);
    Object.keys(this.entityToRemoveById).forEach(key => delete this.entityToRemoveById[key]);
    this.singletonEntity = null;
  }

  public startLoop() {
    if (this.interval) return;

    // default _delta to the value at the given fps
    this._delta = this.millisecondsPerFrame;
    // not using requestAnimationFrame because fixed frame rate would be impossible
    this.interval = setInterval(() => this.updateFrame(), this.millisecondsPerFrame);
  }

  public stopLoop() {
    if (!this.interval) return;

    clearInterval(this.interval);
    this.interval = null;
  }

  // sets the canvas so it is fully contained inside the parent element
  public setCanvasContained() {
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.objectFit = 'contain';
  }

  private setCanvasResolution(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  private async updateFrame(): Promise<void> {
    if (this.paused) return;

    const startMs = Date.now();

    this.updateDelta();

    // gamepad inputs update before the entities because all inputs are received simultaneously during its update
    // unlike keyboard & mouse which are streamed in via events (and then reset by their update methods)
    this.gamepads.update();

    const canUpdateEntities = this.canUpdateEntities == null || this.canUpdateEntities();
    if (canUpdateEntities) {
      this.updateEntities();
      this.clearCanvas(typeof this.backgroundColor === 'function' ? this.backgroundColor() : this.backgroundColor);
      this.drawEntities();
    }

    if (this.keyboard.hasInputThisFrame || this.mouse.hasInputThisFrame) this.lastInputTypeUsed = InputType.Keyboard;
    else if (this.gamepads.hasInputThisFrame) this.lastInputTypeUsed = InputType.Gamepad;

    this._mouse.update();
    this.keyboard.update();

    this._isFirstFrame = false;

    this._millisecondsLastUpdate = Date.now() - startMs;
    this.framesSinceStart++;
  }

  private updateEntity = (o: Entity) => {
    if (o.active && !o.destroyed) {
      o.update();
      for (let _class in o.componentsByClass)
        o.componentsByClass[_class].forEach((c: IComponent) => {
          if (c.active && !c.removed && c.update) c.update();
        });
    }
  };
  private postUpdateEntity = (o: Entity) => {
    if (o.active && !o.destroyed) o.postUpdate();
  };
  private drawEntity = (o: Entity) => {
    if (o.visible && !o.destroyed) o.draw();
  };

  private updateDelta(): void {
    if (this._firstUpdateTimestamp == null) this._firstUpdateTimestamp = Date.now();
    const now = performance.now();
    if (this._lastUpdatePerformanceTimestamp != 0) this._delta = now - this._lastUpdatePerformanceTimestamp;
    this.lastFrameFps = Math.round(1000 / this._delta);
    this._lastUpdatePerformanceTimestamp = now;
  }

  public flushAdded() {
    for (const id in this.entityToAddById) {
      const entity = this.entityToAddById[id];
      delete this.entityToAddById[id];

      this.entities.push(entity);
      this.entityById[id] = entity;
      if (!(entity.class in this.entitiesByClass)) this.entitiesByClass[entity.class] = [];
      this.entitiesByClass[entity.class].push(entity);
    }
  }

  public flushRemoved() {
    for (const id in this.entityToRemoveById) {
      const entity = this.entityToRemoveById[id];
      delete this.entityToRemoveById[id];

      entity.removeAllComponents();
      entity.remove();
      this.entities.remove(entity);
      delete this.entityById[entity.id];
      this.entitiesByClass[entity.class].remove(entity);
      if (this.entitiesByClass[entity.class].length <= 0) delete this.entitiesByClass[entity.class];
      entity.removed = true;
    }

    // in case any entities are removed as a result of another entity's removal
    if (Object.keys(this.entityToRemoveById).length > 0) this.flushRemoved();
  }

  private updateEntities(): void {
    this.flushAdded();

    this.sortEntitiesByUpdateOrder();

    if (this.singletonEntity) this.updateEntity(this.singletonEntity);
    else this.entities.forEach(this.updateEntity);

    if (this.singletonEntity) this.postUpdateEntity(this.singletonEntity);
    else this.entities.forEach(this.postUpdateEntity);

    this.flushRemoved();
  }

  private drawEntities() {
    this.sortEntitiesByUpdateOrder();

    if (this.singletonEntity) this.drawEntity(this.singletonEntity);
    else this.entities.forEach(this.drawEntity);
  }

  // returns the id of the entity
  public addEntity(entity: Entity): number {
    const entityId = this.nextEntityId++;
    this.entityToAddById[entityId] = entity;
    return entityId;
  }

  public destroyEntity(entity: Entity) {
    if (entity.world != this || entity.destroyed) return;
    this.entityToRemoveById[entity.id] = entity;
    entity.destroyed = true;
  }

  public clearCanvas(color: DeepReadonly<Color> | null = null) {
    if (color == null) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    this.context.fillStyle = Color.ToString(color);
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private sortEntitiesByUpdateOrder() {
    this.entities.sort(this.compareUpdateOrders);
  }

  private compareUpdateOrders(a: Entity, b: Entity): number {
    return a.depth === b.depth ? a.id - b.id : b.depth - a.depth;
  }

  // not a clone of the list, but the actual World list itself!
  public entitiesOfClass<T extends new (...args: any[]) => Entity>(_class: T): InstanceType<T>[] {
    return _class.name in this.entitiesByClass ? (this.entitiesByClass[_class.name] as InstanceType<T>[]) : [];
  }

  public entityOfId(id: number): Entity | null {
    return this.entityById[id] ?? null;
  }

  public closestEntityOfClasses<T extends new (...args: any[]) => Entity>(
    _classes: T[],
    position: IPoint,
    boolCheck: (t: InstanceType<T>) => boolean
  ): InstanceType<T> | null {
    const entities: InstanceType<T>[] = [];
    for (let _class of _classes) {
      for (let entity of this.entitiesOfClass(_class)) {
        if (boolCheck(entity)) entities.push(entity);
      }
    }
    return entities.minOf(entity => Geometry.Point.DistanceSq(entity.position, position)) ?? null;
  }

  public firstEntityOfClasses<T extends new (...args: any[]) => Entity>(
    _classes: T[],
    boolCheck?: (t: InstanceType<T>) => boolean
  ): InstanceType<T> | null {
    for (let _class of _classes) {
      const result = this.entitiesOfClass(_class).first(boolCheck);
      if (result != null) return result;
    }
    return null;
  }

  public forEachComponentOfClass<T extends new (...args: any[]) => U, U extends IComponent>(
    _class: T,
    forEach: (c: InstanceType<T>) => any
  ) {
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (!entity.active) continue;

      const components = entity.componentsOfClass(_class);
      if (components) {
        for (let component of components) {
          if (!component.active) continue;

          forEach(component);
        }
      }
    }
    return null;
  }

  public firstComponentOfClass<T extends new (...args: any[]) => U, U extends IComponent>(
    _class: T,
    first: (c: InstanceType<T>) => boolean
  ): InstanceType<T> | null {
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (!entity.active) continue;

      const components = entity.componentsOfClass(_class);
      if (components) {
        for (let component of components) {
          if (!component.active) continue;

          if (first(component)) return component;
        }
      }
    }
    return null;
  }

  // gets the first entity of a class
  public singleton<T extends new (...args: any[]) => U, U extends Entity>(_class: T): InstanceType<T> | null {
    if (!(_class.name in this.entitiesByClass)) return null;
    const entity = this.entitiesByClass[_class.name].first();
    return entity == null ? null : (entity as InstanceType<T>);
  }
}
