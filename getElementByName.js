export function getElementByName(object3d, name) {
    let result
    object3d.traverse(obj => {
        if (obj.name == name) {
            result = obj
            return;
        }
    })

    return result
}