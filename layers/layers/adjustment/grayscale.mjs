import Layer from "../layer.mjs";

export default class Grayscale extends Layer {
    constructor(opts) {
        super(opts);
        this.type = "grayscale"
    }

    render(canvas) {
        this.ctx.drawImage(canvas, 0, 0);
        var imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        this.filter(data)
        this.ctx.putImageData(imageData, 0, 0);
        return this.canvas
    }

    filter(data) {
        for (var i = 0; i < data.length; i += 4) {
            var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
    }
}