import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UIManager } from './uiManager.js';
import { CameraManager } from './cameraManager.js';
import { initInteractions } from './interactions.js';
import { startPoolGame, stopPoolGame } from './poolGame.js';

// Global variables
let scene, camera, renderer, controls, model;
let isSceneLoaded = false;
let isCameraAnimating = false;

// Initialize scene
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.FogExp2(0x111122, 0.02);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 50);
    camera.lookAt(0, 1, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = false;
    document.body.appendChild(renderer.domElement);

    // Hide main video panel if video fails to load
    const mainVideo = document.getElementById('main-video');
    if (mainVideo) {
        mainVideo.addEventListener('error', () => {
            console.warn('Main video failed to load — hiding panel-main-screen');
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
    loadModel();
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

function loadModel() {
    const loader = new GLTFLoader();
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');

    // 定义模型列表，为需要交互的模型设置 collider: true
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

    const uiManager = new UIManager();
    const cameraManager = new CameraManager(camera, controls);
    const interactiveObjects = {};

    function onEachLoaded() {
        modelsLoaded++;
        if (progressBar && loadingText) {
            const pct = Math.round((modelsLoaded / modelsToLoad) * 100);
            progressBar.style.width = pct + '%';
            loadingText.textContent = pct + '%';
        }

        if (modelsLoaded >= modelsToLoad) {
            isSceneLoaded = true;
            console.log('All models loaded');
            const interactionsConfig = {
                computer: { panel: 'panel-computer' },
                pool_table: { panel: 'panel-billar', callback: () => startPoolGame(renderer, camera, controls, scene, interactiveObjects) },
                main_screen: { panel: 'panel-main-screen' },
                secondary_screen: { panel: 'panel-secondary' },
                whiteboard: { panel: 'panel-blackboard' }
            };
            initInteractions(renderer, camera, scene, interactiveObjects, uiManager, cameraManager, interactionsConfig);
            window.addEventListener('ui:resetView', () => cameraManager.resetView());
        }
    }

    // 辅助函数：为模型创建不可见碰撞体
    function addColliderForModel(model, rootName) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        if (size.length() === 0) return null;

        const colliderGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
        const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
        const colliderMesh = new THREE.Mesh(colliderGeo, colliderMat);
        colliderMesh.position.copy(center);

        colliderMesh.userData = {
            type: rootName,
            interactive: true,
            rootName: rootName,
            originalModel: model
        };

        scene.add(colliderMesh);
        return colliderMesh;
    }

    models.forEach((m) => {
        loader.load(
            m.path,
            (gltf) => {
                const mdl = gltf.scene;
                if (m.pos) mdl.position.set(m.pos[0], m.pos[1], m.pos[2]);
                if (m.scale) mdl.scale.set(m.scale, m.scale, m.scale);
                if (m.rot) mdl.rotation.set(m.rot[0], m.rot[1], m.rot[2]);

                // Tag meshes so interactions can find them (set rootName/type/interactive)
                mdl.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        if (!node.userData) node.userData = {};
                        node.userData.rootName = m.name;
                        // mark interactive unless this is the ground model
                        node.userData.interactive = m.name !== 'ground';
                        // set a simple type mapping used by interactions
                        const nameTypeMap = {
                            computer: 'computer',
                            pool_table: 'pool',
                            main_screen: 'main_screen',
                            secondary_screen: 'secondary_screen',
                            whiteboard: 'blackboard',
                            red_ball: 'poolBall',
                            white_ball: 'poolBall',
                            cue: 'poolCue',
                            mouse_keyboard: 'peripheral',
                            ground: 'ground'
                        };
                        node.userData.type = nameTypeMap[m.name] || m.name;
                    }
                });

                scene.add(mdl);
                interactiveObjects[m.name] = mdl;

                // 如果这是台球桌，为桌面创建一个透明平面作为精确点击触发器
                if (m.name === 'pool_table') {
                    // 根据模型实际尺寸调整 PlaneGeometry 的宽高
                    const planeGeo = new THREE.PlaneGeometry(2.0, 1.5);
                    const planeMat = new THREE.MeshBasicMaterial({
                        color: 0x00ff00,
                        transparent: true,
                        opacity: 0.0, // 调试时可设为 0.5
                        side: THREE.DoubleSide
                    });
                    const plane = new THREE.Mesh(planeGeo, planeMat);
                    // 将平面略微置于台面之上（根据模型调整 Y 值，例如 0.85）
                    plane.position.set(m.pos ? m.pos[0] : 0, 0.85, m.pos ? m.pos[2] : 0);
                    plane.rotation.x = -Math.PI / 2;
                    plane.name = 'pool_table_plane';
                    plane.userData = {
                        type: 'pool_table',
                        interactive: true,
                        rootName: 'pool_table',
                        originalModel: mdl
                    };
                    scene.add(plane);
                    if (!interactiveObjects.colliders) interactiveObjects.colliders = {};
                    interactiveObjects.colliders.pool_table_plane = plane;
                }

                if (m.collider) {
                    const collider = addColliderForModel(mdl, m.name);
                    if (collider) {
                        if (!interactiveObjects.colliders) interactiveObjects.colliders = {};
                        interactiveObjects.colliders[m.name] = collider;
                    }
                }

                onEachLoaded();
            },
            undefined,
            (err) => {
                console.error('Error loading', m.path, err);
                onEachLoaded();
            }
        );
    });
}

// 窗口大小自适应
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const cameraX = document.getElementById('camera-x');
    const cameraY = document.getElementById('camera-y');
    const cameraZ = document.getElementById('camera-z');
    if (cameraX && cameraY && cameraZ) {
        cameraX.textContent = `X: ${camera.position.x.toFixed(2)}`;
        cameraY.textContent = `Y: ${camera.position.y.toFixed(2)}`;
        cameraZ.textContent = `Z: ${camera.position.z.toFixed(2)}`;
    }

    renderer.render(scene, camera);
}

function startExperience() {
    const startScreen = document.getElementById('start-screen');
    const loadingScreen = document.getElementById('loading-screen');
    startScreen.classList.add('hidden');
    loadingScreen.classList.remove('hidden');

    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');

    if (isSceneLoaded) {
        if (progressBar) progressBar.style.width = '100%';
        if (loadingText) loadingText.textContent = '100%';
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            animateCameraToInitialPosition();
        }, 500);
    } else {
        const checkLoading = setInterval(() => {
            if (isSceneLoaded) {
                clearInterval(checkLoading);
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    animateCameraToInitialPosition();
                }, 500);
            }
        }, 100);
    }
}

function animateCameraToInitialPosition() {
    if (isCameraAnimating) return;
    isCameraAnimating = true;

    const startPosition = camera.position.clone();
    const endPosition = new THREE.Vector3(0.08, 5.52, 10.66);
    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(0, 1, 0);

    const duration = 2000;
    const startTime = Date.now();

    function updateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        camera.position.lerpVectors(startPosition, endPosition, easedProgress);
        controls.target.lerpVectors(startTarget, endTarget, easedProgress);

        if (progress < 1) {
            requestAnimationFrame(updateCamera);
        } else {
            isCameraAnimating = false;
            controls.enabled = true;
        }
    }
    updateCamera();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

initScene();
console.log('Scene initialized');
const startBtn = document.getElementById('start-btn');
if (startBtn) startBtn.addEventListener('click', startExperience);
animate();
