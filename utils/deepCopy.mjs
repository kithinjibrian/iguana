export default function deepCopy(obj) {
    if (typeof obj !== "object" || obj === null) {
        return obj; // Return primitives and null as is
    }

    if (obj instanceof Date) {
        return new Date(obj); // Create a new Date object with the same value
    }

    if (obj instanceof Array) {
        return obj.map((item) => deepCopy(item)); // Deep copy array elements
    }

    if (obj instanceof Object) {
        const copiedObj = Object.create(Object.getPrototypeOf(obj)); // Create a new object with the same prototype

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                copiedObj[key] = deepCopy(obj[key]); // Deep copy object properties
            }
        }

        return copiedObj;
    }
}
