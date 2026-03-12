import * as THREE from 'three';
import { BaseScreenManager } from './BaseScreenManager.js';

/**
 * Desktop Screen Manager — Windows 10 pixel style
 */
export class DesktopScreenManager extends BaseScreenManager {
    constructor(scene, camera, cameraManager, config = null) {
        super(scene, camera, cameraManager);
        
        // Configuration: prioritize externally passed config (from screenConfig.js)
        this.config = config || {
            canvas: { width: 1024, height: 768 },
            position: { x: -0.388, y: 1.658, z: -2.027 },
            scale: { width: 1.6, height: 1 }
        };
        
        // Set canvas dimensions from config
        this.canvas.width = this.config.canvas.width;
        this.canvas.height = this.config.canvas.height;
        this.icons = [];
    }

    /**
     * Attach desktop screen to secondary monitor mesh
     * @param {THREE.Mesh} parentMesh  Target mesh
     * @param {Array}      customIcons Icon config array
     * @param {Object}     position    Position override (optional)
     * @param {Object}     scale       Scale override (optional)
     */
    createDesktopScreen(parentMesh, customIcons = null, position = null, scale = null) {
        if (customIcons) this.icons = customIcons;
        
        // Use provided position/scale or fall back to config
        const screenPos = position || this.config.position;
        const screenScale = scale || this.config.scale;
        
        this.createScreenMesh(screenPos, screenScale, parentMesh);
        this.drawDesktop();
    }

    /**
     * Draw Windows 10 pixel-style desktop
     */
    drawDesktop() {
        const ctx = this.ctx;
        const w   = this.canvas.width;   // 1024
        const h   = this.canvas.height;  // 768

        // ── Wallpaper: Win10 blue gradient ─────────────────────
        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0,   '#041c3a');
        bg.addColorStop(0.5, '#0d47a1');
        bg.addColorStop(1,   '#01579b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Subtle pixel grid overlay
        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 8) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
        for (let y = 0; y < h; y += 8) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

        // ── Desktop icons (4, stacked on left side) ────────────
        const iconDefs = [
            { icon: '📄', label: 'CV' },
            { icon: '🌐', label: 'Portfolio' },
            { icon: '🐙', label: 'GitHub' },
            { icon: '📝', label: 'Boceto' },
        ];

        this.clickAreas = [];
        const iconW = 100, iconH = 96;
        const padX = 28, padY = 28, gapY = 14;

        iconDefs.forEach((def, i) => {
            const ix = padX;
            const iy = padY + i * (iconH + gapY);
            const imgH = iconH - 18;

            // Icon background
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(ix, iy, iconW, imgH);

            // Emoji
            ctx.font       = '46px "Segoe UI Emoji", Arial';
            ctx.textAlign  = 'center';
            ctx.fillStyle  = '#fff';
            ctx.fillText(def.icon, ix + iconW / 2, iy + 54);

            // Pixel-style label (4-direction outline)
            const lx = ix + iconW / 2;
            const ly = iy + iconH - 4;
            ctx.font      = 'bold 15px "Courier New", monospace';
            ctx.fillStyle = '#000';
            ctx.fillText(def.label, lx+1, ly+1);
            ctx.fillText(def.label, lx-1, ly-1);
            ctx.fillStyle = '#fff';
            ctx.fillText(def.label, lx, ly);

            this.clickAreas.push({
                x: ix, y: iy,
                width:  iconW,
                height: iconH,
                icon: this.icons[i] || null
            });
        });

        // ── Taskbar ─────────────────────────────────────────────
        const tbH = 52;
        const tbY = h - tbH;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, tbY, w, tbH);

        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, tbY); ctx.lineTo(w, tbY); ctx.stroke();

        // Windows 4-color logo
        const bx = 20, by = tbY + (tbH - 20) / 2;
        const sq = 8, g = 2;
        ctx.fillStyle = '#e84040'; ctx.fillRect(bx,       by,       sq, sq);
        ctx.fillStyle = '#40c040'; ctx.fillRect(bx+sq+g,  by,       sq, sq);
        ctx.fillStyle = '#4040e8'; ctx.fillRect(bx,       by+sq+g,  sq, sq);
        ctx.fillStyle = '#e8e840'; ctx.fillRect(bx+sq+g,  by+sq+g,  sq, sq);

        ctx.font      = 'bold 14px "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('Start', bx + sq*2 + g*2 + 6, tbY + tbH/2 + 5);

        // Clock
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
        ctx.font      = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.fillText(timeStr, w - 20, tbY + tbH/2 + 6);

        ctx.textAlign = 'left';
        this.updateTexture();
    }

    /* Handle area click */
    handleAreaClick(area) {
        if (area.icon) this.handleIconAction(area.icon);
    }

    /* Execute icon action */
    handleIconAction(icon) {
        if (icon.type === 'link' && icon.url)  window.open(icon.url,  '_blank');
        if (icon.type === 'pdf'  && icon.path) window.open(icon.path, '_blank');
    }

    /* Update icon config and redraw */
    setIcons(newIcons) {
        this.icons = newIcons;
        this.drawDesktop();
    }
}