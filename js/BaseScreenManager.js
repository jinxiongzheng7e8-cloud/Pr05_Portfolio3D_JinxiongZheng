import * as THREE from 'three';

/**
 * 屏幕管理器基类
 * 提供屏幕管理的公共功能，包括Canvas初始化、纹理创建、相机控制等
 */
export class BaseScreenManager {
    constructor(scene, camera, cameraManager) {
        this.scene = scene;
        this.camera = camera;
        this.cameraManager = cameraManager;

        // Canvas相关
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);

        // 屏幕网格
        this.screenMesh = null;

        // 点击区域记录
        this.clickAreas = [];
    }

    /**
     * 创建屏幕网格
     * @param {Object} position 屏幕位置 {x, y, z}
     * @param {Object} scale 屏幕缩放 {width, height}
     * @param {THREE.Mesh} parentMesh 父网格（可选）
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
            // 加回父网格保持继承缩放，通过世界矩阵逆变换算出局部坐标
            const worldPos = new THREE.Vector3(-0.207, 1.459, -2.045);
            const localPos = parentMesh.worldToLocal(worldPos.clone());
            this.screenMesh.position.copy(localPos);
            parentMesh.add(this.screenMesh);
        } else {
            // 否则直接添加到场景中
            this.screenMesh.position.set(position.x, position.y, position.z);
            this.scene.add(this.screenMesh);
        }

        // 标记为可交互
        this.screenMesh.userData.type = 'canvas-screen';
        this.screenMesh.userData.interactive = false;
        this.screenMesh.raycast = () => {}; // 完全穿透，不拦截任何射线

        return this.screenMesh;
    }

    /**
     * 处理屏幕点击
     * @param {Object} intersect Raycaster的交点对象
     */
    handleCanvasScreenClick(intersect) {
        if (!intersect || !this.screenMesh) return;

        const uv = intersect.uv;
        if (!uv) return;

        const canvasX = uv.x * this.canvas.width;
        const canvasY = (1 - uv.y) * this.canvas.height;

        // 检查点击区域
        for (const area of this.clickAreas) {
            if (canvasX >= area.x && canvasX <= area.x + area.width &&
                canvasY >= area.y && canvasY <= area.y + area.height) {
                this.handleAreaClick(area);
                return;
            }
        }
    }

    /**
     * 处理区域点击（子类实现）
     * @param {Object} area 点击区域对象
     */
    handleAreaClick(area) {
        // 子类实现具体逻辑
    }

    /**
     * 将相机移动到屏幕前
     */
    goToScreen() {
        if (this.screenMesh && this.cameraManager) {
            this.cameraManager.goTo(this.screenMesh, 1000);
        }
    }

    /**
     * 更新纹理
     */
    updateTexture() {
        this.texture.needsUpdate = true;
    }

    /**
     * 清空画布
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 获取屏幕网格
     */
    getScreenMesh() {
        return this.screenMesh;
    }

    /**
     * 销毁屏幕管理器
     */
    destroy() {
        if (this.screenMesh && this.screenMesh.parent) {
            this.screenMesh.parent.remove(this.screenMesh);
        }
        this.texture.dispose();
        this.clickAreas = [];
    }
}