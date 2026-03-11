import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UIManager } from './uiManager.js';
import { CameraManager } from './cameraManager.js';
import { initInteractions } from './interactions.js';
import { startPoolGame, stopPoolGame } from './poolGame.js';
import { DesktopScreenManager } from './DesktopScreenManager_new.js';
import { desktopIcons } from './screenConfig.js';

// Global variables
let scene, camera, renderer, controls, model;
let cameraManager; // 提升为全局，animateCameraToInitialPosition 需要访问
let isSceneLoaded = false;
let isCameraAnimating = false;

// Initialize scene
/**
 * 初始化场景，包括场景创建、相机设置、渲染器配置、控制器设置等
 */
function initScene() {
    // 创建场景并设置背景色和雾效
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122); // 设置场景背景色为深蓝色
    scene.fog = new THREE.FogExp2(0x111122, 0.02); // 设置指数雾效，增强场景深度感

    // 创建透视相机并设置位置和旋转角度
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-87.34, 70.41, 89.40); // 设置相机位置
    camera.rotation.set(
        THREE.MathUtils.degToRad(-37.83), // 将角度转换为弧度设置相机X轴旋转
        THREE.MathUtils.degToRad(-37.66), // 将角度转换为弧度设置相机Y轴旋转
        THREE.MathUtils.degToRad(-25.38)  // 将角度转换为弧度设置相机Z轴旋转
    );

    // 创建WebGL渲染器并配置参数
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器尺寸为窗口大小
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 设置像素比率，限制最大为2
    renderer.shadowMap.enabled = true; // 启用阴影
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 设置阴影类型为软阴影
    renderer.outputEncoding = THREE.sRGBEncoding; // 设置颜色编码为sRGB
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // 设置色调映射为ACES Filmic
    renderer.toneMappingExposure = 1.0; // 设置色调映射曝光度
    renderer.physicallyCorrectLights = false; // 禁用物理正确光照
    document.body.appendChild(renderer.domElement); // 将渲染器的DOM元素添加到页面

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

    console.log('开始加载模型...');

    // 定义模型列表
    const models = [
        { path: './assets/models/models_interactive/interactiveModel.glb', pos: [0, 0, 0], scale: 1, name: 'ground' },
        { path: './assets/models/models_Static/Billiard_cue.glb', pos: [0, 0, 0], scale: 1, name: 'cue' },
        { path: './assets/models/models_Static/computer_case.glb', pos: [0, 0, 0], scale: 1, name: 'computer' },
        { path: './assets/models/models_Static/main_screen.glb', pos: [0, 0, 0], scale: 1, name: 'main_screen' },
        { path: './assets/models/models_Static/Mouse_keyboard.glb', pos: [0, 0, 0], scale: 1, name: 'mouse_keyboard' },
        { path: './assets/models/models_Static/pool_table.glb', pos: [0, 0, 0], scale: 1, name: 'pool_table' },
        { path: './assets/models/models_Static/Red_billiard_ball.glb', pos: [0, 0, 0], scale: 1, name: 'red_ball' },
        { path: './assets/models/models_Static/White_billiard_ball.glb', pos: [0, 0, 0], scale: 1, name: 'white_ball' },
        { path: './assets/models/models_Static/secondary_screen.glb', pos: [0, 0, 0], scale: 1, name: 'secondary_screen' },
        { path: './assets/models/models_Static/Whiteboard.glb', pos: [0, 0, 0], scale: 1, name: 'whiteboard' }
    ];

    console.log(`准备加载 ${models.length} 个模型`);

    let modelsToLoad = models.length;
    let modelsLoaded = 0;

    const uiManager = new UIManager();
    cameraManager = new CameraManager(camera, controls);
    const desktopScreenManager = new DesktopScreenManager(scene, camera, cameraManager);
    const interactiveObjects = {};

    // 添加超时，如果模型加载太慢，显示fallback场景
    const loadTimeout = setTimeout(() => {
        if (modelsLoaded < modelsToLoad) {
            console.warn('模型加载超时.显示fallback场景');
            showFallbackScene();
        }
    }, 20000); // 20秒超时

    function onEachLoaded() {
        modelsLoaded++;
        if (progressBar && loadingText) {
            const pct = Math.round((modelsLoaded / modelsToLoad) * 100);
            progressBar.style.width = pct + '%';
            loadingText.textContent = pct + '%';
        }

        if (modelsLoaded >= modelsToLoad) {
            clearTimeout(loadTimeout);
            isSceneLoaded = true;
            console.log('All models loaded');
            
            // 初始化桌面屏幕（当相应模型加载完毕时会调用）
            const interactionsConfig = {
                computer:         {},
                pool_table:       { callback: () => startPoolGame(renderer, camera, controls, scene, interactiveObjects) },
                main_screen:      {},
                secondary_screen: {
                    callback: ({ cameraManager }) => {
                        cameraManager.goToView('secondaryScreenView', 1200, () => {
                            document.getElementById('screen-overlay').classList.add('open');
                        });
                    }
                },
                whiteboard: {}
            };
            initInteractions(renderer, camera, scene, interactiveObjects, uiManager, cameraManager, interactionsConfig, desktopScreenManager);
            window.addEventListener('ui:resetView', () => cameraManager.resetView());


            // 示例：设置一个预设视角
            cameraManager.setCustomView(
                'computerView',
                new THREE.Vector3(-5.70, 5.82, 6.55),
                new THREE.Vector3(0, 0.9, 0)
            );

            // 副显示屏视角：根据实际坐标精确定位
            cameraManager.setCustomView(
                'secondaryScreenView',
                new THREE.Vector3(-0.10, 1.41, -1.31),
                new THREE.Vector3(-0.279, 1.148, -2.0)  // 屏幕中心
            );

        }
    }

    function showFallbackScene() {
        clearTimeout(loadTimeout);
        isSceneLoaded = true;
        console.log('显示fallback场景');

        // 创建简单的几何体作为fallback
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0.5, 0);
        cube.userData.interactive = true;
        cube.userData.type = 'fallback_cube';
        scene.add(cube);

        // 添加地面
        const groundGeo = new THREE.PlaneGeometry(10, 10);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        scene.add(ground);

        // 初始化基本交互
        const interactionsConfig = {
            fallback_cube: { panel: 'panel-computer' } // 复用面板
        };
        initInteractions(renderer, camera, scene, { fallback_cube: cube }, uiManager, cameraManager, interactionsConfig, desktopScreenManager);

        // 隐藏加载屏幕
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.classList.add('hidden');

        // 设置相机
        cameraManager.jumpToView(
            { x: 2, y: 2, z: 2 },
            { x: -30, y: 45, z: 0 },
            new THREE.Vector3(0, 0.5, 0)
        );
    }

    models.forEach((m) => {
        console.log(`正在加载模型: ${m.name} (${m.path})`);
        loader.load(
            m.path,
            (gltf) => {
                console.log(`成功加载模型: ${m.name}`);
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

                // 副显示屏：只附加一次到第一个 Mesh
                if (m.name === 'secondary_screen') {
                    let attached = false;
                    mdl.traverse((child) => {
                        if (child.isMesh && !attached) {
                            desktopScreenManager.createDesktopScreen(child, desktopIcons);
                            attached = true;
                        }
                    });
                }

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

                onEachLoaded();
            },
            undefined,
            (err) => {
                console.error(`加载模型失败: ${m.name} (${m.path})`, err.message || err);
                if (!isSceneLoaded) {
                    showFallbackScene();
                }
                onEachLoaded(); // 无论成败都计数，防止进度条卡死
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
    // 台球游戏运行时由 poolGame 自己管理相机，跳过 OrbitControls update 防止阻尼覆盖
    if (!window.__poolGameActive) {
        controls.update();
    }

    const cameraX = document.getElementById('camera-x');
    const cameraY = document.getElementById('camera-y');
    const cameraZ = document.getElementById('camera-z');
    if (cameraX && cameraY && cameraZ) {
        cameraX.textContent = `X: ${camera.position.x.toFixed(2)}`;
        cameraY.textContent = `Y: ${camera.position.y.toFixed(2)}`;
        cameraZ.textContent = `Z: ${camera.position.z.toFixed(2)}`;
    }

    const cameraRotX = document.getElementById('camera-rot-x');
    const cameraRotY = document.getElementById('camera-rot-y');
    const cameraRotZ = document.getElementById('camera-rot-z');
    if (cameraRotX && cameraRotY && cameraRotZ) {
        // 用相机实际朝向向量计算准确的 pitch / yaw，而不是读 Euler 角
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        const pitch = Math.asin(-dir.y) * 180 / Math.PI;               // 俯仰角
        const yaw   = Math.atan2(-dir.x, -dir.z) * 180 / Math.PI;     // 水平朝向
        const roll  = (camera.rotation.z * 180 / Math.PI);             // 横滚角（通常为0）
        cameraRotX.textContent = `Pitch: ${pitch.toFixed(1)}°`;
        cameraRotY.textContent = `Yaw: ${yaw.toFixed(1)}°`;
        cameraRotZ.textContent = `Roll: ${roll.toFixed(1)}°`;
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
            // 动画结束后才记录 home，Reset View 回到这个视角
            cameraManager.home.position.copy(endPosition);
            cameraManager.home.target.copy(endTarget);
        }
    }
    updateCamera();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

initScene();
console.log('Scene initialized');
animate(); // 启动动画循环（只调用一次）
const startBtn = document.getElementById('start-btn');
if (startBtn) startBtn.addEventListener('click', startExperience);

// Reset View 按钮事件监听
const resetViewBtn = document.getElementById('reset-view-btn');
if (resetViewBtn) {
    resetViewBtn.addEventListener('click', () => {
        if (cameraManager) {
            cameraManager.resetView();
        }
    });
}
