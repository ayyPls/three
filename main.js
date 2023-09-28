import { BufferGeometry, CubicBezierCurve3, GridHelper, Line, LineBasicMaterial, PointLight, SRGBColorSpace, Vector2 } from 'three';
import { Raycaster, Vector3 } from 'three';
import { Scene, PerspectiveCamera, AxesHelper, WebGLRenderer, AmbientLight, AnimationMixer, Clock, Color, SpriteMaterial, Sprite, CanvasTexture, Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'


// https://convert3d.org/convert/fbx
// TODO: move in scene using scroll/ add scrub or ui to move between points and annotations on objects when you are on point
let scrollPercent = 0

const scene = new Scene();
scene.background = new Color(0xc5c5c5) // set scene background color
// Функция для создания кривой Безье в 3D-пространстве
function createBezierCurve(points) {
    // Создаем экземпляр класса THREE.CubicBezierCurve3
    const curve = new CubicBezierCurve3(
        points[0], // Начальная точка
        points[1], // Контрольная точка 1
        points[2], // Контрольная точка 2
        points[3]  // Конечная точка
    );

    // Создаем геометрию для кривой Безье
    const curveGeometry = new BufferGeometry().setFromPoints(curve.getPoints(100)); // 100 - количество точек на кривой

    // Создаем материал для кривой
    const curveMaterial = new LineBasicMaterial({ color: 0xff0000 });

    // Создаем объект кривой
    const curveObject = new Line(curveGeometry, curveMaterial);

    // Возвращаем объект кривой
    return curveObject;
}

const points = [
    new Vector3(-2, 1, 1), // Начальная точка
    new Vector3(-1, 3, 0), // Контрольная точка 1
    new Vector3(1, -3, -2), // Контрольная точка 2
    new Vector3(1, 2, 0),  // Конечная точка
    new Vector3(1, 2, 0),  // Конечная точка
    new Vector3(0, 2, -3),  // Конечная точка
    new Vector3(-1, 2, -5),  // Конечная точка
    new Vector3(-2, 2, -7),  // Конечная точка
];

const bezierCurve = createBezierCurve(points.slice(0, 3));
const bezierCurve2 = createBezierCurve(points.slice(4));

scene.add(bezierCurve);
scene.add(bezierCurve2);
const curve = new CubicBezierCurve3(
    points[0], // Начальная точка
    points[1], // Контрольная точка 1
    points[2], // Контрольная точка 2
    points[3]  // Конечная точка
);
const curve2 = new CubicBezierCurve3(
    points[4], // Начальная точка
    points[5], // Контрольная точка 1
    points[6], // Контрольная точка 2
    points[7]  // Конечная точка
);
// Used to fit the lerps to start and end at specific scrolling percentages
function scalePercent(start, end) {
    return (scrollPercent - start) / (end - start)
}
const animationScripts = []
animationScripts.push({
    start: 0,
    end: 49,
    func: () => {
        const point = curve.getPointAt(scalePercent(0, 49));
        camera.position.copy(point);
        camera.lookAt(getElementByName(scene, "head1").position)
    },
})
animationScripts.push({
    start: 50,
    end: 101,
    func: () => {
        const point = curve2.getPointAt(scalePercent(50, 101));
        camera.position.copy(point);
        camera.lookAt(getElementByName(scene, "head1").position)
    },
})


function playScrollAnimations() {
    animationScripts.forEach(a => {
        if (scrollPercent >= a.start && scrollPercent < a.end) {
            a.func()
        }
    })
}
document.body.onscroll = () => {
    //calculate the current scroll progress as a percentage
    scrollPercent =
        ((document.documentElement.scrollTop || document.body.scrollTop) /
            ((document.documentElement.scrollHeight ||
                document.body.scrollHeight) -
                document.documentElement.clientHeight)) *
        100;
    console.log(scrollPercent.toFixed(3));
}

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

let mixer

const clock = new Clock()


const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
const cameraGroup = new Group()
cameraGroup.name = "cameraGroup"
scene.add(cameraGroup)
cameraGroup.add(camera)

// set camera position
camera.position.x = -2
camera.position.y = 10
camera.position.z = -2

const gridHelper = new GridHelper()
scene.add(gridHelper)

const axesHelper = new AxesHelper(5);
scene.add(axesHelper);

const renderer = new WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.className = 'renderer'
document.body.appendChild(renderer.domElement);

const light = new AmbientLight()
scene.add(light)

const controls = new OrbitControls(camera, renderer.domElement) // bind controls to 2d renderer to work if you have some 2d to render
controls.enablePan = false; // disable moving model with ctrl+mouse
controls.enableDamping = true; // smooth camera rotation
controls.dampingFactor = 0.05;
// controls.enableZoom = false

const modelUrl = '/models/Scene21/result.gltf';
renderer.outputColorSpace = SRGBColorSpace;

const loader = new GLTFLoader()
// const loader = new FBXLoader()
loader.load(
    modelUrl,
    model => {
        mixer = new AnimationMixer(model.scene)
        model.scene.scale.set(0.003, 0.003, 0.003)
        // model.scene.position.setY(-2)
        // controls.target = getElementByName(model.scene, "head1").position //sets orbit controls target
        scene.add(model.scene)
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

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta()
    controls.update()

    // const parallaxX = cursor.x * 0.5
    // const parallaxY = - cursor.y * 0.5
    // cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * delta
    // cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * delta
    // playScrollAnimations()

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
