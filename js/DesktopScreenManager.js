import * as THREE from 'three';

/**
 * 桌面屏幕管理器
 * 在3D平面上绘制一个类似操作系统的桌面，包含文件夹图标
 * 点击图标可打开网页或PDF文件
 */
export class DesktopScreenManager {
    constructor(scene, camera, cameraManager) {
        this.scene = scene;
        this.camera = camera;
        this.cameraManager = cameraManager;
        
        // Canvas相关
        this.canvas = document.createElement('canvas');
        this.canvas.width = 512;
        this.canvas.height = 384;
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        
        // 屏幕网格（会被替换或附加到模型上）
        this.screenMesh = null;
        
        // 图标区域记录 [ { x, y, width, height, icon } ]
        this.iconAreas = [];
        
        // 默认图标配置
        this.icons = [
            { name: '浏览器', type: 'link', url: 'https://github.com', icon: '🌐' },
            { name: '简历', type: 'pdf', path: 'assets/pdfs/cv.pdf', icon: '📄' },
            { name: '项目', type: 'pdf', path: 'assets/pdfs/projects.pdf', icon: '📁' },
            { name: '联系', type: 'link', url: 'https://linkedin.com', icon: '📧' }
        ];
    }

    /**
     * 将桌面屏幕应用到指定的网格（替换材质）
     * @param {THREE.Mesh} mesh 目标网格（通常是副显示屏的屏幕部分）
     * @param {Array} customIcons 可选的自定义图标数组
     */
    createDesktopScreen(parentMesh, customIcons = null) {
        if (customIcons) this.icons = customIcons;

        // Use a smaller geometry for the screen
        const screenGeometry = new THREE.PlaneGeometry(1.0, 0.75);
        const screenMaterial = new THREE.MeshBasicMaterial({
            map: this.texture,
            side: THREE.DoubleSide,
            toneMapped: false
        });

        this.screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);

        // Position the screen relative to the parent mesh
        if (parentMesh) {
            if (!parentMesh.geometry.boundingBox) {
                parentMesh.geometry.computeBoundingBox();
            }
            const center = parentMesh.geometry.boundingBox.getCenter(new THREE.Vector3());
            const size = parentMesh.geometry.boundingBox.getSize(new THREE.Vector3());
            
            // Position in the center of the parent, and slightly in front (assuming +Z is forward for the model)
            this.screenMesh.position.copy(center);
            this.screenMesh.position.z += size.z / 2 + 0.02; // 2cm offset

            parentMesh.add(this.screenMesh);
        } else {
            // Fallback to old behavior if no parent is provided
            this.screenMesh.position.set(-0.279, 1.148, -2.0);
            this.scene.add(this.screenMesh);
        }

        // Make it interactive
        this.screenMesh.userData.type = 'canvas-screen';
        this.screenMesh.userData.interactive = true;

        this.drawDesktop();
    }

    /**
     * 绘制桌面界面
     */
    drawDesktop() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;

        // 清空画布，绘制背景（浅色模式，类似Windows）
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, w, h);

        // 绘制任务栏（底部）
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(0, h - 40, w, 40);

        // 任务栏上的开始按钮
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(30, h - 20, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px "Segoe UI", Arial';
        ctx.fillText('☺', 22, h - 16);

        // 绘制图标区域（网格布局，4个图标）
        this.iconAreas = [];
        const cols = 2; // 每行2个
        const iconSize = 100;
        const startX = (w - cols * iconSize) / 2;
        const startY = 80;

        this.icons.forEach((icon, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * iconSize + 15;
            const y = startY + row * (iconSize + 15) + 15;
            const iconW = iconSize - 30;
            const iconH = iconSize - 30;

            // 绘制文件夹图标（简单矩形）
            ctx.fillStyle = '#FFD966';
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 5;
            ctx.fillRect(x, y, iconW, iconH);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, iconW, iconH);

            // 绘制图标上的小标签（模拟文件夹标签）
            ctx.fillStyle = '#FFF2CC';
            ctx.fillRect(x + 5, y - 5, 30, 10);
            ctx.strokeStyle = '#8B7355';
            ctx.strokeRect(x + 5, y - 5, 30, 10);

            // 绘制图标内的符号（如📁）
            ctx.font = '40px "Segoe UI Emoji", Arial';
            ctx.fillStyle = '#5D3A1A';
            ctx.fillText(icon.icon || '📁', x + 15, y + 50);

            // 绘制文字标签
            ctx.font = '14px "Segoe UI", Arial';
            ctx.fillStyle = '#333';
            ctx.fillText(icon.name, x + 5, y + iconH + 20);

            // 记录点击区域（整个图标矩形区域）
            this.iconAreas.push({
                x: x,
                y: y,
                width: iconW,
                height: iconH + 25, // 包括文字区域
                icon: icon
            });
        });

        // 绘制底部文字
        ctx.font = '16px monospace';
        ctx.fillStyle = '#00aa00';
        ctx.textAlign = 'center';
        ctx.fillText('[ 点击选择 ]', canvas.width / 2, canvas.height - 20);

        // 更新纹理
        this.texture.needsUpdate = true;
    }

    /**
     * 处理屏幕点击（由Raycaster触发）
     * @param {Object} intersect Raycaster的交点对象
     */
    handleCanvasScreenClick(intersect) {
        if (!intersect || !this.screenMesh) return;

        // 获取UV坐标
        const uv = intersect.uv;
        if (!uv) return;

        // 转换为Canvas像素坐标
        const canvasX = uv.x * this.canvas.width;
        const canvasY = (1 - uv.y) * this.canvas.height;

        // 检查点击区域
        for (let area of this.iconAreas) {
            if (canvasX >= area.x && canvasX <= area.x + area.width &&
                canvasY >= area.y && canvasY <= area.y + area.height) {
                this.handleIconAction(area.icon);
                break;
            }
        }
    }

    /**
     * 执行图标动作
     */
    handleIconAction(icon) {
        if (icon.type === 'link' && icon.url) {
            window.open(icon.url, '_blank');
        } else if (icon.type === 'pdf' && icon.path) {
            window.open(icon.path, '_blank');
        }
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
     * 更新图标配置并重绘
     */
    setIcons(newIcons) {
        this.icons = newIcons;
        this.drawDesktop();
    }
}
