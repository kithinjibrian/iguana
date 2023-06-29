import Layer from "../layer.mjs";
import clamp from "../../../utils/clamp.mjs";

export default class Grayscale extends Layer {
    constructor(opts) {
        opts.type = "brightness";
        super(opts);
        this.brightness = opts.brightness;
    }

    render(canvas) {
        this.ctx.drawImage(canvas, 0, 0);
        var imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        this.filter(data, this.brightness)
        this.ctx.putImageData(imageData, 0, 0);
        return this.canvas
    }

    filter(data, brightness) {
        for (var i = 0; i < data.length; i += 4) {
            data[i] = clamp(data[i] + brightness);
            data[i + 1] = clamp(data[i + 1] + brightness);
            data[i + 2] = clamp(data[i + 2] + brightness);
        }
    }
}
