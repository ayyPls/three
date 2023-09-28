import { BufferGeometry, CubicBezierCurve3, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const testgeo = new SphereGeometry(0.5, 32, 16)
// draw points and curve itself
export function createBezierCurve(points, scene) {
    // Создаем экземпляр класса THREE.CubicBezierCurve3
    const curve = new CubicBezierCurve3(
        points[0], // Начальная точка
        points[1], // Контрольная точка 1
        points[2], // Контрольная точка 2
        points[3]  // Конечная точка
    );

    const color = getRandomColor()
    points.map(
        point => {
            const testmat = new MeshBasicMaterial({ color: color })
            const sphere = new Mesh(testgeo, testmat);
            sphere.position.copy(point)
            scene.add(sphere)
        }
    )


    // Создаем геометрию для кривой Безье
    const curveGeometry = new BufferGeometry().setFromPoints(curve.getPoints(100)); // 100 - количество точек на кривой

    // Создаем материал для кривой
    const curveMaterial = new LineBasicMaterial({ color: 0xff0000 });

    // Создаем объект кривой
    const curveObject = new Line(curveGeometry, curveMaterial);

    // Возвращаем объект кривой
    scene.add(curveObject)
    return curve;
}
