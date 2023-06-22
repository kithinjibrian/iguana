import Layers from "../layer/layer.mjs";

export default class Renderer {
    constructor(opts) {
        const def = {
            canvasWidth: "400",
            canvasHeight: "400"
        };

        Object.assign(def, opts);

        this.canvas = canvas;
        this.canvas.width = def.canvasWidth;
        this.canvas.height = def.canvasHeight;
        this.MAX_SIZE = 600

        this.ctx = this.canvas.getContext("2d");
        this.layers = Layers.get();
    }

    getCanvas() {
        return this.canvas;
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

    drawBrush(dim,blendMode) {
        if (dim.length > 3) {
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 10;
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';
            this.ctx.globalCompositeOperation = blendMode;

            this.ctx.save()
            this.ctx.beginPath();
            this.ctx.moveTo(dim[0].x, dim[0].y);

            for (let y = 1; y < dim.length - 2; y++) {
                const c = (dim[y].x + dim[y + 1].x) / 2;
                const d = (dim[y].y + dim[y + 1].y) / 2;
                this.ctx.quadraticCurveTo(dim[y].x, dim[y].y, c, d);
            }
            this.ctx.lineTo(dim[dim.length - 1].x, dim[dim.length - 1].y);
            this.ctx.stroke();
            this.ctx.restore()
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const a = this.layers.getLayers();
        for (let y = a.length - 1; y >= 0; y--) {
            const i = a[y];
            if (!i.visible) {
                continue;
            }
            switch (i.type) {
                case "image":
                case "layer":
                    this.ctx.globalCompositeOperation = i.opts.blendMode;
                    this.ctx.drawImage(i.fn(), 0, 0)
                    if ("brush" in i && 'dim' in i['brush']) {
                        i.brush.dim.map(y => this.drawBrush(y,i.brush.opts.blendMode))
                    }
                    if ("eraser" in i && 'dim' in i['eraser']) {
                        i.eraser.dim.map(y => this.drawBrush(y,i.eraser.opts.blendMode))
                    }
                    break;
                case "selection":
                    this.ctx.strokeStyle = "red";
                    this.ctx.lineWidth = 2;
                    const { x, y, x2, y2 } = i.dim
                    this.ctx.strokeRect(x, y, x2 - x, y2 - y)
                    break;
                default:
                    var imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    var data = imageData.data;
                    i.fn(data)
                    this.ctx.putImageData(imageData, 0, 0);
                    break;
            }
        }
    }
}

/* globalCompositeOperation :
  normal | multiply | screen | overlay | 
  darken | lighten | color-dodge | color-burn | hard-light | 
  soft-light | difference | exclusion | hue | saturation | 
  color | luminosity
*/