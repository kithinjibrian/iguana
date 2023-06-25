import Layers from "./layer/layer.mjs";
import Pubsub from "./pubsub/pubsub.mjs";
import Caretaker from "./memento/caretaker.mjs";
import Renderer from "./renderer/renderer.mjs";
import loadImage from "./utils/upload.mjs";
import Event from "./event/event.mjs";
import Box from "./tools/selectors/box.mjs";
import Brush from "./tools/brushes/brush.mjs";
import {M} from "./layer/layer.mjs"

const { createApp, ref, onMounted, reactive, computed, watch } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify()

const app = createApp({
    setup() {
        //internal classes
        let layers = reactive(Layers.get());
        const caretaker = reactive(Caretaker.get());
        const box = Box.get();
        const brush = new Brush("brush");
        const eraser = new Brush("eraser", "destination-out")

        caretaker.set(layers)
        //those that wait for DOM
        let renderer, event;

        //v models
        const tabHistorySwatch = ref("one"),
            tabLayerChannel = ref("one"),
            blendModes = ref("normal"),
            brightness = ref({
                value:0,
                min:-150,
                max:150
            }),
            threshold = ref({
                value:1,
                min:1,
                max:255
            });

        //ui states
        let activeLayer = ref({
            index: 0,
            layer: {}
        }),
            activeMemento = ref({
                index: 0,
                memento: {}
            })

        //dom elements
        let canvas = ref({
            width: 0,
            height: 0
        }),
            on = ref(false);

        //event listeners
        Pubsub.subscribe("drawingBoxSelection", (boxDimensions) => {
            layers.add("selector", boxDimensions)
        })

        Pubsub.subscribe("boxSelectionDone", (boxDimensions) => {
            layers.add("selector", boxDimensions)
            caretaker.saveMemento(layers)
        })

        //event listeners
        Pubsub.subscribe("brushDrawing", (brush) => {
            layers.add("brush", activeLayer.value.index, brush)
        })

        Pubsub.subscribe("brushDrawingDone", (brush) => {
            layers.add("brush", activeLayer.value.index, brush)
            caretaker.saveMemento(layers)
        })

        //event listeners
        Pubsub.subscribe("eraserDrawing", (brush) => {
            layers.add("eraser", activeLayer.value.index, brush)
        })

        Pubsub.subscribe("eraserDrawingDone", (brush) => {
            layers.add("eraser", activeLayer.value.index, brush)
            caretaker.saveMemento(layers)
        })

        //watch
        watch(blendModes, (newBlendMode) => {
            layers.patch2(activeLayer.value.index, (layer) => {
                layer['opts']['blendMode'] = newBlendMode;
            }, true)
        })

        // watch(brightness.value, (newBrightness) => {
        //     layers.patch2(activeLayer.value.index, (layer) => {
        //         layer['fn'] = M.brightness(newBrightness.value)
        //     },true)
        // })

        // watch(threshold.value, (newThreshold) => {
        //     layers.patch2(activeLayer.value.index, (layer) => {
        //         layer['fn'] = M.threshold(newThreshold.value)
        //     },true)
        // })

        //methods
        const newImage = async (image) => {
            let loadedImage = await loadImage(image)
            Pubsub.publish("init", {
                width: loadedImage.width,
                height: loadedImage.height
            });
            layers.add("image", true, {
                blendMode: "normal"
            },{ 
                image:loadedImage, 
                w:canvas.value.width, 
                h:canvas.value.height
            });
            on.value = true
            caretaker.saveMemento(layers)
        }

        const placeImage = async (image) => {
            let loadedImage = await loadImage(image)
            layers.add("image", false, {
                blendMode: "normal"
            }, {
                image:loadedImage
            });
            caretaker.saveMemento(layers)
        }

        const newLayer = () => {
            const image = new Image(canvas.value.width, canvas.value.height)
            layers.add("layer", {
                blendMode: "normal"
            }, image)
            caretaker.saveMemento(layers)
        }

        const addAdjustment = (a, ...args) => {
            layers.add(a, ...args)
            caretaker.saveMemento(layers);
        }

        const setAdjustmentProperty = (type,index,value) => {
            layers.patch2(index, (layer) => {
                layer['fn'] = M[type](value)
            },true)
            caretaker.saveMemento(layers)
        }

        const addFilter = (a, ...args) => {
            layers.add(a, activeLayer.value.index, args)
            caretaker.saveMemento(layers)
        }

        const setVisibility = (index, state) => {
            layers.patch(index, "visible", !state, true)
        }

        const setFilterVisibility = (layerIndex, filterIndex, state) => {
            layers.patch2(layerIndex, (layer) => {
                layer['filters'][filterIndex]['visible'] = !state
            },true)
        }

        const setActiveLayer = (index, layer) => {
            activeLayer.value = {
                layer,
                index
            };
            blendModes.value = layer.opts.blendMode
        }

        const revertStateTo = (index, memento) => {
            activeMemento.value = {
                index,
                memento
            }
            caretaker.restoreMemento(index);
        }

        const stepBack = () => {
            const index = activeMemento.value.index;
            const newIndex = index - 1
            if (newIndex >= 0) {
                revertStateTo(newIndex)
            }
        }

        const stepForward = () => {
            const ck = [];
            const index = activeMemento.value.index;
            for (const a of caretaker) {
                ck.push(a)
            }
            const newIndex = index + 1
            if (newIndex < ck.length) {
                revertStateTo(newIndex)
            }
        }

        //box
        const boxActivate = () => {
            box.listen()
        }

        const brushActivate = () => {
            brush.listen()
        }

        const eraserActivate = () => {
            eraser.listen()
        }

        const activate = (tool) => {
            Pubsub.publish("eventId", tool);
            switch (tool) {
                case "box":
                    boxActivate();
                    break;
                case "brush":
                    brushActivate();
                    break;
                case "eraser":
                    eraserActivate();
                    break;
            }
        }

        //dom loading
        onMounted(() => {
            renderer = new Renderer(canvas.value)
            event = new Event(canvas.value)
        })

        return {
            //data
            layers,
            caretaker,
            //v models
            tabHistorySwatch,
            tabLayerChannel,
            blendModes,
            activeLayer,
            brightness,
            threshold,
            //dom elements
            canvas,
            on,
            //methods
            newImage,
            placeImage,
            setVisibility,
            setFilterVisibility,
            newLayer,
            activate,
            setActiveLayer,
            revertStateTo,
            addAdjustment,
            setAdjustmentProperty,
            addFilter,
            stepBack,
            stepForward
        }
    }
})

app.use(vuetify).mount('#app')