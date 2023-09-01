import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, SpotLight, TextureLoader, AmbientLight, Box3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import Stats from 'three/examples/jsm/libs/stats.module'
const scene = new Scene();
const stats = new Stats()
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new WebGLRenderer();
const light = new AmbientLight(0x404040, 100); // soft white light
scene.add(light);
const controls = new OrbitControls(camera, renderer.domElement)
// disable moving model with ctrl+mouse
controls.enablePan = false;

// scene.rotateY(10)

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.body.appendChild(stats.dom)


const loader = new GLTFLoader()
const modelUrl = '/scene.gltf';
loader.load(
    modelUrl,
    model => {
        scene.add(model.scene)
        console.log(model);
    },
    undefined,
    error => console.error(error)
)

// const geometry = new BoxGeometry(1, 1, 1);
// const material = new MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new Mesh(geometry, material);
// scene.add(cube);


camera.position.z = 1.5;
function animate() {
    requestAnimationFrame(animate);
    // model.rotation.x +=0.01
    // model.rotation.y +=0.01
    // rotate scene, not the model
    // scene.rotateY(0.001)
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();