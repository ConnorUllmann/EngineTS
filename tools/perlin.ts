import { clamp, rng } from '../core/utils';
import { PixelGrid } from './pixel-grid';
import { Color } from '../visuals/color';
import { IPoint } from '../geometry/interfaces';
import { Geometry } from '../geometry/geometry';
import { RNG } from '../core/rng';
import { CameraContext } from '../visuals/camera-context';
import { Grid } from '../geometry/grid';

export class Perlin {
  private noiseCanvas: OffscreenCanvas;
  private perlinCanvas: OffscreenCanvas;
  private perlinPixelGrid: PixelGrid;

  constructor(
    public readonly w: number,
    public readonly h: number,
    alpha: number = 1,
    scale?: number,
    private readonly rng?: RNG
  ) {
    this.noiseCanvas = new OffscreenCanvas(w, h);
    this.perlinCanvas = new OffscreenCanvas(w, h);
    this.refreshRandomNoise(alpha);
    this.refreshPerlinNoise(scale == null ? this.noiseCanvas.width : scale);
    this.perlinPixelGrid = new PixelGrid(this.perlinCanvas);
  }

  refreshRandomNoise(alpha: number = 1): this {
    const x = 0;
    const y = 0;
    const context = this.noiseCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    const imageData = context.getImageData(x, y, this.noiseCanvas.width, this.noiseCanvas.height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      // greyscale so set all rgb to the same value
      pixels[i] = pixels[i + 1] = pixels[i + 2] = ((this.rng ?? rng).random() * 256) | 0;
      pixels[i + 3] = alpha * 255;
    }
    context.putImageData(imageData, x, y);
    return this;
  }

  getPixelColor(position: IPoint): Color | null {
    return this.perlinPixelGrid.get(position);
  }

  setPixelColor(position: IPoint, color: Color): this {
    this.perlinPixelGrid.set(position, color);
    return this;
  }

  // https://gist.github.com/donpark/1796361
  refreshPerlinNoise(scale: number): this {
    const contextDestination = this.perlinCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    const canvasSource = this.noiseCanvas;
    for (let size = 4; size <= scale; size *= 2) {
      const w = (size * canvasSource.width) / scale;
      const h = (size * canvasSource.height) / scale;
      let x = ((this.rng ?? rng).random() * (canvasSource.width - w)) | 0;
      let y = ((this.rng ?? rng).random() * (canvasSource.height - h)) | 0;
      contextDestination.globalAlpha = 4 / size;
      contextDestination.drawImage(canvasSource, x, y, w, h, 0, 0, canvasSource.width, canvasSource.height);
    }
    return this;
  }

  normalizePerlinNoise(): this {
    const perlinValues = Grid.Map(this.perlinPixelGrid, color => color.red);
    const perlinValuesMin = perlinValues.min() ?? 0;
    const perlinValuesMax = perlinValues.max() ?? 0;

    const filter = (position: IPoint, getColor: (position: IPoint) => Color | null) => {
      const oldValue = getColor(position)?.red ?? 0;
      const normal =
        perlinValuesMin == perlinValuesMax ? 0 : (oldValue - perlinValuesMin) / (perlinValuesMax - perlinValuesMin);
      const newValue = clamp(Math.floor(256 * normal), 0, 255);
      return new Color(newValue, newValue, newValue, 1);
    };
    this.perlinPixelGrid.applyFilter(filter);
    return this;
  }

  blurPerlinNoise(range: number = 1): this {
    return this.applyFilterWithBuffer(({ x, y }: IPoint) => {
      let neighborSum = 0;
      let neighborCount = 0;
      for (let i = -range; i <= range; i++) {
        for (let j = -range; j <= range; j++) {
          const neighbor = this.perlinPixelGrid.get({ x: x + i, y: y + j });
          if (neighbor) {
            neighborSum += neighbor.red;
            neighborCount++;
          }
        }
      }
      const neighborMean = Math.floor(neighborSum / neighborCount);
      return new Color(neighborMean, neighborMean, neighborMean, 1);
    });
  }

  applyFilter(filter: (position: IPoint, getColor: (position: IPoint) => Color | null) => Color): this {
    this.perlinPixelGrid.applyFilter(filter);
    return this;
  }

  applyFilterWithBuffer(filter: (position: IPoint, getColor: (position: IPoint) => Color | null) => Color): this {
    this.perlinPixelGrid.applyFilterWithBuffer(filter);
    return this;
  }

  renderToContext(
    context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    position: IPoint = Geometry.Point.Zero
  ) {
    this.perlinPixelGrid.renderToContext(context, position);
  }

  draw(cameraContext: CameraContext, position: IPoint = Geometry.Point.Zero, scale: IPoint = Geometry.Point.One) {
    this.perlinPixelGrid.draw(cameraContext, position, scale);
  }

  getImageData(): ImageData {
    return this.perlinPixelGrid.getImageData();
  }
}
