import Pubsub from "../../pubsub/pubsub.mjs"

class Points {
    constructor() {
        this.index = 0
        this.points = [[]]
    }

    push(points) {
        if (this.points[this.index] === undefined) {
            this.points[this.index] = [points]
        } else {
            this.points[this.index].push(points)
        }
    }

    next() {
        this.index += 1;
    }

    clone() {
        return [...this.points];
    }
}

export default class Brush {
    constructor(name,blendMode) {
        this.isMouseDown = false;
        this.points = new Points();
        this.name = name;
        this.blendMode = blendMode || 'source-over'
    }

    reset() {
        this.points = new Points()
    }

    listen() {
        const self = this;
        Pubsub.subscribeOnce("mousedown",(id,event)=>{
            if(id!==self.name) return;
            self.isMouseDown = true;
            self.points.push({
                x:event.offsetX,
                y:event.offsetY
            })
        })
        Pubsub.subscribeOnce("mouseup",(id,event)=>{
            if(id!==self.name) return;
            self.isMouseDown = false;
            self.points.next()
            Pubsub.publish(`${self.name}DrawingDone`,{
                brushPoints:self.points.clone(),
                opts:{
                    blendMode:self.blendMode
                }
            })
            self.reset()
        })
        Pubsub.subscribeOnce("mousemove",(id,event)=>{
            if(id!==self.name || !self.isMouseDown) return;
            self.points.push({
                x:event.offsetX,
                y:event.offsetY
            });
            Pubsub.publish(`${self.name}Drawing`,{
                brushPoints:self.points.clone(),
                opts:{
                    blendMode:self.blendMode
                }
            })
        })
        return this;
    }
}