import Cache from "./cache.mjs"

const createHash = (args) => JSON.stringify(args);

export default (fn, capacity) => {
    const cache = new Cache(capacity);
    return (...args) => {
        const hash = createHash(args);
        if(cache.has(hash)) {
            return cache.get(hash)
        }
        const result = fn(...args);
        cache.put(hash,result);
        return result;
    }
}