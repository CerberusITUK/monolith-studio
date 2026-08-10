/* WebGL fallback particle simulation for studio.html hero */
(function () {
  if (typeof THREE === "undefined") return;

  var mount = document.getElementById("heroCanvas");
  if (!mount) return;

  var PARTICLE_COUNT = 8000;
  var BOUNDS = 35;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
  camera.position.set(0, 15, 50);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, premultipliedAlpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x020208, 1);
  mount.appendChild(renderer.domElement);

  function resize() {
    var w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize);

  // Particle data
  var positions = new Float32Array(PARTICLE_COUNT * 3);
  var velocities = new Float32Array(PARTICLE_COUNT * 3);
  var colors = new Float32Array(PARTICLE_COUNT * 3);
  var sizes = new Float32Array(PARTICLE_COUNT);
  var masses = new Float32Array(PARTICLE_COUNT);
  var lives = new Float32Array(PARTICLE_COUNT);

  function initParticles() {
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var radius = Math.pow(Math.random(), 0.5) * BOUNDS * 0.7;

      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
      positions[i * 3 + 2] = Math.cos(phi) * radius;

      velocities[i * 3] = (Math.random() - 0.5) * 1.5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      masses[i] = Math.random() * 0.6 + 0.4;
      lives[i] = Math.random();
      sizes[i] = masses[i] * 0.4 + 0.2;
    }
  }
  initParticles();

  // Color palette
  var palette = [
    [0.1, 0.2, 0.9],
    [0.5, 0.1, 0.95],
    [0.95, 0.2, 0.6],
    [1.0, 0.7, 0.2],
  ];

  function speedColor(speed) {
    var t = Math.max(0, Math.min(1, (speed - 0.5) / 19.5));
    var idx = t * 3;
    var i0 = Math.floor(idx);
    var i1 = Math.min(i0 + 1, 3);
    var f = idx - i0;
    return [
      palette[i0][0] * (1 - f) + palette[i1][0] * f,
      palette[i0][1] * (1 - f) + palette[i1][1] * f,
      palette[i0][2] * (1 - f) + palette[i1][2] * f,
    ];
  }

  // Build geometry
  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  // Circular particle texture
  var texCanvas = document.createElement("canvas");
  texCanvas.width = 64; texCanvas.height = 64;
  var tctx = texCanvas.getContext("2d");
  var grad = tctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.4)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, 64, 64);
  var particleTex = new THREE.CanvasTexture(texCanvas);

  var mat = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: particleTex },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: [
      "attribute float size;",
      "attribute vec3 color;",
      "varying vec3 vColor;",
      "uniform float uPixelRatio;",
      "void main() {",
      "  vColor = color;",
      "  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);",
      "  gl_PointSize = size * uPixelRatio * (300.0 / -mvPos.z);",
      "  gl_Position = projectionMatrix * mvPos;",
      "}",
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D uTex;",
      "varying vec3 vColor;",
      "void main() {",
      "  vec4 tex = texture2D(uTex, gl_PointCoord);",
      "  gl_FragColor = vec4(vColor, tex.a * 0.5);",
      "}",
    ].join("\n"),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  var points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  // Background stars
  var starGeo = new THREE.BufferGeometry();
  var starCount = 2000;
  var starPos = new Float32Array(starCount * 3);
  var starCol = new Float32Array(starCount * 3);
  for (var i = 0; i < starCount; i++) {
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    var r = 80 + Math.random() * 100;
    starPos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    starPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
    starPos[i * 3 + 2] = Math.cos(phi) * r;
    var temp = Math.random();
    starCol[i * 3] = 0.8 + temp * 0.2;
    starCol[i * 3 + 1] = 0.85 + temp * 0.15;
    starCol[i * 3 + 2] = 1.0;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
  var starMat = new THREE.PointsMaterial({
    size: 1.0,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    vertexColors: true,
    map: particleTex,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  var stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Mouse tracking
  var mouseWorld = new THREE.Vector3();
  var mouseActive = false;
  var raycaster = new THREE.Raycaster();
  var mouseNDC = new THREE.Vector2();
  var targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  var intersectPoint = new THREE.Vector3();

  addEventListener("mousemove", function (e) {
    mouseNDC.x = (e.clientX / innerWidth) * 2 - 1;
    mouseNDC.y = -(e.clientY / innerHeight) * 2 + 1;
    targetPlane.normal.copy(camera.getWorldDirection(new THREE.Vector3()));
    raycaster.setFromCamera(mouseNDC, camera);
    raycaster.ray.intersectPlane(targetPlane, intersectPoint);
    mouseWorld.copy(intersectPoint);
    mouseActive = true;
  });

  addEventListener("mouseleave", function () {
    mouseActive = false;
  });

  // Simulation
  var dt = 0.016;
  var autoRotY = 0;
  var clock0 = performance.now() / 1000;

  function simulate() {
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var px = positions[i * 3], py = positions[i * 3 + 1], pz = positions[i * 3 + 2];
      var vx = velocities[i * 3], vy = velocities[i * 3 + 1], vz = velocities[i * 3 + 2];
      var mass = masses[i];

      // Mouse force
      if (mouseActive) {
        var dx = mouseWorld.x - px, dy = mouseWorld.y - py, dz = mouseWorld.z - pz;
        var md = Math.max(0.1, Math.sqrt(dx * dx + dy * dy + dz * dz));
        var attraction = 600.0 / (md * md + 10.0);
        var repulsion = 50.0 / (md * md + 0.1);
        var repZone = Math.max(0, Math.min(1, (5.0 - md) / 4.0));
        var net = attraction - repulsion * repZone;
        vx += (dx / md) * net * dt / mass;
        vy += (dy / md) * net * dt / mass;
        vz += (dz / md) * net * dt / mass;
      }

      // Central forces
      var cd = Math.max(0.1, Math.sqrt(px * px + py * py + pz * pz));
      var cAttr = 3.0 / (cd + 15.0);
      var cRep = 100.0 / (cd * cd + 0.5);
      var inCore = Math.max(0, Math.min(1, (6.0 - cd) / 3.0));
      var cNet = cAttr - cRep * inCore;
      vx += (-px / cd) * cNet * dt;
      vy += (-py / cd) * cNet * dt;
      vz += (-pz / cd) * cNet * dt;

      // Orbital swirl
      var tx = -pz, ty = 0, tz = px;
      var tl = Math.max(0.001, Math.sqrt(tx * tx + tz * tz));
      var swirl = 2.5 / (cd + 5.0);
      vx += (tx / tl) * swirl * dt;
      vz += (tz / tl) * swirl * dt;

      // Noise
      var t = clock0 + performance.now() / 1000 - clock0;
      vx += (Math.random() - 0.5) * 0.5 * dt;
      vy += (Math.random() - 0.5) * 0.5 * dt;
      vz += (Math.random() - 0.5) * 0.5 * dt;

      // Damping
      vx *= 0.985; vy *= 0.985; vz *= 0.985;

      // Speed limit
      var sp = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (sp > 40.0) { vx = vx / sp * 40.0; vy = vy / sp * 40.0; vz = vz / sp * 40.0; }
      if (sp < 0.5 && sp > 0.01) { vx = vx / sp * 0.5; vy = vy / sp * 0.5; vz = vz / sp * 0.5; }

      // Update position
      px += vx * dt; py += vy * dt; pz += vz * dt;

      // Boundary
      var bd = Math.sqrt(px * px + py * py + pz * pz);
      if (bd > BOUNDS * 0.75) {
        var overflow = Math.max(0, Math.min(1, (bd - BOUNDS * 0.75) / (BOUNDS * 0.25)));
        vx += (-px / bd) * overflow * 30.0 * dt;
        vy += (-py / bd) * overflow * 30.0 * dt;
        vz += (-pz / bd) * overflow * 30.0 * dt;
      }
      if (bd > BOUNDS * 1.1) {
        var ratio = BOUNDS / bd;
        px *= ratio; py *= ratio; pz *= ratio;
      }

      positions[i * 3] = px; positions[i * 3 + 1] = py; positions[i * 3 + 2] = pz;
      velocities[i * 3] = vx; velocities[i * 3 + 1] = vy; velocities[i * 3 + 2] = vz;

      // Color from speed
      var finalSp = Math.sqrt(vx * vx + vy * vy + vz * vz);
      var c = speedColor(finalSp);
      var shimmer = 0.9 + 0.1 * Math.sin(lives[i] * 20.0 + t * 4.0);
      colors[i * 3] = c[0] * shimmer;
      colors[i * 3 + 1] = c[1] * shimmer;
      colors[i * 3 + 2] = c[2] * shimmer;

      // Size from speed
      var speedBonus = Math.max(0, Math.min(1, finalSp / 20.0)) * 0.2;
      sizes[i] = masses[i] * 0.4 + 0.2 + speedBonus;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.size.needsUpdate = true;
  }

  function animate() {
    requestAnimationFrame(animate);
    simulate();

    if (!mouseActive) {
      autoRotY += 0.001;
      camera.position.x = Math.cos(autoRotY) * 50;
      camera.position.z = Math.sin(autoRotY) * 50;
      camera.lookAt(0, 0, 0);
    }

    stars.rotation.y += 0.0005;
    renderer.render(scene, camera);
  }
  animate();
})();
