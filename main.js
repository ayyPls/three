import { BufferGeometry, CubicBezierCurve3, DirectionalLight, GridHelper, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshPhongMaterial, PointLight, SRGBColorSpace, SphereGeometry, Vector2 } from 'three';
import { Raycaster, Vector3 } from 'three';
import { Scene, PerspectiveCamera, AxesHelper, WebGLRenderer, AmbientLight, AnimationMixer, Clock, Color, SpriteMaterial, Sprite, CanvasTexture, Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Cache } from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { createBezierCurve } from './createBezierCurve';




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
    // b,r,g
    new Vector3(40, 15, 80),
    new Vector3(-20, 2, 40),
    new Vector3(-10, 0, -10),
    new Vector3(-1, 1, -1),
    new Vector3(1, 2, 0),
    new Vector3(0, 2, -3),
    new Vector3(-1, 2, -5),
    new Vector3(-2, 2, -7),
]
const animationScripts = []

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


// INIT HELPERS //
const clock = new Clock()

const stats = new Stats()
document.body.appendChild(stats.dom)

const gridHelper = new GridHelper()
scene.add(gridHelper)

const axesHelper = new AxesHelper(100);
scene.add(axesHelper);


// INIT CONTROLS //
const controls = new OrbitControls(camera, renderer.domElement)
controls.enablePan = false; // disable moving controls center in scene
controls.enableDamping = true; // smooth camera rotation
controls.dampingFactor = 0.05;
controls.enableZoom = false


// INIT LIGHTS //
const light1 = new AmbientLight(lightColor, lightIntensity);
const light2 = new DirectionalLight(lightColor, lightIntensity);
scene.add(light1, light2)

const loader = new GLTFLoader()
loader.load(
    modelUrl,
    model => {
        mixer = new AnimationMixer(model.scene)
        scene.add(model.scene);
        document.body.removeChild(progress)
    },
    event => progress.value = event.loaded / event.total * 100,
    error => console.error(error)
)

function render() {
    requestAnimationFrame(render);
    const delta = clock.getDelta()
    controls.update(delta)
    stats.update()
    const parallaxX = cursor.x * 0.5
    const parallaxY = - cursor.y * 0.5
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * delta
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * delta
    // run animation
    // if (mixer) mixer.update(delta)
    playScrollAnimations()
    renderer.render(scene, camera)
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
    console.log(scrollPercent.toFixed(3));
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
const curve = createBezierCurve(points.slice(0, 3), scene);
const curve2 = createBezierCurve(points.slice(4), scene);

animationScripts.push({
    start: 0,
    end: 49,
    func: () => {
        const point = curve.getPointAt(scalePercent(0, 49));
        camera.position.copy(point);
        // camera.lookAt(getElementByName(scene, "head1").position)
    },
})
animationScripts.push({
    start: 50,
    end: 101,
    func: () => {
        const point = curve2.getPointAt(scalePercent(50, 101));
        camera.position.copy(point);
        // camera.lookAt(getElementByName(scene, "head1").position)
    },
})
