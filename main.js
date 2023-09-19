import { Vector2 } from 'three';
import { Raycaster, Vector3 } from 'three';
import { Scene, PerspectiveCamera, AxesHelper, WebGLRenderer, AmbientLight, AnimationMixer, Clock, Color, SpriteMaterial, Sprite, CanvasTexture, Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
// TODO: наезд камеры при первом рендере 
// TODO: background of scene (skybox?) https://threejs.org/manual/#en/backgrounds

let mixer, floatingAnimation, shootingAnimation;

const clock = new Clock()

const scene = new Scene();
scene.background = new Color(0xc5c5c5) // set scene background color

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// set camera position
camera.position.x = -3
camera.position.y = 1
camera.position.z = -3

const axesHelper = new AxesHelper(5);
// scene.add(axesHelper);

// const stats = new Stats()
// document.body.appendChild(stats.dom)


const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.className = 'renderer'
document.body.appendChild(renderer.domElement);

const annotationRenderer = new CSS2DRenderer();
annotationRenderer.setSize(window.innerWidth, window.innerHeight);
annotationRenderer.domElement.className = 'annotationRenderer'
annotationRenderer.domElement.style.position = 'absolute'
annotationRenderer.domElement.style.top = 0
document.body.appendChild(annotationRenderer.domElement);

const light = new AmbientLight(0x404040, 100); // soft white light
scene.add(light);

const controls = new OrbitControls(camera, annotationRenderer.domElement) // bind controls to 2d renderer to work if you have some 2d to render
controls.enablePan = false; // disable moving model with ctrl+mouse
controls.enableDamping = true; // smooth camera rotation
controls.dampingFactor = 0.05;
controls.maxDistance = 5; // min and max distance for camera zoom
controls.minDistance = 1.5;

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

const modelUrl = '/models/wither_boss/source/witherBoss.gltf';


const loader = new GLTFLoader()
loader.load(
    modelUrl,
    model => {
        mixer = new AnimationMixer(model.scene)
        // bind animations
        floatingAnimation = model.animations[0]
        shootingAnimation = model.animations[1]
        mixer.clipAction(floatingAnimation).play().timeScale = 0.5
        model.scene.position.y = -1.3
        attachAnnotationSprites(model)
        scene.add(model.scene)
        console.log(scene);
        console.log(spritesArray);
    },
    () => {
        // on progress
    },
    error => console.error(error)
)
var spritesArray = [];

function attachAnnotationSprites(model) {
    model.scene.children.map(obj => obj.children.filter(part => !part.isMesh).map((part, index) => {
        const annotationSprite = new Sprite(annotationSpriteMaterial)
        annotationSprite.scale.set(0.05, 0.05, 0.05)
        annotationSprite.position.copy({ ...part.position, y: part.position.y - 1, z: part.position.z - 0.3 })
        part.attach(annotationSprite)
        spritesArray.push(annotationSprite)
    }))
}

function renderAnnotationSprites(renderer) {
    // render scene + all sprites as transparent
    renderer.autoClear = true;
    annotationSpriteMaterial.opacity = 0.2;
    annotationSpriteMaterial.depthTest = false;
    renderer.render(scene, camera);

    // render only front sprites
    renderer.autoClear = false;
    annotationSpriteMaterial.opacity = 1;
    annotationSpriteMaterial.depthTest = true;
    spritesArray.map((sprite) => { renderer.render(sprite, camera); })
    annotationRenderer.render(scene, camera)
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta()
    controls.update()
    // stats.update();

    // run animation
    if (mixer) mixer.update(delta)

    renderAnnotationSprites(renderer)
}
animate();


let openedAnnotation;
const onWindowClick = (e) => {
    e.preventDefault()
    if (openedAnnotation) {
        scene.remove(openedAnnotation)
    }
    const raycaster = new Raycaster()
    let mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(scene.children);
    for (let i = 0; i < intersects.length; i++) {
        // You can do anything you want here, this is just an example to make the hovered object transparent
        const intersectedObject = intersects[i].object
        if (intersectedObject.type == 'Sprite') {
            const annotationContainer = document.createElement('div')
            annotationContainer.id = 'annotationContainer'
            annotationContainer.innerText = intersectedObject.parent.name
            
            openedAnnotation = new CSS2DObject(annotationContainer)
            openedAnnotation.position.copy(intersectedObject.parent.position)
            openedAnnotation.position.setY(intersectedObject.parent.position.y - 0.8)
            openedAnnotation.position.setZ(intersectedObject.parent.position.z - 0.3)
            scene.add(openedAnnotation)
        }
    }
}

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    // to prevent blurring output canvas ?
    renderer.setPixelRatio(window.devicePixelRatio);
}
window.addEventListener('resize', onWindowResize, false)
window.addEventListener('click', onWindowClick, false)
