import { Euler, GridHelper, Vector3 } from 'three';
import { Scene, PerspectiveCamera, AxesHelper, WebGLRenderer, AmbientLight, AnimationMixer, Clock, Color, SpriteMaterial, Sprite, CanvasTexture, Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let scrollPercent = 0

const scenePositions = [
    { x: -4, z: -4, y: 4, targetName: "head1" },
    { x: 2, z: 2, y: -2, targetName: "head2" },
    { x: -1, z: 1.8, y: -1.5, targetName: "head3" },
    { x: 0.5, z: 1, y: -1.5, targetName: "upperBodyPart2" },
]

const animationScripts = []

// линейная интерполяция 2d координат
function lerp(x, y, a) {
    return (1 - a) * x + a * y
}

// 3d lerp
function lerp3d(vectorA, vectorB, intendedDistance) {
    return new Vector3().lerpVectors(vectorA, vectorB, intendedDistance)
}
// Used to fit the lerps to start and end at specific scrolling percentages
function scalePercent(start, end) {
    return (scrollPercent - start) / (end - start)
}
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

const light = new AmbientLight()
scene.add(light)

const controls = new OrbitControls(camera, renderer.domElement) // bind controls to 2d renderer to work if you have some 2d to render
controls.enablePan = false; // disable moving model with ctrl+mouse
controls.enableDamping = true; // smooth camera rotation
controls.dampingFactor = 0.05;
controls.enableZoom = false
controls.enableRotate = false
const modelUrl = '/models/wither_boss/source/witherBoss.gltf';

const loader = new GLTFLoader()
loader.load(
    modelUrl,
    model => {
        mixer = new AnimationMixer(model.scene)
        controls.target = getElementByName(model.scene, "head1").position //sets orbit controls target

        // animationScripts.push({
        //     start: 0,
        //     end: 80,
        //     func: () => {
        //         // rotate camera on z axis 
        //         const rot = lerp3d(new Vector3(0, 0, 0), new Vector3(0, 3, 3), scalePercent(0, 80))
        //         camera.rotation.copy(new Euler(rot.x, rot.y, rot.z))
        //     },
        // })
        animationScripts.push({
            start: 0,
            end: 80,
            func: () => {
                // rotate camera on z axis 
                camera.lookAt(getElementByName(model.scene, "head1").position)
                camera.position.copy(lerp3d(new Vector3(10, 4, 10), new Vector3(1, 1, 0), scalePercent(0, 50)))
                console.log(camera.position)
            },
        })
        animationScripts.push({
            start: 50,
            end: 80,
            func: () => {
                // rotate camera on z axis 
                camera.lookAt(getElementByName(model.scene, "head2").position)
                camera.position.copy(lerp3d(new Vector3(1, 1, 0), new Vector3(-2, 1.5, -3), scalePercent(50, 80)))
            },
        })
        animationScripts.push({
            start: 80,
            end: 90,
            func: () => {
                // rotate camera on z axis 
                camera.lookAt(getElementByName(model.scene, "head2").position)
                camera.position.copy(lerp3d(new Vector3(-2, 1.5, -3), new Vector3(-2, 1.5, -4), scalePercent(80, 90)))
            },
        })
        scene.add(model.scene)
    },
    () => {
        // on progress
    },
    error => console.error(error)
)

// for parallax type of effect on mouse move
const cursor = { x: 0, y: 0 }
window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / window.innerWidth - 0.5
    cursor.y = event.clientY / window.innerHeight - 0.5
})

// helper func to get nested model element with given name
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

function playScrollAnimations() {
    animationScripts.forEach((a) => {
        if (scrollPercent >= a.start && scrollPercent < a.end) {
            a.func()
        }
    })
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta()
    controls.update()

    const parallaxX = cursor.x * 0.5
    const parallaxY = - cursor.y * 0.5
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * delta
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * delta

    playScrollAnimations()

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
document.body.onscroll = () => {
    //calculate the current scroll progress as a percentage
    scrollPercent =
        ((document.documentElement.scrollTop || document.body.scrollTop) /
            ((document.documentElement.scrollHeight || document.body.scrollHeight) -
                document.documentElement.clientHeight)) * 100;

    console.log(scrollPercent.toFixed(2))

}