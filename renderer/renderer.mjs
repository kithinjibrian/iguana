import Pubsub from "../pubsub/pubsub.mjs";

export default class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.MAX_SIZE = 900;
        this.init()
    }

    init() {
        const self = this;
        Pubsub.subscribe("init", (a) => {
            self.set(a)
        });

        Pubsub.subscribe("render", (a) => {
            self.render(a)
        })
    }

    set({ width, height }) {
        if (width > this.MAX_SIZE || height > this.MAX_SIZE) {
            if (width > height) {
                height = Math.round((height / width) * this.MAX_SIZE);
                width = this.MAX_SIZE;
            } else {
                width = Math.round((width / height) * this.MAX_SIZE)
                height = this.MAX_SIZE
            }
        }
        this.canvas.width = width;
        this.canvas.height = height;
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    render(layersMap) {
        this.clearCanvas()
        const layers = Array.from(layersMap.values());
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (!layer.visible) {
                continue;
            };
            const canvas = layer.render(this.canvas);
            this.ctx.globalCompositeOperation = layer.blendMode
            this.ctx.drawImage(canvas, 0, 0)
        }
    }
}
