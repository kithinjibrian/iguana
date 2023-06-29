export default class Cache {
    constructor(capacity) {
        this.cache = new Map();
        this.capacity = capacity;
    }

    has(key) {
        return this.cache.has(key)
    }

    get(key) {
        if(!this.has(key)) {
            return -1;
        }

        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key,value);
        return value;
    }

    put(key,value) {
        if(this.cache.has(key)) {
            this.cache.delete(key)
        }

        this.cache.set(key,value);
        if(this.cache.size > this.capacity) {
            const [keyToDelete] = this.cache.keys();
            this.cache.delete(keyToDelete)
        }
    }
}