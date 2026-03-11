import * as THREE from 'three';

export class CameraManager {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.home = {
            position: camera.position.clone(),
            target: controls.target.clone()
        };
        this.customViews = {};
        this._isAnimating = false;
        this._currentAnim = null;
    }

    goTo(targetPosition, duration = 800) {
        // Accept THREE.Object3D (recommended) or THREE.Vector3 / plain {x,y,z}
        if (!targetPosition) return;

        let center = null;
        let endTarget = null;

        if (targetPosition instanceof THREE.Object3D) {
            // Compute bounding box center and size for the object
            const box = new THREE.Box3().setFromObject(targetPosition);
            center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z, 0.001);

            // Estimate a distance based on object size and camera fov
            const fov = (this.camera.isPerspectiveCamera) ? this.camera.fov : 50;
            const distance = maxDim * 1.8 + 2;

            // Keep current view direction from controls (direction from target to camera)
            const viewDir = this.camera.position.clone().sub(this.controls.target).normalize();
            const endPosition = center.clone().add(viewDir.multiplyScalar(distance));

            endTarget = center.clone();

            // animate from current camera.position -> endPosition and controls.target -> endTarget
            this._animateTo(endPosition, endTarget, duration);
            return;
        }

        // Fallback: accept a Vector3-like target
        if (typeof targetPosition.x === 'number') {
            endTarget = (targetPosition instanceof THREE.Vector3) ? targetPosition.clone() : new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
            const offsetVec = new THREE.Vector3(0, 0.8, 1.8);
            const endPosition = endTarget.clone().add(offsetVec);
            this._animateTo(endPosition, endTarget, duration);
            return;
        }
        return;
    }

    // Internal helper to animate camera and controls target
    _animateTo(endPosition, endTarget, durationMs = 800) {
        // Cancel any running animation
        if (this._isAnimating && this._currentAnim) {
            cancelAnimationFrame(this._currentAnim);
            this._isAnimating = false;
            this._currentAnim = null;
        }

        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const dur = Math.max(1, durationMs);
        const startTime = performance.now();
        this._isAnimating = true;
        this.controls.enabled = false;

        const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const step = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / dur, 1);
            const e = ease(t);

            this.camera.position.lerpVectors(startPos, endPosition, e);
            this.controls.target.lerpVectors(startTarget, endTarget, e);
            this.controls.update();

            if (t < 1) {
                this._currentAnim = requestAnimationFrame(step);
            } else {
                this._isAnimating = false;
                this._currentAnim = null;
                this.controls.enabled = true;
            }
        };

        this._currentAnim = requestAnimationFrame(step);
    }

    resetView() {
        // Smoothly go back to home position
        if (this.home && this.home.position && this.home.target) {
            this._animateTo(this.home.position, this.home.target, 800);
        }
    }

    setCustomView(name, position, target) {
        this.customViews[name] = {
            position: position,
            target: target,
        };
    }

    goToView(name, duration = 800) {
        const view = this.customViews[name];
        if (view) {
            this._animateTo(view.position, view.target, duration);
        } else {
            console.warn(`View "${name}" not found.`);
        }
    }

    /**
     * Immediately set camera position/rotation and optionally controls target.
     * `rotationDegrees` should be {x,y,z} in degrees (converted to radians internally).
     */
    jumpToView(position, rotationDegrees, target = null) {
        if (position) {
            this.camera.position.set(position.x, position.y, position.z);
        }
        if (rotationDegrees) {
            this.camera.rotation.set(
                THREE.MathUtils.degToRad(rotationDegrees.x),
                THREE.MathUtils.degToRad(rotationDegrees.y),
                THREE.MathUtils.degToRad(rotationDegrees.z)
            );
        }
        if (target) {
            this.controls.target.copy(target);
        } else {
            // 默认看向世界高度 0.9 处的点，可根据需要改为 (0,0,0)
            this.controls.target.set(0, 0.9, 0);
        }
        this.controls.update();
    }
}

