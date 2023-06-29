import Noise from "../layers/filters/noise.mjs"
import Conv from "./filters/conv.mjs";
import Brush from "../../brush/index.mjs";

export default class Layer {
    constructor(opts) {
        const def = {
            id: 0,
            type: "layer",
            visible: true,
            scale: false,
            blendMode:"normal",
            canvasWidth: 400,
            canvasHeight: 400,
            image: new Image(),
            filters: new Set(),
            brushes: new Map(),
            points: new Set()
        };

        Object.assign(def, opts);
        this.id = def.id;
        this.type = def.type
        this.visible = def.visible;
        this.image = def.image;
        this.scale = def.scale;
        this.blendMode = def.blendMode;
        this.mask = null;
        this.brushes = def.brushes;
        this.filters = def.filters;
        this.points = def.points;

        this.image = def.image;
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = def.canvasWidth;
        this.canvasHeight = def.canvasHeight
        this.canvas.width = def.canvasWidth;
        this.canvas.height = def.canvasHeight;

    }

    render(canvas) {
        this.ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height, 0, 0, this.image.width, this.image.height); 
        for (let filter of this.filters) {
            filter.render(this.canvas)
        }
        for (let [key, brush] of this.brushes) {
            const point = brush.getPoint();
            this.image = brush.render(this.canvas, point)
        }
        return this.canvas;
    }

    modify(opts) {
        for (let n in opts) {
            this[n] = opts[n]
        }
        return this;
    }

    addFilter(type, opts) {
        const hashMap = {
            "noise": () => {
                return new Noise()
            },
            "conv": (opts) => {
                return new Conv(opts)
            }
        }
        this.filters.add(hashMap[type](opts))
    }

    addBrush(type, opts) {
        let brush = new Brush({ type, canvas: document.createElement("canvas"), ...opts });;
        if (this.brushes.has(type)) {
            brush = this.brushes.get(type)
        }
        this.brushes.set(type, brush);
    }
}
