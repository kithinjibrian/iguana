import Noise from "../layers/filters/noise.mjs";
import Conv from "./filters/conv.mjs";
import Brush from "../../brush/index.mjs";
import Select from "../../select/index.mjs";

export default class Layer {
    constructor(opts) {
        const def = {
            id: 0,
            type: "layer",
            visible: true,
            internal: false,
            scale: false,
            blendMode: "normal",
            canvasWidth: 400,
            canvasHeight: 400,
            clearable: false,
            image: new Image(),
            filters: new Set(),
            brushes: new Map(),
            select: new Map(),
            points: new Set(),
        };

        Object.assign(def, opts);
        this.id = def.id;
        this.type = def.type;
        this.visible = def.visible;
        this.internal = def.internal;
        this.image = def.image;
        this.scale = def.scale;
        this.blendMode = def.blendMode;
        this.mask = null;
        this.brushes = def.brushes;
        this.select = def.select;
        this.filters = def.filters;
        this.points = def.points;
        this.clearable = def.clearable;

        this.image = def.image;
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = def.canvasWidth;
        this.canvasHeight = def.canvasHeight;
        this.canvas.width = def.canvasWidth;
        this.canvas.height = def.canvasHeight;
    }

    render(canvas) {
        if (this.clearable) {
            this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        this.ctx.drawImage(
            this.image,
            0,
            0,
            canvas.width,
            canvas.height,
            0,
            0,
            this.image.width,
            this.image.height
        );
        for (let filter of this.filters) {
            filter.render(this.canvas);
        }
        for (let [key, brush] of this.brushes) {
            const point = brush.getPoint();
            this.image = brush.render(this.canvas, point);
        }

        for (let [key, select] of this.select) {
            const point = select.getPoint();
            this.image = select.render(this.canvas, point);
        }
        return this.canvas;
    }

    modify(opts) {
        for (let n in opts) {
            this[n] = opts[n];
        }
        return this;
    }

    addFilter(type, opts) {
        const hashMap = {
            noise: () => {
                return new Noise();
            },
            conv: (opts) => {
                return new Conv(opts);
            },
        };
        this.filters.add(hashMap[type](opts));
    }

    addBrush(type, opts) {
        let brush = new Brush({ type, ...opts });
        if (this.brushes.has(type)) {
            brush = this.brushes.get(type);
        }
        this.brushes.set(type, brush);
    }

    addSelect(type, opts) {
        let select = new Select({ type, ...opts });
        this.select.set(type, select);
    }
}
