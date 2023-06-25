import Pubsub from "../../pubsub/pubsub.mjs"

class Box {
    constructor() {
        if (!Box.instance) {
            Box.instance = this;
        }
        this.isMouseDown = false;
        this.hasDrawn = false;
        this.boxDimensions = {
            x: 0,
            y: 0,
            x2: 0,
            y2: 0
        }
        return Box.instance;
    }

    get() {
        return this;
    }

    listen() {
        const self = this;
        Pubsub.subscribeOnce("mousedown", (id, event) => {
            if (id !== "box") return;
            if (self.hasDrawn) {
                self.boxDimensions = {}
                Pubsub.publish("boxSelectionDone", {...self.boxDimensions});
                //self.hasDrawn = false;
            } else {
                self.isMouseDown = true
                self.boxDimensions.x = event.offsetX;
                self.boxDimensions.y = event.offsetY;
            }
        })
        Pubsub.subscribeOnce("mouseup", (id) => {
            if (id !== "box") return;
            self.isMouseDown = false;
            self.hasDrawn = !self.hasDrawn
            //return new box dimensions for immutability
            if(!self.hasDrawn) {
                Pubsub.publish("boxSelectionDone", { ...self.boxDimensions })
            }
        })
        Pubsub.subscribeOnce("mousemove", (id, event) => {
            if (id !== "box" || !self.isMouseDown || self.hasDrawn) return;
            self.boxDimensions.x2 = event.offsetX;
            self.boxDimensions.y2 = event.offsetY;
            //return new box dimensions for immutability
            Pubsub.publish("drawingBoxSelection", { ...self.boxDimensions })
        })
    }
}

export default new Box()