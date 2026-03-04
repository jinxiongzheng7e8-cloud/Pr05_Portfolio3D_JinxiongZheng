import * as THREE from 'three';

export class CameraManager {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.home = {
            position: camera.position.clone(),
            target: controls.target.clone()
        };
    }

    goTo(targetPosition, duration = 800) {
        // Simple immediate jump for the skeleton; can replace with tween for smooth transitions
        if (targetPosition && targetPosition.isVector3) {
            const offset = targetPosition.clone().add(new THREE.Vector3(0, 0.8, 1.8));
            this.camera.position.copy(offset);
            this.controls.target.copy(targetPosition);
            this.controls.update();
        }
    }

    resetView() {
        this.camera.position.copy(this.home.position);
        this.controls.target.copy(this.home.target);
        this.controls.update();
    }
}
