import { BufferGeometry, CubicBezierCurve3, DirectionalLight, GridHelper, Line, Line3, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshPhongMaterial, PointLight, SRGBColorSpace, SphereGeometry, Vector2 } from 'three';
import { Raycaster, Vector3 } from 'three';
import { Scene, PerspectiveCamera, AxesHelper, WebGLRenderer, AmbientLight, AnimationMixer, Clock, Color, SpriteMaterial, Sprite, CanvasTexture, Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Cache } from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { createBezierCurve } from './createBezierCurve';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { getElementByName } from './getElementByName';


// TODO/NOTES LIST //
// TODO: move in scene using scroll/ add scrub or ui to move between points and annotations on objects when you are on point
// TODO: enable controls (enable rotation on position)
// TODO: linear camera rotation change from point to point

// FIXME: 
// A WebGL context could not be created. Reason:  Web page caused context loss and was blocked (on page/model load)
// THREE.GLTFLoader: Couldn't load texture blob (on page/model load)

Cache.enabled = true

// GLOBAL SCOPE VARIABLES //
let mixer //reserved variable for AnimationMixer
let scrollPercent = 0 //current scroll position in percent
let cursor = { x: 0, y: 0 } //cursor position (to rotate camera on mouse move)
const modelUrl = '/models/Scene2.glb'
const lightColor = '#FFFFFF'
const lightIntensity = 0.8 * Math.PI
const points = [
    new Vector3(40, 15, 80),
    new Vector3(-20, 2, 40),
    new Vector3(-10, 0, -10),
    new Vector3(2.5, 2.5, 2.5),

    new Vector3(2.5, 2.5, 2.5),
    new Vector3(0, 2, -3),
    new Vector3(-1, 2, -5),
    new Vector3(-2, 2, -7),

    new Vector3(-2, 2, -7),
    new Vector3(4, 4, 4),
    new Vector3(4, 4, 5),
    new Vector3(4, 3.5, 5),

]
const animationScripts = []
const spritesArray = []
let openedAnnotation
const annotationGroup = new Group()
const testAnnotationGroup = new Group()
const ANNOTATION_GROUP_NAME = 'annotationGroup'
annotationGroup.name = ANNOTATION_GROUP_NAME

// INIT ANNOTATION POSITIONS IN SCENE COORDINATES//
const annotationPositions = [
    {
        x: 0.5,
        y: 0.5,
        z: 0.5,
        data: {
            id: '1',
            name: 'name',
            description: 'description',
        }
    }
]


// INIT PROGRESS BAR // 
const progress = document.createElement("progress");
progress.min = 0;
progress.max = 100;
progress.value = 0;
document.body.appendChild(progress)


// INIT SCENE //
const scene = new Scene()
scene.background = new Color(0xc5c5c5)


// INIT CAMERA //
const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
const cameraGroup = new Group()
cameraGroup.name = "cameraGroup"
scene.add(cameraGroup)
cameraGroup.add(camera)
camera.position.x = 40
camera.position.y = 15
camera.position.z = 80


// INIT RENDERER // 
const renderer = new WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.className = 'renderer'
renderer.outputColorSpace = SRGBColorSpace;
document.body.appendChild(renderer.domElement);


// INIT 2D RENDERER
const annotationRenderer = new CSS2DRenderer();
annotationRenderer.setSize(window.innerWidth, window.innerHeight);
annotationRenderer.domElement.className = 'annotationRenderer'
annotationRenderer.domElement.style.position = 'absolute'
annotationRenderer.domElement.style.top = 0
document.body.appendChild(annotationRenderer.domElement);


// INIT ANNOTATION MATERIAL
let canvas = document.createElement('canvas');
canvas.width = 64;
canvas.height = 64; let context = canvas.getContext('2d');
context.lineStyle = 'black';
context.lineWidth = 6;
context.fillStyle = 'white';
context.beginPath();
context.arc(32, 32, 24, 0, 2 * Math.PI);
context.fill();
context.stroke();

const circleTexture = new CanvasTexture(canvas)
const annotationSpriteMaterial = new SpriteMaterial({
    transparent: true,
    opacity: 1,
    depthTest: true,
    map: circleTexture,
})

// INIT HELPERS //
const clock = new Clock()

const stats = new Stats()
document.body.appendChild(stats.dom)

const gridHelper = new GridHelper()
scene.add(gridHelper)

const axesHelper = new AxesHelper(100);
scene.add(axesHelper);


// INIT CONTROLS //
const controls = new OrbitControls(camera, annotationRenderer.domElement)
controls.enablePan = false; // disable moving controls center in scene
controls.enableDamping = true; // smooth camera rotation
controls.dampingFactor = 0.05;
// controls.enableZoom = false


// INIT LIGHTS //
const light1 = new AmbientLight(lightColor, lightIntensity);
const light2 = new DirectionalLight(lightColor, lightIntensity);
scene.add(light1, light2)


// const 
const loader = new GLTFLoader()
loader.load(
    modelUrl,
    model => {
        scene.add(model.scene);
        document.body.removeChild(progress)
        annotationPositions.forEach(
            annotation => {
                const { data, ...position } = annotation
                const annotationSprite = new Sprite(annotationSpriteMaterial)
                annotationSprite.scale.set(0.05, 0.05, 0.05)
                annotationSprite.userData = data
                annotationSprite.position.set(position.x, position.y, position.z)
                annotationGroup.add(annotationSprite)
                scene.add(annotationGroup)
                spritesArray.push(annotationSprite)

                // test add annotation on top of 3d annotation dot object
                const testcontainer = document.createElement("div")
                testcontainer.className = 'annotationContainer'
                annotationRenderer.domElement.appendChild(testcontainer)
                testcontainer.id = data.id
                testcontainer.style.position = "absolute"

                const testannotation = new CSS2DObject(testcontainer)
                testannotation.position.set(position.x, position.y, position.z)
                testAnnotationGroup.add(testannotation)
                // scene.add(testAnnotationGroup)
            }
        )
        console.log(scene);

        // const part = getElementByName(model.scene, "stanok-007");
        // const part2 = getElementByName(model.scene, "stanok-007").children[1];
        // const part3 = getElementByName(model.scene, "stanok-007").children[2];
        // const annotationSprite = new Sprite(annotationSpriteMaterial)
        // annotationSprite.scale.set(0.05, 0.05, 0.05)
        // const resultPosition = new Vector3()
        // part2.localToWorld(resultPosition)
        // annotationSprite.position.copy(resultPosition)
        // console.log(annotationSprite.position);
        // part.attach(annotationSprite)
        // spritesArray.push(annotationSprite)

    },
    event => progress.value = event.loaded / event.total * 100,
    error => console.error(error)
)

function render() {
    requestAnimationFrame(render);
    const delta = clock.getDelta()
    controls.update(delta)
    stats.update()
    // for parallax
    const parallaxX = cursor.x * 0.5
    const parallaxY = - cursor.y * 0.5
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * delta
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * delta
    // run animation
    if (mixer) mixer.update(delta)

    renderer.autoClear = true;
    annotationSpriteMaterial.opacity = 0.2;
    annotationSpriteMaterial.depthTest = false;
    renderer.render(scene, camera);
    renderer.autoClear = false;
    annotationSpriteMaterial.opacity = 1;
    annotationSpriteMaterial.depthTest = true;
    spritesArray.map((sprite) => { renderer.render(sprite, camera); })
    annotationRenderer.render(scene, camera)

    // playScrollAnimations()
}

render();

// resize canvas based on window size
const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    // to prevent blurring output canvas ?
    renderer.setPixelRatio(window.devicePixelRatio);
}
window.addEventListener('resize', onWindowResize, false)


// calc scroll position in percent 
function onWindowScroll() {
    scrollPercent =
        ((document.documentElement.scrollTop || document.body.scrollTop) /
            ((document.documentElement.scrollHeight ||
                document.body.scrollHeight) -
                document.documentElement.clientHeight)) *
        100;
    // console.log(scrollPercent.toFixed(3));
}
window.addEventListener('scroll', onWindowScroll, false)


// for parallax effect
window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / window.innerWidth - 0.5
    cursor.y = event.clientY / window.innerHeight - 0.5
})


// Used to fit the lerps to start and end at specific scrolling percentages
function scalePercent(start, end) {
    return (scrollPercent - start) / (end - start)
}


// make changes in scene based on current scroll position
function playScrollAnimations() {
    animationScripts.forEach(a => {
        if (scrollPercent >= a.start && scrollPercent < a.end) {
            a.func()
        }
    })
}

// curves for camera route
const curve = createBezierCurve(points.slice(0, 4), scene);
const curve2 = createBezierCurve(points.slice(4, 8), scene);
const curve3 = createBezierCurve(points.slice(8, 12), scene);
// const linegeom = new BufferGeometry().setFromPoints(curve.getPoints(100)); // 100 - количество точек на кривой

// const linemat = new LineBasicMaterial({ color: 0xff0000 });
// let cameraPositionOnLine = new Vector3()
const linegeom = new BufferGeometry().setFromPoints([new Vector3(0, 0, 0), new Vector3(6, 2, 6)]); // 100 - количество точек на кривой

const line = new Line3(new Vector3(0, 0, 0), new Vector3(6, 2, 6))
const mat = new LineBasicMaterial({ color: 'pink' })
const linemesh = new Mesh(linegeom, mat)

scene.add(linemesh)

animationScripts.push({
    start: 0,
    end: 33,
    func: () => {
        const point = curve.getPointAt(scalePercent(0, 33));
        camera.position.copy(point);
        camera.lookAt(new Vector3(0.5, 0.5, 0.5))
        // camera.lookAt(getElementByName(scene, "head1").position)
    },
})
animationScripts.push({
    start: 34,
    end: 66,
    func: () => {
        const point = curve2.getPointAt(scalePercent(34, 66));
        camera.position.copy(point);
        // camera.lookAt(getElementByName(scene, "head1").position)
    },
})
animationScripts.push({
    start: 34,
    end: 101,
    func: () => {
        let tempVector = new Vector3()
        const point = line.at(scalePercent(34, 101), tempVector);
        // camera.position.copy(point);
        // 
        console.log(scalePercent(34, 101), tempVector);
        camera.lookAt(tempVector)
    },
})
animationScripts.push({
    start: 67,
    end: 101,
    func: () => {
        const point = curve3.getPointAt(scalePercent(67, 101));
        camera.position.copy(point);
        // camera.lookAt(new Vector3(6, 2, 6))
    },
})


const onWindowClick = async (e) => {
    e.preventDefault()
    // FIXME: do not delete annotation div container
    // if (openedAnnotation) {
    //     scene.remove(openedAnnotation)
    // }
    const raycaster = new Raycaster()
    let mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.getObjectByName(ANNOTATION_GROUP_NAME).children);
    for (let i = 0; i < intersects.length; i++) {
        // You can do anything you want here, this is just an example to make the hovered object transparent
        const intersectedObject = intersects[i].object
        if (intersectedObject.type == 'Sprite') {

            const getData = async (id) => {
                const response = await fetch(`http://jsonplaceholder.typicode.com/todos/${id}`)
                const data = await response.json()
                return data.title
            }
            console.log(intersectedObject);
            const annotationContainer = document.getElementById(intersectedObject.userData.id)
            annotationContainer.innerText = getData(intersectedObject.userData.id)

            openedAnnotation = new CSS2DObject(annotationContainer)
            openedAnnotation.position.copy(intersectedObject.position)
            // openedAnnotation.position.setY(intersectedObject.parent.position.y - 0.8)
            // openedAnnotation.position.setZ(intersectedObject.parent.position.z - 0.3)
            scene.add(openedAnnotation)
        }
    }
    
}

window.addEventListener('click', onWindowClick, false)
