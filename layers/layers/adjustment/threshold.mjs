import Layer from "../layer.mjs";

export default class Grayscale extends Layer {
    constructor(opts) {
        super(opts);
        this.type = "threshold";
        this.threshold = opts.threshold;
    }

    render(canvas) {
        this.ctx.drawImage(canvas, 0, 0);
        var imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        this.filter(data, this.threshold)
        this.ctx.putImageData(imageData, 0, 0);
        return this.canvas
    }

    filter(data, threshold) {
        for (var i = 0; i < data.length; i += 4) {
            var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            let v = avg < threshold ? 0 : 255;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
        }
    }
}
