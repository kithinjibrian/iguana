import Pubsub from "../pubsub/pubsub.mjs"

export default class Event {
    constructor(canvas) {
        this.canvas = canvas;
        this.id = null;
        this.ears();
        this.listen()
    }

    ears() {
        const self = this;
        Pubsub.subscribe("eventId",(id)=>{
            self.id = id;
        })
    }

    listen() {
        const self = this;
        this.canvas.addEventListener("mouseup", (e) => {
            Pubsub.publish("mouseup", self.id, e);
        }, false)
        this.canvas.addEventListener("mousedown", (e) => {
            Pubsub.publish("mousedown", self.id, e);
        }, false)
        this.canvas.addEventListener("mousemove", (e) => {
            Pubsub.publish("mousemove", self.id, e);
        }, false);
        return this;
    }
}