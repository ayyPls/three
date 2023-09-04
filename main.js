import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, AnimationMixer, Clock, CameraHelper, Color } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';

// TODO: наезд камеры при первом рендере 
// TODO: visible (and hideable on collision?) and clickable dots on model
// TODO: background of scene (skybox?) https://threejs.org/manual/#en/backgrounds

let mixer, floatingAnimation, shootingAnimation, annotations;

const loader = new GLTFLoader()
const clock = new Clock()

const scene = new Scene();
scene.background = new Color(0xc5c5c5) // set scene background color

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3 // set camera position

const stats = new Stats()
document.body.appendChild(stats.dom)


const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer()
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(labelRenderer.domElement)


const light = new AmbientLight(0x404040, 100); // soft white light
scene.add(light);


const cameraHelper = new CameraHelper(camera)
scene.add(cameraHelper)


const controls = new OrbitControls(camera, labelRenderer.domElement) // bind controls to 2d renderer to work if you have some 2d to render
controls.enablePan = false; // disable moving model with ctrl+mouse
controls.enableDamping = true; // smooth camera rotation
controls.dampingFactor = 0.05;
controls.maxDistance = 5; // min and max distance for camera zoom
controls.minDistance = 1.5;


const modelUrl = '/models/wither_boss/source/witherBoss.gltf';
loader.load(
    modelUrl,
    model => {
        mixer = new AnimationMixer(model.scene)
        // bind animations
        floatingAnimation = model.animations[0]
        shootingAnimation = model.animations[1]
        mixer.clipAction(shootingAnimation).play()
        // rotate model to another angle
        model.scene.position.y = -1.3
        model.scene.rotateY(2.5)
        annotations = model.scene.children.flatMap(obj => obj.children.filter(part => part.isMesh == true))
        // console.log(annotations);
        // renderAnnotations(annotations)

        scene.add(model.scene)
        const labelElement = document.createElement("div")
        labelElement.className= 'label'
        labelElement.textContent = 'label'
        labelElement.style.marginTop = '-1em'
        labelElement.style.background = 'none'

        const label = new CSS2DObject(labelElement)
        annotations[0].add(label)
        // const label = annotations[0]
    },
    undefined,
    error => console.error(error)
)


// const renderAnnotations = (annotations) => {
//     annotations.map(
//         annotation => {
//             const hotspot = document.createElement("div")
//             hotspot.className = "hotspot"
//             hotspot.setAttribute("name", annotation.name)
//             // add tooltip
//             const tooltip = document.createElement("div")
//             tooltip.className = "tooltip"
//             // set text
//             tooltip.innerHTML = annotation.userData.name
//             hotspot.appendChild(tooltip)

//             const hotspotLabel = new CSS2DObject(hotspot)
//             hotspotLabel.position.set(0, 0, 0)
//             annotation.add(hotspotLabel)
//             hotspotLabel.layers.set(0)
//             scene.add(hotspotLabel)
//             console.log(hotspotLabel);
//         })
// }


function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta()
    controls.update()
    stats.update()
    const elapsed = clock.getElapsedTime()

    // run animation
    if (mixer)
        mixer.update(delta)
    renderer.render(scene, camera);
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