import * as THREE from 'three';
import { BaseScreenManager } from './BaseScreenManager.js';

/**
 * Canvas Screen Manager (terminal style)
 * Draws a terminal-style interface on a 3D plane with menu options
 * Clicking menu items opens web pages or PDF files
 */
export class CanvasScreenManager extends BaseScreenManager {
    constructor(scene, camera, cameraManager, pages = null, config = null) {
        super(scene, camera, cameraManager);

        // Configuration: prioritize externally passed config (from screenConfig.js)
        this.config = config || {
            canvas: { width: 1024, height: 768 },
            position: { x: 5, y: 2, z: -2 },
            scale: { width: 4, height: 3 }
        };

        // Set canvas dimensions from config
        this.canvas.width = this.config.canvas.width;
        this.canvas.height = this.config.canvas.height;

        // Current page
        this.currentPage = 'desktop';

        // Page configuration: prioritize externally passed pages (from screenConfig.js)
        this.pages = pages || {
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
    }

    /**
     * Create screen
     * @param {Object} position Screen position {x, y, z} (optional, overrides config)
     * @param {Object} scale Screen scale {width, height} (optional, overrides config)
     */
    createScreen(position = null, scale = null) {
        // Use provided position/scale or fall back to config
        const screenPos = position || this.config.position;
        const screenScale = scale || this.config.scale;
        
        this.createScreenMesh(screenPos, screenScale);
        this.drawInterface();
        return this.screenMesh;
    }

    /**
     * Draw interface
     */
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

        // Draw corner decorations
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
        this.clickAreas = [];
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

            // Store button click area
            this.clickAreas.push({
                x: 60,
                y: y - 30,
                width: canvas.width - 120,
                height: 70,
                index: index,
                item: item
            });
        });

        // Draw bottom text
        ctx.font = '24px monospace';
        ctx.fillStyle = '#00aa00';
        ctx.textAlign = 'center';
        ctx.fillText('[ CLICK TO SELECT ]', canvas.width / 2, canvas.height - 40);

        // Update texture
        this.updateTexture();
    }

    /**
     * Handle area click
     */
    handleAreaClick(area) {
        if (area.item) {
            this.handleButtonClick(area.item);
        }
    }

    /**
     * Handle button click
     */
    handleButtonClick(item) {
        // Handle action-based navigation: any string becomes a page key
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

    /**
     * Update page content
     */
    updatePageContent(pageName, newItems) {
        if (this.pages[pageName]) {
            this.pages[pageName].items = newItems;
            if (this.currentPage === pageName) {
                this.drawInterface();
            }
        }
    }

    /**
     * Set current page
     */
    setPage(pageName) {
        if (this.pages[pageName]) {
            this.currentPage = pageName;
            this.drawInterface();
        }
    }

    /**
     * Reset to main page
     */
    resetToMainPage() {
        this.setPage('main');
    }
}