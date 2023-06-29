import ImageLayer from "./layers/image/image.mjs";
import Memento from "../memento/memento.mjs"
import Pubsub from "../pubsub/pubsub.mjs"
import Grayscale from "./layers/adjustment/grayscale.mjs";
import Brightness from "./layers/adjustment/brightness.mjs";
import Invert from "./layers/adjustment/invert.mjs"
import Threshold from "./layers/adjustment/threshold.mjs"
import Colorfill from "./layers/adjustment/colorfill.mjs"

class Layers {
    constructor() {
        if (!Layers.instance) {
            Layers.instance = this;
        }
        this.layers = new Map();
        this.index = 0
        this.layerTypes = {
            "imagelayer": (opts) => {
                return new ImageLayer(opts)
            },
            "grayscale": (opts) => {
                return new Grayscale(opts)
            },
            "threshold": (opts) => {
                return new Threshold(opts);
            },
            "brightness": (opts) => {
                return new Brightness(opts);
            },
            "invert": (opts) => {
                return new Invert(opts);
            },
            "colorfill": (opts) => {
                return new Colorfill(opts);
            }
        }
        return Layers.instance;
    }

    *id() {
        while (true) {
            yield this.index++
        }
    }

    get() {
        return this;
    }

    set(layers) {
        this.layers = new Map();
        for (let [key, value] of layers) {
            this.layers.set(key, this.layerTypes[value.type](value))
        }
    }

    clone() {
        const a = new Map()
        for (let [key, value] of this.layers) {
            const v = JSON.parse(JSON.stringify(value))
            const filters = new Set();
            const brushes = new Map(value.brushes)
            for (let filter of value.filters) {
                filters.add(filter.clone())
            }
            a.set(key, {
                ...v,
                image: value.image,
                filters,
                brushes
            })
        }
        return a;
    }

    publishLayerChange() {
        Pubsub.publish("render", this.layers)
    }

    add(key, opts) {
        let id = () => {
            let generator = this.id();
            let { value } = generator.next()
            return value;
        };
        let _key = this.layers.has(key) ? key + id() : key;
        this.layers.set(_key, this.layerTypes[key]({ id: _key, ...opts }));
        this.publishLayerChange()
    }

    modify(key, opts) {
        const layer = this.layers.get(key).modify(opts);
        this.publishLayerChange();
        return this.layers;
    }

    getLayer(key) {
        return this.layers.get(key)
    }

    createMemento() {
        return new Memento(this.clone())
    }

    restoreFromMemento(memento) {
        this.set(memento);
        this.publishLayerChange();
    }

    *[Symbol.iterator]() {
        yield* this.layers
    }
}

export default new Layers();
