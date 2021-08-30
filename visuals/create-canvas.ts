export function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

export function createCanvasScreenshotElement(canvas: OffscreenCanvas | HTMLCanvasElement): HTMLImageElement {
    var newImg = document.createElement('img');
    const blobFn = function(blob) {
        var url = URL.createObjectURL(blob);
        newImg.onload = function() { URL.revokeObjectURL(url); };
        newImg.src = url;
        newImg.style.padding="2px";
    }
    if(canvas instanceof OffscreenCanvas)
        canvas.convertToBlob().then(blobFn);
    else
        canvas.toBlob(blobFn);
    return newImg;
}