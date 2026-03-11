// 通用整合示例代码片段
// 基于 SYSTEM_INTEGRATION_GUIDE.md 中的整合说明

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UIManager } from './uiManager.js';
import { CameraManager } from './cameraManager.js';
import { CanvasScreenManager } from './canvasScreenManager.js';
import { HUDManager } from './hudManager.js';
import { initInteractions } from './interactions.js';
import { startPoolGame, stopPoolGame } from './poolGame.js';

let scene, camera, renderer, controls;
let cameraManager, uiManager, hud, screenManager;
let interactiveObjects = {};
let isSceneLoaded = false;

// 初始化场景
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.FogExp2(0x111122, 0.02);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-87.34, 70.41, 89.40);
    camera.lookAt(0, 1, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // rendering improvements
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = false;

    document.body.appendChild(renderer.domElement);

    // 如果主视频加载失败，隐藏相关面板
    const mainVideo = document.getElementById('main-video');
    if (mainVideo) {
        mainVideo.addEventListener('error', () => {
            console.warn('主视频加载失败 —— 隐藏 panel-main-screen');
            const panel = document.getElementById('panel-main-screen');
            if (panel) panel.classList.add('hidden');
        });
    }

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1, 0);
    controls.enabled = false;
    controls.enablePan = true;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.DOLLY
    };

    setupLighting();
    initManagers();
    loadModels();
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.4);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.bias = -0.0001;
    dirLight.shadow.radius = 2;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xb0c4de, 0.8);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x4455ff, 0.6);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    const pointLight1 = new THREE.PointLight(0xffaa00, 0.6, 20);
    pointLight1.position.set(5, 3, 5);
    pointLight1.name = 'pointLight1';
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00aaff, 0.6, 20);
    pointLight2.position.set(-5, 3, 5);
    pointLight2.name = 'pointLight2';
    scene.add(pointLight2);
}

function initManagers() {
    cameraManager = new CameraManager(camera, controls);
    cameraManager.home = { position: camera.position.clone(), target: controls.target.clone() };

    uiManager = new UIManager();
    hud = new HUDManager(camera, renderer);
    screenManager = new CanvasScreenManager(scene, camera, cameraManager);
}

function loadModels() {
    const loader = new GLTFLoader();
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');

    // 模型列表，设置 collider: true 的会生成隐形碰撞体
    const models = [
        { path: 'assets/models/models_interactive/interactiveModel.glb', pos: [0, 0, 0], scale: 1, name: 'ground' },
        { path: 'assets/models/models_Static/Billiard_cue.glb', pos: [0, 0, 0], scale: 1, name: 'cue' },
        { path: 'assets/models/models_Static/computer_case.glb', pos: [0, 0, 0], scale: 1, name: 'computer', collider: true },
        { path: 'assets/models/models_Static/main_screen.glb', pos: [0, 0, 0], scale: 1, name: 'main_screen', collider: true },
        { path: 'assets/models/models_Static/Mouse_keyboard.glb', pos: [0, 0, 0], scale: 1, name: 'mouse_keyboard' },
        { path: 'assets/models/models_Static/pool_table.glb', pos: [0, 0, 0], scale: 1, name: 'pool_table', collider: true },
        { path: 'assets/models/models_Static/Red_billiard_ball.glb', pos: [0, 0, 0], scale: 1, name: 'red_ball' },
        { path: 'assets/models/models_Static/White_billiard_ball.glb', pos: [0, 0, 0], scale: 1, name: 'white_ball' },
        { path: 'assets/models/models_Static/secondary_screen.glb', pos: [0, 0, 0], scale: 1, name: 'secondary_screen', collider: true },
        { path: 'assets/models/models_Static/Whiteboard.glb', pos: [0, 0, 0], scale: 1, name: 'whiteboard', collider: true }
    ];

    let modelsToLoad = models.length;
    let modelsLoaded = 0;

    function onEachLoaded() {
        modelsLoaded++;
        if (progressBar && loadingText) {
            const pct = Math.round((modelsLoaded / modelsToLoad) * 100);
            progressBar.style.width = pct + '%';
            loadingText.textContent = pct + '%';
        }
        if (modelsLoaded >= modelsToLoad) {
            isSceneLoaded = true;
            onAllModelsLoaded();
        }
    }

    models.forEach((m) => {
        loader.load(
            m.path,
            (gltf) => {
                const mdl = gltf.scene;
                if (m.pos) mdl.position.set(m.pos[0], m.pos[1], m.pos[2]);
                if (m.scale) mdl.scale.set(m.scale, m.scale, m.scale);
                if (m.rot) mdl.rotation.set(m.rot[0], m.rot[1], m.rot[2]);

                scene.add(mdl);
                if (m.collider) addColliderForModel(mdl, m.name);
                interactiveObjects[m.name] = mdl;
                onEachLoaded();
            },
            undefined,
            (err) => {
                console.error('model load error', m.path, err);
                onEachLoaded();
            }
        );
    });
}

// 为模型快速生成不可见碰撞盒
function addColliderForModel(model, rootName) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    if (size.length() === 0) return null;

    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mat = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(center);
    mesh.userData = {
        type: rootName,
        interactive: true,
        rootName: rootName,
        originalModel: model
    };
    scene.add(mesh);
    return mesh;
}

function onAllModelsLoaded() {
    isSceneLoaded = true;

    // initialize interactive screen and interactions
    screenManager.createScreen({ x: 2, y: 1.5, z: 0 }, { width: 4, height: 3 });
    const interactionsConfig = {
        computer: { panel: 'panel-computer' },
        pool_table: { panel: 'panel-billar', callback: () => startPoolGame(renderer, camera, controls, scene, interactiveObjects) },
        screen: { panel: 'panel-main-screen', callback: () => screenManager.goToScreen() }
    };
    initInteractions(renderer, camera, scene, interactiveObjects, uiManager, cameraManager, interactionsConfig, screenManager);

    // install UI reset event
    window.addEventListener('ui:resetView', () => cameraManager.resetView());

    cameraManager.setCustomView({ x: -0.13, y: 1.38, z: -1.39 }, { x: -1.94, y: 7.76, z: 0.26 }, new THREE.Vector3(0,0.9,0));
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    hud.update(scene);
    hud.showDebugInfo();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

initScene();
