import Layer from "../layer.mjs"

export default class ImageLayer extends Layer {
    constructor(opts) {
        opts.type = "imagelayer"
        super(opts);
    }
}