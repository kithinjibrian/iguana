import Pubsub from "../pubsub/pubsub.mjs";

export default class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.MAX_SIZE = 500;
        this.listeners()
    }

    listeners() {
        const self = this;
        Pubsub.subscribe("layersChanged", (layers) => {
            self.render(layers)
        })
        Pubsub.subscribe("init", (imageDimensions) => {
            self.set(imageDimensions)
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

    render(layers) {
        //layers accessed from last to first
        this.clearCanvas()
        for (let n = layers.length - 1; n >= 0; n--) {
            const layer = layers[n];
            //skip invisible layers
            if (!layer.visible) continue;
            switch (layer.type) {
                case "image":
                case "layer":
                    this.drawImage(layer.opts, layer.fn())
                    if ("brush" in layer && "brushPoints" in layer['brush']) {
                        layer['brush']['brushPoints'].map(i => this.drawBrush(layer.fn(), i, layer['brush']['opts']['blendMode']));
                    }
                    if ("eraser" in layer && "brushPoints" in layer['eraser']) {
                        layer['eraser']['brushPoints'].map(i => this.drawBrush(layer.fn(), i, layer['eraser']['opts']['blendMode']));
                    }
                    break;
                case 'selector':
                    this.drawSelectorBox(layer.boxDimensions);
                    break;
                default:
                    var imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    var data = imageData.data;
                    layer.fn(data)
                    this.ctx.putImageData(imageData, 0, 0);
                    break;
            }
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    drawImage(opts, image) {
        this.ctx.globalCompositeOperation = opts.blendMode;
        if ('scale' in opts) {
            this.ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, this.canvas.width, this.canvas.height)
        } else {
            this.ctx.drawImage(image, 0, 0)
        }
    }

    drawBrush(canvas, points, blendMode) {
        let ctx = canvas.getContext("2d");
        if (points.length > 3) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 10;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.globalCompositeOperation = blendMode;

            ctx.save()
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            for (let y = 1; y < points.length - 2; y++) {
                const c = (points[y].x + points[y + 1].x) / 2;
                const d = (points[y].y + points[y + 1].y) / 2;
                ctx.quadraticCurveTo(points[y].x, points[y].y, c, d);
            }

            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            ctx.stroke();
            ctx.restore()
        }

        return canvas;
    }

    drawSelectorBox(dimensions) {
        const { x, y, x2, y2 } = dimensions;
        this.ctx.strokeStyle = "red";
        this.ctx.strokeRect(x, y, x2 - x, y2 - y)
    }
}