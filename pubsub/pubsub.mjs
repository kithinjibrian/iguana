class Pubsub {
    constructor() {
        if (!Pubsub.instance) {
            Pubsub.instance = this;
        }
        this.subscribers = new Map();
        return Pubsub.instance;
    }
    
    get() {
        return this;
    }

    subscribe(event, fn) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event).push(fn);
        } else {
            this.subscribers.set(event, [fn]);
        }
    }

    subscribeOnce(event,fn) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event)[0] = fn;
        } else {
            this.subscribers.set(event, [fn]);
        }  
    }

    unsubcribe(event) {
        if (this.subscribers.has(event)) {
            this.subscribers.delete(event);
        }
    }

    publish(event, ...args) {
        if (this.subscribers.has(event)) {
            const fn = this.subscribers.get(event);
            fn.forEach(f => {
                f.apply(null, args)
            });
        }
    }
}

export default new Pubsub();