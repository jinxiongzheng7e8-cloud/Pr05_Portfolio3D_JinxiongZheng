/**
 * hudToggle.js — Coordinate HUD visibility toggle
 * Hidden by default. Press H or call setHudVisible(true/false) to toggle.
 */

const HUD_IDS = ['camera-position', 'camera-rotation'];

let _hudVisible = false; // Hidden by default

function applyHudState() {
    HUD_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = _hudVisible ? '' : 'none';
    });
}

/** Set HUD visibility */
export function setHudVisible(visible) {
    _hudVisible = visible;
    applyHudState();
}

/** Toggle HUD visibility */
export function toggleHud() {
    setHudVisible(!_hudVisible);
}

/** Initialize: hide HUD and bind H key */
export function initHudToggle() {
    applyHudState();
    window.addEventListener('keydown', (e) => {
        // Ignore keydown events inside input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'h' || e.key === 'H') toggleHud();
    });
}