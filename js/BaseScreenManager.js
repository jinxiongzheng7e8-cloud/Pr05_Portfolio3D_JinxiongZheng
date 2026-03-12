import * as THREE from 'three';

/**
 * Base Screen Manager
 * Provides shared functionality: canvas init, texture creation, camera control
 */
export class BaseScreenManager {
    constructor(scene, camera, cameraManager) {
        this.scene = scene;
        this.camera = camera;
        this.cameraManager = cameraManager;

        // Canvas
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);

        // Screen mesh
        this.screenMesh = null;

        // Click areas
        this.clickAreas = [];
    }

    /**
     * Create screen mesh
     * @param {Object} position Screen position {x, y, z}
     * @param {Object} scale Screen scale {width, height}
     * @param {THREE.Mesh} parentMesh Parent mesh (optional)
     */
    createScreenMesh(position = { x: 0, y: 0, z: 0 }, scale = { width: 1, height: 0.75 }, parentMesh = null) {
        const geometry = new THREE.PlaneGeometry(scale.width, scale.height);
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            side: THREE.DoubleSide,
            toneMapped: false
        });

        this.screenMesh = new THREE.Mesh(geometry, material);

        if (parentMesh) {
            // Re-attach to parent to inherit scale; convert world pos to local
            const worldPos = new THREE.Vector3(-0.207, 1.459, -2.045);
            const localPos = parentMesh.worldToLocal(worldPos.clone());
            this.screenMesh.position.copy(localPos);
            parentMesh.add(this.screenMesh);
        } else {
            // Otherwise add directly to scene
            this.screenMesh.position.set(position.x, position.y, position.z);
            this.scene.add(this.screenMesh);
        }

        // Mark mesh metadata
        this.screenMesh.userData.type = 'canvas-screen';
        this.screenMesh.userData.interactive = false;
        this.screenMesh.raycast = () => {}; // Fully transparent to raycasting

        return this.screenMesh;
    }

    /**
     * Handle screen click
     * @param {Object} intersect Raycaster intersect object
     */
    handleCanvasScreenClick(intersect) {
        if (!intersect || !this.screenMesh) return;

        const uv = intersect.uv;
        if (!uv) return;

        const canvasX = uv.x * this.canvas.width;
        const canvasY = (1 - uv.y) * this.canvas.height;

        // Check click areas
        for (const area of this.clickAreas) {
            if (canvasX >= area.x && canvasX <= area.x + area.width &&
                canvasY >= area.y && canvasY <= area.y + area.height) {
                this.handleAreaClick(area);
                return;
            }
        }
    }

    /**
     * Handle area click (implemented by subclass)
     * @param {Object} area Clicked area object
     */
    handleAreaClick(area) {
        // Subclass implements specific logic
    }

    /**
     * Move camera to face the screen
     */
    goToScreen() {
        if (this.screenMesh && this.cameraManager) {
            this.cameraManager.goTo(this.screenMesh, 1000);
        }
    }

    /**
     * Update texture
     */
    updateTexture() {
        this.texture.needsUpdate = true;
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Get screen mesh
     */
    getScreenMesh() {
        return this.screenMesh;
    }

    /**
     * Destroy screen manager
     */
    destroy() {
        if (this.screenMesh && this.screenMesh.parent) {
            this.screenMesh.parent.remove(this.screenMesh);
        }
        this.texture.dispose();
        this.clickAreas = [];
    }
}