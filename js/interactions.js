import * as THREE from 'three';

export function initInteractions(renderer, camera, scene, interactiveObjects, uiManager, cameraManager) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onClick(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            const hit = intersects[0].object;
            if (hit.userData && hit.userData.type) {
                const t = hit.userData.type;
                if (t === 'gpu') {
                    uiManager.showPanel('panel-computer');
                    cameraManager.goTo(hit.getWorldPosition(new THREE.Vector3()));
                } else if (t === 'pool') {
                    uiManager.showPanel('panel-billar');
                } else if (t === 'main_screen') {
                    uiManager.showPanel('panel-main-screen');
                } else if (t === 'blackboard') {
                    uiManager.showPanel('panel-blackboard');
                }
            }
        }
    }

    window.addEventListener('click', onClick, false);
}
