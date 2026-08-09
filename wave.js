/**
 * Wave renderer — 3D fat lines for Wavelength Records.
 * Matches the original three.js webgl_lines_fat_raycasting demo.
 */
(function (global) {
  "use strict";

  function WaveRenderer(container, options) {
    options = options || {};
    const isLowres = options.lowres || false;

    const THREE = global.THREE;
    const POSTPROCESSING = global.POSTPROCESSING;
    if (!THREE) { console.error("THREE is not loaded"); return; }

    let scene, camera, renderer, composer;
    let line, matLine;
    let bokehMat, bokehPoints;
    let running = true;
    let visible = true;
    let scrollProgress = 0;
    let lastTime = 0;

    function init() {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x05050a, 0.012);

      camera = new THREE.PerspectiveCamera(40, 1, 1, 1000);
      camera.position.set(-40, 0, 60);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: !isLowres });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x05050a, 1.0);
      container.appendChild(renderer.domElement);

      // ---- Bokeh background: floating out-of-focus light circles ----
      var bokehCount = isLowres ? 80 : 160;
      var bokehGeo = new THREE.BufferGeometry();
      var bokehPos = [];
      var bokehCol = [];
      var bokehSize = [];
      var bokehPhase = [];
      var bokehColors = [
        [0.3, 0.6, 1.0],  // blue
        [0.6, 0.3, 1.0],  // purple
        [0.1, 0.8, 0.6],  // teal
        [1.0, 0.4, 0.5],  // pink
        [0.8, 0.7, 0.3],  // gold
        [0.2, 0.4, 0.9],  // deep blue
      ];
      for (var i = 0; i < bokehCount; i++) {
        bokehPos.push(
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 80 - 10
        );
        var c = bokehColors[Math.floor(Math.random() * bokehColors.length)];
        bokehCol.push(c[0], c[1], c[2]);
        bokehSize.push(20 + Math.random() * 60);
        bokehPhase.push(Math.random() * Math.PI * 2);
      }
      bokehGeo.setAttribute('position', new THREE.Float32BufferAttribute(bokehPos, 3));
      bokehGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(bokehCol, 3));
      bokehGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(bokehSize, 1));
      bokehGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(bokehPhase, 1));

      bokehMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: [
          'attribute vec3 aColor;',
          'attribute float aSize;',
          'attribute float aPhase;',
          'uniform float uTime;',
          'uniform float uPixelRatio;',
          'varying vec3 vColor;',
          'varying float vAlpha;',
          'void main() {',
          '  vColor = aColor;',
          '  vec3 pos = position;',
          '  pos.x += sin(uTime * 0.3 + aPhase) * 3.0;',
          '  pos.y += cos(uTime * 0.2 + aPhase * 1.3) * 2.0;',
          '  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);',
          '  float dist = -mvPos.z;',
          '  gl_PointSize = aSize * uPixelRatio * (1200.0 / dist);',
          '  vAlpha = smoothstep(80.0, 20.0, dist) * 0.8;',
          '  gl_Position = projectionMatrix * mvPos;',
          '}'
        ].join('\n'),
        fragmentShader: [
          'varying vec3 vColor;',
          'varying float vAlpha;',
          'void main() {',
          '  vec2 uv = gl_PointCoord - 0.5;',
          '  float d = length(uv);',
          '  if (d > 0.5) discard;',
          '  float soft = smoothstep(0.5, 0.0, d);',
          '  soft = pow(soft, 1.5);',
          '  gl_FragColor = vec4(vColor, soft * vAlpha);',
          '}'
        ].join('\n'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      bokehPoints = new THREE.Points(bokehGeo, bokehMat);
      bokehPoints.renderOrder = -1;
      scene.add(bokehPoints);

      // ---- Spiral curve (same as raycasting demo) ----
      const positions = [];
      const colors = [];
      const points = [];
      for (let i = -50; i < 50; i++) {
        const t = i / 3;
        points.push(new THREE.Vector3(t * Math.sin(2 * t), t, t * Math.cos(2 * t)));
      }

      const spline = new THREE.CatmullRomCurve3(points);
      const divisions = Math.round(3 * points.length);
      const point = new THREE.Vector3();
      const color = new THREE.Color();

      for (let i = 0; i < divisions; i++) {
        const t = i / divisions;
        spline.getPoint(t, point);
        positions.push(point.x, point.y, point.z);
        color.setHSL(t, 1.0, 0.5);
        colors.push(color.r, color.g, color.b);
      }

      matLine = new THREE.LineMaterial({
        color: 0xffffff,
        linewidth: 22,
        vertexColors: true,
        alphaToCoverage: true,
      });
      matLine.resolution.set(container.clientWidth || 800, container.clientHeight || 600);

      const segmentsGeometry = new THREE.LineSegmentsGeometry();
      segmentsGeometry.setPositions(positions);
      segmentsGeometry.setColors(colors);

      line = new THREE.LineSegments2(segmentsGeometry, matLine);
      line.computeLineDistances();
      line.scale.set(1, 1, 1);
      scene.add(line);

      // ---- Resize ----
      function onResize() {
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 600;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if (composer) composer.setSize(w, h);
        matLine.resolution.set(w, h);
      }
      onResize();
      global.addEventListener("resize", onResize);
      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(onResize).observe(container);
      }

      // ---- Bloom (optional — may fail with incompatible postprocessing build) ----
      try {
        if (POSTPROCESSING) {
          const bloomEffect = new POSTPROCESSING.BloomEffect({
            blendFunction: POSTPROCESSING.BlendFunction.ADD,
            kernelSize: POSTPROCESSING.KernelSize.HUGE,
            useLuminanceFilter: true,
            luminanceThreshold: 0.05,
            luminanceSmoothing: 0.85,
          });
          bloomEffect.blendMode.opacity.value = 2.5;

          const effectPass = new POSTPROCESSING.EffectPass(camera, bloomEffect);
          effectPass.renderToScreen = true;

          composer = new POSTPROCESSING.EffectComposer(renderer);
          composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));
          composer.addPass(effectPass);
        }
      } catch (e) {
        console.warn("Bloom unavailable, rendering without postprocessing:", e.message);
        composer = null;
      }

      lastTime = performance.now() / 1000;
      render();
    }

    function render() {
      if (!running || !visible) return;
      const now = performance.now() / 1000;
      const delta = Math.min(now - lastTime, 0.1);
      lastTime = now;

      // Animate bokeh
      bokehMat.uniforms.uTime.value = now;
      // Parallax — shift bokeh slightly with scroll
      bokehPoints.position.y = scrollProgress * 10;

      // Subtle camera parallax on scroll — move camera up/down
      camera.position.y = scrollProgress * 20;

      // Animate the spiral — rotate on multiple axes
      // Scroll adds extra rotation so the spiral turns as you scroll
      line.rotation.y += delta * 0.25 + scrollProgress * 0.02;
      line.rotation.x = Math.sin(now * 0.4) * 0.25 + scrollProgress * 0.3;
      line.rotation.z = Math.cos(now * 0.3) * 0.15 + scrollProgress * 0.2;

      // Irregular beat compress/expand — not a steady pattern
      // Multiple sine layers at non-harmonic ratios for unpredictable feel
      const beat1 = Math.sin(now * 2.3) * 0.5 + 0.5;       // ~2.3Hz, irregular
      const beat2 = Math.sin(now * 1.7 + 1.2) * 0.5 + 0.5;  // offset, non-harmonic
      const beat3 = Math.sin(now * 3.1 + 0.5) * 0.5 + 0.5;  // faster, sparse
      const beatEnv = beat1 * 0.5 + beat2 * 0.3 + beat3 * 0.2;

      // Compress on Y (vertical squeeze), expand on X/Z when beat hits
      const compress = 1 - beatEnv * 0.25;
      const expand = 1 + beatEnv * 0.12;
      line.scale.set(expand, compress, expand);

      if (composer) {
        composer.render(delta);
      } else {
        renderer.render(scene, camera);
      }
      requestAnimationFrame(render);
    }

    if (typeof IntersectionObserver !== "undefined") {
      const visObserver = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && running) {
          lastTime = performance.now() / 1000;
          requestAnimationFrame(render);
        }
      }, { threshold: 0 });
      visObserver.observe(container);
    }

    this.setScrollProgress = function (p) {
      scrollProgress = Math.min(Math.max(p, 0), 1);
    };

    init();

    this.stop = function () { running = false; };
    this.start = function () { if (!running) { running = true; lastTime = performance.now() / 1000; render(); } };
    this.dispose = function () {
      running = false;
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }

  global.WaveRenderer = WaveRenderer;
})(window);
