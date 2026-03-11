import * as THREE from 'three';

export class CanvasScreenManager {
    constructor(scene, camera, cameraManager) {
        this.scene = scene;
        this.camera = camera;
        this.cameraManager = cameraManager;
        
        // Canvas and rendering
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 768;
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        
        // Screen mesh
        this.screenMesh = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Content management: simulate desktop with folders
        this.currentPage = 'desktop';
        this.pages = {
            desktop: {
                title: 'DESKTOP',
                items: [
                    { label: 'Browser', link: 'https://jinxiongzheng7e8-cloud.github.io/gIt-JS/MiPortfolio/index.html#contact' },
                    { label: 'CV Folder', action: 'cv' },
                    { label: 'Projects Folder', action: 'projects' },
                    { label: 'Contact Folder', action: 'contact' }
                ]
            },
            cv: {
                title: 'CV FOLDER',
                items: [
                    { label: 'Download CV', link: 'assets/pdfs/resume.pdf' },
                    { label: 'Back to Desktop', action: 'desktop' }
                ]
            },
            projects: {
                title: 'PROJECTS FOLDER',
                items: [
                    { label: 'Project 1: 3D Scene', link: 'assets/pdfs/project1.pdf' },
                    { label: 'Project 2: Web Design', link: 'assets/pdfs/project2.pdf' },
                    { label: 'Back to Desktop', action: 'desktop' }
                ]
            },
            contact: {
                title: 'CONTACT FOLDER',
                items: [
                    { label: 'Email: jinxiong@email.com', action: null },
                    { label: 'Back to Desktop', action: 'desktop' }
                ]
            }
        };
        
        // Button hit areas for click detection
        this.buttonAreas = [];
    }
    
    createScreen(position = { x: 5, y: 2, z: -2 }, scale = { width: 4, height: 3 }) {
        const geometry = new THREE.PlaneGeometry(scale.width, scale.height);
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            side: THREE.DoubleSide,
            toneMapped: false
        });
        
        this.screenMesh = new THREE.Mesh(geometry, material);
        this.screenMesh.position.set(position.x, position.y, position.z);
        this.screenMesh.userData = {
            type: 'canvas-screen',
            interactive: true,
            isCanvasScreen: true
        };
        
        this.scene.add(this.screenMesh);
        
        // Draw initial interface
        this.drawInterface();
        
        return this.screenMesh;
    }
    
    drawInterface() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const pageData = this.pages[this.currentPage];
        
        if (!pageData) return;
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw scanline effect
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.height; i += 2) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
        
        // Draw border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Draw corner accents
        ctx.fillStyle = '#00ff00';
        const cornerSize = 40;
        ctx.fillRect(10, 10, cornerSize, 4);
        ctx.fillRect(10, 10, 4, cornerSize);
        ctx.fillRect(canvas.width - cornerSize - 10, 10, cornerSize, 4);
        ctx.fillRect(canvas.width - 14, 10, 4, cornerSize);
        ctx.fillRect(10, canvas.height - 14, cornerSize, 4);
        ctx.fillRect(10, canvas.height - cornerSize - 10, 4, cornerSize);
        ctx.fillRect(canvas.width - cornerSize - 10, canvas.height - 14, cornerSize, 4);
        ctx.fillRect(canvas.width - 14, canvas.height - cornerSize - 10, 4, cornerSize);
        
        // Draw title
        ctx.font = 'bold 48px monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText(pageData.title, canvas.width / 2, 100);
        
        // Draw separator line
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 130);
        ctx.lineTo(canvas.width - 50, 130);
        ctx.stroke();
        
        // Draw menu items
        this.buttonAreas = [];
        const itemHeight = 100;
        const startY = 180;
        const itemPadding = 20;
        
        pageData.items.forEach((item, index) => {
            const y = startY + index * itemHeight;
            
            // Button background
            ctx.fillStyle = '#003300';
            ctx.fillRect(60, y - 30, canvas.width - 120, 70);
            
            // Button border
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(60, y - 30, canvas.width - 120, 70);
            
            // Button text
            ctx.font = 'bold 32px monospace';
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, canvas.width / 2, y + 15);
            
            // Store button hit area for click detection
            this.buttonAreas.push({
                x: 60,
                y: y - 30,
                width: canvas.width - 120,
                height: 70,
                index: index,
                item: item
            });
        });
        
        // Draw footer
        ctx.font = '24px monospace';
        ctx.fillStyle = '#00aa00';
        ctx.textAlign = 'center';
        ctx.fillText('[ CLICK TO SELECT ]', canvas.width / 2, canvas.height - 40);
        
        // Update texture
        this.texture.needsUpdate = true;
    }
    
    handleCanvasScreenClick(intersect) {
        if (!intersect || !this.screenMesh) return;
        
        // Get UV coordinates from the intersection
        const uv = intersect.uv;
        if (!uv) return;
        
        // Convert UV to canvas pixel coordinates
        const canvasX = uv.x * this.canvas.width;
        const canvasY = (1 - uv.y) * this.canvas.height;
        
        console.log('Canvas click at:', { canvasX, canvasY, uv });
        
        // Check which button was clicked
        for (let i = 0; i < this.buttonAreas.length; i++) {
            const btn = this.buttonAreas[i];
            if (canvasX >= btn.x && canvasX <= btn.x + btn.width &&
                canvasY >= btn.y && canvasY <= btn.y + btn.height) {
                
                console.log('Button clicked:', btn.item.label);
                this.handleButtonClick(btn.item);
                return;
            }
        }
    }
    
    handleButtonClick(item) {
        // Handle action-based navigation: any string becomes page key
        if (item.action && typeof item.action === 'string') {
            this.currentPage = item.action;
            this.drawInterface();
        }

        // Handle link-based actions
        if (item.link) {
            if (item.link.startsWith('http')) {
                window.open(item.link, '_blank');
            } else if (item.link.endsWith('.pdf')) {
                // Open PDF in new tab
                window.open(item.link, '_blank');
            }
        }
    }
    
    goToScreen() {
        if (this.screenMesh && this.cameraManager) {
            this.cameraManager.goTo(this.screenMesh, 1000);
        }
    }
    
    updatePageContent(pageName, newItems) {
        if (this.pages[pageName]) {
            this.pages[pageName].items = newItems;
            if (this.currentPage === pageName) {
                this.drawInterface();
            }
        }
    }
    
    setPage(pageName) {
        if (this.pages[pageName]) {
            this.currentPage = pageName;
            this.drawInterface();
        }
    }
    
    resetToMainPage() {
        this.setPage('main');
    }
    
    getScreenMesh() {
        return this.screenMesh;
    }
}
