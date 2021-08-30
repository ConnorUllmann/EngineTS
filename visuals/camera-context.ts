import { Images } from "@engine-ts/core/images";
import { IRectangle } from "@engine-ts/geometry/interfaces";

export interface CameraContext {
    camera: IRectangle,
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
}

export interface ImagesCameraContext extends CameraContext {
    images: Images
}