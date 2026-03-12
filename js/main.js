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
let cameraManager; // Promoted to global scope — needed by animateCameraToInitialPosition
let isSceneLoaded = false;
let isCameraAnimating = false;

// Initialize scene
/**
 * Initializes scene: scene creation, camera setup, renderer config, controls
 */
function initScene() {
    // Create scene with background color and fog
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122); // Set scene background to dark blue
    scene.fog = new THREE.FogExp2(0x111122, 0.02); // Exponential fog for depth

    // Create perspective camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-87.34, 70.41, 89.40); // Set initial camera position
    camera.rotation.set(
        THREE.MathUtils.degToRad(-37.83), // Convert degrees to radians for X rotation
        THREE.MathUtils.degToRad(-37.66), // Convert degrees to radians for Y rotation
        THREE.MathUtils.degToRad(-25.38)  // Convert degrees to radians for Z rotation
    );

    // Create and configure WebGL renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight); // Set renderer size to window dimensions
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio to 2
    renderer.shadowMap.enabled = true; // Enable shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadow map
    renderer.outputEncoding = THREE.sRGBEncoding; // sRGB color encoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // ACES Filmic tone mapping
    renderer.toneMappingExposure = 1.0; // Tone mapping exposure
    renderer.physicallyCorrectLights = false; // Disable physically correct lights
    document.body.appendChild(renderer.domElement); // Append renderer to document body

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

    console.log('Loading models...');

    // Define model list
    const models = [
        { path: './assets/models/models_interactive/interactiveModel.glb', pos: [0, 0, 0], scale: 1, name: 'ground' },
        { path: './assets/models/models_Static/Billiard_cue_oig.glb', pos: [0, 0, 0], scale: 1, name: 'cue' },
        { path: './assets/models/models_Static/computer_case.glb', pos: [0, 0, 0], scale: 1, name: 'computer' },
        { path: './assets/models/models_Static/main_screen.glb', pos: [0, 0, 0], scale: 1, name: 'main_screen' },
        { path: './assets/models/models_Static/Mouse_keyboard.glb', pos: [0, 0, 0], scale: 1, name: 'mouse_keyboard' },
        { path: './assets/models/models_Static/pool_table.glb', pos: [0, 0, 0], scale: 1, name: 'pool_table' },
        { path: './assets/models/models_Static/Red_billiard_ball_oig.glb', pos: [0, 0, 0], scale: 1, name: 'red_ball' },
        { path: './assets/models/models_Static/White_billiard_ball_oig.glb', pos: [0, 0, 0], scale: 1, name: 'white_ball' },
        { path: './assets/models/models_Static/secondary_screen.glb', pos: [0, 0, 0], scale: 1, name: 'secondary_screen' },
        { path: './assets/models/models_Static/Whiteboard.glb', pos: [0, 0, 0], scale: 1, name: 'whiteboard' }
    ];

    console.log(`Preparing to load ${models.length} models`);

    let modelsToLoad = models.length;
    let modelsLoaded = 0;

    const uiManager = new UIManager();
    cameraManager = new CameraManager(camera, controls);
    const desktopScreenManager = new DesktopScreenManager(scene, camera, cameraManager);
    const interactiveObjects = {};

    // Timeout fallback if models load too slowly
    const loadTimeout = setTimeout(() => {
        if (modelsLoaded < modelsToLoad) {
            console.warn('Model load timeout — showing fallback scene');
            showFallbackScene();
        }
    }, 20000); // 20-second timeout

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
            
            // Initialize interaction config after all models are loaded
            const interactionsConfig = {
                computer:         {},
                pool_table:       { callback: () => startPoolGame(renderer, camera, controls, scene, interactiveObjects) },
                main_screen:      {},
                secondary_screen: {
                    callback: () => {
                        document.getElementById('screen-overlay').classList.add('open');
                    }
                },
                whiteboard: {}
            };
            initInteractions(renderer, camera, scene, interactiveObjects, uiManager, cameraManager, interactionsConfig, desktopScreenManager);
            window.addEventListener('ui:resetView', () => cameraManager.resetView());

            // Set preset camera views
            cameraManager.setCustomView(
                'computerView',
                new THREE.Vector3(-5.70, 5.82, 6.55),
                new THREE.Vector3(0, 0.9, 0)
            );

            // Secondary screen view: precisely positioned from real coordinates
            cameraManager.setCustomView(
                'secondaryScreenView',
                new THREE.Vector3(-0.03, 1.46, -1.25),
                new THREE.Vector3(-0.279 + 0.5, 1.148, -2.0 + 0.5)  // canvas offset (+0.5x, +0.5z)
            );
        }
    }

    function showFallbackScene() {
        clearTimeout(loadTimeout);
        isSceneLoaded = true;
        console.log('Showing fallback scene');

        // Create simple fallback geometry
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0.5, 0);
        cube.userData.interactive = true;
        cube.userData.type = 'fallback_cube';
        scene.add(cube);

        // Add ground plane
        const groundGeo = new THREE.PlaneGeometry(10, 10);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        scene.add(ground);

        // Initialize basic interactions
        const interactionsConfig = {
            fallback_cube: { panel: 'panel-computer' } // Reuse panel
        };
        initInteractions(renderer, camera, scene, { fallback_cube: cube }, uiManager, cameraManager, interactionsConfig, desktopScreenManager);

        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.classList.add('hidden');

        // Set camera
        cameraManager.jumpToView(
            { x: 2, y: 2, z: 2 },
            { x: -30, y: 45, z: 0 },
            new THREE.Vector3(0, 0.5, 0)
        );
    }

    models.forEach((m) => {
        console.log(`Loading model: ${m.name} (${m.path})`);
        loader.load(
            m.path,
            (gltf) => {
                console.log(`Model loaded: ${m.name}`);
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

                // Secondary screen: attach only once to the first mesh
                if (m.name === 'secondary_screen') {
                    let attached = false;
                    mdl.traverse((child) => {
                        if (child.isMesh && !attached) {
                            desktopScreenManager.createDesktopScreen(child, desktopIcons);
                            attached = true;
                        }
                    });
                }

                // Pool table: fix materials and create invisible collision plane
                if (m.name === 'pool_table') {
                    // Fix pool table material
                    mdl.traverse((node) => {
                        if (node.isMesh && node.material) {
                            const mats = Array.isArray(node.material) ? node.material : [node.material];
                            mats.forEach(mat => {
                                if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                                    mat.roughness  = 0.75;
                                    mat.metalness  = 0.05;
                                    mat.envMapIntensity = 0.4;
                                    mat.needsUpdate = true;
                                }
                            });
                        }
                    });

                    const planeGeo = new THREE.PlaneGeometry(2.0, 1.5);
                    const planeMat = new THREE.MeshBasicMaterial({
                        color: 0x00ff00,
                        transparent: true,
                        opacity: 0.0, // Set to 0.35 to debug
                        side: THREE.DoubleSide
                    });
                    const plane = new THREE.Mesh(planeGeo, planeMat);
                    // Place plane slightly above table surface (adjust Y as needed)
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
                console.error(`Failed to load model: ${m.name} (${m.path})`, err.message || err);
                onEachLoaded(); // Always count regardless of success/failure to prevent stuck progress
            }
        );
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    // Pool game manages its own camera — skip OrbitControls to prevent damping override
    if (!window.__poolGameActive) {
        controls.update();
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
            // Record home position after animation ends so Reset View returns here
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
animate();
const startBtn = document.getElementById('start-btn');
if (startBtn) startBtn.addEventListener('click', startExperience);