
import Layers from "./layers/index.mjs";
import Caretaker from "./memento/caretaker.mjs";
import Pubsub from "./pubsub/pubsub.mjs";
import Renderer from "./renderer/renderer.mjs";
import ImageUpload from "./utils/upload.mjs"
import Event from "./event/event.mjs"

const { createApp, ref, onMounted, reactive, computed, watch } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify();

const app = createApp({
    setup() {
        //internal classes
        const layers = reactive(Layers.get())
        const caretaker = reactive(Caretaker.get())
        //dom elements
        let canvas = ref({
            width: 0,
            height: 0
        }),
            on = ref(false);

        //v models
        const tabHistorySwatch = ref("one"),
            tabLayerChannel = ref("one"),
            blendModes = ref("normal"),
            brightness = ref({
                value: 0,
                min: -150,
                max: 150
            }),
            threshold = ref({
                value: 1,
                min: 1,
                max: 255
            }),
            activeLayer = ref({})

        const init = (opts) => {
            Pubsub.publish("init", opts);
            on.value = true
        }

        //watchers
        watch(blendModes,(a)=>{
            let id = activeLayer.value.id;
            layers.modify(id,{
                blendMode:a
            });
            Pubsub.publish("render", layers.layers)
            caretaker.saveMemento(`setBlendModeTo-${a}`,layers)
        })

        //event listeners
        Pubsub.subscribe("brushDrawing", () => {
            Pubsub.publish("render", layers.layers)
        })

        Pubsub.subscribe("brushFinishedDrawing", () => {
            caretaker.saveMemento("brushDrawn",layers)
        })

        //methods
        const openImage = async (image) => {
            const loadedImage = await ImageUpload(image);
            init({
                width: loadedImage.width,
                height: loadedImage.height
            })
            layers.add("imagelayer", {
                image: loadedImage,
                canvasWidth: canvas.value.width,
                canvasHeight: canvas.value.height
            });
            caretaker.saveMemento("open", layers)
        }

        const newLayer = () => {
            const image = new Image(canvas.value.width,canvas.value.height)
            layers.add("imagelayer", {
                image: image,
                canvasWidth: canvas.value.width,
                canvasHeight: canvas.value.height
            });
            caretaker.saveMemento("newLayer", layers)
        }

        const placeImage = async (image) => {
            const loadedImage = await ImageUpload(image);
            layers.add("imagelayer",{
                image:loadedImage,
                canvasWidth: canvas.value.width,
                canvasHeight: canvas.value.height
            });
            caretaker.saveMemento("placeImage", layers)
        }

        const addAdjustment = (type, opts) => {
            layers.add(type, {
                ...opts,
                canvasWidth: canvas.value.width,
                canvasHeight: canvas.value.height
            });
            caretaker.saveMemento(type, layers)
        }

        const setAdjustmentProperty = (id,property,value) => {
            console.log(id)
            layers.modify(id,{
                [property]:value
            })
        }

        const addFilter = (type, name) => {
            let id = activeLayer.value.id;
            layers.getLayer(id).addFilter(type, {
                matrix: name
            })
            caretaker.saveMemento(type, layers)
            Pubsub.publish("render", layers.layers)
        }

        const activate = (type) => {
            Pubsub.publish("eventId", type);
            let id = activeLayer.value.id;
            layers.getLayer(id).addBrush(type, {
                canvasWidth: canvas.value.width,
                canvasHeight: canvas.value.height
            })
        }

        const setVisibility = (id, visible) => {
            layers.modify(id, { visible: !visible });
        }

        const setActiveLayer = (layer) => {
            activeLayer.value = layer;
        }

        const revertStateTo = (id,action) => {
            caretaker.restoreMemento(id,action, layers)
            Pubsub.publish("stateRestoration",null)
        }

        onMounted(() => {
            new Renderer(canvas.value);
            new Event(canvas.value)
        })

        return {
            layers,
            caretaker,
            //dom
            canvas,
            on,
            //v models
            tabHistorySwatch,
            tabLayerChannel,
            blendModes,
            brightness,
            threshold,
            activeLayer,
            //methods
            openImage,
            placeImage,
            newLayer,
            addAdjustment,
            setAdjustmentProperty,
            addFilter,
            setVisibility,
            revertStateTo,
            setActiveLayer,
            activate
        }
    }
});

app.use(vuetify).mount('#app')
