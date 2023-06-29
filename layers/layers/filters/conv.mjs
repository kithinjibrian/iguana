import clamp from "../../../utils/clamp.mjs"

export default class Conv {
    constructor(opts) {
        const myKernels = {
            "emboss": [
                [-2, -1, 0],
                [-1, 1, 1],
                [0, 1, 2]
            ],
            "blur": [
                [1 / 9, 1 / 9, 1 / 9],
                [1 / 9, 1 / 9, 1 / 9],
                [1 / 9, 1 / 9, 1 / 9],
            ],
            "sharpen": [
                [0, -0.5, 0],
                [-0.5, 3, -0.5],
                [0, -0.5, 0],
            ],
        }
        this.matrix = opts.matrix;
        this.kernel = myKernels[this.matrix]
    }
    clone() {
        return new Conv({matrix:this.matrix})
    }

    render(canvas) {
        const ctx = canvas.getContext("2d")
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const a = this.filter(imageData);
        ctx.putImageData(a, 0, 0)
    }

    filter(imageData) {
        const w = imageData.width;
        const h = imageData.height;
        const sourceBuffer = imageData.data;

        const destination = new ImageData(w, h);
        const destinationBuffer = destination.data;

        const rowOffset = Math.floor(this.kernel.length / 2);
        const colOffset = Math.floor(this.kernel[0].length / 2);

        for (let row = 0; row < h; row++) {
            for (let col = 0; col < w; col++) {
                let pixelIndex = (row * w + col) * 4
                let r = 0, g = 0, b = 0, a = 0;
                for (let kRow = 0; kRow < this.kernel.length; kRow++) {
                    for (let kCol = 0; kCol < this.kernel[0].length; kCol++) {
                        let kVal = this.kernel[kRow][kCol];

                        let pixelRow = row + kRow - rowOffset
                        let pixelCol = col + kCol - colOffset;

                        if (pixelRow > 0 && pixelRow <= h && pixelCol > 0 && pixelCol <= w) {
                            let sourceIndex = (pixelRow * w + pixelCol) * 4;
                            r += sourceBuffer[sourceIndex] * kVal;
                            g += sourceBuffer[sourceIndex + 1] * kVal;
                            b += sourceBuffer[sourceIndex + 2] * kVal;
                            a += sourceBuffer[sourceIndex + 3] * kVal;
                        }
                    }
                }
                destinationBuffer[pixelIndex] = clamp(r)
                destinationBuffer[pixelIndex + 1] = clamp(g)
                destinationBuffer[pixelIndex + 2] = clamp(b)
                destinationBuffer[pixelIndex + 3] = clamp(a)
            }
        }
        return destination
    }
}