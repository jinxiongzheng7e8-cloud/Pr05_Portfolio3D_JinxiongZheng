import * as THREE from 'three';
import { startPoolGame, stopPoolGame } from './poolGame.js';

export function initInteractions(renderer, camera, scene, interactiveObjects, uiManager, cameraManager, interactionsConfig = {}, desktopScreenManager = null) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let panelOpen = false;
    // Prevent duplicate initialization
    if (renderer.domElement.__interactionsInit) return;
    renderer.domElement.__interactionsInit = true;

    function collectInteractiveMeshes() {
        const meshes = [];
        scene.traverse(node => {
            if (node.isMesh && node.userData && node.userData.interactive
                && node.userData.type !== 'canvas-screen') {
                meshes.push(node);
            }
        });
        return meshes;
    }

    function getMouseCoords(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onClick(event) {
        // If a panel is open, close it first so clicks still work
        if (panelOpen) {
            document.querySelectorAll('.info-panel').forEach(p => p.classList.add('hidden'));
            panelOpen = false;
            if (cameraManager && cameraManager.controls) cameraManager.controls.enabled = true;
        }

        getMouseCoords(event);
        raycaster.setFromCamera(mouse, camera);

        // If pool game is active, clicking outside the table stops the game
        if (window.__poolGameActive) {
            const interactiveMeshesForCheck = collectInteractiveMeshes();
            const intersectsCheck = raycaster.intersectObjects(interactiveMeshesForCheck, true);
            if (intersectsCheck.length > 0) {
                const hitCheck = intersectsCheck[0].object;
                const rootNameCheck = hitCheck.userData && (hitCheck.userData.rootName || hitCheck.userData.type);
                if (rootNameCheck !== 'pool_table') {
                    try { stopPoolGame(); } catch (e) { console.error(e); }
                    window.__poolGameActive = false;
                }
            } else {
                try { stopPoolGame(); } catch (e) { console.error(e); }
                window.__poolGameActive = false;
            }
        }

        const interactiveMeshes = collectInteractiveMeshes();
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);
        if (intersects.length === 0) return;

        const hit = intersects[0].object;
        const hitPoint = intersects[0].point.clone();

        // Determine root model name (prefer originalModel from collider userData)
        let original = hit.userData.originalModel || null;
        let targetModel = original || hit;
        let rootName = hit.userData.rootName || hit.userData.type || (original && original.userData && original.userData.type);

        // Canvas screen is non-interactive — skip
        // if (hit.userData.type === 'canvas-screen') return;

        const cfg = (rootName && interactionsConfig[rootName]) ? interactionsConfig[rootName] : null;

        if (cfg) {
            if (cfg.panel) {
                uiManager.showPanel(cfg.panel);
                panelOpen = true;
            }
            if (rootName === 'computer') {
                cameraManager.goToView('computerView', 1000);
            } else {
                cameraManager.goTo(targetModel, 1000);
            }
            if (typeof cfg.callback === 'function') {
                try {
                    cfg.callback({ hit, root: targetModel, uiManager, cameraManager, interactiveObjects, renderer, camera });
                } catch (e) {
                    console.error('interactions: callback error', e);
                }
            }
        } else {
            // No config found for this object (should not happen)
            console.warn(`interactions: no config found for "${rootName}" — add it to interactionsConfig in main.js`);
        }

    }

    // Hover highlight
    let hoveredObject = null;

    function restoreHover(obj) {
        if (!obj) return;
        const meshes = obj.isMesh ? [obj] : [];
        if (!obj.isMesh && obj.traverse) obj.traverse((n) => { if (n.isMesh) meshes.push(n); });
        meshes.forEach((mesh) => {
            if (!mesh.material) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
                const orig = m.userData && m.userData._originalEmissive;
                if (orig !== undefined && m.emissive) {
                    m.emissive.setHex(orig);
                    delete m.userData._originalEmissive;
                }
            });
        });
    }

    function applyHover(obj) {
        if (!obj) return;
        const meshes = obj.isMesh ? [obj] : [];
        if (!obj.isMesh && obj.traverse) obj.traverse((n) => { if (n.isMesh) meshes.push(n); });
        meshes.forEach((mesh) => {
            if (!mesh.material) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
                if (m && m.emissive) {
                    if (!m.userData) m.userData = {};
                    if (m.userData._originalEmissive === undefined) {
                        m.userData._originalEmissive = m.emissive.getHex();
                    }
                    m.emissive.setHex(0x333333);
                }
            });
        });
    }

    function onMouseMove(event) {
        if (window.__poolGameActive) {
            // Clear any lingering hover highlight
            if (hoveredObject) {
                restoreHover(hoveredObject);
                hoveredObject = null;
            }
            return;
        }
        getMouseCoords(event);
        raycaster.setFromCamera(mouse, camera);
        const interactiveMeshes = collectInteractiveMeshes();
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            // If hit is a collider with originalModel, highlight the original model instead
            const highlightTarget = hit.userData && hit.userData.originalModel ? hit.userData.originalModel : hit;
            if (hoveredObject !== highlightTarget) {
                if (hoveredObject) restoreHover(hoveredObject);
                applyHover(highlightTarget);
                hoveredObject = highlightTarget;
            }
        } else {
            if (hoveredObject) {
                restoreHover(hoveredObject);
                hoveredObject = null;
            }
        }
    }

    // Close panel buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.info-panel').forEach(p => p.classList.add('hidden'));
            panelOpen = false;
            if (cameraManager && cameraManager.controls) cameraManager.controls.enabled = true;
        });
    });

    // ESC closes panel
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.info-panel').forEach(p => p.classList.add('hidden'));
            panelOpen = false;
            if (cameraManager && cameraManager.controls) cameraManager.controls.enabled = true;
            if (window.__poolGameActive) {
                try { stopPoolGame(); } catch (err) { console.error(err); }
                window.__poolGameActive = false;
            }
        }
    });

    renderer.domElement.addEventListener('dblclick', onClick, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, {passive: true});

}