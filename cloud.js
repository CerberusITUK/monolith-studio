/**
 * Nebula Cloud renderer — adapted from Red Stapler nebula tutorial.
 * Uses smoke.png textured planes, colored point lights, FogExp2,
 * and postprocessing bloom + star texture overlay.
 *
 * Teal/cyan/green palette for the Strata Finance project page.
 */
(function (global) {
  "use strict";

  function CloudRenderer(container, options) {
    options = options || {};
    const isLowres = options.lowres || false;

    const THREE = global.THREE;
    const POSTPROCESSING = global.POSTPROCESSING;
    if (!THREE) { console.error("THREE is not loaded"); return; }

    let scene, camera, renderer, composer;
    let cloudParticles = [];
    let running = true;
    let visible = true;

    function init() {
      scene = new THREE.Scene();
      lightningLight = new THREE.PointLight(0xffffff, 0, 800, 2);
      scene.add(lightningLight);
      lightningMaterial = new THREE.MeshBasicMaterial({
        color: 0xB0FFFF,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      camera = new THREE.PerspectiveCamera(60, 1, 1, 2000);
      camera.position.z = 300;
      camera.rotation.x = 0.76;
      camera.rotation.y = 0.02;
      camera.rotation.z = 0.27;

      let ambient = new THREE.AmbientLight(0x333333);
      scene.add(ambient);

      let directionalLight = new THREE.DirectionalLight(0x00bbaa);
      directionalLight.position.set(0, 0, 1);
      scene.add(directionalLight);

      // Vibrant rainbow palette lights
      let tealLight = new THREE.PointLight(0x00ddcc, 50, 450, 1.7);
      tealLight.position.set(200, 300, 100);
      scene.add(tealLight);

      let greenLight = new THREE.PointLight(0x33ff44, 50, 450, 1.7);
      greenLight.position.set(100, 300, 100);
      scene.add(greenLight);

      let cyanLight = new THREE.PointLight(0x00b8ff, 50, 450, 1.7);
      cyanLight.position.set(300, 300, 200);
      scene.add(cyanLight);

      let magentaLight = new THREE.PointLight(0xff3399, 40, 450, 1.7);
      magentaLight.position.set(-200, 300, 150);
      scene.add(magentaLight);

      let purpleLight = new THREE.PointLight(0x9944ff, 40, 450, 1.7);
      purpleLight.position.set(-100, 300, 200);
      scene.add(purpleLight);

      let orangeLight = new THREE.PointLight(0xff6600, 80, 500, 1.7);
      orangeLight.position.set(150, 200, 50);
      scene.add(orangeLight);

      let redLight = new THREE.PointLight(0xff2200, 70, 500, 1.7);
      redLight.position.set(-100, 150, 80);
      scene.add(redLight);

      let deepOrangeLight = new THREE.PointLight(0xff4400, 60, 450, 1.7);
      deepOrangeLight.position.set(50, 350, 150);
      scene.add(deepOrangeLight);

      let yellowLight = new THREE.PointLight(0xffee00, 35, 450, 1.7);
      yellowLight.position.set(-150, 250, 100);
      scene.add(yellowLight);

      let blueLight = new THREE.PointLight(0x3366ff, 40, 450, 1.7);
      blueLight.position.set(250, 350, 250);
      scene.add(blueLight);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isLowres });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      scene.fog = new THREE.FogExp2(0x000000, 0.001);
      renderer.setClearColor(0x000000, 1);
      container.appendChild(renderer.domElement);

      function onResize() {
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 600;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if (composer) composer.setSize(w, h);
      }
      onResize();
      global.addEventListener("resize", onResize);
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(onResize);
        ro.observe(container);
      }

      let loader = new THREE.TextureLoader();
      loader.load("smoke.png", function (texture) {
        let cloudGeo = new THREE.PlaneBufferGeometry(500, 500);
        let cloudMaterial = new THREE.MeshLambertMaterial({
          map: texture,
          transparent: true,
        });

        let numClouds = isLowres ? 25 : 50;
        for (let p = 0; p < numClouds; p++) {
          let cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
          cloud.position.set(
            Math.random() * 800 - 400,
            500,
            Math.random() * 500 - 500
          );
          cloud.rotation.x = 0.76;
          cloud.rotation.y = 0.02;
          cloud.rotation.z = Math.random() * 2 * Math.PI;
          cloud.material.opacity = 0.35;
          cloudParticles.push(cloud);
          scene.add(cloud);
        }
      });

      loader.load("stars.jpg", function (texture) {
        const textureEffect = new POSTPROCESSING.TextureEffect({
          blendFunction: POSTPROCESSING.BlendFunction.COLOR_DODGE,
          texture: texture,
        });
        textureEffect.blendMode.opacity.value = 0.2;

        const bloomEffect = new POSTPROCESSING.BloomEffect({
          blendFunction: POSTPROCESSING.BlendFunction.COLOR_DODGE,
          kernelSize: POSTPROCESSING.KernelSize.SMALL,
          useLuminanceFilter: true,
          luminanceThreshold: 0.3,
          luminanceSmoothing: 0.75,
        });
        bloomEffect.blendMode.opacity.value = 1.5;

        let effectPass = new POSTPROCESSING.EffectPass(
          camera,
          bloomEffect,
          textureEffect
        );
        effectPass.renderToScreen = true;

        composer = new POSTPROCESSING.EffectComposer(renderer);
        composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));
        composer.addPass(effectPass);

        render();
      });
    }

    let oldTime = 0;
    const clock = new THREE.Clock();

    // ---- Lightning system (LightningStrike) ----
    let lightningStrike = null;
    let lightningMesh = null;
    let lightningLight = null;
    let lightningTimer = 0;
    let nextLightningAt = 2 + Math.random() * 4;
    let lightningStartTime = 0;
    let lightningDuration = 0.6;
    let lightningMaterial = null;

    function createLightningBolt() {
      var sx = Math.random() * 600 - 300;
      var sy = 400 + Math.random() * 200;
      var sz = Math.random() * 300 - 150;
      var ex = sx + (Math.random() - 0.5) * 200;
      var ey = sy - 300 - Math.random() * 200;
      var ez = sz + (Math.random() - 0.5) * 150;

      var rayParams = {
        sourceOffset: new THREE.Vector3(sx, sy, sz),
        destOffset: new THREE.Vector3(ex, ey, ez),
        radius0: 4,
        radius1: 1,
        minRadius: 0.5,
        maxIterations: 7,
        isEternal: false,
        birthTime: 0,
        deathTime: lightningDuration,
        propagationTimeFactor: 0.15,
        vanishingTimeFactor: 0.85,
        subrayPeriod: 3,
        subrayDutyCycle: 0.6,
        maxSubrayRecursion: 3,
        ramification: 7,
        recursionProbability: 0.6,
        roughness: 0.85,
        straightness: 0.6,
      };

      lightningStrike = new THREE.LightningStrike(rayParams);
      if (lightningMesh) {
        scene.remove(lightningMesh);
        lightningMesh.geometry.dispose();
      }
      lightningMesh = new THREE.Mesh(lightningStrike, lightningMaterial);
      lightningMesh.renderOrder = 10;
      scene.add(lightningMesh);

      lightningLight.position.set((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2);
      lightningLight.color.setHex(Math.random() > 0.5 ? 0x88ddff : 0xffcc88);

      lightningStartTime = lightningTimer;
    }

    function updateLightning(dt) {
      lightningTimer += dt;
      if (lightningStrike && lightningMesh) {
        var elapsed = lightningTimer - lightningStartTime;
        if (elapsed >= lightningDuration) {
          scene.remove(lightningMesh);
          lightningMesh.geometry.dispose();
          lightningMesh = null;
          lightningStrike = null;
          lightningLight.intensity = 0;
          nextLightningAt = lightningTimer + 2 + Math.random() * 5;
        } else {
          lightningStrike.update(elapsed);
          var flicker = Math.random() > 0.25 ? 1 : 0.5;
          var lifeFactor = 1 - (elapsed / lightningDuration);
          lightningMaterial.opacity = lifeFactor * flicker;
          lightningLight.intensity = lifeFactor * 400 * flicker;
        }
      } else if (lightningTimer >= nextLightningAt) {
        createLightningBolt();
      }
    }

    function render() {
      if (!running || !visible) return;
      const elapsed = clock.getElapsedTime();
      const dt = Math.min(elapsed - oldTime, 0.1);
      oldTime = elapsed;

      // Lightning strikes
      try { updateLightning(dt); } catch (e) { console.warn("Lightning error:", e); }

      // Parallax: move camera Y down based on scroll
      camera.position.y = scrollProgress * 80;

      // Move nebula clouds down as scroll progresses (lights stay static)
      for (let i = 0; i < cloudParticles.length; i++) {
        cloudParticles[i].position.y = 500 - scrollProgress * 200;
      }

      cloudParticles.forEach(function (p) {
        p.rotation.z -= 0.001;
      });

      if (composer) {
        composer.render(0.1);
      } else {
        renderer.render(scene, camera);
      }
      requestAnimationFrame(render);
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

    init();

    let scrollProgress = 0;
    this.setScrollProgress = function (p) {
      scrollProgress = Math.min(Math.max(p, 0), 1);
    };

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

  global.CloudRenderer = CloudRenderer;
})(window);
