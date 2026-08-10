/* WebGPU particle simulation for studio.html hero */
import * as THREE from 'three/webgpu';
import {
    Fn, float, vec3, vec4, uniform,
    instanceIndex, storage, attribute, uv,
    mix, smoothstep, length,
    sin, cos, time, step, clamp, max, pow,
    select, exp, hash
} from 'three/tsl';

const PARTICLE_COUNT = 50000;
const BOUNDS = 35;

const mount = document.getElementById('heroCanvas');
if (!mount) throw new Error('No heroCanvas found');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
camera.position.set(0, 15, 50);

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x020208);

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > 0 && h > 0) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
}
resize();
window.addEventListener('resize', resize);

// Storage buffer arrays
const positionArray = new Float32Array(PARTICLE_COUNT * 4);
const velocityArray = new Float32Array(PARTICLE_COUNT * 4);

function initParticles() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = Math.pow(Math.random(), 0.5) * BOUNDS * 0.7;

        positionArray[i * 4 + 0] = Math.sin(phi) * Math.cos(theta) * radius;
        positionArray[i * 4 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
        positionArray[i * 4 + 2] = Math.cos(phi) * radius;
        positionArray[i * 4 + 3] = Math.random();

        velocityArray[i * 4 + 0] = (Math.random() - 0.5) * 1.5;
        velocityArray[i * 4 + 1] = (Math.random() - 0.5) * 1.5;
        velocityArray[i * 4 + 2] = (Math.random() - 0.5) * 1.5;
        velocityArray[i * 4 + 3] = Math.random() * 0.6 + 0.4;
    }
}
initParticles();

const positionAttribute = new THREE.StorageInstancedBufferAttribute(positionArray, 4);
const velocityAttribute = new THREE.StorageInstancedBufferAttribute(velocityArray, 4);

const positionStorage = storage(positionAttribute, 'vec4', PARTICLE_COUNT);
const velocityStorage = storage(velocityAttribute, 'vec4', PARTICLE_COUNT);

const mousePos = uniform(new THREE.Vector3(0, 0, 0));
const mouseActive = uniform(0.0);
const currentTime = uniform(0.0);

// Compute shader
const computeUpdate = Fn(() => {
    const idx = instanceIndex;

    const posData = positionStorage.element(idx);
    const velData = velocityStorage.element(idx);

    const position = posData.xyz.toVar();
    const velocity = velData.xyz.toVar();
    const mass = velData.w;
    const life = posData.w;

    const dt = float(0.016);

    // Mouse force
    const toMouse = mousePos.sub(position);
    const mouseDist = max(length(toMouse), float(0.1));
    const mouseDir = toMouse.div(mouseDist);
    const attraction = mouseActive.mul(600.0).div(mouseDist.mul(mouseDist).add(10.0));
    const mouseRepulsion = float(50.0).div(mouseDist.mul(mouseDist).add(0.1));
    const mouseRepulsionZone = smoothstep(float(5.0), float(1.0), mouseDist);
    const netMouseForce = mouseDir.mul(attraction.sub(mouseRepulsion.mul(mouseRepulsionZone)));
    velocity.addAssign(netMouseForce.mul(dt).div(mass));

    // Central forces
    const toCenter = position.negate();
    const centerDist = length(toCenter);
    const centerDistSafe = max(centerDist, float(0.1));
    const centerDir = toCenter.div(centerDistSafe);
    const centerAttraction = float(3.0).div(centerDistSafe.add(15.0));
    const coreRepulsion = float(100.0).div(centerDistSafe.mul(centerDistSafe).add(0.5));
    const inCore = smoothstep(float(6.0), float(3.0), centerDist);
    const netCentralForce = centerDir.mul(centerAttraction.sub(coreRepulsion.mul(inCore)));
    velocity.addAssign(netCentralForce.mul(dt));

    // Orbital swirl
    const tangent = vec3(position.z.negate(), float(0.0), position.x);
    const tangentLen = max(length(tangent), float(0.001));
    const swirlDir = tangent.div(tangentLen);
    const swirlStrength = float(2.5).div(centerDistSafe.add(5.0));
    velocity.addAssign(swirlDir.mul(swirlStrength).mul(dt));

    // Noise
    const noise = vec3(
        hash(idx.toFloat().add(currentTime.mul(10.0))).sub(0.5),
        hash(idx.toFloat().add(currentTime.mul(10.0)).add(1000.0)).sub(0.5),
        hash(idx.toFloat().add(currentTime.mul(10.0)).add(2000.0)).sub(0.5)
    );
    velocity.addAssign(noise.mul(0.5).mul(dt));

    // Damping
    velocity.mulAssign(0.985);

    // Speed limit
    const speed = length(velocity);
    const maxSpeed = float(40.0);
    const limitFactor = select(speed.greaterThan(maxSpeed), maxSpeed.div(speed), float(1.0));
    velocity.mulAssign(limitFactor);

    // Min speed
    const minSpeed = float(0.5);
    const speedBoost = select(speed.lessThan(minSpeed), minSpeed.div(max(speed, float(0.01))), float(1.0));
    velocity.mulAssign(speedBoost);

    // Update position
    position.addAssign(velocity.mul(dt));

    // Boundary
    const dist = length(position);
    const boundary = float(BOUNDS);
    const overflow = smoothstep(boundary.mul(0.75), boundary, dist);
    const pushDir = position.div(max(dist, float(0.001))).negate();
    velocity.addAssign(pushDir.mul(overflow).mul(30.0).mul(dt));
    const clampRatio = select(dist.greaterThan(boundary.mul(1.1)), boundary.div(dist), float(1.0));
    position.mulAssign(clampRatio);

    // Write back
    positionStorage.element(idx).assign(vec4(position, life));
    velocityStorage.element(idx).assign(vec4(velocity, mass));
});

const computeNode = computeUpdate().compute(PARTICLE_COUNT);

// Particle geometry
const geometry = new THREE.PlaneGeometry(1, 1);
geometry.setAttribute('particlePosition', positionAttribute);
geometry.setAttribute('particleVelocity', velocityAttribute);

const material = new THREE.SpriteNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
});

material.positionNode = attribute('particlePosition', 'vec4').xyz;

material.colorNode = Fn(() => {
    const particlePos = attribute('particlePosition', 'vec4');
    const particleVel = attribute('particleVelocity', 'vec4');

    const position = particlePos.xyz;
    const velocity = particleVel.xyz;
    const life = particlePos.w;
    const mass = particleVel.w;

    const uvCentered = uv().sub(0.5).mul(2.0);
    const dist = length(uvCentered);

    const glow = exp(dist.negate().mul(2.0));
    const core = smoothstep(float(0.6), float(0.0), dist);
    const shape = core.mul(0.7).add(glow.mul(0.3));

    const speed = length(velocity);
    const normalizedSpeed = smoothstep(float(0.5), float(20.0), speed);

    const c1 = vec3(0.1, 0.2, 0.9);
    const c2 = vec3(0.5, 0.1, 0.95);
    const c3 = vec3(0.95, 0.2, 0.6);
    const c4 = vec3(1.0, 0.7, 0.2);

    const t = normalizedSpeed;
    const color = mix(
        mix(c1, c2, smoothstep(float(0.0), float(0.33), t)),
        mix(c3, c4, smoothstep(float(0.33), float(1.0), t)),
        smoothstep(float(0.25), float(0.6), t)
    ).toVar();

    color.addAssign(core.mul(normalizedSpeed).mul(0.3));

    const shimmer = sin(life.mul(20.0).add(time.mul(4.0))).mul(0.1).add(1.0);
    color.mulAssign(shimmer);

    const posDist = length(position);
    const distFade = smoothstep(float(BOUNDS), float(BOUNDS * 0.3), posDist);

    const baseAlpha = normalizedSpeed.mul(0.15).add(0.08);
    const finalAlpha = shape.mul(baseAlpha).mul(distFade).mul(mass.add(0.2));

    return vec4(color, finalAlpha);
})();

material.scaleNode = Fn(() => {
    const particleVel = attribute('particleVelocity', 'vec4');
    const mass = particleVel.w;
    const speed = length(particleVel.xyz);
    const speedBonus = smoothstep(float(0.0), float(20.0), speed).mul(0.2);
    return mass.mul(0.4).add(0.2).add(speedBonus);
})();

const particles = new THREE.InstancedMesh(geometry, material, PARTICLE_COUNT);
particles.frustumCulled = false;
scene.add(particles);

// Background stars
const starGeometry = new THREE.BufferGeometry();
const starCount = 2000;
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 80 + Math.random() * 100;

    starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    starPositions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
    starPositions[i * 3 + 2] = Math.cos(phi) * r;

    const temp = Math.random();
    starColors[i * 3] = 0.8 + temp * 0.2;
    starColors[i * 3 + 1] = 0.85 + temp * 0.15;
    starColors[i * 3 + 2] = 1.0;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starMaterial = new THREE.PointsNodeMaterial({
    size: 1.0,
    transparent: true,
    sizeAttenuation: true,
    vertexColors: true,
});
starMaterial.colorNode = Fn(() => {
    const vColor = attribute('color', 'vec3');
    const twinkle = sin(time.mul(2.0).add(length(attribute('position', 'vec3')))).mul(0.15).add(0.85);
    return vec4(vColor.mul(twinkle), float(0.6));
})();

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Mouse tracking
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const intersectPoint = new THREE.Vector3();

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    targetPlane.normal.copy(camera.getWorldDirection(new THREE.Vector3()));
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(targetPlane, intersectPoint);
    mousePos.value.copy(intersectPoint);
    mouseActive.value = 1.0;
});

window.addEventListener('mouseleave', () => {
    mouseActive.value = 0.0;
});

// Slow auto-rotation when no mouse
let autoRotY = 0;

async function animate() {
    currentTime.value = performance.now() / 1000;

    if (mouseActive.value < 0.5) {
        autoRotY += 0.001;
        camera.position.x = Math.cos(autoRotY) * 50;
        camera.position.z = Math.sin(autoRotY) * 50;
        camera.lookAt(0, 0, 0);
    }

    renderer.compute(computeNode);
    stars.rotation.y += 0.0005;
    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

await renderer.init();
mount.appendChild(renderer.domElement);
resize();
animate();
