/**
 * hudToggle.js — 坐标 HUD 显示开关
 * 默认隐藏，按 H 键或调用 setHudVisible(true/false) 切换
 */

const HUD_IDS = ['camera-position', 'camera-rotation'];

let _hudVisible = false; // 默认关闭

function applyHudState() {
    HUD_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = _hudVisible ? '' : 'none';
    });
}

/** 设置 HUD 可见性 */
export function setHudVisible(visible) {
    _hudVisible = visible;
    applyHudState();
}

/** 切换 HUD 可见性 */
export function toggleHud() {
    setHudVisible(!_hudVisible);
}

/** 初始化：隐藏 HUD，绑定 H 键开关 */
export function initHudToggle() {
    applyHudState();
    window.addEventListener('keydown', (e) => {
        // 避免在输入框里触发
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'h' || e.key === 'H') toggleHud();
    });
}