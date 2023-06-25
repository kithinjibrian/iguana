import Pubsub from "../pubsub/pubsub.mjs";
import Memento from "../memento/memento.mjs";

export class M {

    static image2(image,w,h) {
        const canvas = document.createElement("canvas");
        canvas.width = w || image.width;
        canvas.height = h || image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, w, h);
        return () => {
            return canvas;
        }
    }

    static image(scale,opts) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if(scale) {
            canvas.width = opts.w
            canvas.height = opts.h
            ctx.drawImage(opts.image,0,0,opts.image.width,opts.image.height,0,0,opts.w,opts.h)
            return () => {
                return canvas
            }
        } else {
            canvas.width = opts.image.width;
            canvas.height = opts.image.height;
            ctx.drawImage(opts.image,0,0)
            return () => {
                return canvas
            }
        }
    }

    static clamp(value) {
        return Math.max(0, Math.min(Math.floor(value), 255))
    }

    static noise(factor) {
        return (data) => {
            for (var i = 0; i < data.length; i += 4) {
                var noiseR = (Math.random() - 0.5) * factor * 255;
                var noiseG = (Math.random() - 0.5) * factor * 255;
                var noiseB = (Math.random() - 0.5) * factor * 255;
                data[i] = M.clamp(data[i] + noiseR);
                data[i + 1] = M.clamp(data[i + 1] + noiseG);
                data[i + 2] = M.clamp(data[i + 2] + noiseB);
            }
        }
    }

    static colorFill(r, g, b) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")
        const fn = (data) => {
            for (var i = 0; i < data.length; i += 4) {
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
        }

        return (image) => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            fn(data)
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }
    }

    static grayscale() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")
        const fn = (data) => {
            for (var i = 0; i < data.length; i += 4) {
                var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
            }
        }

        return (image) => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            fn(data)
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }
    }

    static threshold(threshold) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")
        const fn = (data) => {
            for (var i = 0; i < data.length; i += 4) {
                var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                let v = avg < threshold ? 0 : 255;
                data[i] = v;
                data[i + 1] = v;
                data[i + 2] = v;
            }
        }

        return (image) => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            fn(data)
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }
    }

    static brightness(value) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")
        const fn = (data) => {
            for (var i = 0; i < data.length; i += 4) {
                data[i] = M.clamp(data[i] + value);
                data[i + 1] = M.clamp(data[i + 1] + value);
                data[i + 2] = M.clamp(data[i + 2] + value);
            }
        }

        return (image) => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            fn(data)
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }
    }

    static inverse() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")
        const fn = (data) => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];         // red
                data[i + 1] = 255 - data[i + 1]; // green
                data[i + 2] = 255 - data[i + 2]; // blue
            }
        }

        return (image) => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            fn(data)
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }
    }
}

class Layers {
    constructor() {
        if (!Layers.instance) {
            Layers.instance = this;
        }
        this.layers = [];
        return Layers.instance;
    }

    get() {
        return this;
    }

    set(layers) {
        this.layers = []
        this.layers.push(...layers)
    }

    clone(layers) {
        //clone layers
        const finalLayers = layers || this.layers;

        return finalLayers.slice().map(i => ({
            ...i,
            fn: i.fn.bind(i)
        }))
    }

    patch(index, property, data, notify) {
        this.layers[index][property] = data;
        if (notify) this.publishLayerChange();
    }

    patch2(index, cb, notify) {
        cb(this.layers[index])
        if (notify) this.publishLayerChange();
    }

    createMemento() {
        //create state snapshot
        return new Memento(this.clone())
    }

    restoreFromMemento(memento) {
        //restore state snapshot
        this.set(this.clone(memento));
        this.publishLayerChange()
    }

    publishLayerChange() {
        Pubsub.publish("layersChanged", this.clone());
    }

    unshift(data) {
        this.layers.unshift(data);
        this.publishLayerChange()
    }

    add(type, ...args) {
        switch (type) {
            case "colorfill":
                this.colorFill(args[0], args[1], args[2])
                break;
            case "grayscale":
                this.grayscale()
                break;
            case "threshold":
                this.threshold(args[0])
                break;
            case "brightness":
                this.brightness(args[0])
                break;
            case "invert":
                this.invert()
                break;
            case "noise":
                this.noise(args[0], args[1])
                break;
            case "image":
                this.image(args[0], args[1], args[2])
                break;
            case "layer":
                this.layer(args[0], args[1]);
                break;
            case "selector":
                this.selector(args[0]);
                break;
            case "brush":
                this.brush("brush", args[0], args[1]);
                break;
            case "eraser":
                this.brush("eraser", args[0], args[1]);
                break;
        }
    }

    colorFill(r, g, b) {
        this.unshift({
            type: 'colorfill',
            visible: true,
            internal: false,
            opts: {
                blendMode: 'normal'
            },
            action: "applyColorfill",
            fn: M.colorFill(r, g, b)
        })
    }

    grayscale() {
        this.unshift({
            type: 'grayscale',
            visible: true,
            internal: false,
            opts: {
                blendMode: 'normal'
            },
            action: "applyGrayscale",
            fn: M.grayscale()
        })
    }

    threshold(threshold) {
        this.unshift({
            type: 'threshold',
            visible: true,
            internal: false,
            opts: {
                blendMode: 'normal'
            },
            action: "applyThreshold",
            fn: M.threshold(threshold)
        })
    }

    noise(index, factor) {
        const layer = this.layers[index];
        let f = [];
        if ("filters" in layer) {
            const c = layer['filters'].slice().map(i => {
                return i.bind(i)
            })
            f = [...c, {
                type: "noise",
                visible: true,
                fn: M.noise(factor)
            }]
        } else {
            f.push({
                type: "noise",
                visible: true,
                fn: M.noise(factor)
            })
        }
        layer['filters'] = f;
        layer['action'] = 'AddNoiseFilter'
        this.publishLayerChange()
    }

    brightness(args) {
        this.unshift({
            type: 'brightness',
            visible: true,
            internal: false,
            opts: {
                blendMode: 'normal'
            },
            action: "applyBrightness",
            fn: M.brightness(args)
        })
    }

    invert() {
        this.unshift({
            type: 'invert',
            visible: true,
            internal: false,
            opts: {
                blendMode: 'normal'
            },
            action: "applyInversion",
            fn: M.inverse()
        })
    }

    image(scale,opts,payload) {
        this.unshift({
            type: 'image',
            visible: true,
            internal: false,
            opts: opts,
            filters: [],
            action: "addImage",
            fn: M.image(scale,payload)
        })
    }

    layer(opts, image) {
        this.unshift({
            type: 'layer',
            visible: true,
            internal: false,
            opts: opts,
            action: "newLayer",
            fn: M.image(image)
        })
    }

    selector(boxDimensions) {
        //find any existing selector layer
        const index = this.layers.findIndex(({ type }) => type === 'selector');
        if (index != -1) {
            //if layer found delete it
            this.layers.splice(index, 1)
        }
        this.unshift({
            type: 'selector',
            visible: true,
            internal: true,
            opts: {
                blendMode: 'normal'
            },
            boxDimensions,
            action: "boxSelection",
            fn: () => { }
        })
    }

    brush(name, index, brush) {
        let layer = this.layers[index];
        let d = {}
        if (name in layer) {
            let p = 'brushPoints' in layer[name] ? layer[name]['brushPoints'] : [];
            d['brushPoints'] = [...p, ...brush['brushPoints']];
            d['opts'] = brush['opts']
        }
        this.layers[index] = {
            ...layer,
            action: `${name}`,
            [name]: d
        };
        this.publishLayerChange()
    }

    [Symbol.iterator]() {
        let index = 0;
        const layers = this.layers;

        return {
            next() {
                if (index < layers.length) {
                    return { value: layers[index++], done: false }
                } else {
                    return { done: true }
                }
            }
        }
    }
}

export default new Layers();