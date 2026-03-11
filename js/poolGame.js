import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════
//  CONSTANTS  ← 按模型微调
// ═══════════════════════════════════════════════════════════
const BALL_Y      = 1.228;   // 球心高度（可调）
const BALL_R      = 0.058;  // 球半径（可调）
const FRICTION    = 0.982;  // 每帧速度衰减 (<1)
const RESTITUTION = 0.78;   // 边界反弹系数
const MAX_POWER   = 8.5;    // 最大冲量
const POWER_RATE  = 5.5;    // 每秒充能速率
const CUE_LEN     = 1.55;   // 杆长（视觉）

// 桌面边界（由口袋位置推算，可微调）
const TX_MIN = -3.08, TX_MAX = -0.65;
const TZ_MIN =  0.72, TZ_MAX =  2.03;
const TABLE_CENTER = new THREE.Vector3(
    -1.957, BALL_Y, 1.149
);

// 相机俯视位置（固定）
const CAM_POS    = new THREE.Vector3(-1.87, 3.16, 1.39);
const CAM_TARGET = TABLE_CENTER.clone();

// 六个口袋
const POCKET_R = 0.13;
const POCKETS  = [
    [-3.067, 0.759], [-1.864, 0.725], [-0.702, 0.729],
    [-3.065, 2.012], [-1.854, 2.021], [-0.719, 1.925],
].map(([x, z]) => new THREE.Vector3(x, BALL_Y, z));

// 初始位置
const WHITE_START = new THREE.Vector3(-2.55, BALL_Y, TABLE_CENTER.z);
const RACK_X      = -1.15;
const RACK_Z      = TABLE_CENTER.z;

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════
let S = null;

// ═══════════════════════════════════════════════════════════
//  HTML UI
// ═══════════════════════════════════════════════════════════
function buildUI() {
    const bar = document.createElement('div');
    bar.id = 'pool-power-bar';
    bar.innerHTML = `
        <div style="font-size:11px;font-weight:bold;letter-spacing:1px;">POWER</div>
        <div id="pool-bar-track" style="width:22px;height:160px;background:rgba(0,0,0,.65);
            border:2px solid rgba(255,255,255,.35);border-radius:4px;
            overflow:hidden;display:flex;flex-direction:column-reverse;">
            <div id="pool-bar-fill" style="width:100%;height:0%;
                background:linear-gradient(0deg,#00e676,#ffee58,#ff1744);
                transition:height .04s;"></div>
        </div>
        <div id="pool-power-pct" style="font-size:11px;font-weight:bold;">0%</div>`;
    Object.assign(bar.style, {
        position:'fixed', right:'22px', top:'50%', transform:'translateY(-50%)',
        display:'flex', flexDirection:'column', alignItems:'center', gap:'5px',
        zIndex:'60', opacity:'0', transition:'opacity .25s', pointerEvents:'none',
        fontFamily:"'Courier New',monospace", color:'#fff', textShadow:'0 1px 4px #000',
    });
    document.body.appendChild(bar);

    const info = document.createElement('div');
    info.id = 'pool-info';
    info.innerHTML = `
        <div id="pool-score-txt">🎱 Score: <b>0</b></div>
        <div id="pool-hint-txt" style="font-size:12px;opacity:.75;margin-top:3px;">
            移动鼠标瞄准 · 按住充能 · 松开击球</div>
        <button id="pool-exit-btn" style="
            margin-top:8px;padding:5px 18px;
            background:rgba(255,255,255,0.12);color:#fff;
            border:1px solid rgba(255,255,255,0.3);border-radius:6px;
            font-size:12px;cursor:pointer;font-family:inherit;
            transition:background .15s;
            pointer-events:auto;">✕ 退出游戏</button>`;
    Object.assign(info.style, {
        position:'fixed', top:'72px', left:'50%', transform:'translateX(-50%)',
        background:'rgba(0,0,0,.72)', color:'#fff', borderRadius:'8px',
        padding:'8px 22px', zIndex:'60', textAlign:'center',
        pointerEvents:'none',  // 容器不拦截，但按钮自身设了 pointer-events:auto
        fontFamily:"'Segoe UI',Arial,sans-serif", fontSize:'14px', fontWeight:'bold',
        border:'1px solid rgba(255,255,255,.15)', boxShadow:'0 4px 20px rgba(0,0,0,.5)',
    });
    document.body.appendChild(info);
}

function destroyUI() {
    ['pool-power-bar','pool-info'].forEach(id => document.getElementById(id)?.remove());
}
function setScore(n) {
    const el = document.getElementById('pool-score-txt');
    if (el) el.innerHTML = `🎱 Score: <b>${n}</b>`;
}
function setHint(t) {
    const el = document.getElementById('pool-hint-txt');
    if (el) el.textContent = t;
}

// ═══════════════════════════════════════════════════════════
//  GEOMETRY CENTER HELPER
//  将 GLB 模型的几何中心对齐到原点，解决模型原点偏移问题
// ═══════════════════════════════════════════════════════════
function centerModel(object) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);          // 移动 object 本身
    // 将偏移反向加回，使世界坐标不变
    const wrapper = new THREE.Group();
    wrapper.add(object);
    return wrapper;
}

// ═══════════════════════════════════════════════════════════
//  BALL FACTORY
// ═══════════════════════════════════════════════════════════
function makeBall(origModel, pos, isWhite) {
    let mesh;
    if (origModel) {
        mesh = origModel.clone(true);
        mesh.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        // 将模型几何中心对齐到原点（修正 GLB 原点偏移）
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        const wrapper = new THREE.Group();
        wrapper.add(mesh);
        mesh = wrapper;
    } else {
        const mat = new THREE.MeshStandardMaterial({
            color: isWhite ? 0xf5f5f5 : 0xcc2200, roughness: 0.3, metalness: 0.1
        });
        mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 20, 20), mat);
    }
    mesh.position.copy(pos);
    return { mesh, vx: 0, vz: 0, isWhite, pocketed: false };
}

// ═══════════════════════════════════════════════════════════
//  AIM LINE (3D dashed)
// ═══════════════════════════════════════════════════════════
function makeAimLine(scene) {
    const pts = [new THREE.Vector3(), new THREE.Vector3(1,0,0)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineDashedMaterial({
        color:0xffffff, dashSize:0.06, gapSize:0.04, opacity:0.55, transparent:true
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    scene.add(line);
    return line;
}
function updateAimLine(line, wbPos, aimDir) {
    const end = new THREE.Vector3(
        wbPos.x + aimDir.x * 3.0,
        BALL_Y + 0.005,
        wbPos.z + aimDir.z * 3.0
    );
    const pts = [new THREE.Vector3(wbPos.x, BALL_Y + 0.005, wbPos.z), end];
    line.geometry.setFromPoints(pts);
    line.computeLineDistances();
    line.geometry.attributes.position.needsUpdate = true;
}

// ═══════════════════════════════════════════════════════════
//  MOUSE → TABLE PLANE
// ═══════════════════════════════════════════════════════════
function mouseToTable(e, camera, renderer) {
    const rect = renderer.domElement.getBoundingClientRect();
    const rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width)  * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    ), camera);
    const pt = new THREE.Vector3();
    return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0), -BALL_Y), pt) ? pt : null;
}

// ═══════════════════════════════════════════════════════════
//  PHYSICS STEP
// ═══════════════════════════════════════════════════════════
function stepPhysics(dt) {
    const alive = S.balls.filter(b => !b.pocketed);

    alive.forEach(b => {
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.z += b.vz * dt;
        b.vx *= FRICTION;
        b.vz *= FRICTION;
        if (Math.hypot(b.vx, b.vz) < 0.004) { b.vx = 0; b.vz = 0; }
    });

    // Wall bounce
    alive.forEach(b => {
        if (b.mesh.position.x < TX_MIN + BALL_R) { b.vx =  Math.abs(b.vx) * RESTITUTION; b.mesh.position.x = TX_MIN + BALL_R; }
        if (b.mesh.position.x > TX_MAX - BALL_R) { b.vx = -Math.abs(b.vx) * RESTITUTION; b.mesh.position.x = TX_MAX - BALL_R; }
        if (b.mesh.position.z < TZ_MIN + BALL_R) { b.vz =  Math.abs(b.vz) * RESTITUTION; b.mesh.position.z = TZ_MIN + BALL_R; }
        if (b.mesh.position.z > TZ_MAX - BALL_R) { b.vz = -Math.abs(b.vz) * RESTITUTION; b.mesh.position.z = TZ_MAX - BALL_R; }
    });

    // Ball-ball elastic collision
    for (let i = 0; i < alive.length; i++) {
        for (let j = i + 1; j < alive.length; j++) {
            const a = alive[i], b = alive[j];
            const dx = a.mesh.position.x - b.mesh.position.x;
            const dz = a.mesh.position.z - b.mesh.position.z;
            const d  = Math.hypot(dx, dz);
            if (d < BALL_R * 2 && d > 0.0001) {
                const nx = dx / d, nz = dz / d;
                const ov = (BALL_R * 2 - d) * 0.5;
                a.mesh.position.x += nx * ov; a.mesh.position.z += nz * ov;
                b.mesh.position.x -= nx * ov; b.mesh.position.z -= nz * ov;
                const dot = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
                if (dot < 0) {
                    a.vx -= dot * nx; a.vz -= dot * nz;
                    b.vx += dot * nx; b.vz += dot * nz;
                }
            }
        }
    }

    // Pocket detection
    alive.forEach(b => {
        for (const p of POCKETS) {
            if (Math.hypot(b.mesh.position.x - p.x, b.mesh.position.z - p.z) < POCKET_R) {
                b.pocketed = true; b.vx = 0; b.vz = 0; b.mesh.visible = false;
                if (!b.isWhite) { S.score++; setScore(S.score); }
                break;
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════
//  CUE POSITION
// ═══════════════════════════════════════════════════════════
function positionCue(pullBack) {
    if (!S?.cueMesh) return;
    const wb   = S.balls[0].mesh.position;
    const dist = CUE_LEN * 0.5 + BALL_R + 0.03 + pullBack;
    S.cueMesh.position.set(
        wb.x - S.aimDir.x * dist,
        BALL_Y + 0.01,
        wb.z - S.aimDir.z * dist
    );
    // Assumes GLB cue's long axis = local Y → rotate X -90° then Y for direction
    S.cueMesh.rotation.set(-Math.PI / 2, 0, Math.atan2(S.aimDir.x, S.aimDir.z));
}

// ═══════════════════════════════════════════════════════════
//  BUILD RACK & POCKETS
// ═══════════════════════════════════════════════════════════
function buildRack(scene, redModel) {
    const balls = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col <= row; col++) {
            const pos = new THREE.Vector3(
                RACK_X + row  * (BALL_R * 2.2),
                BALL_Y,
                RACK_Z + (col - row * 0.5) * (BALL_R * 2.2)
            );
            const rb = makeBall(redModel, pos, false);
            scene.add(rb.mesh);
            balls.push(rb);
        }
    }
    return balls;
}

function buildPocketMeshes(scene) {
    return POCKETS.map(p => {
        const m = new THREE.Mesh(
            new THREE.TorusGeometry(POCKET_R * 0.9, 0.012, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0x111111, opacity: 0.85, transparent: true })
        );
        m.rotation.x = Math.PI / 2;
        m.position.copy(p).setY(BALL_Y - 0.01);
        scene.add(m);
        return m;
    });
}

// ═══════════════════════════════════════════════════════════
//  AFTER ROLLING STOPS
// ═══════════════════════════════════════════════════════════
function onRollFinished() {
    if (!S) return;

    if (S.balls[0].pocketed) {
        S.balls[0].pocketed = false;
        S.balls[0].vx = S.balls[0].vz = 0;
        S.balls[0].mesh.position.copy(WHITE_START);
        S.balls[0].mesh.visible = true;
        setHint('⚠ 母球进袋，已重置');
    }

    const redsLeft = S.balls.filter(b => !b.isWhite && !b.pocketed).length;
    if (redsLeft === 0) {
        setHint(`🎉 全部入袋！总得分：${S.score} — 重置中…`);
        setTimeout(() => {
            S.balls.filter(b => !b.isWhite).forEach(b => b.mesh.parent?.remove(b.mesh));
            const newReds = buildRack(S.scene, S.interactiveObjects?.red_ball ?? null);
            S.balls = [S.balls[0], ...newReds];
            S.balls[0].mesh.position.copy(WHITE_START);
            S.balls[0].mesh.visible = true;
            S.balls[0].vx = S.balls[0].vz = 0;
            S.balls[0].pocketed = false;
            setHint('移动鼠标瞄准 · 按住充能 · 松开击球');
            S.phase = 'aiming';
            S.aimLine.visible = true;
        }, 2200);
        return;
    }

    S.phase = 'aiming';
    S.aimLine.visible = true;
    setHint('移动鼠标瞄准 · 按住充能 · 松开击球');
}

// ═══════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════
function startPoolGame(renderer, camera, controls, scene, interactiveObjects) {
    if (S?.active) return;

    camera.position.copy(CAM_POS);
    controls.target.copy(CAM_TARGET);
    controls.update();
    controls.enabled = false;
    window.__poolGameActive = true;

    ['cue','red_ball','white_ball'].forEach(n => {
        if (interactiveObjects[n]) interactiveObjects[n].visible = false;
    });

    const whiteModel = interactiveObjects?.white_ball ?? null;
    const redModel   = interactiveObjects?.red_ball   ?? null;
    const cueModel   = interactiveObjects?.cue        ?? null;

    const whiteBall    = makeBall(whiteModel, WHITE_START.clone(), true);
    scene.add(whiteBall.mesh);
    const redBalls     = buildRack(scene, redModel);
    const pocketMeshes = buildPocketMeshes(scene);

    // Cue mesh — 几何中心对齐原点
    let cueMesh;
    if (cueModel) {
        const inner = cueModel.clone(true);
        inner.traverse(n => { if (n.isMesh) n.castShadow = true; });
        // 居中
        const box = new THREE.Box3().setFromObject(inner);
        const center = box.getCenter(new THREE.Vector3());
        inner.position.sub(center);
        cueMesh = new THREE.Group();
        cueMesh.add(inner);
    } else {
        cueMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.025, CUE_LEN, 8),
            new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.5 })
        );
    }
    scene.add(cueMesh);

    const aimLine = makeAimLine(scene);
    buildUI();

    // ── 先初始化 S，再绑定所有事件 ───────────────────────
    S = {
        active: true,
        phase: 'aiming',
        balls: [whiteBall, ...redBalls],
        cueMesh, aimLine, pocketMeshes,
        aimDir: new THREE.Vector3(-1, 0, 0),
        power: 0,
        shootT: 0,
        score: 0,
        scene, renderer, camera, controls, interactiveObjects,
        rafId: null, last: performance.now(),
    };

    // 退出按钮 & ESC（S 已赋值，绑定安全）
    document.getElementById('pool-exit-btn').addEventListener('click', stopPoolGame);
    function onEscKey(e) { if (e.key === 'Escape') stopPoolGame(); }
    window.addEventListener('keydown', onEscKey);
    S.removeEsc = () => window.removeEventListener('keydown', onEscKey);

    // ── Event handlers ───────────────────────────────────
    function onMove(e) {
        if (!S?.active || S.phase === 'rolling' || S.phase === 'shooting') return;
        const pt = mouseToTable(e, camera, renderer);
        if (!pt) return;
        const wb = S.balls[0].mesh.position;
        const dx = pt.x - wb.x, dz = pt.z - wb.z;
        const len = Math.hypot(dx, dz);
        if (len > 0.05) S.aimDir.set(dx/len, 0, dz/len);
    }
    function onDown() {
        if (!S?.active || S.phase !== 'aiming') return;
        S.phase = 'charging'; S.power = 0;
        document.getElementById('pool-power-bar').style.opacity = '1';
        setHint('充能中… 松开击球');
    }
    function onUp() {
        if (!S?.active || S.phase !== 'charging') return;
        document.getElementById('pool-power-bar').style.opacity = '0';
        S.phase = 'shooting'; S.shootT = 0;
        setHint('💨 滚动中…');
    }
    renderer.domElement.addEventListener('mousemove', onMove);
    renderer.domElement.addEventListener('mousedown', onDown);
    renderer.domElement.addEventListener('mouseup',   onUp);
    S.removeEvents = () => {
        renderer.domElement.removeEventListener('mousemove', onMove);
        renderer.domElement.removeEventListener('mousedown', onDown);
        renderer.domElement.removeEventListener('mouseup',   onUp);
    };

    // ── Main loop ────────────────────────────────────────
    function loop(now) {
        if (!S?.active) return;
        const dt = Math.min((now - S.last) / 1000, 0.05);
        S.last = now;

        // Always enforce camera lock
        camera.position.copy(CAM_POS);
        controls.target.copy(CAM_TARGET);
        controls.update(); // 同步 OrbitControls 内部状态，防止 main loop 阻尼覆盖

        if (S.phase === 'charging') {
            S.power = Math.min(S.power + POWER_RATE * dt, MAX_POWER);
            const pct = S.power / MAX_POWER;
            document.getElementById('pool-bar-fill').style.height = (pct*100).toFixed(1) + '%';
            document.getElementById('pool-power-pct').textContent = Math.round(pct*100) + '%';
        }

        if (S.phase === 'shooting') {
            S.shootT += dt * 7;
            if (S.shootT >= 1) {
                S.balls[0].vx = S.aimDir.x * S.power;
                S.balls[0].vz = S.aimDir.z * S.power;
                S.phase = 'rolling'; S.shootT = 0;
                S.aimLine.visible = false;
            }
        }

        if (S.phase === 'rolling') {
            stepPhysics(dt);
            const allStopped = S.balls.every(b =>
                b.pocketed || (Math.abs(b.vx) < 0.008 && Math.abs(b.vz) < 0.008)
            );
            if (allStopped) onRollFinished();
        }

        // Cue pullback visual
        if (S.phase === 'aiming' || S.phase === 'charging' || S.phase === 'shooting') {
            const pb =
                S.phase === 'charging' ? (S.power / MAX_POWER) * 0.38 :
                S.phase === 'shooting' ? (1 - S.shootT) * (S.power / MAX_POWER) * 0.38 : 0;
            positionCue(pb);
        }

        // Aim line
        if ((S.phase === 'aiming' || S.phase === 'charging') && !S.balls[0].pocketed) {
            S.aimLine.visible = true;
            updateAimLine(S.aimLine, S.balls[0].mesh.position, S.aimDir);
        }

        S.rafId = requestAnimationFrame(loop);
    }
    S.rafId = requestAnimationFrame(loop);
}

// ═══════════════════════════════════════════════════════════
//  STOP
// ═══════════════════════════════════════════════════════════
function stopPoolGame() {
    if (!S?.active) return;

    S.balls.forEach(b => b.mesh.parent?.remove(b.mesh));
    S.cueMesh?.parent?.remove(S.cueMesh);
    S.aimLine?.parent?.remove(S.aimLine);
    S.pocketMeshes?.forEach(m => m.parent?.remove(m));

    ['cue','red_ball','white_ball'].forEach(n => {
        if (S.interactiveObjects[n]) S.interactiveObjects[n].visible = true;
    });

    S.removeEvents?.();
    S.removeEsc?.();
    if (S.rafId) cancelAnimationFrame(S.rafId);
    S.controls.enabled = true;
    // 重新同步 OrbitControls 内部状态，避免接管时弹回旧位置
    S.controls.target.copy(CAM_TARGET);
    S.controls.update();
    window.__poolGameActive = false;

    destroyUI();
    S.active = false;
    S = null;
}

export { startPoolGame, stopPoolGame };