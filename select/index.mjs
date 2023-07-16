import Pubsub from "../pubsub/pubsub.mjs"

export default class Select {
	constructor(opt) {
		const def = {
			type:"boxselect",
			start:{x:0,y:0},
			end:{x:0,y:0},
			canvasWidth:400,
			canvasHeight:400
		}

		Object.assign(def,opt);

		this.type = def.type;
		this.start = def.start;
		this.end = def.end;

		this.isMouseDown = false

		this.listen()
	}

	clone() {
		return this;
	}

	getPoint() {
		return {
			start:this.start,
			end:this.end
		}
	}

	listen() {
		const self = this;
		Pubsub.subscribeOnce('mousedown',(type,event)=>{
			if (type == self.type) {
				self.mousedown(event)
			}
		})
		Pubsub.subscribeOnce('mouseup',(type,event)=>{
			if (type == self.type) {
				self.mouseup(event)
			}
		})
		Pubsub.subscribeOnce('mousemove',(type,event)=>{
			if (type == self.type) {
				self.mousemove(event)
			}
		})
	}

	render(canvas,{start,end}) {
		const cnvs = document.createElement('canvas');
		const ctx = cnvs.getContext('2d');
		cnvs.width = canvas.width;
		cnvs.height = canvas.height;
		//ctx.drawImage(canvas,0,0)
		ctx.strokeStyle = 'red';
		ctx.strokeRect(start.x,start.y,end.x,end.y)
		return cnvs
	}

	mousedown({offsetX:x,offsetY:y}) {
		this.isMouseDown = true
		this.start = {x,y}
	}

	mousemove({offsetX:x,offsetY:y}) {
		if(!this.isMouseDown) return;
		this.end = {x,y};
		Pubsub.publish("selecting",null)
	}

	mouseup({offsetX:x,offsetY:y}) {
		this.isMouseDown = false
		this.finished()
	}

	finished() {
		Pubsub.publish('selectionFinished',null)
	}
}
