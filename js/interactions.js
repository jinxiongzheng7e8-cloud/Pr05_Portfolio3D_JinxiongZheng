import * as THREE from 'three';
import { startPoolGame, stopPoolGame } from './poolGame.js';

export function initInteractions(renderer, camera, scene, interactiveObjects, uiManager, cameraManager, interactionsConfig = {}) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let panelOpen = false;
    // 防止重复初始化
    if (renderer.domElement.__interactionsInit) return;
    renderer.domElement.__interactionsInit = true;

    function collectInteractiveMeshes() {
        const meshes = [];
        scene.traverse(node => {
            if (node.isMesh && node.userData && node.userData.interactive) {
                meshes.push(node);
                console.debug('collectInteractiveMeshes found:', node.name, node.userData.type);
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
        console.debug('interactions:onClick', {clientX: event.clientX, clientY: event.clientY});
        // If a panel is open, close it first so clicks still work
        if (panelOpen) {
            document.querySelectorAll('.info-panel').forEach(p => p.classList.add('hidden'));
            panelOpen = false;
            if (cameraManager && cameraManager.controls) cameraManager.controls.enabled = true;
        }

        getMouseCoords(event);
        raycaster.setFromCamera(mouse, camera);

        // 如果台球小游戏正在运行，点击非台面区域时停止游戏
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

        // 确定根模型名称（优先使用碰撞体关联的 originalModel）
        let original = hit.userData.originalModel || null;
        let targetModel = original || hit;
        let rootName = hit.userData.rootName || hit.userData.type || (original && original.userData && original.userData.type);

        const cfg = (rootName && interactionsConfig[rootName]) ? interactionsConfig[rootName] : null;

        if (cfg) {
            if (cfg.panel) {
                uiManager.showPanel(cfg.panel);
                panelOpen = true;
            }
            cameraManager.goTo(targetModel, 1000);
            if (typeof cfg.callback === 'function') {
                try {
                    cfg.callback({ hit, root: targetModel, uiManager, cameraManager, interactiveObjects, renderer, camera });
                } catch (e) {
                    console.error('interactions: callback error', e);
                }
            }
        } else {
            const t = hit.userData.type || (original && original.userData && original.userData.type);
            switch (t) {
                case 'computer':
                case 'gpu':
                    uiManager.showPanel('panel-computer');
                    cameraManager.goTo(targetModel, 1000);
                    panelOpen = true;
                    break;
                case 'pool':
                    uiManager.showPanel('panel-billar');
                    cameraManager.goTo(targetModel, 1000);
                    panelOpen = true;
                    break;
                case 'main_screen':
                    uiManager.showPanel('panel-main-screen');
                    cameraManager.goTo(targetModel, 1000);
                    panelOpen = true;
                    break;
                case 'secondary_screen':
                    uiManager.showPanel('panel-secondary');
                    cameraManager.goTo(targetModel, 1000);
                    panelOpen = true;
                    break;
                case 'blackboard':
                    uiManager.showPanel('panel-blackboard');
                    cameraManager.goTo(targetModel, 1000);
                    panelOpen = true;
                    break;
                default:
                    break;
            }
        }

        // 显示坐标弹出框（调试用）
        createCoordPopup(hitPoint);
    }

    // 悬停高亮
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

    // 关闭面板按钮
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.info-panel').forEach(p => p.classList.add('hidden'));
            panelOpen = false;
            if (cameraManager && cameraManager.controls) cameraManager.controls.enabled = true;
        });
    });

    // ESC 关闭面板
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

    renderer.domElement.addEventListener('click', onClick, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, {passive: true});

    // 坐标弹出框（调试用）
    let _coordPopup = null;
    function createCoordPopup(worldPos) {
        if (_coordPopup) _coordPopup.remove();
        const rect = renderer.domElement.getBoundingClientRect();
        const vector = worldPos.clone().project(camera);
        const x = (vector.x + 1) / 2 * rect.width + rect.left;
        const y = (-vector.y + 1) / 2 * rect.height + rect.top;

        const div = document.createElement('div');
        div.className = 'coord-popup';
        const coordsText = `X: ${worldPos.x.toFixed(3)} Y: ${worldPos.y.toFixed(3)} Z: ${worldPos.z.toFixed(3)}`;
        div.innerHTML = `
            <div class="coord-header">Coordinates <button class="coord-close">✕</button></div>
            <div class="coord-body">${coordsText}</div>
            <div class="coord-actions"><button class="coord-copy">Copy</button></div>
        `;
        div.style.position = 'absolute';
        div.style.left = `${Math.round(x)}px`;
        div.style.top = `${Math.round(y)}px`;
        div.style.transform = 'translate(-50%, -110%)';
        document.body.appendChild(div);
        _coordPopup = div;

        div.querySelector('.coord-close').addEventListener('click', () => {
            div.remove();
            _coordPopup = null;
        });

        div.querySelector('.coord-copy').addEventListener('click', async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(coordsText);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = coordsText;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                }
                const b = div.querySelector('.coord-copy');
                const orig = b.textContent;
                b.textContent = 'Copied!';
                setTimeout(() => b.textContent = orig, 1200);
            } catch (e) {
                console.error('Copy failed', e);
            }
        });

        const updatePos = () => {
            if (!document.body.contains(div)) return;
            const vec = worldPos.clone().project(camera);
            const nx = (vec.x + 1) / 2 * rect.width + rect.left;
            const ny = (-vec.y + 1) / 2 * rect.height + rect.top;
            div.style.left = `${Math.round(nx)}px`;
            div.style.top = `${Math.round(ny)}px`;
        };

        let rafId = null;
        function rafLoop() {
            if (!document.body.contains(div)) {
                if (rafId) cancelAnimationFrame(rafId);
                return;
            }
            updatePos();
            rafId = requestAnimationFrame(rafLoop);
        }
        rafLoop();
    }
}
