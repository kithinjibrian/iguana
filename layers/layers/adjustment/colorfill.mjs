import Layer from "../layer.mjs";

export default class Grayscale extends Layer {
    constructor(opts) {
        super(opts);
        this.type = "colorfill";
        this.color = opts.color;
    }

    render(canvas) {
        this.ctx.drawImage(canvas, 0, 0);
        var imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        this.filter(data, this.color)
        this.ctx.putImageData(imageData, 0, 0);
        return this.canvas
    }

    filter(data, { r, g, b }) {
        for (var i = 0; i < data.length; i += 4) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
    }
}
