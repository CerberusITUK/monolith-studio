(function (global) {
  "use strict";

  function ThreadRenderer(container, options) {
    options = options || {};
    const THREE = global.THREE;
    if (!THREE) { console.error("THREE is not loaded"); return; }

    let scene, camera, renderer, webGroup;
    let sceneRT, blurRTA, blurRTB, blurMat, compositeMat, dofScene, dofCamera, fsQuad;
    let dewMesh, twinkleMesh, twinkleMat, twinkleGeo;
    let nodes = [], edges = [], dewDescriptors = [], twinkleDescriptors = [];
    let frameFlatNodes = [];
    let running = true, visible = true, scrollProgress = 0;
    let mouseX = 0, mouseY = 0;
    let rtW, rtH, dpr;
    let clock;

    var RINGS = 20, SPOKES = 24, MAX_R = 4.6, HUB_R = 0.22;
    var GRAVITY = new THREE.Vector3(0, -0.0004, 0);
    var DAMPING = 0.975;
    var CONSTRAINT_ITERATIONS = 7;
    var WIND_AMPLITUDE = 0.005, WIND_SPEED = 0.12, WIND_WAVE_K = 0.6;
    var DROP_SPACING = 0.032, BASE_DROP_R = 0.027;

    function init() {
      var cw = container.clientWidth || 800;
      var ch = container.clientHeight || 600;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x05070c, 0.045);

      // Background — dusky gradient with bokeh glows
      var bgC = document.createElement('canvas');
      bgC.width = 1024; bgC.height = 683;
      var bgCtx = bgC.getContext('2d');
      var grad = bgCtx.createLinearGradient(0, 0, 0, bgC.height);
      grad.addColorStop(0, '#03050a');
      grad.addColorStop(0.55, '#070d16');
      grad.addColorStop(1, '#141008');
      bgCtx.fillStyle = grad;
      bgCtx.fillRect(0, 0, bgC.width, bgC.height);
      bgCtx.filter = 'blur(38px)';
      var blobColors = ['rgba(255,195,120,0.34)', 'rgba(130,175,255,0.28)', 'rgba(255,255,255,0.16)', 'rgba(110,210,185,0.22)'];
      for (var i = 0; i < 18; i++) {
        var bx = Math.random() * bgC.width;
        var by = bgC.height * (0.2 + Math.random() * 0.8);
        var br = 55 + Math.random() * 130;
        var bg = bgCtx.createRadialGradient(bx, by, 0, bx, by, br);
        bg.addColorStop(0, blobColors[Math.floor(Math.random() * blobColors.length)]);
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        bgCtx.fillStyle = bg;
        bgCtx.beginPath(); bgCtx.arc(bx, by, br, 0, Math.PI * 2); bgCtx.fill();
      }
      bgCtx.filter = 'none';
      scene.background = new THREE.CanvasTexture(bgC);

      camera = new THREE.PerspectiveCamera(50, cw / ch, 0.1, 100);
      camera.position.set(0, 0.6, 11);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(global.devicePixelRatio, 2));
      renderer.setSize(cw, ch);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      // DOF post-processing
      function makeRT(w, h, withDepth) {
        var rt = new THREE.WebGLRenderTarget(w, h, {
          minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat, type: THREE.UnsignedByteType
        });
        if (withDepth) rt.depthTexture = new THREE.DepthTexture();
        return rt;
      }
      dpr = Math.min(global.devicePixelRatio, 2);
      rtW = Math.floor(cw * dpr); rtH = Math.floor(ch * dpr);
      sceneRT = makeRT(rtW, rtH, true);
      blurRTA = makeRT(rtW, rtH, false);
      blurRTB = makeRT(rtW, rtH, false);

      var fsVert = "varying vec2 vUv;\nvoid main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}";
      blurMat = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, direction: { value: new THREE.Vector2(1, 0) }, resolution: { value: new THREE.Vector2(rtW, rtH) } },
        vertexShader: fsVert,
        fragmentShader: "uniform sampler2D tDiffuse;uniform vec2 direction;uniform vec2 resolution;varying vec2 vUv;\nvoid main(){vec2 t=direction/resolution;vec4 s=vec4(0.0);\ns+=texture2D(tDiffuse,vUv-t*3.0)*0.06;s+=texture2D(tDiffuse,vUv-t*2.0)*0.12;s+=texture2D(tDiffuse,vUv-t*1.0)*0.18;\ns+=texture2D(tDiffuse,vUv)*0.28;\ns+=texture2D(tDiffuse,vUv+t*1.0)*0.18;s+=texture2D(tDiffuse,vUv+t*2.0)*0.12;s+=texture2D(tDiffuse,vUv+t*3.0)*0.06;\ngl_FragColor=s;}",
        depthTest: false, depthWrite: false
      });
      compositeMat = new THREE.ShaderMaterial({
        uniforms: { tSharp: { value: null }, tBlur: { value: null }, tDepth: { value: null }, cameraNear: { value: camera.near }, cameraFar: { value: camera.far }, focusDistance: { value: 10 }, focusRange: { value: 3.6 } },
        vertexShader: fsVert,
        fragmentShader: "uniform sampler2D tSharp;uniform sampler2D tBlur;uniform sampler2D tDepth;uniform float cameraNear;uniform float cameraFar;uniform float focusDistance;uniform float focusRange;varying vec2 vUv;\nfloat readDepth(vec2 uv){float z=texture2D(tDepth,uv).x;float v=(cameraNear*cameraFar)/((cameraFar-cameraNear)*z-cameraFar);return -v;}\nvoid main(){float dist=readDepth(vUv);float coc=clamp(abs(dist-focusDistance)/focusRange,0.0,1.0);coc=coc*coc;\nvec4 sc=texture2D(tSharp,vUv);vec4 bc=texture2D(tBlur,vUv);vec4 r=mix(sc,bc,coc);\nvec2 c=vUv-0.5;float vig=1.0-smoothstep(0.35,0.92,length(c)*1.15);r.rgb*=mix(0.62,1.0,vig);\ngl_FragColor=r;}",
        depthTest: false, depthWrite: false
      });
      dofScene = new THREE.Scene();
      dofCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      fsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat);
      dofScene.add(fsQuad);

      // Lighting
      scene.add(new THREE.AmbientLight(0x2a3548, 0.34));
      var key = new THREE.DirectionalLight(0xe8f0ff, 0.75);
      key.position.set(1.5, 3.5, -7); scene.add(key);
      var fill = new THREE.DirectionalLight(0xcfe0ff, 0.28);
      fill.position.set(-1, 1.5, 8); scene.add(fill);
      var rim = new THREE.PointLight(0x6f8fce, 0.18, 11);
      rim.position.set(-4.5, -2, 3.5); scene.add(rim);
      var glow = new THREE.PointLight(0xffe9c0, 0.08, 9);
      glow.position.set(1, -1, 4.5); scene.add(glow);
      var spA = new THREE.PointLight(0xffffff, 0.12, 7);
      spA.position.set(2.4, 2.6, 4); scene.add(spA);
      var spB = new THREE.PointLight(0xcfe4ff, 0.08, 7);
      spB.position.set(-2.6, -1.8, 4.5); scene.add(spB);

      // Dust
      (function () {
        var N = 220, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3);
        for (var i = 0; i < N; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 40;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        var dc = document.createElement('canvas'); dc.width = 64; dc.height = 64;
        var dctx = dc.getContext('2d');
        var dg = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        dg.addColorStop(0, 'rgba(255,255,255,0.9)'); dg.addColorStop(1, 'rgba(255,255,255,0)');
        dctx.fillStyle = dg; dctx.fillRect(0, 0, 64, 64);
        var tex = new THREE.CanvasTexture(dc);
        var mat = new THREE.PointsMaterial({ size: 0.09, map: tex, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xaad0ff });
        scene.add(new THREE.Points(geo, mat));
      })();

      webGroup = new THREE.Group();
      scene.add(webGroup);

      buildWeb();

      // Position top-right, start at 0.5 scale
      webGroup.position.set(2.5, 1.8, 0);
      webGroup.scale.set(0.5, 0.5, 0.5);

      function onResize() {
        var w = container.clientWidth || 800;
        var h = container.clientHeight || 600;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        dpr = Math.min(global.devicePixelRatio, 2);
        rtW = Math.floor(w * dpr); rtH = Math.floor(h * dpr);
        sceneRT.setSize(rtW, rtH); blurRTA.setSize(rtW, rtH); blurRTB.setSize(rtW, rtH);
        blurMat.uniforms.resolution.value.set(rtW, rtH);
      }
      global.addEventListener("resize", onResize);
      if (typeof ResizeObserver !== "undefined") {
        var ro = new ResizeObserver(onResize); ro.observe(container);
      }

      global.addEventListener('mousemove', function (e) {
        mouseX = (e.clientX / global.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / global.innerHeight - 0.5) * 2;
      });
    }

    function buildWeb() {
      function computeScreenEdgeRadius(theta) {
        var cx = Math.cos(theta), cy = Math.sin(theta);
        var scale = 1 / Math.max(Math.abs(cx), Math.abs(cy));
        var margin = 1.4;
        var ndc = new THREE.Vector3(cx * scale * margin, cy * scale * margin, 0.5).unproject(camera);
        var dir = ndc.clone().sub(camera.position).normalize();
        var pt = camera.position.clone().addScaledVector(dir, 11);
        pt.z = 0;
        return pt.length();
      }

      var shapeSeed0 = Math.random() * Math.PI * 2;
      var shapeSeed1 = Math.random() * Math.PI * 2;
      var shapeSeed2 = Math.random() * Math.PI * 2;
      var shapeSeed3 = Math.random() * Math.PI * 2;
      function shapeWobble(angle) {
        return 1 + 0.34 * Math.sin(angle * 1 + shapeSeed0) + 0.22 * Math.sin(angle * 2 + shapeSeed1)
          + 0.15 * Math.sin(angle * 3 - shapeSeed2) + 0.09 * Math.sin(angle * 7 + shapeSeed3);
      }

      var spokeJitter = [];
      for (var s = 0; s < SPOKES; s++) spokeJitter.push((Math.random() - 0.5) * 0.42);

      var spokeEdgeR = [];
      for (var s2 = 0; s2 < SPOKES; s2++) {
        var angle = (s2 / SPOKES) * Math.PI * 2 + spokeJitter[s2];
        spokeEdgeR.push(computeScreenEdgeRadius(angle));
      }

      function ringRadius(r, s) {
        var t = r / (RINGS - 1);
        return HUB_R + (spokeEdgeR[s] - HUB_R) * Math.pow(t, 1.05);
      }

      function lerpAngle(a, b, t) {
        var d = b - a;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return a + d * t;
      }
      function angleDiff(a, b) {
        var d = Math.abs(a - b) % (Math.PI * 2);
        if (d > Math.PI) d = Math.PI * 2 - d;
        return d;
      }

      var DETACH_CENTER = Math.PI * 1.22;
      var DETACH_HALFWIDTH = Math.PI / 2.5;
      var HUB = 0;
      nodes.push({ pos: new THREE.Vector3(0, 0, 0), oldPos: new THREE.Vector3(0, 0, 0), fixed: false, angle: 0, ampScale: 0.6 });
      var detachedIndices = [];
      var grid = [];

      for (var r = 0; r < RINGS; r++) {
        grid.push([]);
        for (var s3 = 0; s3 < SPOKES; s3++) {
          var ang = (s3 / SPOKES) * Math.PI * 2 + spokeJitter[s3];
          var t = r / (RINGS - 1);
          var wobble = 1 + (shapeWobble(ang) - 1) * (1 - t);
          var radius = ringRadius(r, s3) * wobble;
          var isOuter = r === RINGS - 1;
          var jitter = isOuter ? 0.02 : 0.2;
          var zJitter = isOuter ? 0 : 0.16;
          var x = Math.cos(ang) * radius + (Math.random() - 0.5) * jitter;
          var y = Math.sin(ang) * radius + (Math.random() - 0.5) * jitter;
          var z = (Math.random() - 0.5) * zJitter;
          var nodeFixed = isOuter, nodeAmpScale = isOuter ? 0 : 1, wasDetached = false;

          if (isOuter) {
            var baseAngle = (s3 / SPOKES) * Math.PI * 2;
            var d = angleDiff(baseAngle, DETACH_CENTER);
            if (d < DETACH_HALFWIDTH) {
              var depth = 1 - d / DETACH_HALFWIDTH;
              var pull = 0.3 + Math.random() * 0.3;
              x *= pull; y *= pull;
              x += depth * 2.6; y -= depth * 0.55;
              nodeFixed = false; nodeAmpScale = 0.5; wasDetached = true;
            }
          }

          var idx = nodes.length;
          var pos = new THREE.Vector3(x, y, z);
          nodes.push({ pos: pos, oldPos: pos.clone(), fixed: nodeFixed, angle: ang, ampScale: nodeAmpScale });
          if (wasDetached) detachedIndices.push(idx);
          grid[r].push(idx);
        }
      }

      function subdivideEdge(iA, iB, subdivisions, slackFactor, ampOverride, kind) {
        var posA = nodes[iA].pos, posB = nodes[iB].pos;
        var totalDist = posA.distanceTo(posB);
        var segRest = (totalDist * slackFactor) / subdivisions;
        var k2 = kind || 'structural';
        var flatten = k2 === 'frame';
        var prev = iA;
        for (var k = 1; k < subdivisions; k++) {
          var t2 = k / subdivisions;
          var p = posA.clone().lerp(posB, t2);
          p.y -= 0.0008 * Math.sin(t2 * Math.PI);
          if (flatten) p.z = 0;
          var idx2 = nodes.length;
          nodes.push({ pos: p, oldPos: p.clone(), fixed: false, angle: lerpAngle(nodes[iA].angle, nodes[iB].angle, t2), ampScale: ampOverride !== undefined ? ampOverride : 0.85 });
          if (flatten) frameFlatNodes.push(idx2);
          edges.push([prev, idx2, segRest, k2]);
          prev = idx2;
        }
        edges.push([prev, iB, segRest, k2]);
      }

      function hangLooseThread(originIdx, length) {
        var originPos = nodes[originIdx].pos;
        var dropDir = new THREE.Vector3((Math.random() - 0.5) * 0.12, -1, (Math.random() - 0.5) * 0.12).normalize();
        var tipPos = originPos.clone().add(dropDir.multiplyScalar(length));
        var tipIdx = nodes.length;
        nodes.push({ pos: tipPos, oldPos: tipPos.clone(), fixed: false, angle: nodes[originIdx].angle, ampScale: 0.08 });
        var subdiv = Math.max(2, Math.round(length / 0.15));
        subdivideEdge(originIdx, tipIdx, subdiv, 1.05 + Math.random() * 0.12, 0.08, 'loose');
      }

      var RADIAL_SUBDIV = 3, RADIAL_SLACK = 1.0003;
      var SPIRAL_SUBDIV = 9, SPIRAL_SLACK = 1.02;
      var FRAME_SUBDIV = 3, FRAME_SLACK = 1.0001;
      var RADIAL_GAP_CHANCE = 0.035, SPIRAL_GAP_CHANCE = 0.08, BROKEN_END_CHANCE = 0.4;

      for (var s4 = 0; s4 < SPOKES; s4++) {
        var prev = HUB;
        for (var r2 = 0; r2 < RINGS; r2++) {
          var cur = grid[r2][s4];
          if (r2 > 1 && Math.random() < RADIAL_GAP_CHANCE) {
            if (Math.random() < BROKEN_END_CHANCE) hangLooseThread(prev, 0.3 + Math.random() * 1.1);
          } else {
            subdivideEdge(prev, cur, RADIAL_SUBDIV, RADIAL_SLACK, undefined, 'radial');
          }
          prev = cur;
        }
      }

      for (var r3 = 1; r3 < RINGS; r3++) {
        for (var s5 = 0; s5 < SPOKES; s5++) {
          var a = grid[r3][s5], b = grid[r3][(s5 + 1) % SPOKES];
          if (Math.random() < SPIRAL_GAP_CHANCE) {
            if (Math.random() < BROKEN_END_CHANCE) hangLooseThread(Math.random() < 0.5 ? a : b, 0.25 + Math.random() * 1.3);
            continue;
          }
          subdivideEdge(a, b, SPIRAL_SUBDIV, SPIRAL_SLACK, undefined, 'spiral');
        }
      }

      var TETHER_CENTER = -Math.PI / 4, TETHER_HALFWIDTH = Math.PI / 7;
      var tetherAnchors = [];
      for (var s6 = 0; s6 < SPOKES; s6++) {
        var baseAngle2 = (s6 / SPOKES) * Math.PI * 2;
        if (angleDiff(baseAngle2, TETHER_CENTER) < TETHER_HALFWIDTH) tetherAnchors.push(grid[RINGS - 1][s6]);
      }
      if (tetherAnchors.length) {
        for (var di = 0; di < detachedIndices.length; di++) {
          var target = tetherAnchors[Math.floor(Math.random() * tetherAnchors.length)];
          var dist = nodes[detachedIndices[di]].pos.distanceTo(nodes[target].pos);
          var subdiv = Math.max(8, Math.round(dist / 0.12));
          subdivideEdge(detachedIndices[di], target, subdiv, 1.09 + Math.random() * 0.1, 0.55, 'frame');
        }
      }

      var strayThreadCount = 70;
      for (var si2 = 0; si2 < strayThreadCount; si2++) {
        var rA = 1 + Math.floor(Math.random() * (RINGS - 1));
        var sA = Math.floor(Math.random() * SPOKES);
        var rB = 1 + Math.floor(Math.random() * (RINGS - 1));
        var sB = Math.floor(Math.random() * SPOKES);
        var a2 = grid[rA][sA], b2 = grid[rB][sB];
        if (a2 === b2) continue;
        var dist2 = nodes[a2].pos.distanceTo(nodes[b2].pos);
        if (dist2 < 0.3 || dist2 > 3.4) continue;
        var subdiv2 = Math.max(2, Math.round(dist2 / 0.22));
        subdivideEdge(a2, b2, subdiv2, 1.004 + Math.random() * 0.01, undefined, 'stray');
      }

      var looseThreadCount = 6;
      for (var li = 0; li < looseThreadCount; li++) {
        var r4 = 1 + Math.floor(Math.random() * (RINGS - 1));
        var s7 = Math.floor(Math.random() * SPOKES);
        hangLooseThread(grid[r4][s7], 0.3 + Math.random() * 1.8);
      }

      // Dew drops — beaded threads
      var DROP_PROFILE = {
        spiral: { spacingMul: 1.0, min: 0.5, max: 0.85 },
        radial: { spacingMul: 1.0, min: 0.7, max: 1.1 },
        frame: { spacingMul: 1.2, min: 1.1, max: 1.9 },
        stray: { spacingMul: 1.1, min: 0.55, max: 0.9 },
        loose: { spacingMul: 1.1, min: 0.55, max: 0.95 },
        structural: { spacingMul: 1.0, min: 0.7, max: 1.05 }
      };

      edges.forEach(function (edge, edgeIdx) {
        var restLen = edge[2];
        var profile = DROP_PROFILE[edge[3]] || DROP_PROFILE.structural;
        var n = Math.max(1, Math.round(restLen / (DROP_SPACING * profile.spacingMul)));
        for (var k = 0; k < n; k++) {
          var t3 = (k + 0.5) / n;
          var scale = profile.min + Math.random() * (profile.max - profile.min);
          dewDescriptors.push({ type: 'edge', edgeIdx: edgeIdx, t: t3, scale: scale });
        }
      });

      var junctionNodes = [HUB];
      for (var r5 = 0; r5 < RINGS; r5++) for (var s8 = 0; s8 < SPOKES; s8++) junctionNodes.push(grid[r5][s8]);
      junctionNodes.forEach(function (nodeIdx) {
        if (Math.random() > 0.85) return;
        var clusterSize = 1 + Math.floor(Math.random() * 3);
        for (var c = 0; c < clusterSize; c++) {
          var offset = new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05 - 0.01, (Math.random() - 0.5) * 0.05);
          dewDescriptors.push({ type: 'node', nodeIdx: nodeIdx, offset: offset, scale: 1.0 + Math.random() * 0.7 });
        }
      });

      var dewGeo = new THREE.SphereGeometry(1, 8, 8);
      var dewMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.06, metalness: 0,
        transmission: 0.85, thickness: 0.2, ior: 1.33, clearcoat: 1, clearcoatRoughness: 0.03
      });
      dewMesh = new THREE.InstancedMesh(dewGeo, dewMat, dewDescriptors.length);
      dewMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      dewMesh.castShadow = false; dewMesh.receiveShadow = true;
      webGroup.add(dewMesh);

      // Twinkle
      var twinkleCount = 24;
      var edgeOnly = dewDescriptors.filter(function (d) { return d.type === 'edge'; });
      for (var ti = 0; ti < twinkleCount && edgeOnly.length; ti++) {
        twinkleDescriptors.push(edgeOnly[Math.floor(Math.random() * edgeOnly.length)]);
      }
      twinkleGeo = new THREE.BufferGeometry();
      var twinklePos = new Float32Array(twinkleDescriptors.length * 3);
      var twinklePhase = new Float32Array(twinkleDescriptors.length);
      for (var ti2 = 0; ti2 < twinkleDescriptors.length; ti2++) twinklePhase[ti2] = Math.random() * Math.PI * 2 * 100;
      twinkleGeo.setAttribute('position', new THREE.BufferAttribute(twinklePos, 3));
      twinkleGeo.setAttribute('aPhase', new THREE.BufferAttribute(twinklePhase, 1));

      twinkleMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: "attribute float aPhase;varying float vPulse;uniform float uTime;\nvoid main(){float p=pow(max(0.0,sin(uTime*0.11+aPhase)),40.0);vPulse=p;\nvec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=(5.0+p*10.0)*(12.0/-mv.z);gl_Position=projectionMatrix*mv;}",
        fragmentShader: "varying float vPulse;\nvoid main(){vec2 c=gl_PointCoord-0.5;float d=length(c);float a=smoothstep(0.5,0.0,d)*vPulse;\nif(a<0.01)discard;gl_FragColor=vec4(1.0,0.98,0.9,a);}",
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      twinkleMesh = new THREE.Points(twinkleGeo, twinkleMat);
      webGroup.add(twinkleMesh);
    }

    var _m = new THREE.Matrix4();
    var _q = new THREE.Quaternion();
    var _identityQ = new THREE.Quaternion();
    var _mid = new THREE.Vector3();
    var _scale = new THREE.Vector3();
    var _dir = new THREE.Vector3();
    var _up = new THREE.Vector3(0, 1, 0);

    function computeWind(node, t) {
      var baseline = 0.55 + 0.15 * Math.sin(t * 0.025 + 3.1);
      var gustPulse = Math.pow(Math.max(0, Math.sin(t * (2 * Math.PI / 28))), 24);
      var gust = baseline + gustPulse * 0.9;
      var distFromHub = Math.min(node.pos.length() / MAX_R, 1);
      var freedom = Math.sin(distFromHub * Math.PI);
      var amp = WIND_AMPLITUDE * node.ampScale * gust * (0.3 + 0.7 * freedom);
      var bend = Math.sin(t * WIND_SPEED + node.angle * WIND_WAVE_K);
      return new THREE.Vector3(bend * amp, bend * amp * 0.2, bend * amp * 0.7);
    }

    function verletStep(t, dt) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.fixed) continue;
        var wind = computeWind(n, t);
        var accel = wind.clone().add(GRAVITY);
        var velocity = n.pos.clone().sub(n.oldPos).multiplyScalar(DAMPING);
        var newPos = n.pos.clone().add(velocity).add(accel.multiplyScalar(dt * dt));
        n.oldPos.copy(n.pos);
        n.pos.copy(newPos);
      }
      for (var iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
        for (var e = 0; e < edges.length; e++) {
          var ia = edges[e][0], ib = edges[e][1], rest = edges[e][2];
          var na = nodes[ia], nb = nodes[ib];
          var delta = nb.pos.clone().sub(na.pos);
          var dist = delta.length() || 0.0001;
          var diff = (dist - rest) / dist;
          var aFixed = na.fixed, bFixed = nb.fixed;
          if (aFixed && bFixed) continue;
          if (aFixed) { nb.pos.sub(delta.clone().multiplyScalar(diff)); }
          else if (bFixed) { na.pos.add(delta.clone().multiplyScalar(diff)); }
          else { na.pos.add(delta.clone().multiplyScalar(0.5 * diff)); nb.pos.sub(delta.clone().multiplyScalar(0.5 * diff)); }
        }
      }
    }

    function updateGeometry() {
      for (var i = 0; i < dewDescriptors.length; i++) {
        var d = dewDescriptors[i];
        if (d.type === 'node') {
          _mid.copy(nodes[d.nodeIdx].pos).add(d.offset);
          _scale.setScalar(BASE_DROP_R * d.scale);
          _m.compose(_mid, _identityQ, _scale);
        } else {
          var ia = edges[d.edgeIdx][0], ib = edges[d.edgeIdx][1];
          var a = nodes[ia].pos, b = nodes[ib].pos;
          _mid.lerpVectors(a, b, d.t);
          _dir.subVectors(b, a);
          var len = _dir.length() || 0.0001;
          _dir.normalize();
          _q.setFromUnitVectors(_up, _dir);
          var r = BASE_DROP_R * d.scale;
          _scale.set(r * 0.8, r * 2.1, r * 0.8);
          _m.compose(_mid, _q, _scale);
        }
        dewMesh.setMatrixAt(i, _m);
      }
      dewMesh.instanceMatrix.needsUpdate = true;

      var tPos = twinkleGeo.attributes.position.array;
      for (var i2 = 0; i2 < twinkleDescriptors.length; i2++) {
        var d2 = twinkleDescriptors[i2];
        var ia2 = edges[d2.edgeIdx][0], ib2 = edges[d2.edgeIdx][1];
        _mid.lerpVectors(nodes[ia2].pos, nodes[ib2].pos, d2.t);
        tPos[i2 * 3] = _mid.x; tPos[i2 * 3 + 1] = _mid.y; tPos[i2 * 3 + 2] = _mid.z;
      }
      twinkleGeo.attributes.position.needsUpdate = true;
    }

    function renderWithDOF(t) {
      renderer.setRenderTarget(sceneRT);
      renderer.render(scene, camera);
      fsQuad.material = blurMat;
      blurMat.uniforms.tDiffuse.value = sceneRT.texture;
      blurMat.uniforms.direction.value.set(1.2, 0);
      renderer.setRenderTarget(blurRTA);
      renderer.render(dofScene, dofCamera);
      blurMat.uniforms.tDiffuse.value = blurRTA.texture;
      blurMat.uniforms.direction.value.set(0, 1.2);
      renderer.setRenderTarget(blurRTB);
      renderer.render(dofScene, dofCamera);
      fsQuad.material = compositeMat;
      compositeMat.uniforms.tSharp.value = sceneRT.texture;
      compositeMat.uniforms.tBlur.value = blurRTB.texture;
      compositeMat.uniforms.tDepth.value = sceneRT.depthTexture;
      compositeMat.uniforms.focusDistance.value = camera.position.length() + Math.sin(t * 0.045) * 1.3;
      renderer.setRenderTarget(null);
      renderer.render(dofScene, dofCamera);
    }

    clock = new THREE.Clock();

    function render() {
      if (!running || !visible) return;
      try {
        var t = clock.getElapsedTime();
        var dt = 1;

        var orbit = t * 0.02;
        camera.position.x += ((Math.sin(orbit) * 0.25 + mouseX * 0.18) - camera.position.x) * 0.03;
        camera.position.y += ((0.5 + Math.cos(orbit * 0.7) * 0.08 - mouseY * 0.12) - camera.position.y) * 0.03;
        camera.position.z = 11;
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();

        verletStep(t, dt);

        for (var i = 0; i < frameFlatNodes.length; i++) {
          var n = nodes[frameFlatNodes[i]];
          n.pos.z = 0; n.oldPos.z = 0;
        }

        updateGeometry();
        twinkleMat.uniforms.uTime.value = t;

        // Scroll zoom — scale from 0.5 to 1.0
        var s = 0.5 + scrollProgress * 0.5;
        webGroup.scale.set(s, s, s);

        renderWithDOF(t);
        requestAnimationFrame(render);
      } catch (e) {
        console.warn("web render error:", e.message);
        requestAnimationFrame(render);
      }
    }

    if (typeof IntersectionObserver !== "undefined") {
      var visObserver = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && running) { requestAnimationFrame(render); }
      }, { threshold: 0 });
      visObserver.observe(container);
    }

    try { init(); } catch (e) { console.error("ThreadRenderer init error:", e.message); }

    requestAnimationFrame(render);

    this.setScrollProgress = function (p) { scrollProgress = Math.min(Math.max(p, 0), 1); };
    this.stop = function () { running = false; };
    this.start = function () { if (!running) { running = true; render(); } };
    this.dispose = function () {
      running = false;
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }

  global.ThreadRenderer = ThreadRenderer;
})(window);
