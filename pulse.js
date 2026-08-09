/**
 * Pulse renderer — Rolex 3D watch for Pulse Wearables.
 * Loads the three.js webgl_watch rolex.glb model with DRACO decompression,
 * studio lighting, procedural environment reflections, slow rotation,
 * heartbeat pulse, and scroll parallax.
 */
(function (global) {
  "use strict";

  function PulseRenderer(container, options) {
    options = options || {};
    const isLowres = options.lowres || false;

    const THREE = global.THREE;
    if (!THREE) { console.error("THREE is not loaded"); return; }

    let scene, camera, renderer;
    let watchGroup;
    let running = true;
    let visible = true;
    let scrollProgress = 0;
    let lastTime = 0;
    let modelLoaded = false;
    let renderCount = 0;
    let isDragging = false;
    let lastMouseX = 0, lastMouseY = 0;
    let mouseRotX = 0, mouseRotY = 0;
    let autoRotate = true;

    function init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(55, 1, 0.1, 20);
      camera.position.set(0.35, -0.65, -0.65);
      camera.lookAt(0, -0.1, 0);

      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: !isLowres });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x0a0a12, 1.0);
      renderer.toneMapping = THREE.NeutralToneMapping || THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.7;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      // ---- Environment map from lobe.hdr (same as three.js watch example) ----
      // Use blurred PNG for background (r128 has no backgroundBlurriness)
      var bgTex = new THREE.TextureLoader().load("lobe_bg.png", function (tex) {
        tex.mapping = THREE.EquirectangularReflectionMapping;
      });
      bgTex.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = bgTex;

      // Use HDR for environment reflections
      if (THREE.RGBELoader) {
        new THREE.RGBELoader().load("lobe.hdr", function (texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = texture;
          if (scene.environmentIntensity !== undefined) scene.environmentIntensity = 1.5;
        });
      } else {
        scene.environment = bgTex;
      }

      // ---- Lighting (matching official three.js watch example) ----
      const keyLight = new THREE.DirectionalLight(0xffffff, 6);
      keyLight.position.set(0.2, 0.6, 0.4);
      keyLight.castShadow = true;
      scene.add(keyLight);
      const shadow = keyLight.shadow;
      shadow.mapSize.width = shadow.mapSize.height = 2048;
      shadow.radius = 8;
      shadow.bias = -0.0005;
      shadow.camera.near = 0.1;
      shadow.camera.far = 2;
      shadow.camera.right = shadow.camera.top = 0.5;
      shadow.camera.left = shadow.camera.bottom = -0.5;

      const pointLight = new THREE.PointLight(0x7b8cad, 1, 0, 2);
      pointLight.position.set(-0.3, -0.2, -0.2);
      scene.add(pointLight);

      // Moving point lights for dynamic reflections
      const movingLight1 = new THREE.PointLight(0x00ffaa, 3.0, 5);
      scene.add(movingLight1);
      const movingLight2 = new THREE.PointLight(0xff4466, 2.0, 5);
      scene.add(movingLight2);

      // ---- Placeholder group (used before model loads) ----
      watchGroup = new THREE.Group();
      watchGroup.position.x = -0.2;
      scene.add(watchGroup);
      watchGroup.userData.movingLight1 = movingLight1;
      watchGroup.userData.movingLight2 = movingLight2;

      // ---- Load Rolex model ----
      try {
        const GLTFLoader = THREE.GLTFLoader;
        const DRACOLoader = THREE.DRACOLoader;
        if (GLTFLoader && DRACOLoader) {
          const loader = new GLTFLoader();
          loader.setDRACOLoader(new DRACOLoader().setDecoderPath("draco/"));
          loader.load("rolex.glb", function (gltf) {
            console.log("PulseRenderer: rolex.glb loaded");
            const model = gltf.scene;
            model.rotation.x = 0;

            const meshes = {};
            model.traverse(function (child) {
              if (child.isMesh || child.isGroup) {
                if (child.isMesh) {
                  child.material.vertexColors = false;
                  if (child.name !== "glass" && child.name !== "floor") {
                    child.receiveShadow = true;
                    child.castShadow = true;
                  }
                }
                meshes[child.name] = child;
              }
            });

            // Glass material matching official example
            if (meshes.glass) {
              meshes.glass.material = new THREE.MeshPhysicalMaterial({
                color: 0x020205,
                transparent: true,
                opacity: 0.8,
                metalness: 0,
                roughness: 0,
                iridescence: 0.3,
                clearcoat: 1.0,
                blending: THREE.AdditiveBlending
              });
            }

            // Remove floor if present
            if (meshes.floor) meshes.floor.visible = false;

            watchGroup.add(model);
            watchGroup.userData.meshes = meshes;
            modelLoaded = true;
            console.log("PulseRenderer: model added to scene, renderCount=", renderCount);
          }, function (progress) {
            if (progress.total) {
              console.log("PulseRenderer: loading", (progress.loaded / progress.total * 100).toFixed(0) + "%");
            }
          }, function (err) {
            console.warn("PulseRenderer: Failed to load rolex.glb:", err);
          });
        } else {
          console.warn("GLTFLoader or DRACOLoader not available");
        }
      } catch (e) {
        console.warn("Model loading error:", e);
      }

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
        new ResizeObserver(onResize).observe(container);
      }

      // ---- Mouse drag rotation ----
      function onPointerDown(e) {
        isDragging = true;
        autoRotate = false;
        const p = e.touches ? e.touches[0] : e;
        lastMouseX = p.clientX;
        lastMouseY = p.clientY;
      }
      function onPointerMove(e) {
        if (!isDragging) return;
        const p = e.touches ? e.touches[0] : e;
        const dx = p.clientX - lastMouseX;
        const dy = p.clientY - lastMouseY;
        mouseRotY += dx * 0.01;
        mouseRotX += dy * 0.01;
        lastMouseX = p.clientX;
        lastMouseY = p.clientY;
      }
      function onPointerUp() { isDragging = false; }
      renderer.domElement.addEventListener("mousedown", onPointerDown);
      renderer.domElement.addEventListener("mousemove", onPointerMove);
      renderer.domElement.addEventListener("mouseup", onPointerUp);
      renderer.domElement.addEventListener("mouseleave", onPointerUp);
      renderer.domElement.addEventListener("touchstart", onPointerDown, { passive: true });
      renderer.domElement.addEventListener("touchmove", onPointerMove, { passive: true });
      renderer.domElement.addEventListener("touchend", onPointerUp);

      lastTime = performance.now() / 1000;
      render();
    }

    function render() {
      if (!running) return;
      if (!visible) { requestAnimationFrame(render); return; }
      const now = performance.now() / 1000;
      const delta = Math.min(now - lastTime, 0.1);
      lastTime = now;
      renderCount++;

      // Scroll parallax — zoom in at middle, back out at end, with movement throughout
      var sp = scrollProgress;
      var zoomCurve = Math.sin(sp * Math.PI); // 0→1→0, peaks at 50%
      camera.position.x = 0.35 + zoomCurve * 0.6;
      camera.position.y = -0.65 - zoomCurve * 0.5;
      camera.position.z = -0.65 - zoomCurve * 2.5; // much closer at mid-scroll
      camera.lookAt(0, -0.1, 0);

      // Rotation — moves around during scroll but returns to start orientation at end
      if (renderCount === 1) {
        mouseRotY = 3.7;
        mouseRotX = -1.8;
      }
      const rotSpeed = 1 + sp * 3;
      // Scroll-driven swing that goes out and comes back (sine-based, ends at 0)
      var swingX = Math.sin(sp * Math.PI) * 1.2;       // swings out, returns
      var swingY = Math.sin(sp * Math.PI) * 0.8;       // swings out, returns
      var swingZ = Math.sin(sp * Math.PI * 2) * 0.3;   // wobble mid-scroll
      watchGroup.rotation.x = -2 + swingX + Math.sin(now * 0.17 * rotSpeed) * 0.3 + Math.sin(now * 0.08 * rotSpeed) * 0.15;
      watchGroup.rotation.y = -2.64 + swingY + Math.sin(now * 0.12 * rotSpeed) * 0.08 + Math.cos(now * 0.07 * rotSpeed) * 0.05;
      watchGroup.rotation.z = -12.5 + swingZ + Math.sin(now * 0.15 * rotSpeed) * 0.2 + Math.cos(now * 0.1 * rotSpeed) * 0.1;

      // Heartbeat pulse — irregular beat
      const beat1 = Math.sin(now * 2.3) * 0.5 + 0.5;
      const beat2 = Math.sin(now * 1.7 + 1.2) * 0.5 + 0.5;
      const beatEnv = beat1 * 0.6 + beat2 * 0.4;
      const pulseScale = 1 + beatEnv * 0.02;
      watchGroup.scale.set(pulseScale, pulseScale, pulseScale);

      // Move point lights for dynamic reflections
      const ml1 = watchGroup.userData.movingLight1;
      const ml2 = watchGroup.userData.movingLight2;
      if (ml1) {
        ml1.position.set(Math.cos(now * 0.7) * 1.5, Math.sin(now * 0.5) + 0.5, Math.sin(now * 0.7) * 1.5);
      }
      if (ml2) {
        ml2.position.set(Math.cos(now * 0.6 + Math.PI) * 1.5, Math.sin(now * 0.4 + Math.PI) - 0.5, Math.sin(now * 0.6 + Math.PI) * 1.5);
      }

      // Real-time clock hands
      if (watchGroup.userData.meshes) {
        var m = watchGroup.userData.meshes;
        var d = new Date();
        var hour = d.getHours(); if (hour >= 12) hour -= 12;
        var minute = d.getMinutes();
        var second = d.getSeconds();
        var day = d.getDay(); if (day > 30) day = 30;
        var month = d.getMonth();
        var milli = d.getMilliseconds();
        var torad = Math.PI / 180;
        if (m.hour) m.hour.rotation.y = -hour * 30 * torad;
        if (m.minute) m.minute.rotation.y = -minute * 6 * torad;
        if (m.second) m.second.rotation.y = -second * 6 * torad;
        if (m.mini_03) m.mini_03.rotation.y = -day * 12 * torad;
        if (m.mini_02) m.mini_02.rotation.y = -month * 30 * torad;
        if (m.mini_01) m.mini_01.rotation.y = -milli * 0.36;
      }

      renderer.render(scene, camera);
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

  global.PulseRenderer = PulseRenderer;
})(window);
