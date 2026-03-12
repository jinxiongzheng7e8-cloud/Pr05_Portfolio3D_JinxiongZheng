import * as THREE from 'three';
import { startPoolGame, stopPoolGame } from './poolGame.js';

export function initInteractions(renderer, camera, scene, interactiveObjects, uiManager, cameraManager, interactionsConfig = {}, desktopScreenManager = null) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let panelOpen = false;

    // Prevent duplicate initialization
    if (renderer.domElement.__interactionsInit) return;
    renderer.domElement.__interactionsInit = true;

    // ── Helpers ─────────────────────────────────────────────────

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

    // ── Hover highlight ──────────────────────────────────────────

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

    // ── Mouse move (hover) ───────────────────────────────────────

    function onMouseMove(event) {
        if (window.__poolGameActive) {
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

    // ── Double-click (interact) ──────────────────────────────────

    function onClick(event) {
        // Close any open panel first
        if (panelOpen) {
            document.querySelectorAll('.info-panel').forEach(p => p.classList.add('hidden'));
            panelOpen = false;
            if (cameraManager && cameraManager.controls) cameraManager.controls.enabled = true;
        }

        getMouseCoords(event);
        raycaster.setFromCamera(mouse, camera);

        // Pool game active: outside click stops game
        if (window.__poolGameActive) {
            const meshes = collectInteractiveMeshes();
            const hits = raycaster.intersectObjects(meshes, true);
            if (hits.length > 0) {
                const rootName = hits[0].object.userData.rootName || hits[0].object.userData.type;
                const isPoolObject = rootName === 'pool_table' ||
                                     rootName === 'pool_table_MeshCollision' ||
                                     rootName === 'poolBall' ||
                                     rootName === 'poolCue';
                if (!isPoolObject) {
                    try { stopPoolGame(); } catch (e) { console.error(e); }
                    window.__poolGameActive = false;
                }
            }
            return;
        }

        const interactiveMeshes = collectInteractiveMeshes();
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);
        if (intersects.length === 0) return;

        const hit = intersects[0].object;
        const original = hit.userData.originalModel || null;
        const targetModel = original || hit;
        const rootName = hit.userData.rootName || hit.userData.type || (original && original.userData && original.userData.type);

        const cfg = (rootName && interactionsConfig[rootName]) ? interactionsConfig[rootName] : null;

        if (cfg) {
            if (cfg.panel) {
                uiManager.showPanel(cfg.panel);
                panelOpen = true;
            }

            // skipCamera: let the callback manage its own camera (e.g. pool game)
            if (!cfg.skipCamera) {
                if (rootName === 'computer') {
                    cameraManager.goToView('computerView', 1000);
                } else {
                    cameraManager.goTo(targetModel, 1000);
                }
            }

            if (typeof cfg.callback === 'function') {
                try {
                    cfg.callback({ hit, root: targetModel, uiManager, cameraManager, interactiveObjects, renderer, camera });
                } catch (e) {
                    console.error('interactions: callback error', e);
                }
            }
        } else {
            console.warn(`interactions: no config found for "${rootName}" — add it to interactionsConfig in main.js`);
        }
    }

    // ── Panel / ESC close ────────────────────────────────────────

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.info-panel').forEach(p => p.classList.add('hidden'));
            panelOpen = false;
            if (cameraManager && cameraManager.controls) cameraManager.controls.enabled = true;
        });
    });

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

    // ── Event listeners ──────────────────────────────────────────

    renderer.domElement.addEventListener('dblclick', onClick, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, { passive: true });
}