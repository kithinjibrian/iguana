import clamp from "../../../utils/clamp.mjs";

export default class Noise {
    clone() {
        return new Noise()
    }

    render(canvas) {
        const ctx = canvas.getContext("2d")
        let imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
        this.filter(imageData);
        ctx.putImageData(imageData,0,0)
    }

    filter(imageData,factor = 0.5) {
        let data = imageData.data;
        for (var i = 0; i < data.length; i += 4) {
            var noiseR = (Math.random() - 0.5) * factor * 255;
            var noiseG = (Math.random() - 0.5) * factor * 255;
            var noiseB = (Math.random() - 0.5) * factor * 255;
            data[i] = clamp(data[i] + noiseR);
            data[i + 1] = clamp(data[i + 1] + noiseG);
            data[i + 2] = clamp(data[i + 2] + noiseB);
        }
        return imageData;
    }
}