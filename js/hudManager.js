import * as THREE from 'three';

export class HUDManager {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        
        // Create HUD container
        this.hudContainer = document.createElement('div');
        this.hudContainer.id = 'hud-container';
        this.hudContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            font-family: 'Courier New', monospace;
            color: #0f0;
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            font-size: 12px;
            z-index: 100;
        `;
        document.body.appendChild(this.hudContainer);
        
        // HUD Elements
        this.elements = {
            topLeft: this.createElement('hud-top-left'),
            topRight: this.createElement('hud-top-right'),
            bottomLeft: this.createElement('hud-bottom-left'),
            bottomRight: this.createElement('hud-bottom-right'),
            center: this.createElement('hud-center')
        };
        
        // Data
        this.data = {
            fps: 0,
            frameCount: 0,
            lastTime: performance.now(),
            cameraPos: new THREE.Vector3(),
            cameraRot: new THREE.Euler(),
            objectCount: 0,
            drawCalls: 0
        };
    }
    
    createElement(id) {
        const el = document.createElement('div');
        el.id = id;
        el.style.cssText = `
            position: absolute;
            padding: 10px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #0f0;
            white-space: pre-wrap;
            word-break: break-all;
            max-width: 400px;
        `;
        
        if (id === 'hud-top-left') {
            el.style.top = '10px';
            el.style.left = '10px';
        } else if (id === 'hud-top-right') {
            el.style.top = '10px';
            el.style.right = '10px';
            el.style.textAlign = 'right';
        } else if (id === 'hud-bottom-left') {
            el.style.bottom = '10px';
            el.style.left = '10px';
        } else if (id === 'hud-bottom-right') {
            el.style.bottom = '10px';
            el.style.right = '10px';
            el.style.textAlign = 'right';
        } else if (id === 'hud-center') {
            el.style.top = '50%';
            el.style.left = '50%';
            el.style.transform = 'translate(-50%, -50%)';
            el.style.textAlign = 'center';
            el.style.zIndex = '101';
        }
        
        this.hudContainer.appendChild(el);
        return el;
    }
    
    update(scene) {
        // Update FPS
        const now = performance.now();
        const deltaTime = now - this.data.lastTime;
        this.data.lastTime = now;
        
        this.data.frameCount++;
        if (deltaTime > 0) {
            this.data.fps = Math.round(1000 / deltaTime);
        }
        
        // Update camera data
        this.data.cameraPos = this.camera.position.clone();
        this.data.cameraRot = this.camera.rotation.clone();
        
        // Count objects
        this.data.objectCount = 0;
        scene.traverse(() => {
            this.data.objectCount++;
        });
    }
    
    setTopLeft(text) {
        this.elements.topLeft.textContent = text;
    }
    
    setTopRight(text) {
        this.elements.topRight.textContent = text;
    }
    
    setBottomLeft(text) {
        this.elements.bottomLeft.textContent = text;
    }
    
    setBottomRight(text) {
        this.elements.bottomRight.textContent = text;
    }
    
    setCenter(text) {
        this.elements.center.textContent = text;
    }
    
    showDebugInfo() {
        const fps = this.data.fps;
        const pos = this.data.cameraPos;
        const rot = this.data.cameraRot;
        
        const topLeftText = `[SYSTEM INFO]
FPS: ${fps}
Frame: ${this.data.frameCount}
Objects: ${this.data.objectCount}`;
        
        const topRightText = `[CAMERA DATA]
X: ${pos.x.toFixed(2)}
Y: ${pos.y.toFixed(2)}
Z: ${pos.z.toFixed(2)}
RX: ${(rot.x * 180 / Math.PI).toFixed(2)}°
RY: ${(rot.y * 180 / Math.PI).toFixed(2)}°
RZ: ${(rot.z * 180 / Math.PI).toFixed(2)}°`;
        
        const bottomLeftText = `[RENDERER]
Size: ${this.renderer.domElement.width}x${this.renderer.domElement.height}
Pixel Ratio: ${this.renderer.getPixelRatio().toFixed(2)}`;
        
        this.setTopLeft(topLeftText);
        this.setTopRight(topRightText);
        this.setBottomLeft(bottomLeftText);
    }
    
    showCrosshair() {
        const crosshair = `
    +
   / \\
  ← ○ →
   \\ /
    +`;
        this.setCenter(crosshair);
    }
    
    showMessage(message, timeout = 3000) {
        this.setCenter(message);
        if (timeout > 0) {
            setTimeout(() => {
                this.setCenter('');
            }, timeout);
        }
    }
    
    showMinimap(scene, mapWidth = 200, mapHeight = 200) {
        // Create canvas for minimap
        const canvas = document.createElement('canvas');
        canvas.width = mapWidth;
        canvas.height = mapHeight;
        const ctx = canvas.getContext('2d');
        
        // Draw minimap background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, mapWidth, mapHeight);
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, mapWidth, mapHeight);
        
        // Draw grid
        ctx.strokeStyle = '#004400';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo((mapWidth / 4) * i, 0);
            ctx.lineTo((mapWidth / 4) * i, mapHeight);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, (mapHeight / 4) * i);
            ctx.lineTo(mapWidth, (mapHeight / 4) * i);
            ctx.stroke();
        }
        
        // Draw camera position (center)
        const centerX = mapWidth / 2;
        const centerY = mapHeight / 2;
        ctx.fillStyle = '#0f0';
        ctx.fillRect(centerX - 3, centerY - 3, 6, 6);
        
        // Draw camera direction
        const cameraDir = new THREE.Vector3(0, 0, -1);
        cameraDir.applyQuaternion(this.camera.quaternion);
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + cameraDir.x * 30, centerY + cameraDir.z * 30);
        ctx.stroke();
        
        // Create image from canvas
        const dataUrl = canvas.toDataURL();
        const el = this.elements.topRight;
        el.innerHTML = `<img src="${dataUrl}" style="width: 200px; height: 200px; image-rendering: pixelated;">`;
    }
    
    showRadar(scene, range = 50, pixelsPerUnit = 2) {
        const size = range * 2 * pixelsPerUnit;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Concentric circles
        ctx.strokeStyle = '#004400';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const radius = (size / 2) * (i / 3);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw objects
        scene.traverse((obj) => {
            if (obj.isMesh && obj !== this.camera) {
                const dx = (obj.position.x - this.camera.position.x) * pixelsPerUnit;
                const dz = (obj.position.z - this.camera.position.z) * pixelsPerUnit;
                
                // Only draw if in range
                if (Math.abs(dx) < size / 2 && Math.abs(dz) < size / 2) {
                    ctx.fillStyle = obj.userData.interactive ? '#ff0' : '#0f0';
                    ctx.fillRect(
                        size / 2 + dx - 2,
                        size / 2 + dz - 2,
                        4,
                        4
                    );
                }
            }
        });
        
        // Camera at center
        ctx.fillStyle = '#00f';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Direction indicator
        ctx.strokeStyle = '#00f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size / 2, size / 2);
        ctx.lineTo(size / 2, size / 2 - 15);
        ctx.stroke();
        
        const dataUrl = canvas.toDataURL();
        const el = this.elements.topRight;
        el.innerHTML = `<img src="${dataUrl}" style="width: ${size/2}px; height: ${size/2}px; image-rendering: pixelated;">`;
    }
    
    hideAll() {
        this.elements.topLeft.textContent = '';
        this.elements.topRight.textContent = '';
        this.elements.topRight.innerHTML = '';
        this.elements.bottomLeft.textContent = '';
        this.elements.bottomRight.textContent = '';
        this.elements.center.textContent = '';
    }
    
    destroy() {
        if (this.hudContainer) {
            this.hudContainer.remove();
        }
    }
}
