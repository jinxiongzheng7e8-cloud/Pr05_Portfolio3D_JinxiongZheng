import * as THREE from 'three';

let _state = {
    active: false,
    balls: [],
    cue: null,
    rafId: null,
    clickHandler: null,
    scene: null,
    renderer: null,
    camera: null,
    controls: null,
    interactiveObjects: null,
};

function createBall(pos, color = 0xff0000) {
    const geo = new THREE.SphereGeometry(0.12, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isGameBall = true;
    return { mesh, vel: new THREE.Vector3() };
}

function createCue(pos) {
    const geo = new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.rotation.z = Math.PI / 2;
    mesh.castShadow = true;
    mesh.userData.isGameCue = true;
    return mesh;
}

function startPoolGame(renderer, camera, controls, scene, interactiveObjects) {
    if (_state.active) return;
    _state.active = true;
    // 标记小游戏为活动中（全局便于交互模块查询）
    try { window.__poolGameActive = true; } catch (e) { /* ignore */ }
    _state.scene = scene;
    _state.renderer = renderer;
    _state.camera = camera;
    _state.controls = controls;
    _state.interactiveObjects = interactiveObjects;

    // hide originals if present
    ['cue', 'red_ball', 'white_ball'].forEach(n => {
        if (interactiveObjects[n]) interactiveObjects[n].visible = false;
        if (interactiveObjects.colliders && interactiveObjects.colliders[n]) interactiveObjects.colliders[n].visible = false;
    });
    // create a simple rack of balls using loaded models when available
    const startX = 0.0, startY = 0.82, startZ = 0.0;
    const balls = [];
    const positions = [
        new THREE.Vector3(startX + 0.5, startY, startZ),
        new THREE.Vector3(startX + 0.65, startY, startZ - 0.06),
        new THREE.Vector3(startX + 0.65, startY, startZ + 0.06),
        new THREE.Vector3(startX + 0.8, startY, startZ - 0.12),
        new THREE.Vector3(startX + 0.8, startY, startZ),
        new THREE.Vector3(startX + 0.8, startY, startZ + 0.12),
    ];

    const redModel = interactiveObjects && interactiveObjects['red_ball'] ? interactiveObjects['red_ball'] : null;
    const whiteModel = interactiveObjects && interactiveObjects['white_ball'] ? interactiveObjects['white_ball'] : null;
    const cueModel = interactiveObjects && interactiveObjects['cue'] ? interactiveObjects['cue'] : null;

    // helper: clone model or fallback to procedural ball
    function createBallFromModel(origModel, pos) {
        if (origModel) {
            const clone = origModel.clone(true);
            // ensure meshes cast/receive shadows and mark as game ball
            clone.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; n.userData.isGameBall = true; } });
            clone.position.copy(pos);
            scene.add(clone);
            return { mesh: clone, vel: new THREE.Vector3() };
        }
        return createBall(pos);
    }

    positions.forEach((p, i) => {
        // use red model for all rack balls (clone for each)
        const b = createBallFromModel(redModel, p);
        balls.push(b);
    });

    // cue ball (white)
    const whitePos = new THREE.Vector3(-0.5, startY, 0);
    const cueBall = createBallFromModel(whiteModel, whitePos);
    balls.push(cueBall);

    // cue: clone model if available, else procedural
    let cue = null;
    if (cueModel) {
        cue = cueModel.clone(true);
        cue.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; n.userData.isGameCue = true; } });
        cue.position.copy(new THREE.Vector3(-0.9, startY, 0));
        scene.add(cue);
    } else {
        cue = createCue(new THREE.Vector3(-0.9, startY, 0));
        scene.add(cue);
    }

    _state.balls = balls;
    _state.cue = cue;

    // move camera to top-down play position
    camera.position.set(-1.87, 3.36, 1.38);
    controls.target.set(0, 0.9, 0);
    controls.update();
    controls.enabled = false;

    // click to shoot: apply impulse to the white ball
    _state.clickHandler = async (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const rc = new THREE.Raycaster();
        rc.setFromCamera(mouse, camera);
        const intersects = rc.intersectObjects(_state.balls.map(b => b.mesh), true);
        if (intersects.length === 0) return;
        const hitMesh = intersects[0].object;
        // find ball
        const ball = _state.balls.find(b => b.mesh === hitMesh || (hitMesh.parent && b.mesh === hitMesh.parent));
        if (!ball) return;
        // apply impulse away from camera
        const dir = new THREE.Vector3().subVectors(ball.mesh.position, camera.position).setY(0).normalize();
        ball.vel.add(dir.multiplyScalar(3));
    };
    renderer.domElement.addEventListener('click', _state.clickHandler);

    // simple physics loop
    let last = performance.now();
    function loop(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        // update balls
        _state.balls.forEach(b => {
            // integrate
            b.mesh.position.addScaledVector(b.vel, dt);
            // friction
            b.vel.multiplyScalar(1 - Math.min(3 * dt, 0.2));
            // simple table boundaries (approx)
            const bx = b.mesh.position.x;
            const bz = b.mesh.position.z;
            const bounds = 1.8;
            if (bx < -bounds || bx > bounds) { b.vel.x *= -0.7; b.mesh.position.x = THREE.MathUtils.clamp(b.mesh.position.x, -bounds, bounds); }
            if (bz < -bounds || bz > bounds) { b.vel.z *= -0.7; b.mesh.position.z = THREE.MathUtils.clamp(b.mesh.position.z, -bounds, bounds); }
        });

        _state.rafId = requestAnimationFrame(loop);
    }
    _state.rafId = requestAnimationFrame(loop);
}

function stopPoolGame() {
    if (!_state.active) return;
    // remove generated balls and cue
    _state.balls.forEach(b => {
        if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
    });
    if (_state.cue && _state.cue.parent) _state.cue.parent.remove(_state.cue);

    // restore originals
    const io = _state.interactiveObjects || {};
    ['cue', 'red_ball', 'white_ball'].forEach(n => {
        if (io[n]) io[n].visible = true;
        if (io.colliders && io.colliders[n]) io.colliders[n].visible = true;
    });

    if (_state.clickHandler && _state.renderer) _state.renderer.domElement.removeEventListener('click', _state.clickHandler);
    if (_state.rafId) cancelAnimationFrame(_state.rafId);
    if (_state.controls) _state.controls.enabled = true;

    // 清除全局活动标志
    try { window.__poolGameActive = false; } catch (e) { /* ignore */ }

    _state.active = false;
    _state.balls = [];
    _state.cue = null;
    _state.clickHandler = null;
}

export { startPoolGame, stopPoolGame };
