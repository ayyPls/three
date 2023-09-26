import { GridHelper, PointLight, Vector2 } from 'three';
import { Raycaster, Vector3 } from 'three';
import { Scene, PerspectiveCamera, AxesHelper, WebGLRenderer, AmbientLight, AnimationMixer, Clock, Color, SpriteMaterial, Sprite, CanvasTexture, Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
import gsap, { Power2 } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger)

const scenePositions = [
    { x: -4, z: -4, y: 4, targetName: "head1" },
    { x: 2, z: 2, y: -2, targetName: "head2" },
    { x: -1, z: 1.8, y: -1.5, targetName: "head3" },
    { x: 0.5, z: 1, y: -1.5, targetName: "upperBodyPart2" },
]

// Object_2 - зельеварилка
// Object_3 - все сундуки
// Object_4 - все фрукты 
// Object_5, 6, 7- деревья
// Object 8 - лампы
// Object 14 - ender chest
// Object 15 - лестницы
// Object 17 -тыква
// Object 17 -тыква
// TODO: наезд камеры при первом рендере 
// TODO: background of scene (skybox?) https://threejs.org/manual/#en/backgrounds

let mixer, floatingAnimation, shootingAnimation;

const clock = new Clock()

const scene = new Scene();
scene.background = new Color(0xc5c5c5) // set scene background color

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const cameraGroup = new Group()
cameraGroup.name = "cameraGroup"
scene.add(cameraGroup)
cameraGroup.add(camera)

// set camera position
camera.position.x = 10
camera.position.y = 4
camera.position.z = 10

const gridHelper = new GridHelper()
scene.add(gridHelper)

const axesHelper = new AxesHelper(5);
scene.add(axesHelper);

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.className = 'renderer'
document.body.appendChild(renderer.domElement);

// const light = new PointLight()
// light.position.set(0, 2, 0)
// scene.add(light)
const light = new AmbientLight()
// light.position.set(0, 2, 0)
scene.add(light)

const controls = new OrbitControls(camera, renderer.domElement) // bind controls to 2d renderer to work if you have some 2d to render
controls.enablePan = false; // disable moving model with ctrl+mouse
controls.enableDamping = true; // smooth camera rotation
controls.dampingFactor = 0.05;
controls.enableZoom = false
// controls.screenSpacePanning = true

// controls.addEventListener("change", e=>console.log(e))
// controls.autoRotate = true

// controls.mo
// controls.autoRotateSpeed = -1
// const controls = new FirstPersonControls(camera, renderer.domElement) // bind controls to 2d renderer to work if you have some 2d to render
// controls.lookSpeed = 0.01
// controls.movementSpeed = 5

// const modelUrl = '/models/end_city/scene.gltf';
const modelUrl = '/models/wither_boss/source/witherBoss.gltf';


const timeline = gsap.timeline()

// const scrollTrigger = ScrollTrigger.scrollerProxy(renderer.domElement, {
//     scrollTop(value){
        
//     }
// })

let currentPosition = 0
// ,  onUpdate: () => controls.target = getElementByName(model.scene, "head1").position
const loader = new GLTFLoader()
loader.load(
    modelUrl,
    model => {
        mixer = new AnimationMixer(model.scene)
        controls.target = getElementByName(model.scene, "head1").position //sets orbit controls target
        scene.add(model.scene)
        timeline
            .to(camera.position, {
                x: -4, z: -4, y: 4, ease: Power2.easeInOut, scrollTrigger: {
                    trigger: renderer.domElement,
                    scrub: true,
                    onEnter: e => {
                        camera.updateProjectionMatrix()
                    },
                    
                }
            })
        // .to(camera.position, { x: 2, y: 2, z: -2, duration: 2, onUpdate: () => controls.target = getElementByName(model.scene, "head2").position })
        // .to(camera.position, { x: -1, y: 1.8, z: -1.5, duration: 2, onUpdate: () => controls.target = getElementByName(model.scene, "head3").position })
        // .to(camera.position, { x: 0.5, y: 1, z: -1.5, duration: 2, onUpdate: () => controls.target = getElementByName(model.scene, "upperBodyPart2").position })
    },
    () => {
        // on progress
    },
    error => console.error(error)
)

const cursor = { x: 0, y: 0 }
window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / window.innerWidth - 0.5
    cursor.y = event.clientY / window.innerHeight - 0.5
})

function getElementByName(object3d, name) {
    let result
    object3d.traverse(obj => {
        if (obj.name == name) {
            result = obj
            return;
        }
    })

    return result
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta()
    controls.update()

    const parallaxX = cursor.x * 0.5
    const parallaxY = - cursor.y * 0.5
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * delta
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * delta

    // run animation
    if (mixer) mixer.update(delta)

    renderer.render(scene, camera)
}
animate();

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    // to prevent blurring output canvas ?
    renderer.setPixelRatio(window.devicePixelRatio);
}

window.addEventListener('resize', onWindowResize, false)
// window.addEventListener('wheel', onScrollScene, false)
