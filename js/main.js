import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UIManager } from './uiManager.js';
import { CameraManager } from './cameraManager.js';
import { initInteractions } from './interactions.js';

// Global variables
let scene, camera, renderer, controls, model;
let isSceneLoaded = false;
let isCameraAnimating = false;

// Initialize scene
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.FogExp2(0x111122, 0.02);

    // Camera initial position (will be set in loading animation)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Initial camera position set far away
    camera.position.set(0, 20, 50);
    camera.lookAt(0, 1, 0);

    // Optimize renderer settings
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.toneMappingWhitePoint = 1.0;
    renderer.physicallyCorrectLights = true;
    document.body.appendChild(renderer.domElement);

    // Camera controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 1, 0);
    controls.enabled = false; // Initially disable controls until animation completes

    // Set camera zoom range
    controls.minDistance = 5;
    controls.maxDistance = 15;

    // Set camera movement range limits to 45 degrees
    controls.minAzimuthAngle = -Math.PI / 4; // Left limit (45 degrees)
    controls.maxAzimuthAngle = Math.PI / 4;  // Right limit (45 degrees)

    // Enable mouse middle button drag with fixed position limits
    controls.enablePan = true;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.DOLLY
    };
    
    // Set pan limits to keep camera within scene bounds
    controls.minPan = new THREE.Vector3(-5, 0, -5);
    controls.maxPan = new THREE.Vector3(5, 2, 5);
    
    // Add custom pan constraint to keep target within bounds
    controls.addEventListener('change', () => {
        // Clamp target position to keep it within scene bounds
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -5, 5);
        controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 2);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -5, 5);
    });

    // Optimize lighting settings
    setupLighting();

    // Load model
    loadModel();
}

// Optimize lighting settings
function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Main directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
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

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xb0c4de, 0.6);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0x4455ff, 0.4);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    // Point lights to add scene depth
    const pointLight1 = new THREE.PointLight(0xffaa00, 0.5, 20);
    pointLight1.position.set(5, 3, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00aaff, 0.5, 20);
    pointLight2.position.set(-5, 3, 5);
    scene.add(pointLight2);
}

// Load model
function loadModel() {
    const loader = new GLTFLoader();
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');

    loader.load(
        'assets/models/models_interactive/Non-interactiveModel.glb',
        (gltf) => {
            model = gltf.scene;
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    // Optimize material
                    if (node.material) {
                        node.material.envMapIntensity = 1.0;
                    }
                }
            });
            // Rotate model by 45 degrees
            model.rotation.y = THREE.MathUtils.degToRad(45);
            scene.add(model);
            isSceneLoaded = true;
            console.log('Non-interactiveModel loaded');
        },
        (xhr) => {
            // Update loading progress
            if (xhr.lengthComputable) {
                const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
                if (progressBar && loadingText) {
                    progressBar.style.width = percentComplete + '%';
                    loadingText.textContent = percentComplete + '%';
                }
            }
        },
        (err) => {
            console.error('Error loading Non-interactiveModel:', err);
        }
    );

    // Initialize managers
    const uiManager = new UIManager();
    const cameraManager = new CameraManager(camera, controls);
    const interactiveObjects = {};

    // Initialize interactions
    initInteractions(renderer, camera, scene, interactiveObjects, uiManager, cameraManager);

    // Listen for reset view event
    window.addEventListener('ui:resetView', () => {
        cameraManager.resetView();
    });

    // Listen for window resize event
    window.addEventListener('resize', onWindowResize);

    // Set start button event
    document.getElementById('start-btn').addEventListener('click', startExperience);

    // Start animation loop
    animate();

    console.log('Scene initialized');
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Update camera position info
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

// Start experience
function startExperience() {
    const startScreen = document.getElementById('start-screen');
    const loadingScreen = document.getElementById('loading-screen');

    // Hide start screen
    startScreen.classList.add('hidden');

    // Show loading screen
    loadingScreen.classList.remove('hidden');

    // Simulate loading progress (if model is already loaded)
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');
    
    if (isSceneLoaded) {
        // If scene is already loaded, show 100% directly
        if (progressBar) progressBar.style.width = '100%';
        if (loadingText) loadingText.textContent = '100%';
        
        // Start camera animation after a short delay
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            animateCameraToInitialPosition();
        }, 500);
    } else {
        // Wait for model to finish loading
        const checkLoading = setInterval(() => {
            if (isSceneLoaded) {
                clearInterval(checkLoading);
                
                // Start camera animation after a short delay
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    animateCameraToInitialPosition();
                }, 500);
            }
        }, 100);
    }
}

// Animate camera to initial position
function animateCameraToInitialPosition() {
    if (isCameraAnimating) return;
    isCameraAnimating = true;

    const startPosition = camera.position.clone();
    const endPosition = new THREE.Vector3(0.08, 5.52, 10.66);
    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(0, 1, 0);
    
    const duration = 2000; // Animation duration (milliseconds)
    const startTime = Date.now();

    function updateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smoother animation
        const easedProgress = easeInOutCubic(progress);
        
        // Interpolate camera position and target
        camera.position.lerpVectors(startPosition, endPosition, easedProgress);
        controls.target.lerpVectors(startTarget, endTarget, easedProgress);
        
        if (progress < 1) {
            requestAnimationFrame(updateCamera);
        } else {
            // Animation complete
            isCameraAnimating = false;
            controls.enabled = true; // Enable controls
        }
    }

    updateCamera();
}

// Easing function
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Initialize scene
initScene();

console.log('Scene initialized');
