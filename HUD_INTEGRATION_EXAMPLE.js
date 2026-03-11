// HUD 集成示例
// 将以下代码复制到您的 main.js 中

// ============ 1. 导入HUDManager ============
// 在文件顶部的import语句中添加：
import { HUDManager } from './hudManager.js';

// ============ 2. 全局变量 ============
let hud = null;

// ============ 3. 在initScene函数中创建HUD ============
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

    // >>> 创建HUD <<<
    hud = new HUDManager(camera, renderer);
    // 可选: 初始显示消息
    hud.showMessage('Welcome to Portfolio 3D');

    // ... 其他初始化代码 ...
}

// ============ 4. 在animate函数中更新HUD ============
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // >>> 更新HUD <<<
    if (hud) {
        hud.update(scene);
        
        // 选择要显示的HUD内容：
        hud.showDebugInfo();  // 显示调试信息
        // hud.showCrosshair();  // 显示准星（可选）
        // hud.showRadar(scene, 50, 2);  // 显示雷达（可选）
    }

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

// ============ 5. 在startExperience中隐藏启动消息时清除HUD ============
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
            
            // >>> HUD已准备好 <<<
            if (hud) {
                hud.showMessage('Exploration Started', 2000);
            }
            
            animateCameraToInitialPosition();
        }, 500);
    } else {
        // ... 其他代码 ...
    }
}

// ============ 6. 可选：创建调试切换函数 ============
// 在window对象上添加，便于在浏览器控制台调用
window.toggleHUD = function(mode) {
    if (!hud) return;
    
    switch(mode) {
        case 'debug':
            hud.showDebugInfo();
            break;
        case 'minimap':
            hud.showMinimap(scene);
            break;
        case 'radar':
            hud.showRadar(scene);
            break;
        case 'crosshair':
            hud.showCrosshair();
            break;
        case 'hide':
            hud.hideAll();
            break;
        default:
            console.log('Available modes: debug, minimap, radar, crosshair, hide');
    }
};

// ============ 7. 可选：按键切换HUD ============
window.addEventListener('keydown', (e) => {
    if (!hud) return;
    
    switch(e.key) {
        case 'd': // D键 - 显示调试信息
            hud.showDebugInfo();
            break;
        case 'r': // R键 - 显示雷达
            hud.showRadar(scene);
            break;
        case 'm': // M键 - 显示地图
            hud.showMinimap(scene);
            break;
        case 'h': // H键 - 隐藏HUD
            hud.hideAll();
            break;
    }
});

// ============ 8. 清理 (窗口关闭时) ============
window.addEventListener('beforeunload', () => {
    if (hud) {
        hud.destroy();
    }
});

// ============ 9. 完整的使用场景示例 ============

// 场景1: 仅显示调试信息
function setupDebugHUD() {
    if (hud) {
        hud.showDebugInfo();
    }
}

// 场景2: 显示游戏状态HUD
function setupGameHUD(playerData) {
    if (hud) {
        hud.setTopLeft(`
[PLAYER]
Name: ${playerData.name}
Level: ${playerData.level}
Health: ${playerData.health}/100
        `);
        
        hud.setBottomLeft(`
[INVENTORY]
Weapon: ${playerData.weapon}
Ammo: ${playerData.ammo}
        `);
        
        hud.showRadar(scene);
        hud.showCrosshair();
    }
}

// 场景3: 最小化HUD (仅显示必要信息)
function setupMinimalHUD() {
    if (hud) {
        hud.setTopLeft(`FPS: ${hud.data.fps}`);
        hud.setTopRight(`Objects: ${hud.data.objectCount}`);
        hud.showCrosshair();
    }
}

// 场景4: 展示模式 (无HUD)
function setupPresentationMode() {
    if (hud) {
        hud.hideAll();
    }
}

// ============ 10. 控制台命令参考 ============
/*
在浏览器控制台(F12)中可以使用以下命令：

// 切换HUD显示
toggleHUD('debug')      // 显示调试信息
toggleHUD('radar')      // 显示雷达
toggleHUD('minimap')    // 显示地图
toggleHUD('crosshair')  // 显示准星
toggleHUD('hide')       // 隐藏HUD

// 直接调用HUD方法
hud.showDebugInfo();
hud.showRadar(scene);
hud.showMessage('自定义消息');
hud.setTopLeft('左上内容');

// 查看HUD数据
console.log(hud.data);

// 销毁HUD
hud.destroy();
*/

// ============ 11. 实时更新HUD示例 ============
// 如果需要实时更新信息（如分数、血量等），可以这样：

class GameState {
    constructor() {
        this.score = 0;
        this.health = 100;
        this.time = 0;
    }
    
    update() {
        if (hud) {
            hud.setBottomRight(`
[GAME STATE]
Score: ${this.score}
Health: ${this.health}%
Time: ${this.time}s
            `);
        }
    }
}

const gameState = new GameState();

// 在animate中每帧更新
// gameState.update();

// ============ 12. 完整的main.js修改清单 ============
/*
1. 在import语句处加入:
   import { HUDManager } from './hudManager.js';

2. 声明全局变量:
   let hud = null;

3. 在initScene()最后加入:
   hud = new HUDManager(camera, renderer);

4. 在animate()开始加入:
   if (hud) {
       hud.update(scene);
       hud.showDebugInfo();
   }

5. (可选)添加按键监听器切换HUD显示

6. (可选)在window.toggleHUD中添加控制函数
*/
