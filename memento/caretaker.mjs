class Caretaker {
    constructor() {
        if (!Caretaker.instance) {
            Caretaker.instance = this;
        }
        this.mementos = new Map();
        this.index = 0;
        this.restoreIndex = -1;
        return Caretaker.instance;
    }

    get() {
        return this;
    }

    *id() {
        while(true) {
            yield this.index++
        }
    }

    saveMemento(action,originator) {
        let id = () => {
            let generator = this.id();
            let {value} = generator.next()
            return value;
        };

        if(this.restoreIndex !== -1) {
            let arr = Array.from(this.mementos);
            arr.splice(this.restoreIndex,arr.length)
            this.mementos = new Map(arr)
            this.restoreIndex = -1
        }

        this.mementos.set(action + id(),originator.createMemento());  
    }

    restoreMemento(id,action,originator) {
        this.restoreIndex = id == 0 ? 1 : id;
        const memento = this.mementos.get(action);
        originator.restoreFromMemento(memento.state);
        return originator;
    }

    *[Symbol.iterator]() {
        yield* this.mementos
    }
}

export default new Caretaker();