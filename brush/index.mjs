import Pubsub from "../pubsub/pubsub.mjs"

export default class Brush {
    constructor(opts) {
        const def = {
            id: "",
            type: "brush",
            isMouseDown: false,
            blendMode: "normal",
            fpoint: {},
            lpoint: {},
            index: 0
        }
        Object.assign(def, opts);
        this.type = def.type;
        this.isMouseDown = def.isMouseDown;
        this.blendMode = def.blendMode;
        this.fpoint = def.fpoint;
        this.lpoint = def.lpoint;
        this.listen()
    }

    clone() {
        return this;
    }

    getPoint() {
        return {
            last:this.lpoint,
            newer:this.fpoint
        }
    }

    getBlendMode() {
        return this.blendMode;
    }

    listen() {
        const self = this;
        Pubsub.subscribeOnce("mousedown", (type, event) => {
            if (type === self.type) {
                self.mousedown(event)
            }
        })

        Pubsub.subscribeOnce("mousemove", (type, event) => {
            if (type === self.type) {
                self.mousemove(event)
            }
        })

        Pubsub.subscribeOnce("mouseup", (type, event) => {
            if (type === self.type) {
                self.mouseup(event)
            }
        })
    }

    render(canvas1,{last,newer}) {
        const canvas = document.createElement("canvas")
        canvas.width = canvas1.width;
        canvas.height = canvas1.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(canvas1,0,0);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 24;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(newer.x, newer.y)
        ctx.stroke()
        return canvas
    }

    mousedown({ offsetX: x, offsetY: y }) {
        this.isMouseDown = true;
        this.lpoint = { x, y }
    }

    mousemove({ offsetX: x, offsetY: y }) {
        if (!this.isMouseDown) return;
        this.fpoint = {x,y}
        Pubsub.publish("brushDrawing", null);
        this.lpoint = { x, y }
    }

    mouseup() {
        this.isMouseDown = false;
        this.finished()
    }

    finished() {
        Pubsub.publish("brushFinishedDrawing", null)
    }
}
