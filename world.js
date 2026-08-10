/**
 * World network renderer — 3D globe with network connections.
 * Shows a wireframe sphere with glowing nodes and animated arc connections.
 */
(function (global) {
  "use strict";

  function WorldRenderer(container, options) {
    options = options || {};
    const isLowres = options.lowres || false;

    const THREE = global.THREE;
    if (!THREE) { console.error("THREE is not loaded"); return; }

    let scene, camera, renderer;
    let globe, globeGroup, cloudMesh;
    let bgMesh;
    let nodes = [];
    let connections = [];
    let arcs = [];
    let airplaneModel = null;
    let running = true;
    let visible = true;
    let scrollProgress = 0;

    function init() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.set(0, 0, 8);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: !isLowres });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 1);
      container.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      // ---- Galaxy starfield background on a plane ----
      var starsBgTex = new THREE.TextureLoader().load("stars.jpg?v=3", function (tex) {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
      });
      var bgMat = new THREE.MeshBasicMaterial({ map: starsBgTex, color: 0x444444, depthWrite: false, side: THREE.DoubleSide });
      bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
      bgMesh.position.z = -30;
      bgMesh.renderOrder = -1;
      scene.add(bgMesh);

      globeGroup = new THREE.Group();
      scene.add(globeGroup);

      // ---- Realistic Earth globe ----
      const globeRadius = 2.5;
      const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 48);

      var textureLoader = new THREE.TextureLoader();
      var dayMap = textureLoader.load("earth_day.jpg");

      var globeMat = new THREE.MeshPhongMaterial({
        map: dayMap,
        shininess: 10,
      });
      globe = new THREE.Mesh(globeGeo, globeMat);
      globeGroup.add(globe);

      // ---- Cloud layer ----
      var cloudMap = textureLoader.load("earth_clouds.jpg");
      var cloudGeo = new THREE.SphereGeometry(globeRadius * 1.015, 64, 48);
      var cloudMat = new THREE.MeshBasicMaterial({
        map: cloudMap,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      globeGroup.add(cloudMesh);

      // ---- Atmosphere glow ----
      var atmGeo = new THREE.SphereGeometry(globeRadius * 1.15, 64, 48);
      var atmMat = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: [
          "varying vec3 vNormal;",
          "void main() {",
          "  vNormal = normalize(normalMatrix * normal);",
          "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
          "}",
        ].join("\n"),
        fragmentShader: [
          "varying vec3 vNormal;",
          "void main() {",
          "  float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);",
          "  gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;",
          "}",
        ].join("\n"),
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      });
      var atmosphere = new THREE.Mesh(atmGeo, atmMat);
      scene.add(atmosphere);

      // ---- Lighting ----
      var ambientLight = new THREE.AmbientLight(0x333355, 0.5);
      scene.add(ambientLight);

      var dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(5, 3, 5);
      scene.add(dirLight);

      // ---- Network nodes at real city coordinates ----
      // [name, lat, lon] — lat in degrees, lon in degrees
      var cities = [
        ["London", 51.5, -0.1],
        ["New York", 40.7, -74.0],
        ["Tokyo", 35.7, 139.7],
        ["Sydney", -33.9, 151.2],
        ["Dubai", 25.2, 55.3],
        ["Singapore", 1.3, 103.8],
        ["Paris", 48.9, 2.4],
        ["Los Angeles", 34.1, -118.2],
        ["Hong Kong", 22.3, 114.2],
        ["Frankfurt", 50.1, 8.7],
        ["São Paulo", -23.5, -46.6],
        ["Mumbai", 19.1, 72.9],
        ["Shanghai", 31.2, 121.5],
        ["Cape Town", -33.9, 18.4],
        ["Moscow", 55.8, 37.6],
        ["Istanbul", 41.0, 28.9],
        ["Mexico City", 19.4, -99.1],
        ["Buenos Aires", -34.6, -58.4],
        ["Bangkok", 13.8, 100.5],
        ["Stockholm", 59.3, 18.1],
        ["Nairobi", -1.3, 36.8],
        ["Vancouver", 49.3, -123.1],
        ["Cairo", 30.0, 31.2],
        ["Lagos", 6.5, 3.4],
        ["Seoul", 37.6, 127.0],
        ["Toronto", 43.7, -79.4],
        ["Madrid", 40.4, -3.7],
        ["Jakarta", -6.2, 106.8],
        ["Auckland", -36.8, 174.8],
        ["Lima", -12.0, -77.0],
      ];

      function latLonToVec3(lat, lon, radius) {
        var phi = (90 - lat) * Math.PI / 180;
        var theta = (lon + 180) * Math.PI / 180;
        var x = -radius * Math.sin(phi) * Math.cos(theta);
        var y = radius * Math.cos(phi);
        var z = radius * Math.sin(phi) * Math.sin(theta);
        return new THREE.Vector3(x, y, z);
      }

      var cityColors = [0x00ffcc, 0x00aaff, 0xffaa00, 0xff6688, 0xaa66ff, 0x66ff66, 0xff5544, 0x44ddff];

      for (var ci = 0; ci < cities.length; ci++) {
        var pos = latLonToVec3(cities[ci][1], cities[ci][2], globeRadius);

        // ---- Travel-style location pin marker ----
        var markerColor = new THREE.Color(cityColors[ci % cityColors.length]);
        var markerGroup = new THREE.Group();

        // Pin head (glow sphere)
        var headGeo = new THREE.SphereGeometry(0.06, 12, 12);
        var headMat = new THREE.MeshBasicMaterial({
          color: markerColor,
          transparent: true,
          opacity: 0.9,
        });
        var head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.18;
        markerGroup.add(head);

        // Tapered pin body
        var pinGeo = new THREE.ConeGeometry(0.04, 0.28, 8);
        var pinMat = new THREE.MeshBasicMaterial({
          color: markerColor,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
        });
        var pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.y = 0.04;
        markerGroup.add(pin);

        // Pin point at surface
        var pointGeo = new THREE.SphereGeometry(0.02, 8, 8);
        var pointMat = new THREE.MeshBasicMaterial({
          color: markerColor,
          transparent: true,
          opacity: 0.5,
        });
        var point = new THREE.Mesh(pointGeo, pointMat);
        markerGroup.add(point);

        // Pulsing ring at base
        var ringGeo = new THREE.RingGeometry(0.08, 0.12, 32);
        var ringMat = new THREE.MeshBasicMaterial({
          color: markerColor,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.lookAt(pos);
        markerGroup.add(ring);

        // Position marker at city location, oriented outward from globe center
        markerGroup.position.copy(pos);
        markerGroup.lookAt(0, 0, 0);
        markerGroup.rotateX(Math.PI / 2);
        globeGroup.add(markerGroup);

        // Store first child (head) as the main node for pulse effects
        var node = head;
        node.userData = { basePos: pos.clone(), pulsePhase: Math.random() * Math.PI * 2, name: cities[ci][0], markerGroup: markerGroup, ring: ring, color: markerColor };
        nodes.push(node);
      }

      // ---- Connections (arcs between random node pairs) ----
      const connectionCount = isLowres ? 12 : 25;
      for (let i = 0; i < connectionCount; i++) {
        const a = nodes[Math.floor(Math.random() * nodes.length)];
        const b = nodes[Math.floor(Math.random() * nodes.length)];
        if (a === b) continue;

        // Create arc using quadratic bezier elevated above surface
        const start = a.userData.basePos.clone();
        const end = b.userData.basePos.clone();
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const midLen = mid.length();
        mid.normalize().multiplyScalar(globeRadius + 0.8 + Math.random() * 0.6);

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const segments = 32;
        const points = curve.getPoints(segments);

        const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
        const arcMat = new THREE.LineBasicMaterial({
          color: a.userData.color,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
        });
        const arc = new THREE.Line(arcGeo, arcMat);
        arc.userData = {
          curve: curve,
          segments: segments,
          progress: Math.random(),
          speed: 0.15 + Math.random() * 0.25,
        };
        globeGroup.add(arc);
        arcs.push(arc);
        connections.push({ a, b, arc });
      }

      // ---- Traveling 3D arrows along arcs ----
      var arrowShaftGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.08, 4);
      var arrowHeadGeo = new THREE.ConeGeometry(0.03, 0.06, 4);
      var arrowMat = new THREE.MeshBasicMaterial({
        color: 0x88ffdd,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });

      for (let i = 0; i < arcs.length; i++) {
        var arrowColor = connections[i].a.userData.color;
        var arrowGroup = new THREE.Group();
        var shaft = new THREE.Mesh(arrowShaftGeo, arrowMat.clone());
        shaft.material.color = arrowColor;
        shaft.position.y = -0.03;
        arrowGroup.add(shaft);
        var head = new THREE.Mesh(arrowHeadGeo, arrowMat.clone());
        head.material.color = arrowColor;
        head.position.y = 0.04;
        arrowGroup.add(head);
        globeGroup.add(arrowGroup);
        connections[i].pulse = arrowGroup;
      }

      // ---- Ambient particles (stars) ----
      const starCount = isLowres ? 400 : 1200;
      const starGeo = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      const starColors = new Float32Array(starCount * 3);
      const starSizes = new Float32Array(starCount);
      for (let i = 0; i < starCount; i++) {
        const r = 15 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.cos(phi);
        starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        var sc = 0.5 + Math.random() * 0.5;
        starColors[i * 3] = sc * (0.7 + Math.random() * 0.3);
        starColors[i * 3 + 1] = sc * (0.7 + Math.random() * 0.3);
        starColors[i * 3 + 2] = sc;
        starSizes[i] = 0.05 + Math.random() * 0.12;
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
      const starMat = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      // ---- Resize ----
      function onResize() {
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 600;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      onResize();
      global.addEventListener("resize", onResize);
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(onResize);
        ro.observe(container);
      }
    }

    let oldTime = 0;
    const clock = new THREE.Clock();

    function render() {
      if (!running || !visible) return;
      try {
      const elapsed = clock.getElapsedTime();
      const dt = Math.min(elapsed - oldTime, 0.1);
      oldTime = elapsed;

      // Scroll parallax — camera zoom
      camera.position.z = 8 - scrollProgress * 3;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      // Scale bg plane to cover view at z=-30, respecting image aspect ratio
      var bgAspect = 2844 / 1896;
      var dist = camera.position.z - (-30);
      var fovRad = camera.fov * Math.PI / 180;
      var viewH = 2 * Math.tan(fovRad / 2) * dist;
      var viewW = viewH * camera.aspect;
      var bgScale = Math.max(viewW / 2, viewH / bgAspect / 2) * 1.05;
      bgMesh.scale.set(bgScale * bgAspect, bgScale, 1);
      // Slight parallax with scroll + slow drift
      bgMesh.position.x = scrollProgress * 1.5 + Math.sin(elapsed * 0.04) * 2.0;
      bgMesh.position.y = -scrollProgress * 1.0 + Math.cos(elapsed * 0.03) * 1.5;

      // Rotate globe
      globeGroup.rotation.y += dt * (0.15 + scrollProgress * 0.3);
      globeGroup.rotation.x = Math.sin(elapsed * 0.1) * 0.15;

      // Clouds rotate slightly faster than globe
      if (cloudMesh) {
        cloudMesh.rotation.y += dt * 0.05;
      }

      // Pulse nodes (travel markers)
      nodes.forEach(function (node) {
        const pulse = 1 + Math.sin(elapsed * 2 + node.userData.pulsePhase) * 0.3;
        node.scale.setScalar(pulse);
        node.material.opacity = 0.6 + Math.sin(elapsed * 2 + node.userData.pulsePhase) * 0.3;

        // Pulse ring animation
        if (node.userData.ring) {
          const ringPulse = 1 + Math.sin(elapsed * 2 + node.userData.pulsePhase) * 0.2;
          node.userData.ring.scale.setScalar(ringPulse);
          node.userData.ring.material.opacity = 0.2 + Math.max(0, Math.sin(elapsed * 2 + node.userData.pulsePhase)) * 0.3;
        }
      });

      // Animate traveling aircraft along arcs
      connections.forEach(function (conn, idx) {
        const arc = conn.arc;
        arc.userData.progress += dt * arc.userData.speed;
        if (arc.userData.progress > 1) arc.userData.progress -= 1;

        if (conn.pulse) {
          const p = arc.userData.progress;
          const point = arc.userData.curve.getPoint(p);
          const ahead = arc.userData.curve.getPoint(Math.min(p + 0.01, 1));
          conn.pulse.position.copy(point);
          // Arrow tip is +Y, rotate to point along travel direction
          var dir = new THREE.Vector3().subVectors(ahead, point).normalize();
          conn.pulse.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          // Fade at start/end
          const fade = Math.min(p * 4, (1 - p) * 4, 1);
          conn.pulse.traverse(function (child) {
            if (child.isMesh) child.material.opacity = fade * 0.9;
          });
          conn.pulse.scale.setScalar(0.8 + fade * 0.4);
        }

        // Highlight arc near the aircraft
        const p = arc.userData.progress;
        const highlight = Math.max(0, 1 - Math.abs(p - 0.5) * 2);
        arc.material.opacity = 0.15 + highlight * 0.4;
      });

      renderer.render(scene, camera);
      requestAnimationFrame(render);
      } catch(e) { console.warn("render error:", e.message); requestAnimationFrame(render); }
    }

    if (typeof IntersectionObserver !== "undefined") {
      const visObserver = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && running) {
          oldTime = clock.getElapsedTime();
          requestAnimationFrame(render);
        }
      }, { threshold: 0 });
      visObserver.observe(container);
    }

    try { init(); } catch(e) { console.error("WorldRenderer init error:", e.message); }

    // Fallback: start rendering immediately
    oldTime = clock.getElapsedTime();
    requestAnimationFrame(render);

    this.setScrollProgress = function (p) { scrollProgress = Math.min(Math.max(p, 0), 1); };
    this.stop = function () { running = false; };
    this.start = function () { if (!running) { running = true; oldTime = clock.getElapsedTime(); render(); } };
    this.dispose = function () {
      running = false;
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }

  global.WorldRenderer = WorldRenderer;
})(window);
