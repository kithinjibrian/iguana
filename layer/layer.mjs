import Pubsub from "../pubsub/pubsub.mjs";
import Memento from "../memento/memento.mjs";

class M {

    static image(image) {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        return () => {
            return canvas;
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

    static grayscale(data) {
        for (var i = 0; i < data.length; i += 4) {
            var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
    }

    static brightness(value) {
        return (data) => {
            for (var i = 0; i < data.length; i += 4) {
                data[i] = M.clamp(data[i] + value);
                data[i + 1] = M.clamp(data[i + 1] + value);
                data[i + 2] = M.clamp(data[i + 2] + value);
            }
        }
    }

    static inverse(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];         // red
            data[i + 1] = 255 - data[i + 1]; // green
            data[i + 2] = 255 - data[i + 2]; // blue
            // data[i + 3] = data[i + 3];    // alpha (transparency)
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
            case "grayscale":
                this.grayscale()
                break;
            case "brightness":
                this.brightness(args[0])
                break;
            case "inverse":
                this.inverse()
                break;
            case "noise":
                this.noise(args[0], args[1])
                break;
            case "image":
                this.image(args[0], args[1])
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

    grayscale() {
        this.unshift({
            type: 'grayscale',
            visible: true,
            internal: false,
            action: "applyGrayscale",
            fn: M.grayscale
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
                type:"noise",
                visible: true,
                fn: M.noise(factor)
            }]
        } else {
            f.push({
                type:"noise",
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
            action: "applyBrightness",
            fn: M.brightness(args)
        })
    }

    inverse() {
        this.unshift({
            type: 'grayscale',
            visible: true,
            internal: false,
            action: "applyInversion",
            fn: M.inverse
        })
    }

    image(opts, image) {
        this.unshift({
            type: 'image',
            visible: true,
            internal: false,
            opts: opts,
            filters:[],
            action: "addImage",
            fn: M.image(image)
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
        if (name === 'eraser') {
            layer["brushes"] = {}
        }

        if (name === "brush") {
            layer["eraser"] = {}
        }
        layer.fn = M.image(layer.fn())
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