/* =========================================================
   MONOLITH — scroll-jacked cinematic site
   Three.js morphing particle scene where each shape
   matches the content of its slide.
   ========================================================= */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isEmbed = new URLSearchParams(location.search).get("embed") === "1";

  if (isEmbed) {
    // Hide all UI elements, only show the particle background
    document.documentElement.classList.add("embed-mode");
  }

  /* ---------------- Three.js morphing particle scene ---------------- */
  let scene, camera, renderer, points, wire, bokehPoints, bokehMat, pointsMat;
  let targetSize = 0.04;
  const COUNT = isEmbed ? 10000 : 40000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const targets = {};      // shape -> { pos: Float32Array, col: Float32Array }
  let currentShape = "globe";
  let mouseX = 0, mouseY = 0, rotX = 0, rotY = 0;
  let clock = 0;

  // Per-slide background colors (r,g,b 0..1)
  const slideBgColors = {
    globe:    [0.05, 0.08, 0.20],   // deep space blue
    streams:  [0.12, 0.04, 0.20],   // dark purple
    ribbon:   [0.18, 0.08, 0.03],   // warm dark amber
    wall:     [0.03, 0.12, 0.12],   // dark teal
    crystal:  [0.10, 0.05, 0.15],   // dark violet
  };
  let currentBg = [0.05, 0.08, 0.20];
  let targetBg = [0.05, 0.08, 0.20];

  /* ---- Shape builders ---- */
  var earthSpecCanvas = null;
  var earthSpecData = null;
  var thumbCanvases = {};   // project id -> { canvas, data, w, h }

  function loadEarthTextures(callback) {
    var specImg = new Image();
    specImg.onload = function () {
      earthSpecCanvas = document.createElement("canvas");
      earthSpecCanvas.width = specImg.width;
      earthSpecCanvas.height = specImg.height;
      earthSpecCanvas.getContext("2d").drawImage(specImg, 0, 0);
      earthSpecData = earthSpecCanvas.getContext("2d").getImageData(0, 0, specImg.width, specImg.height).data;
      callback();
    };
    specImg.onerror = function () { callback(); };
    specImg.src = "earth_specular.jpg";
  }

  var thumbFiles = {
    lumen:      "thumbs/lumen.png",
    strata:     "thumbs/strata.png",
    wavelength: "thumbs/wavelength.png",
    latitude:   "thumbs/latitude.png",
    threadwork: "thumbs/threadwork.png",
    pulse:      "thumbs/pulse.png",
  };

  function loadThumbs(callback) {
    var keys = Object.keys(thumbFiles);
    var loaded = 0;
    keys.forEach(function (key) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas");
        // Downscale to a smaller sampling resolution — we only need coarse color
        var sw = 200, sh = Math.round(sw * img.height / img.width);
        c.width = sw; c.height = sh;
        c.getContext("2d").drawImage(img, 0, 0, sw, sh);
        var d = c.getContext("2d").getImageData(0, 0, sw, sh).data;
        thumbCanvases[key] = { data: d, w: sw, h: sh };
        loaded++;
        if (loaded === keys.length) callback();
      };
      img.onerror = function () { loaded++; if (loaded === keys.length) callback(); };
      img.src = thumbFiles[key];
    });
  }

  function sampleThumb(projectId, u, v) {
    var t = thumbCanvases[projectId];
    if (!t) return [0.5, 0.5, 0.5];
    // u: 0..1 left→right, v: 0..1 top→bottom
    var x = Math.max(0, Math.min(t.w - 1, Math.floor(u * t.w)));
    var y = Math.max(0, Math.min(t.h - 1, Math.floor(v * t.h)));
    var idx = (y * t.w + x) * 4;
    return [t.data[idx] / 255, t.data[idx + 1] / 255, t.data[idx + 2] / 255];
  }

  function sampleEarthTexture(data, w, h, x, y) {
    x = Math.max(0, Math.min(w - 1, Math.floor(x * w)));
    y = Math.max(0, Math.min(h - 1, Math.floor(y * h)));
    var idx = (y * w + x) * 4;
    return [data[idx] / 255, data[idx + 1] / 255, data[idx + 2] / 255];
  }

  function buildShapes() {
    // 1. EARTH GLOBE — for "Designing Worlds That Move"
    // Uses real Earth specular map for continent shapes (like particle-globe reference)
    // Only land particles are bright; ocean particles are dim blue.
    const globePos = new Float32Array(COUNT * 3);
    const globeCol = new Float32Array(COUNT * 3);
    const R = 2.5;
    var specW = earthSpecCanvas ? earthSpecCanvas.width : 1024;
    var specH = earthSpecCanvas ? earthSpecCanvas.height : 512;
    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.cos(phi);
      const z = R * Math.sin(phi) * Math.sin(theta);
      globePos[i*3] = x; globePos[i*3+1] = y; globePos[i*3+2] = z;

      // Convert 3D position to lat/lon → UV (standard equirectangular mapping)
      var r = Math.sqrt(x*x + y*y + z*z);
      var u = 0.5 + Math.atan2(z, x) / (2.0 * Math.PI);
      var v = 0.5 - (y / r) * 0.5;

      if (earthSpecData) {
        // Sample specular map: BRIGHT = ocean, DARK = land
        var spec = sampleEarthTexture(earthSpecData, specW, specH, u, v);
        var isOcean = spec[0] > 0.5;

        if (isOcean) {
          // Ocean: dark blue dots
          globeCol[i*3]   = 0.03;
          globeCol[i*3+1] = 0.12;
          globeCol[i*3+2] = 0.28;
        } else {
          // Land particles: warm orange-gold
          var brightness = 0.5 + (1.0 - spec[0]) * 0.5;
          globeCol[i*3]   = brightness * 1.0;
          globeCol[i*3+1] = brightness * 0.55;
          globeCol[i*3+2] = brightness * 0.15;
        }

        // Ice caps near poles — bright white-blue
        var latAbs = Math.abs(y / R);
        if (latAbs > 0.82) {
          var iceBlend = Math.min(1, (latAbs - 0.82) / 0.15);
          globeCol[i*3]   = globeCol[i*3] * (1 - iceBlend) + 0.8 * iceBlend;
          globeCol[i*3+1] = globeCol[i*3+1] * (1 - iceBlend) + 0.9 * iceBlend;
          globeCol[i*3+2] = globeCol[i*3+2] * (1 - iceBlend) + 1.0 * iceBlend;
        }
      } else {
        // Fallback: noise-based if textures haven't loaded
        var n = Math.sin(x * 2.0) * Math.cos(y * 1.7) * Math.sin(z * 2.3) +
                Math.sin(x * 4.1) * Math.cos(z * 3.7) * 0.5;
        if (n > 0.15) {
          globeCol[i*3] = 0.9; globeCol[i*3+1] = 0.5; globeCol[i*3+2] = 0.15;
        } else {
          globeCol[i*3] = 0.03; globeCol[i*3+1] = 0.12; globeCol[i*3+2] = 0.28;
        }
      }
    }
    targets.globe = { pos: globePos, col: globeCol };

    // 2. STREAMS — for "What We Do" (six disciplines converging)
    // Six streams of particles flow inward from six outer origins,
    // merge into a central swirling core, and orbit — visualizing
    // six disciplines becoming one studio output.
    const streamsPos = new Float32Array(COUNT * 3);
    const streamsCol = new Float32Array(COUNT * 3);
    const streamsPhase = new Float32Array(COUNT);    // 0..1 along the flow
    const streamsSpeed = new Float32Array(COUNT);    // per-particle flow speed
    const streamsOrigin = new Float32Array(COUNT * 3); // outer start point
    const numStreams = 6;
    const perStream = Math.floor(COUNT / numStreams);
    // six stream origins arranged in a hexagon, pushed out in 3D
    const origins = [];
    for (let s = 0; s < numStreams; s++) {
      const a = (s / numStreams) * Math.PI * 2;
      origins.push({
        x: Math.cos(a) * 3.5,
        y: Math.sin(a) * 3.5,
        z: (Math.sin(s * 1.7) * 1.2),
      });
    }
    // six discipline tints (subtle, mostly white with a hint)
    const tints = [
      [1.0, 0.5, 0.15],   // vivid orange — brand identity
      [0.15, 0.5, 1.0],   // electric blue — film & motion
      [0.1, 1.0, 0.5],    // emerald green — interactive web
      [1.0, 0.15, 0.6],   // hot pink — art direction
      [0.6, 0.2, 1.0],    // deep purple — sound design
      [1.0, 0.85, 0.1],   // gold — strategy
    ];
    for (let i = 0; i < COUNT; i++) {
      const s = Math.min(Math.floor(i / perStream), numStreams - 1);
      const origin = origins[s];
      const tint = tints[s];
      // spread particles along the stream path with some lateral jitter
      streamsPhase[i] = Math.random();
      streamsSpeed[i] = 0.003 + Math.random() * 0.004;
      // origin point with small cluster spread
      const jitter = 0.3;
      streamsOrigin[i*3]   = origin.x + (Math.random() - 0.5) * jitter;
      streamsOrigin[i*3+1] = origin.y + (Math.random() - 0.5) * jitter;
      streamsOrigin[i*3+2] = origin.z + (Math.random() - 0.5) * jitter;
      // initial position = at origin (will flow in animate loop)
      streamsPos[i*3]   = streamsOrigin[i*3];
      streamsPos[i*3+1] = streamsOrigin[i*3+1];
      streamsPos[i*3+2] = streamsOrigin[i*3+2];
      // color: tinted, brighter near center
      streamsCol[i*3]   = tint[0];
      streamsCol[i*3+1] = tint[1];
      streamsCol[i*3+2] = tint[2];
    }
    targets.streams = {
      pos: streamsPos,
      col: streamsCol,
      origins: origins,
      phase: streamsPhase,
      speed: streamsSpeed,
      originArr: streamsOrigin,
      tints: tints,
      perStream: perStream,
      dynamic: true,
      type: "streams",
    };
    // keep mandala as alias for backward compat (not used but prevents errors)
    targets.mandala = targets.streams;

    // 3. RIBBON — for "How We Move" (process flow)
    // A flowing sine-wave ribbon surface
    const ribbonPos = new Float32Array(COUNT * 3);
    const ribbonCol = new Float32Array(COUNT * 3);
    const rCols = 120, rRows = Math.ceil(COUNT / rCols);
    for (let i = 0; i < COUNT; i++) {
      const col = i % rCols;
      const row = Math.floor(i / rCols);
      const u = (col / rCols - 0.5) * 8;
      const v = (row / rRows - 0.5) * 2.2;
      const wave = Math.sin(u * 1.2) * 0.7;
      const wave2 = Math.cos(u * 0.8) * 0.4;
      ribbonPos[i*3]   = u;
      ribbonPos[i*3+1] = wave + wave2 + v * 0.15;
      ribbonPos[i*3+2] = v + Math.sin(u * 1.5) * 0.3;
      const b = 0.4 + Math.abs(v / 1.1) * 0.6;
      var ribHue = u * 0.15 + 0.5;
      ribbonCol[i*3]   = b * (0.8 + Math.sin(ribHue) * 0.3);
      ribbonCol[i*3+1] = b * (0.3 + Math.sin(ribHue + 2) * 0.4);
      ribbonCol[i*3+2] = b * (0.9 + Math.sin(ribHue + 4) * 0.3);
    }
    targets.ribbon = { pos: ribbonPos, col: ribbonCol };

    // 4. WALL — for "Selected Work" (6 project-page panels)
    // A 3×2 grid of panels, each styled like one project page with its glyph and color
    const wallPos = new Float32Array(COUNT * 3);
    const wallCol = new Float32Array(COUNT * 3);
    const wSide = Math.ceil(Math.sqrt(COUNT));

    const projectPanels = [
      { x: 0, y: 1, name: "Lumen",      id: "lumen" },
      { x: 1, y: 1, name: "Strata",     id: "strata" },
      { x: 2, y: 1, name: "Wavelength", id: "wavelength" },
      { x: 0, y: 0, name: "Latitude",   id: "latitude" },
      { x: 1, y: 0, name: "Threadwork", id: "threadwork" },
      { x: 2, y: 0, name: "Pulse",      id: "pulse" },
    ];

    for (let i = 0; i < COUNT; i++) {
      const gx = (i % wSide) / wSide - 0.5;
      const gy = Math.floor(i / wSide) / wSide - 0.5;
      const panelX = Math.floor((gx + 0.5) * 3);
      const panelY = Math.floor((gy + 0.5) * 2);
      const inGapX = ((gx + 0.5) * 3) % 1 > 0.85 || ((gx + 0.5) * 3) % 1 < 0.05;
      const inGapY = ((gy + 0.5) * 2) % 1 > 0.85 || ((gy + 0.5) * 2) % 1 < 0.05;
      const depth = inGapX || inGapY ? -1.5 : Math.sin(panelX * 1.5 + panelY) * 0.3 - 1;
      wallPos[i*3]   = gx * 7;
      wallPos[i*3+1] = gy * 4.5;
      wallPos[i*3+2] = depth;

      if (inGapX || inGapY) {
        wallCol[i*3] = 0.05; wallCol[i*3+1] = 0.05; wallCol[i*3+2] = 0.08;
      } else {
        const proj = projectPanels.find(p => p.x === panelX && p.y === panelY) || { id: null };
        // local UV inside panel, 0..1 for texture sampling
        const u = ((gx + 0.5) * 3 - panelX);          // 0..1 left→right
        const v = 1 - ((gy + 0.5) * 2 - panelY);       // 0..1 top→bottom (flip Y)
        const b = 0.5 + (depth + 1.5) / 1.8 * 0.5;     // brightness from depth
        if (proj.id && thumbCanvases[proj.id]) {
          var rgb = sampleThumb(proj.id, u, v);
          wallCol[i*3]   = b * rgb[0];
          wallCol[i*3+1] = b * rgb[1];
          wallCol[i*3+2] = b * rgb[2];
        } else {
          wallCol[i*3]   = b * 0.5;
          wallCol[i*3+1] = b * 0.5;
          wallCol[i*3+2] = b * 0.5;
        }
      }
    }
    targets.wall = { pos: wallPos, col: wallCol };

    // 5. CRYSTAL — for "Let's Build Something" (contact / building)
    // Particles continuously cycle: scatter → assemble into a tower
    // from the ground up → hold → dissolve → rebuild.
    // We store both scattered and assembled positions, plus a per-
    // particle build order (bottom layers build first).
    const crystalScattered = new Float32Array(COUNT * 3);
    const crystalAssembled = new Float32Array(COUNT * 3);
    const crystalCol = new Float32Array(COUNT * 3);
    const crystalBuildOrder = new Float32Array(COUNT); // 0=bottom(first), 1=top(last)
    const cLayers = 18;
    const perLayer = Math.floor(COUNT / cLayers);
    for (let i = 0; i < COUNT; i++) {
      const layerIdx = Math.min(Math.floor(i / perLayer), cLayers - 1);
      const lt = layerIdx / (cLayers - 1); // 0 at bottom, 1 at top

      // --- assembled: a ziggurat tower (stepped pyramid) ---
      // each layer is a square ring, shrinking as it goes up
      const yPos = lt * 5 - 2.5; // -2.5 (bottom) to 2.5 (top)
      // tower width: wider at base, narrows at top in steps
      const stepWidth = 2.4 - lt * 1.8;
      const inLayer = i % perLayer;
      const angle = (inLayer / perLayer) * Math.PI * 2;
      // square cross-section with slight rotation per layer
      const sq = 0.85;
      const localA = angle + lt * 0.3;
      const sx = Math.cos(localA) * stepWidth * sq;
      const sz = Math.sin(localA) * stepWidth * sq;
      crystalAssembled[i*3]   = sx + (Math.random() - 0.5) * 0.08;
      crystalAssembled[i*3+1] = yPos + (Math.random() - 0.5) * 0.06;
      crystalAssembled[i*3+2] = sz + (Math.random() - 0.5) * 0.08;

      // --- scattered: random positions in a diffuse cloud ---
      const sR = 2 + Math.random() * 2.5;
      const sA = Math.random() * Math.PI * 2;
      const sEl = Math.acos(2 * Math.random() - 1) - Math.PI / 2;
      crystalScattered[i*3]   = Math.cos(sA) * Math.cos(sEl) * sR;
      crystalScattered[i*3+1] = Math.sin(sEl) * sR * 0.8;
      crystalScattered[i*3+2] = Math.sin(sA) * Math.cos(sEl) * sR;

      // build order: bottom layers first (0), top layers last (1)
      crystalBuildOrder[i] = lt;

      // color: bright white when assembled, dim when scattered
      // edge highlights on the tower faces
      const facet = Math.abs(Math.cos(localA * 4));
      const b = 0.35 + facet * 0.65;
      var crysHue = lt * 2.0;
      crystalCol[i*3]   = b * (0.6 + Math.sin(crysHue) * 0.4);
      crystalCol[i*3+1] = b * (0.4 + Math.sin(crysHue + 2) * 0.4);
      crystalCol[i*3+2] = b * (0.9 + Math.sin(crysHue + 4) * 0.3);
    }
    targets.crystal = {
      pos: crystalAssembled,         // initial target (will be overridden in animate)
      col: crystalCol,
      scattered: crystalScattered,
      assembled: crystalAssembled,
      buildOrder: crystalBuildOrder,
      dynamic: true,
    };

    // 6. FORM — particles arrange to outline a contact form
    // Fields: name+email row, subject, message textarea, send button
    const formPos = new Float32Array(COUNT * 3);
    const formCol = new Float32Array(COUNT * 3);
    // Form field rectangles: [x0, y0, x1, y1] in 3D space
    const formFields = [
      [-2.5, 1.4, -0.05, 2.0],   // name
      [0.05, 1.4, 2.5, 2.0],      // email
      [-2.5, 0.6, 2.5, 1.2],      // subject
      [-2.5, -0.9, 2.5, 0.4],     // message textarea
      [-2.5, -1.7, -0.3, -1.1],   // send button
    ];
    // Calculate total border length for proportional distribution
    var totalBorder = 0;
    for (var fi = 0; fi < formFields.length; fi++) {
      var f = formFields[fi];
      totalBorder += 2 * ((f[2]-f[0]) + (f[3]-f[1]));
    }
    // Add fill for button (make it more solid)
    var btnW = formFields[4][2] - formFields[4][0];
    var btnH = formFields[4][3] - formFields[4][1];
    var btnArea = btnW * btnH;
    var fillCount = Math.floor(COUNT * 0.15); // 15% fill particles
    var borderCount = COUNT - fillCount;
    var particleIdx = 0;
    // Form color: soft violet/white
    var formR = 0.7, formG = 0.65, formB = 1.0;
    // Distribute border particles
    for (var fi = 0; fi < formFields.length; fi++) {
      var f = formFields[fi];
      var w = f[2] - f[0];
      var h = f[3] - f[1];
      var perim = 2 * (w + h);
      var fieldCount = Math.floor((perim / totalBorder) * borderCount);
      for (var p = 0; p < fieldCount && particleIdx < borderCount; p++) {
        var t = (p / fieldCount) * perim;
        var px, py;
        if (t < w) { px = f[0] + t; py = f[1]; }
        else if (t < w + h) { px = f[2]; py = f[1] + (t - w); }
        else if (t < 2*w + h) { px = f[2] - (t - w - h); py = f[3]; }
        else { px = f[0]; py = f[3] - (t - 2*w - h); }
        formPos[particleIdx*3]   = px + (Math.random() - 0.5) * 0.04;
        formPos[particleIdx*3+1] = py + (Math.random() - 0.5) * 0.04;
        formPos[particleIdx*3+2] = (Math.random() - 0.5) * 0.15;
        var brightness = 0.4 + Math.random() * 0.4;
        formCol[particleIdx*3]   = formR * brightness;
        formCol[particleIdx*3+1] = formG * brightness;
        formCol[particleIdx*3+2] = formB * brightness;
        particleIdx++;
      }
    }
    // Fill remaining with button fill particles
    for (var p = particleIdx; p < COUNT; p++) {
      formPos[p*3]   = formFields[4][0] + Math.random() * btnW;
      formPos[p*3+1] = formFields[4][1] + Math.random() * btnH;
      formPos[p*3+2] = (Math.random() - 0.5) * 0.1;
      var brightness = 0.3 + Math.random() * 0.3;
      formCol[p*3]   = formR * brightness;
      formCol[p*3+1] = formG * brightness;
      formCol[p*3+2] = formB * brightness;
    }
    targets.form = {
      pos: formPos,
      col: formCol,
      dynamic: false,
    };
    slideBgColors.form = [0.08, 0.04, 0.14];

    // 7. ENVELOPE — for send animation
    const envPos = new Float32Array(COUNT * 3);
    const envCol = new Float32Array(COUNT * 3);
    // Envelope: rectangle body + triangular flap, all particles interleaved
    const envW = 3.0, envH = 1.8;
    var envPerim = 2 * (envW + envH);
    // Pre-compute all envelope positions then shuffle so button-fill indices spread evenly
    var envPositions = [];
    // Border particles (40% of total)
    var envBorderCount = Math.floor(COUNT * 0.4);
    for (var p = 0; p < envBorderCount; p++) {
      var t = (p / envBorderCount) * envPerim;
      var px, py;
      if (t < envW) { px = -envW/2 + t; py = -envH/2; }
      else if (t < envW + envH) { px = envW/2; py = -envH/2 + (t - envW); }
      else if (t < 2*envW + envH) { px = envW/2 - (t - envW - envH); py = envH/2; }
      else { px = -envW/2; py = envH/2 - (t - 2*envW - envH); }
      envPositions.push([px + (Math.random() - 0.5) * 0.04, py + (Math.random() - 0.5) * 0.04, 0]);
    }
    // Flap lines (20% of total)
    var envFlapCount = Math.floor(COUNT * 0.2);
    for (var p = 0; p < envFlapCount; p++) {
      var u = p / envFlapCount;
      var side = p % 2;
      var px, py;
      if (side === 0) {
        px = -envW/2 + u * (envW/2);
        py = envH/2 - u * (envH * 0.7);
      } else {
        px = envW/2 - u * (envW/2);
        py = envH/2 - u * (envH * 0.7);
      }
      envPositions.push([px + (Math.random() - 0.5) * 0.04, py + (Math.random() - 0.5) * 0.04, 0.02]);
    }
    // Body fill (remaining)
    var envFillCount = COUNT - envPositions.length;
    for (var p = 0; p < envFillCount; p++) {
      envPositions.push([
        -envW/2 + Math.random() * envW,
        -envH/2 + Math.random() * envH,
        -0.02 + (Math.random() - 0.5) * 0.05
      ]);
    }
    // Shuffle so old button-fill particle indices spread across all envelope parts
    for (var i = envPositions.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = envPositions[i]; envPositions[i] = envPositions[j]; envPositions[j] = tmp;
    }
    for (var i = 0; i < COUNT; i++) {
      envPos[i*3]   = envPositions[i][0];
      envPos[i*3+1] = envPositions[i][1];
      envPos[i*3+2] = envPositions[i][2];
      var br = 0.3 + Math.random() * 0.4;
      envCol[i*3]   = 0.8 * br;
      envCol[i*3+1] = 0.75 * br;
      envCol[i*3+2] = 1.0 * br;
    }
    targets.envelope = {
      pos: envPos,
      col: envCol,
      dynamic: false,
    };
  }

  function initThree() {
    if (typeof THREE === "undefined") return;
    const mount = document.getElementById("webgl");
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.05);
    camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 0, 7);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 1);
    mount.appendChild(renderer.domElement);

    // Load Earth textures and project thumbnails, then build shapes and start animation
    loadEarthTextures(function () {
    loadThumbs(function () {
      buildShapes();
      // Check if deep-linking — override default globe with target shape
      var deepLinkShape = null;
      var hashName = location.hash.replace("#", "");
      var allSlides = document.querySelectorAll(".slide");
      for (var s = 0; s < allSlides.length; s++) {
        if (allSlides[s].id === hashName) {
          deepLinkShape = allSlides[s].dataset.shape;
          break;
        }
      }
      if (deepLinkShape && targets[deepLinkShape]) {
        positions.set(targets[deepLinkShape].pos);
        colors.set(targets[deepLinkShape].col);
        currentShape = deepLinkShape;
        if (slideBgColors[deepLinkShape]) {
          targetBg = slideBgColors[deepLinkShape];
          currentBg[0] = slideBgColors[deepLinkShape][0];
          currentBg[1] = slideBgColors[deepLinkShape][1];
          currentBg[2] = slideBgColors[deepLinkShape][2];
        }
      } else {
        positions.set(targets.globe.pos);
        colors.set(targets.globe.col);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      pointsMat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      points = new THREE.Points(geo, pointsMat);
      scene.add(points);

      // subtle wireframe for depth (skip in embed mode for performance)
      if (!isEmbed) {
        const wgeo = new THREE.IcosahedronGeometry(3.6, 1);
        const wmat = new THREE.MeshBasicMaterial({
          color: 0x4466ff, wireframe: true, transparent: true, opacity: 0.06,
        });
        wire = new THREE.Mesh(wgeo, wmat);
        scene.add(wire);
      }

      // ---- Bokeh: floating out-of-focus light circles ----
      var bokehCount = isEmbed ? 30 : 60;
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
      for (var bi = 0; bi < bokehCount; bi++) {
        bokehPos.push(
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          -5 - Math.random() * 15
        );
        var bc = bokehColors[Math.floor(Math.random() * bokehColors.length)];
        bokehCol.push(bc[0], bc[1], bc[2]);
        bokehSize.push(15 + Math.random() * 40);
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
          '  pos.x += sin(uTime * 0.3 + aPhase) * 1.5;',
          '  pos.y += cos(uTime * 0.2 + aPhase * 1.3) * 1.0;',
          '  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);',
          '  float dist = -mvPos.z;',
          '  gl_PointSize = aSize * uPixelRatio * (300.0 / dist);',
          '  vAlpha = smoothstep(30.0, 8.0, dist) * 0.5;',
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

      addEventListener("resize", onResize);
      addEventListener("mousemove", (e) => {
        mouseX = (e.clientX / innerWidth - 0.5) * 2;
        mouseY = (e.clientY / innerHeight - 0.5) * 2;
      });
      animate();
    });
    });
  }

  function onResize() {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  let wallIntro = 0;  // 0=just arrived, lerps to 1 over time
  let formSent = false;  // true when form submitted, triggers envelope morph
  let formFlyOff = false;  // true when envelope should zoom off screen
  let envSpin = 0;  // envelope spin angle, eases to 0 (face-on)
  let envFormed = false;  // true when envelope particles have settled

  function morphTo(shape) {
    if (!targets[shape]) return;
    currentShape = shape;
    if (slideBgColors[shape]) targetBg = slideBgColors[shape];
    if (shape === "wall") wallIntro = 0;
  }

  // Instantly snap particles to target shape (no lerp)
  function forceMorph(shape) {
    if (!targets[shape]) return;
    morphTo(shape);
    var tgt = targets[shape];
    var tgtPos = tgt.pos;
    var tgtCol = tgt.col;
    for (var i = 0; i < COUNT * 3; i++) {
      positions[i] = tgtPos[i];
      colors[i] = tgtCol[i];
    }
    if (points && points.geometry.attributes.position) {
      points.geometry.attributes.position.needsUpdate = true;
      points.geometry.attributes.color.needsUpdate = true;
    }
    // Also snap background color
    if (slideBgColors[shape]) {
      currentBg[0] = slideBgColors[shape][0];
      currentBg[1] = slideBgColors[shape][1];
      currentBg[2] = slideBgColors[shape][2];
    }
  }

  let renderPaused = false;

  // Pause rendering when off-screen (important for embed/iframe mode)
  if (isEmbed && typeof IntersectionObserver !== "undefined") {
    var visObs = new IntersectionObserver(function (entries) {
      renderPaused = !entries[0].isIntersecting;
    }, { threshold: 0 });
    visObs.observe(document.documentElement);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (renderPaused) return;
    clock += 0.005;
    // Update particles on all slides (faded on preview via opacity)
    var isPreview = slides[current] && slides[current].classList.contains("project-preview");
    if (points && !isPreview) {
      const tgt = targets[currentShape];
      const tgtCol = tgt.col;
      const lerp = 0.05;

      if (tgt.dynamic && tgt.type === "streams") {
        // ---- STREAMS: six disciplines converging into one core ----
        // Each particle flows from its outer origin toward the center,
        // then orbits the core before resetting to the origin.
        const phase = tgt.phase;
        const speed = tgt.speed;
        const origins = tgt.originArr;
        const tints = tgt.tints;
        const perStream = tgt.perStream;
        for (let i = 0; i < COUNT; i++) {
          const i3 = i * 3;
          // advance phase
          phase[i] += speed[i];
          if (phase[i] > 1) phase[i] -= 1;
          const p = phase[i];
          // path: 0.0-0.7 = flowing inward, 0.7-1.0 = orbiting core
          let tx, ty, tz;
          if (p < 0.7) {
            // flow from origin to center with a slight curve
            const u = p / 0.7; // 0..1 inward
            const ease = u * u * (3 - 2 * u); // smoothstep
            // add a perpendicular curve so streams spiral in, not straight
            const sIdx = Math.min(Math.floor(i / perStream), 5);
            const swirl = (1 - ease) * 0.8;
            const perpA = (sIdx / 6) * Math.PI * 2 + Math.PI / 2;
            const perpX = Math.cos(perpA) * swirl;
            const perpZ = Math.sin(perpA) * swirl;
            tx = origins[i3]   * (1 - ease) + perpX * (1 - ease) * 0.3;
            ty = origins[i3+1] * (1 - ease);
            tz = origins[i3+2] * (1 - ease) + perpZ * (1 - ease) * 0.3;
          } else {
            // orbit the core: tight spiral that shrinks then fades
            const u = (p - 0.7) / 0.3; // 0..1 orbit
            const orbitR = 0.6 * (1 - u);
            const orbitA = u * Math.PI * 4 + (i * 0.1);
            tx = Math.cos(orbitA) * orbitR;
            ty = Math.sin(orbitA) * orbitR * 0.5;
            tz = Math.sin(orbitA) * orbitR;
          }
          // lerp current position toward target (smooth flow)
          positions[i3]   += (tx - positions[i3])   * 0.12;
          positions[i3+1] += (ty - positions[i3+1]) * 0.12;
          positions[i3+2] += (tz - positions[i3+2]) * 0.12;
          // brightness: dim at origin, bright at center, fade at orbit end
          const bright = p < 0.7
            ? 0.2 + (p / 0.7) * 0.8
            : 1.0 - ((p - 0.7) / 0.3) * 0.7;
          // In orbit phase, cycle through hues for swirling color effect
          var sIdx = Math.min(Math.floor(i / perStream), 5);
          if (p >= 0.7) {
            // Blend between adjacent stream colors based on orbit angle
            const orbitU = (p - 0.7) / 0.3;
            const colorMix = (Math.sin(orbitU * Math.PI * 4 + i * 0.1) + 1) * 0.5;
            const nextIdx = (sIdx + 1) % 6;
            const t1 = tints[sIdx];
            const t2 = tints[nextIdx];
            var r = t1[0] * (1 - colorMix) + t2[0] * colorMix;
            var g = t1[1] * (1 - colorMix) + t2[1] * colorMix;
            var b = t1[2] * (1 - colorMix) + t2[2] * colorMix;
          } else {
            var tint = tints[sIdx];
            var r = tint[0];
            var g = tint[1];
            var b = tint[2];
          }
          colors[i3]   += (r * bright - colors[i3])   * 0.1;
          colors[i3+1] += (g * bright - colors[i3+1]) * 0.1;
          colors[i3+2] += (b * bright - colors[i3+2]) * 0.1;
        }
      } else if (tgt.dynamic) {
        // ---- CRYSTAL: continuous build cycle ----
        // Cycle: scatter → assemble bottom-to-top → hold → dissolve → repeat
        const cyclePeriod = 8.0; // seconds per full build cycle
        const cyclePhase = (clock % cyclePeriod) / cyclePeriod; // 0..1
        // 0.00-0.45: assembling (building up)
        // 0.45-0.70: holding (structure complete)
        // 0.70-1.00: dissolving (falling apart)
        let buildProgress; // 0 = fully scattered, 1 = fully assembled
        if (cyclePhase < 0.45) {
          buildProgress = cyclePhase / 0.45; // 0→1
        } else if (cyclePhase < 0.70) {
          buildProgress = 1; // hold
        } else {
          buildProgress = 1 - (cyclePhase - 0.70) / 0.30; // 1→0
        }
        // smooth the progress
        buildProgress = buildProgress < 0.5
          ? 2 * buildProgress * buildProgress
          : 1 - Math.pow(-2 * buildProgress + 2, 2) / 2;

        const scattered = tgt.scattered;
        const assembled = tgt.assembled;
        const orders = tgt.buildOrder;

        for (let i = 0; i < COUNT; i++) {
          const i3 = i * 3;
          // per-particle build progress: bottom layers (order=0) build first
          // particle starts building when buildProgress > its order
          const pp = Math.max(0, Math.min(1, (buildProgress - orders[i]) * 3));
          const pBlend = pp < 0.5 ? 2*pp*pp : 1 - Math.pow(-2*pp+2, 2)/2;
          positions[i3]   += (scattered[i3]   + (assembled[i3]   - scattered[i3])   * pBlend - positions[i3])   * lerp;
          positions[i3+1] += (scattered[i3+1] + (assembled[i3+1] - scattered[i3+1]) * pBlend - positions[i3+1]) * lerp;
          positions[i3+2] += (scattered[i3+2] + (assembled[i3+2] - scattered[i3+2]) * pBlend - positions[i3+2]) * lerp;
          // color: dim when scattered, bright when assembled
          const cb = 0.15 + pBlend * 0.85;
          colors[i3]   += (tgtCol[i3]   * cb - colors[i3])   * lerp;
          colors[i3+1] += (tgtCol[i3+1] * cb - colors[i3+1]) * lerp;
          colors[i3+2] += (tgtCol[i3+2] * cb - colors[i3+2]) * lerp;
        }
      } else {
        // ---- Standard morph: lerp toward fixed target ----
        const tgtPos = tgt.pos;
        for (let i = 0; i < COUNT * 3; i++) {
          positions[i] += (tgtPos[i] - positions[i]) * lerp;
          colors[i] += (tgtCol[i] - colors[i]) * lerp;
        }
        // Check if envelope is fully formed (sample a subset of particles)
        if (formSent && !envFormed && currentShape === "envelope") {
          var settled = 0;
          for (var si = 0; si < 200; si++) {
            var sIdx = Math.floor(Math.random() * COUNT) * 3;
            var dx = positions[sIdx] - tgtPos[sIdx];
            var dy = positions[sIdx+1] - tgtPos[sIdx+1];
            var dz = positions[sIdx+2] - tgtPos[sIdx+2];
            if (dx*dx + dy*dy + dz*dz < 0.01) settled++;
          }
          if (settled > 190) envFormed = true;
        }
      }

      points.geometry.attributes.position.needsUpdate = true;
      points.geometry.attributes.color.needsUpdate = true;

      // rotation: wall starts facing forward, eases into full rotation
      rotY += (mouseX * 0.5 - rotY) * 0.04;
      rotX += (mouseY * 0.3 - rotX) * 0.04;
      var isProjectPreview = slides[current] && slides[current].classList.contains("project-preview");
      if (currentShape === "wall" && !isProjectPreview) {
        wallIntro += (0.3 - wallIntro) * 0.002;  // cap at 0.3 for slower max speed
        var wallRotY = clock * wallIntro + rotY;
        var wallRotX = Math.sin(clock * 0.5) * 0.12 * wallIntro + rotX;
        points.rotation.y = wallRotY;
        points.rotation.x = wallRotX;
        targetSize = 0.08;
      } else if (currentShape === "wall" && isProjectPreview) {
        // Slow gentle rotation on project preview slides
        points.rotation.y = clock * 0.15 + rotY;
        points.rotation.x = Math.sin(clock * 0.5) * 0.08 + rotX;
        targetSize = 0.08;
      } else {
        points.rotation.y = clock * 0.5 + rotY;
        points.rotation.x = Math.sin(clock * 0.5) * 0.12 + rotX;
        targetSize = 0.04;
      }
      // Envelope: spin to face-on, then keep gentle rotation
      if (formSent) {
        envSpin += (0 - envSpin) * 0.04;
        points.rotation.y = envSpin + rotY;
        points.rotation.x = envSpin * 0.3 + rotX;
        targetSize = 0.03;
      }
      // Handle form/envelope states
      var formFocused = contactForm && contactForm.classList.contains("focused");
      if (formSent && formFlyOff) {
        // Zoom envelope off screen (up and away)
        points.position.y += (15 - points.position.y) * 0.03;
        points.position.z += (-8 - points.position.z) * 0.03;
        pointsMat.opacity += (0 - pointsMat.opacity) * 0.02;
      } else if (formSent) {
        // Envelope formed, stays in place
        points.position.z += (0 - points.position.z) * 0.04;
        points.position.y += (0 - points.position.y) * 0.04;
        pointsMat.opacity += (1.0 - pointsMat.opacity) * 0.04;
      } else if (currentShape === "form" && formFocused) {
        points.position.z += (-6 - points.position.z) * 0.04;
        points.position.y += (3 - points.position.y) * 0.04;
        pointsMat.opacity += (0.3 - pointsMat.opacity) * 0.04;
      } else if (currentShape === "form") {
        points.position.z += (0 - points.position.z) * 0.04;
        points.position.y += (0 - points.position.y) * 0.04;
        pointsMat.opacity += (1.0 - pointsMat.opacity) * 0.04;
      } else {
        points.position.z += (0 - points.position.z) * 0.04;
        points.position.y += (0 - points.position.y) * 0.04;
        if (!isPreview) pointsMat.opacity += (1.0 - pointsMat.opacity) * 0.04;
      }
      // smoothly lerp particle size
      pointsMat.size += (targetSize - pointsMat.size) * 0.05;
      if (wire) {
        wire.rotation.y = -clock * 0.5 + rotY;
        wire.rotation.x = clock * 0.25 + rotX;
      }

      // Update bokeh
      if (bokehMat) bokehMat.uniforms.uTime.value = clock;
    }

    // Always update background color + render, even on preview slides
    if (renderer) {
      // Fade 3D particles + wire on preview slides, keep bokeh
      if (points) {
        points.visible = true;
        pointsMat.opacity = isPreview ? 0.15 : 1.0;
      }
      if (wire) {
        wire.visible = true;
        wire.material.opacity = isPreview ? 0.02 : 0.06;
      }
      // Update bokeh only when not on preview (frozen static on preview)
      if (bokehMat && !isPreview) bokehMat.uniforms.uTime.value = clock;

      currentBg[0] += (targetBg[0] - currentBg[0]) * 0.03;
      currentBg[1] += (targetBg[1] - currentBg[1]) * 0.03;
      currentBg[2] += (targetBg[2] - currentBg[2]) * 0.03;
      var bgR = Math.floor(currentBg[0] * 255);
      var bgG = Math.floor(currentBg[1] * 255);
      var bgB = Math.floor(currentBg[2] * 255);
      renderer.setClearColor((bgR << 16) | (bgG << 8) | bgB, 1);
      if (scene.fog) scene.fog.color.setRGB(currentBg[0], currentBg[1], currentBg[2]);
      renderer.render(scene, camera);
    }
  }

  if (!prefersReduced) initThree();
  else {
    const m = document.getElementById("webgl");
    if (m) m.style.background = "radial-gradient(circle at 50% 60%, #111, #000)";
  }

  /* ---------------- Scroll-jacking / slide deck ---------------- */
  const slides = [...document.querySelectorAll(".slide")];
  const N = slides.length;
  let current = 0;
  let locked = false;
  const railFill = document.getElementById("railFill");
  const railDots = document.getElementById("railDots");
  const scrollHint = document.getElementById("scrollHint");

  slides.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "rail-dot" + (i === 0 ? " active" : "");
    d.dataset.go = i;
    railDots.appendChild(d);
  });

  function loadPreviewIframe(slide) {
    var iframe = slide.querySelector(".project-preview-iframe");
    if (iframe && iframe.dataset.src && iframe.src.indexOf(iframe.dataset.src) === -1) {
      iframe.src = iframe.dataset.src;
    }
  }
  function unloadPreviewIframe(slide) {
    var iframe = slide.querySelector(".project-preview-iframe");
    if (iframe) { iframe.src = ""; }
  }

  function goTo(index) {
    index = Math.max(0, Math.min(N - 1, index));
    if (index === current || locked) return;
    locked = true;
    var goingDown = index > current;
    // Add exit direction class and delay iframe unload until animation finishes
    slides[current].classList.remove("active");
    slides[current].classList.remove("enter-from-left", "enter-from-right");
    slides[current].classList.remove("clicked");
    if (slides[current].classList.contains("project-preview")) {
      var leavingSlide = slides[current];
      leavingSlide.classList.add(goingDown ? "exit-left" : "exit-right");
      var link = leavingSlide.querySelector(".project-preview-link");
      if (link) {
        link.addEventListener("transitionend", function handler() {
          link.removeEventListener("transitionend", handler);
          if (!leavingSlide.classList.contains("active")) {
            unloadPreviewIframe(leavingSlide);
            leavingSlide.classList.remove("exit-left", "exit-right");
          }
        });
      }
    }
    // Set entrance direction for incoming slide
    if (slides[index].classList.contains("project-preview")) {
      slides[index].classList.remove("exit-left", "exit-right");
      var enterClass = goingDown ? "enter-from-right" : "enter-from-left";
      slides[index].classList.add(enterClass);
      loadPreviewIframe(slides[index]);
      requestAnimationFrame(function() {
        slides[index].classList.add("active");
        setTimeout(function() { slides[index].classList.remove(enterClass); }, 1300);
      });
    } else {
      slides[index].classList.add("active");
    }
    const oldIndex = current;
    current = index;
    railFill.style.height = (index / (N - 1)) * 100 + "%";
    [...railDots.children].forEach((d, i) =>
      d.classList.toggle("active", i === index)
    );
    const shape = slides[index].dataset.shape;
    if (shape) morphTo(shape);
    // Reset form state when leaving the form slide
    if (slides[oldIndex] && slides[oldIndex].id === "form" && oldIndex !== index && formSent) {
      formSent = false;
      formFlyOff = false;
      envFormed = false;
      envSpin = 0;
      if (contactForm) {
        contactForm.style.opacity = "";
        contactForm.style.transition = "";
        contactForm.style.pointerEvents = "";
        contactForm.reset();
        contactForm.classList.remove("focused");
      }
      // Remove success message if present
      var oldMsg = document.querySelector(".form-success");
      if (oldMsg) oldMsg.remove();
      // Reset particle positions
      points.position.y = 0;
      points.position.z = 0;
    }
    if (index > 0) scrollHint.classList.add("hidden");
    else scrollHint.classList.remove("hidden");
    // Show return-to-top button when not on first slide
    var returnTopBtn = document.getElementById("returnTop");
    if (returnTopBtn) {
      if (index > 0) returnTopBtn.classList.add("visible");
      else returnTopBtn.classList.remove("visible");
    }
    setTimeout(() => { locked = false; }, 950);
  }

  let wheelAccum = 0;
  addEventListener("wheel", (e) => {
    // If clicked card iframe is under cursor, let it scroll naturally
    if (slides[current] && slides[current].classList.contains("clicked")) {
      return;
    }
    e.preventDefault();
    if (locked) return;
    wheelAccum += e.deltaY;
    if (Math.abs(wheelAccum) > 60) {
      goTo(current + (wheelAccum > 0 ? 1 : -1));
      wheelAccum = 0;
    }
  }, { passive: false });

  addEventListener("keydown", (e) => {
    if (locked) return;
    if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); goTo(current + 1); }
    else if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); goTo(current - 1); }
    else if (e.key === "Home") goTo(0);
    else if (e.key === "End") goTo(N - 1);
    else if (e.key === "Escape") closeMenu();
  });

  let touchY = 0;
  addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchend", (e) => {
    if (locked) return;
    const dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) goTo(current + (dy > 0 ? 1 : -1));
  }, { passive: true });

  // Remove clicked state when mouse leaves the iframe specifically
  // Also toggle clicked on iframe click (second click releases)
  document.querySelectorAll(".project-preview-iframe").forEach(function(iframe) {
    iframe.addEventListener("mouseleave", function() {
      var slide = iframe.closest(".project-preview");
      if (slide) slide.classList.remove("clicked");
    });
    iframe.addEventListener("load", function() {
      try {
        iframe.contentDocument.addEventListener("click", function() {
          var slide = iframe.closest(".project-preview");
          if (slide) slide.classList.remove("clicked");
        });
      } catch(e) {}
    });
  });

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go]");
    if (t) {
      e.preventDefault();
      closeMenu();
      var goVal = t.dataset.go;
      var goIdx = parseInt(goVal, 10);
      if (isNaN(goIdx)) {
        for (var gi = 0; gi < N; gi++) {
          if (slides[gi].id === goVal) { goIdx = gi; break; }
        }
      }
      if (!isNaN(goIdx)) goTo(goIdx);
    }
    // Click on overlay toggles iframe scrolling (don't navigate)
    const overlay = e.target.closest(".project-preview-overlay");
    if (overlay) {
      e.preventDefault();
      e.stopPropagation();
      const slide = overlay.closest(".project-preview");
      if (slide) slide.classList.toggle("clicked");
    }
    // Click on label/button navigates (don't toggle clicked)
    const label = e.target.closest(".project-preview-label");
    if (label) {
      e.preventDefault();
      const link = label.closest(".project-preview-link");
      if (link) window.location = link.href;
    }
  });

  // Contact form — submit via fetch, morph to envelope and zoom off
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    // Toggle focused state when any input/textarea is focused
    contactForm.addEventListener("focusin", function() {
      contactForm.classList.add("focused");
    });
    contactForm.addEventListener("focusout", function() {
      if (!contactForm.contains(document.activeElement) || document.activeElement === contactForm) {
        contactForm.classList.remove("focused");
      }
    });
    contactForm.addEventListener("submit", function(e) {
      e.preventDefault();
      if (formSent) return;
      // Morph particles to envelope shape (stays in place, spins to face-on)
      morphTo("envelope");
      formSent = true;
      envFormed = false;
      envSpin = Math.PI * 0.8;  // start rotated, will ease to 0
      // Hide form fields
      contactForm.style.opacity = "0";
      contactForm.style.transition = "opacity 0.6s ease";
      contactForm.style.pointerEvents = "none";
      // Submit data via fetch (Formsubmit.co — no backend needed)
      var formData = new FormData(contactForm);
      formData.append("_subject", "New project enquiry — Monolith Studio");
      fetch("https://formsubmit.co/ajax/studio@monolith.creative", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData
      }).catch(function(err) {
        console.error("Form submit error:", err);
      });
      // After envelope is fully formed, wait 2s then fly off
      function checkEnvFormed() {
        if (envFormed) {
          setTimeout(function() {
            formFlyOff = true;
            // Show thanks message 1s after fly-off starts
            setTimeout(function() {
              var slide = document.getElementById("form");
              if (slide) {
                var inner = slide.querySelector(".slide-inner");
                var eyebrow = inner.querySelector(".eyebrow");
                var msg = document.createElement("p");
                msg.className = "lede form-success";
                msg.textContent = "Thanks — we'll be in touch soon.";
                msg.style.cssText = "text-align:center;opacity:0;transition:opacity 1s ease;margin-top:0.5rem;align-self:center;";
                if (eyebrow && eyebrow.nextSibling) {
                  inner.insertBefore(msg, eyebrow.nextSibling);
                } else {
                  inner.appendChild(msg);
                }
                requestAnimationFrame(function() { msg.style.opacity = "1"; });
                // Add Home button below the thanks message
                var homeBtn = document.createElement("a");
                homeBtn.href = "#hero";
                homeBtn.className = "cta form-home-btn";
                homeBtn.setAttribute("data-go", "hero");
                homeBtn.innerHTML = "Home <span>→</span>";
                homeBtn.style.cssText = "opacity:0;transition:opacity 1s ease 0.5s;margin-top:1.5rem;align-self:center;";
                inner.appendChild(homeBtn);
                requestAnimationFrame(function() { homeBtn.style.opacity = "1"; });
              }
            }, 1000);
          }, 2000);
        } else {
          setTimeout(checkEnvFormed, 200);
        }
      }
      setTimeout(checkEnvFormed, 500);
    });
  }

  // Check hash first — if deep-linking, jump directly without showing slide 0
  var hashName = location.hash.replace("#", "");
  var hashIndex = -1;
  if (hashName) {
    for (var h = 0; h < N; h++) {
      if (slides[h].id === hashName) { hashIndex = h; break; }
    }
  }
  if (hashIndex >= 0) {
    current = hashIndex;
    slides[hashIndex].classList.add("active");
    if (slides[hashIndex].classList.contains("project-preview")) loadPreviewIframe(slides[hashIndex]);
    railFill.style.height = (hashIndex / (N - 1)) * 100 + "%";
    [...railDots.children].forEach((d, i) =>
      d.classList.toggle("active", i === hashIndex)
    );
    var initialShape = slides[hashIndex].dataset.shape;
    if (hashIndex > 0) scrollHint.classList.add("hidden");
    var rtBtn = document.getElementById("returnTop");
    if (rtBtn && hashIndex > 0) rtBtn.classList.add("visible");
  } else {
    slides[0].classList.add("active");
    railFill.style.height = "0%";
  }

  /* ---------------- Menu ---------------- */
  const menuBtn = document.getElementById("menuBtn");
  const menuOverlay = document.getElementById("menuOverlay");
  let menuOpen = false;
  function openMenu() { menuOpen = true; menuBtn.classList.add("open"); menuOverlay.classList.add("open"); menuOverlay.setAttribute("aria-hidden", "false"); }
  function closeMenu() { menuOpen = false; menuBtn.classList.remove("open"); menuOverlay.classList.remove("open"); menuOverlay.setAttribute("aria-hidden", "true"); }
  menuBtn.addEventListener("click", () => menuOpen ? closeMenu() : openMenu());

  // Return to top button — go to first slide
  var returnTopBtn = document.getElementById("returnTop");
  if (returnTopBtn) {
    returnTopBtn.addEventListener("click", function() { goTo(0); });
  }

})();
