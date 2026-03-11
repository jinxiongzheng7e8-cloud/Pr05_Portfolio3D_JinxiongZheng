import * as THREE from 'three';
import { BaseScreenManager } from './BaseScreenManager.js';

/**
 * 桌面屏幕管理器 — Windows 10 像素风格
 */
export class DesktopScreenManager extends BaseScreenManager {
    constructor(scene, camera, cameraManager) {
        super(scene, camera, cameraManager);
        this.canvas.width  = 1024;
        this.canvas.height = 768;
        this.icons = [];
    }

    /**
     * 将桌面屏幕附加到副显示屏 Mesh 上
     * @param {THREE.Mesh} parentMesh  目标网格
     * @param {Array}      customIcons 图标配置数组
     */
    createDesktopScreen(parentMesh, customIcons = null) {
        if (customIcons) this.icons = customIcons;
        this.createScreenMesh(
            { x: -0.388, y: 1.658, z: -2.027 },   // ← 调整3D场景中的位置
            { width: 1.6,  height: 1

             },         // ← 调整大小
            parentMesh
        );
        this.drawDesktop();
    }

    /**
     * 绘制 Windows 10 像素风格桌面
     */
    drawDesktop() {
        const ctx = this.ctx;
        const w   = this.canvas.width;   // 1024
        const h   = this.canvas.height;  // 768

        // ── 壁纸：Win10 蓝色渐变 ──────────────────────────
        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0,   '#041c3a');
        bg.addColorStop(0.5, '#0d47a1');
        bg.addColorStop(1,   '#01579b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // 像素网格纹理（轻微）
        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 8) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
        for (let y = 0; y < h; y += 8) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

        // ── 桌面图标（4个，纵向排列左侧）─────────────────
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

            // 图标底色
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(ix, iy, iconW, imgH);

            // Emoji
            ctx.font       = '46px "Segoe UI Emoji", Arial';
            ctx.textAlign  = 'center';
            ctx.fillStyle  = '#fff';
            ctx.fillText(def.icon, ix + iconW / 2, iy + 54);

            // 像素风文字（4方向描边）
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

        // ── 任务栏 ────────────────────────────────────────
        const tbH = 52;
        const tbY = h - tbH;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, tbY, w, tbH);

        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, tbY); ctx.lineTo(w, tbY); ctx.stroke();

        // Win 四色徽标
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

        // 时钟
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
        ctx.font      = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.fillText(timeStr, w - 20, tbY + tbH/2 + 6);

        ctx.textAlign = 'left';
        this.updateTexture();
    }

    /** 处理区域点击 */
    handleAreaClick(area) {
        if (area.icon) this.handleIconAction(area.icon);
    }

    /** 执行图标动作 */
    handleIconAction(icon) {
        if (icon.type === 'link' && icon.url)  window.open(icon.url,  '_blank');
        if (icon.type === 'pdf'  && icon.path) window.open(icon.path, '_blank');
    }

    /** 更新图标配置并重绘 */
    setIcons(newIcons) {
        this.icons = newIcons;
        this.drawDesktop();
    }
}