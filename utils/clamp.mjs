export default function clamp(value, min = 0, max = 255) {
    return Math.max(min, Math.min(Math.floor(value), max))
}