class Caretaker {
    constructor() {
        if (!Caretaker.instance) {
            Caretaker.instance = this;
        }
        this.mementos = [];
        this.index = -1;
        return Caretaker.instance;
    }

    get() {
        return this;
    }

    set(snaps) {
        this.snaps = snaps
    }

    saveMemento(originator) {
        if(this.index != -1) {
           this.mementos.splice(this.index + 1,this.mementos.length);
        }
        this.index = -1;
        this.mementos.push(originator.createMemento());  
    }

    restoreMemento(index) {
        this.index = index;
        const memento = this.mementos[index];
        this.snaps.restoreFromMemento(memento.state);
        return this.snaps;
    }

    [Symbol.iterator]() {
        let index = 0;
        const mementos = this.mementos;

        return {
            next() {
                if (index < mementos.length) {
                    return { value: mementos[index++], done: false }
                } else {
                    return { done: true }
                }
            }
        }
    }
}

export default new Caretaker();