/* =========================================================
   MONOLITH — project data, page renderer, and canvas
   animations for subpages. Each project has a unique
   animation that matches its actual content and industry.
   ========================================================= */

/* ---------------- Project data ---------------- */
const PROJECTS = {
  lumen: {
    name: "Lumen",
    category: "Brand Film",
    year: "2025",
    client: "Lumen Energy",
    duration: "3 min launch film + 6 × 30s cutdowns",
    animation: "sun",
    glyph: "◐",
    tags: ["Film", "3D", "Clean Energy"],
    headline: "A film<br/>for the<br/>sun.",
    subtitle: "A cinematic launch film for Lumen Energy's community solar platform — combining real footage from solar farms across three continents with CGI solar animations.",
    brief: "Lumen Energy was launching a new platform that lets communities invest in and share solar power. They needed a launch film that didn't feel like a corporate energy ad — something cinematic, human, and warm. The kind of film that makes you want to be part of something.",
    approach: "We spent two weeks filming at solar farms in Spain, Morocco, and Japan — capturing the infrastructure at golden hour, dawn, and dusk. Back in the studio, we built CGI solar sequences in Houdini: radiating light systems, particle flares, and energy flow visualizations that mirror the platform's underlying technology. The two worlds — real and CGI — are stitched together with a sound design built from actual solar panel frequencies.",
    outcome: "The film launched at Lumen's Series B announcement and drove 2.1M views in the first week. It was picked up by two major tech publications and helped the company close a $40M funding round. The 30-second cutdowns ran across digital and OOH in six markets.",
    credits: [
      { role: "Creative Direction", name: "Aiko Kuroda, Marcus Reed" },
      { role: "Cinematography", name: "Marcus Reed" },
      { role: "3D & VFX", name: "Elena Novak" },
      { role: "Sound Design", name: "Jamie Byrne" },
      { role: "Edit & Grade", name: "Daichi Tanaka" },
    ],
    metrics: [
      { label: "Views (week one)", value: "2.1M" },
      { label: "Funding raised", value: "$40M" },
      { label: "Markets", value: "6" },
    ],
    next: "strata",
    prev: "pulse",
  },
  strata: {
    name: "Strata",
    category: "Brand Identity",
    year: "2025",
    client: "Strata Finance",
    duration: "Identity system + 12 touchpoints",
    animation: "cloud",
    glyph: "✺",
    tags: ["Identity", "Generative", "Fintech"],
    headline: "An identity<br/>that generates<br/>itself.",
    subtitle: "A complete visual identity for a new decentralized finance platform — built around a generative system that creates a unique visual mark for every user.",
    brief: "Strata Finance wanted to democratize access to DeFi — but every fintech identity looked the same: blue gradients, clean sans-serif, trust signals. They wanted something that felt alive, personal, and unmistakably theirs. The brief: an identity system that could scale across 12 touchpoints but never feel repetitive.",
    approach: "We built a generative identity engine — a particle system that takes each user's wallet address as a seed and produces a unique cloud-like visual mark. No two users get the same identity. The core logo is a fixed anchor, but everything around it — patterns, gradients, motion — is generated per user. We delivered the system as a web app, a print kit, motion templates, and an API.",
    outcome: "Strata launched with the new identity across web, app, email, social, print, and OOH. The generative marks became a viral moment — users sharing their unique Strata cloud on social drove 50K+ signups in the first month. The system won Awwwards Site of the Year.",
    credits: [
      { role: "Creative Direction", name: "Aiko Kuroda" },
      { role: "Design", name: "Daichi Tanaka" },
      { role: "Generative System", name: "Sofia Lindqvist" },
      { role: "Motion", name: "Elena Novak" },
      { role: "Strategy", name: "Marcus Reed" },
    ],
    metrics: [
      { label: "Signups (month one)", value: "50K+" },
      { label: "Touchpoints", value: "12" },
      { label: "Unique marks", value: "∞" },
    ],
    next: "wavelength",
    prev: "lumen",
  },
  wavelength: {
    name: "Wavelength",
    category: "Interactive Web",
    year: "2024",
    client: "Wavelength Records",
    duration: "WebGL album experience site",
    animation: "wave",
    glyph: "∿",
    tags: ["WebGL", "Audio", "Music"],
    headline: "An album<br/>you can<br/>see.",
    subtitle: "An immersive WebGL experience site for Wavelength Records' debut album — where every track generates a unique audio-reactive visual world.",
    brief: "Wavelength Records was releasing their flagship album and wanted more than a streaming page. They wanted the album to be an experience — a site where each track had its own visual world that responded to the music in real time. The site needed to work on mobile, load fast, and feel like a music video you could control.",
    approach: "We built the site in Three.js with a custom audio-reactive shader system. Each track maps to a unique visual scene — pulsing waveforms, particle bursts, gravitational fields — all driven by real-time FFT analysis of the audio. Users can scrub through tracks, and the visuals morph seamlessly between scenes. We optimized the WebGL to hit 60fps on mobile and lazy-load scenes so the site opens in under 2 seconds.",
    outcome: "The site hit 500K visitors in the first month and won Awwwards Site of the Day. Average session time was 8 minutes — users stayed to explore every track's visual world. The album hit #3 on the electronic charts, and the site was featured in The FWA and CSS Design Awards.",
    credits: [
      { role: "Creative Direction", name: "Sofia Lindqvist" },
      { role: "WebGL & Code", name: "Sofia Lindqvist" },
      { role: "Design", name: "Daichi Tanaka" },
      { role: "Audio Analysis", name: "Jamie Byrne" },
      { role: "Motion", name: "Elena Novak" },
    ],
    metrics: [
      { label: "Visitors (month one)", value: "500K" },
      { label: "Avg. session time", value: "8 min" },
      { label: "Album chart position", value: "#3" },
    ],
    next: "latitude",
    prev: "strata",
  },
  latitude: {
    name: "Latitude",
    category: "Motion System",
    year: "2024",
    client: "Latitude Travel Group",
    duration: "Motion language + 200+ video assets",
    animation: "world",
    glyph: "⟿",
    tags: ["Motion", "System", "Travel"],
    headline: "One motion<br/>language.<br/>Six brands.",
    subtitle: "A unified motion design system for Latitude Travel Group's six sub-brands — deployed across 200+ video assets and reducing production time by 40%.",
    brief: "Latitude Travel Group operates six travel brands across luxury, adventure, budget, family, corporate, and cruise segments. Each brand had its own motion style, created by different agencies, and nothing felt like it came from the same family. They needed one motion language that could flex across all six brands while keeping each one's personality.",
    approach: "We built a modular motion system — a library of reusable animation primitives (transitions, text treatments, lower thirds, map animations, route visualizations) that could be re-skinned per brand. Each brand gets its own color palette, typography, and pacing, but the underlying motion grammar is shared. We delivered the system as an After Effects toolkit, a Lottie library, and a set of WebGL components for their digital platforms.",
    outcome: "The system was deployed across 200+ video assets in the first six months — social ads, TV spots, in-flight content, and digital display. Production time per asset dropped 40% because teams could assemble from the library instead of starting from scratch. Brand recognition scores went up 23% across the group.",
    credits: [
      { role: "Creative Direction", name: "Elena Novak" },
      { role: "Motion Design", name: "Elena Novak, Daichi Tanaka" },
      { role: "System Architecture", name: "Sofia Lindqvist" },
      { role: "Brand Strategy", name: "Aiko Kuroda" },
    ],
    metrics: [
      { label: "Video assets", value: "200+" },
      { label: "Production time saved", value: "40%" },
      { label: "Brand recognition lift", value: "+23%" },
    ],
    next: "threadwork",
    prev: "wavelength",
  },
  threadwork: {
    name: "Threadwork",
    category: "Fashion Film",
    year: "2023",
    client: "Threadwork",
    duration: "Brand film + seasonal identity system",
    animation: "thread3d",
    glyph: "╳",
    tags: ["Film", "Identity", "Fashion"],
    headline: "Woven from<br/>a single<br/>thread.",
    subtitle: "A brand film and seasonal identity system for an independent fashion house — where every visual element is built from a single animated thread that weaves across the screen.",
    brief: "Threadwork is an independent fashion house known for handwoven textiles. They were launching their Autumn/Winter collection and wanted a brand film and identity system that reflected their craft — everything made by hand, everything starting from a single thread. They didn't want a typical fashion film with models and moody lighting. They wanted the process to be the film.",
    approach: "We built the entire identity around a single animated thread — a continuous line that weaves, crosses, and knots itself to form every visual element: the logo, the collection names, the lookbook layouts, the film transitions. The brand film combines macro footage of the weaving process with CGI thread animations that mirror the fabric patterns. The identity system ships as a generative tool — the studio can type any word and the thread spells it out in real time.",
    outcome: "The film premiered at London Fashion Week and was featured in Vogue, Dazed, and i-D. The generative thread tool became a social media moment — #ThreadworkName generated 30K+ posts of people weaving their own names. The A/W collection sold out in 11 days, a 60% increase on the previous season.",
    credits: [
      { role: "Creative Direction", name: "Aiko Kuroda" },
      { role: "Design & Animation", name: "Elena Novak" },
      { role: "Cinematography", name: "Marcus Reed" },
      { role: "Generative Tool", name: "Sofia Lindqvist" },
      { role: "Sound Design", name: "Jamie Byrne" },
    ],
    metrics: [
      { label: "Fashion Week premiere", value: "LDN" },
      { label: "Collection sellout", value: "11 days" },
      { label: "Sales increase", value: "+60%" },
    ],
    next: "pulse",
    prev: "latitude",
  },
  pulse: {
    name: "Pulse",
    category: "Product Film",
    year: "2023",
    client: "Pulse Jewellers",
    duration: "90-second hero film + microsite",
    animation: "pulse",
    glyph: "⬢",
    tags: ["Film", "Product", "Luxury"],
    headline: "A timepiece<br/>that endures.<br/>A film that captivates.",
    subtitle: "A hero product film and interactive microsite for Pulse Jewellers' flagship timepiece collection — macro cinematography meets CGI, with a heartbeat-driven visual system.",
    brief: "Pulse Jewellers was launching their flagship timepiece collection — precision-crafted watches that blend heritage craftsmanship with modern design. They needed a hero film for the launch event and an interactive microsite that let people explore the timepiece in 3D. The film had to make a luxury object feel monumental — and it had to feel alive, like a heartbeat.",
    approach: "We shot the timepiece in extreme macro — capturing every detail of the polished steel, the subtle play of light across the sapphire crystal, the texture of the hand-finished dial. In post, we added CGI sequences showing the movement 'thinking' — particle flows inside the mechanism, data streams visualized as light, and a heartbeat-driven pulse that runs through every transition. The microsite let users rotate a 3D model of the timepiece, explore hotspots, and watch the film. Everything was built to load fast and run on mobile.",
    outcome: "The film was featured in the launch event presentation and drove 10M+ views across platforms. The microsite saw 800K visitors in launch week with an average of 4 minutes spent exploring the 3D model. Pulse Jewellers sold out their first collection in 72 hours.",
    credits: [
      { role: "Creative Direction", name: "Marcus Reed" },
      { role: "Cinematography", name: "Marcus Reed" },
      { role: "3D & Product Viz", name: "Elena Novov" },
      { role: "Microsite", name: "Sofia Lindqvist" },
      { role: "Sound Design", name: "Jamie Byrne" },
    ],
    metrics: [
      { label: "Views", value: "10M+" },
      { label: "Microsite visitors", value: "800K" },
      { label: "Sellout time", value: "72 hrs" },
    ],
    next: "lumen",
    prev: "threadwork",
  },
};

const PROJECT_ORDER = ["lumen", "strata", "wavelength", "latitude", "threadwork", "pulse"];

/* ---------------- Project page renderer ---------------- */
function initProjectPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "lumen";
  const p = PROJECTS[id] || PROJECTS.lumen;
  const main = document.getElementById("projectMain");

  document.title = `${p.name} — MONOLITH`;

  const creditsHTML = p.credits.map(c =>
    `<div class="credit-item"><span class="label">${c.role}</span><span class="value">${c.name}</span></div>`
  ).join("");

  const metricsHTML = p.metrics.map(m =>
    `<div class="studio-stat"><div class="num">${m.value}</div><div class="label">${m.label}</div></div>`
  ).join("");

  main.innerHTML = `
    <section class="project-hero">
      <div class="project-hero-content">
        <p class="subpage-eyebrow sr">${p.category} · ${p.year}</p>
        <h1 class="subpage-title sr">${p.headline}</h1>
        <p class="subpage-subtitle sr">${p.subtitle}</p>
        <div class="project-meta-row sr" style="margin-top: 2rem;">
          <div class="project-meta-item"><span class="label">Client</span><span class="value">${p.client}</span></div>
          <div class="project-meta-item"><span class="label">Year</span><span class="value">${p.year}</span></div>
          <div class="project-meta-item"><span class="label">Scope</span><span class="value">${p.duration}</span></div>
        </div>
      </div>
    </section>

    <section class="project-section sr">
      <h3>The Brief</h3>
      <p>${p.brief}</p>
    </section>

    <section class="project-section sr">
      <h3>The Approach</h3>
      <p>${p.approach}</p>
    </section>

    <section class="project-section sr">
      <h3>The Outcome</h3>
      <p>${p.outcome}</p>
      <div class="studio-stats" style="grid-template-columns: repeat(3,1fr); margin-top: 2.5rem;">
        ${metricsHTML}
      </div>
    </section>

    <section class="project-section sr">
      <h3>Credits</h3>
      <div class="project-credits">
        ${creditsHTML}
      </div>
    </section>

    <nav class="project-nav">
      <a href="project.html?id=${p.prev}" class="prev-nav">
        <div>
          <span class="nav-label">Previous</span>
          ${PROJECTS[p.prev].name}
        </div>
        <span>←</span>
      </a>
      <a href="work.html" style="font-size: 0.85rem; color: var(--ink-faint); letter-spacing: 0.16em; text-transform: uppercase;">All Work</a>
      <a href="project.html?id=${p.next}" class="next-nav">
        <span>→</span>
        <div>
          <span class="nav-label">Next</span>
          ${PROJECTS[p.next].name}
        </div>
      </a>
    </nav>
  `;

  // reveal animations
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  main.querySelectorAll(".sr").forEach(el => io.observe(el));

  // project hero animation
  const canvasContainer = document.querySelector(".project-canvas");
  let activeRenderer = null;

  // Parallax via camera position in 3D
  function onProjectScroll() {
    if (activeRenderer && activeRenderer.setScrollProgress) {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      activeRenderer.setScrollProgress(progress);
    }
  }
  window.addEventListener("scroll", onProjectScroll, { passive: true });

  if (p.animation === "pulse" && typeof PulseRenderer !== "undefined") {
    // For pulse: use Three.js 3D watch renderer
    const heroContainer = document.querySelector(".project-canvas");
    const heroCanvas = document.getElementById("projCanvas");
    if (heroCanvas) heroCanvas.remove();
    if (heroContainer) {
      activeRenderer = new PulseRenderer(heroContainer, { lowres: false });
    }
  } else if (p.animation === "sun" && typeof SunRenderer !== "undefined") {
    // For sun: use Three.js shader-based sun renderer (hero only — one instance)
    const heroContainer = document.querySelector(".project-canvas");
    const heroCanvas = document.getElementById("projCanvas");
    if (heroCanvas) heroCanvas.remove();
    requestAnimationFrame(() => {
      if (heroContainer) activeRenderer = new SunRenderer(heroContainer, { lowres: false });
    });
  } else if (p.animation === "cloud" && typeof CloudRenderer !== "undefined") {
    // For strata: use Three.js nebula cloud renderer (hero only — one instance)
    const heroContainer = document.querySelector(".project-canvas");
    const heroCanvas = document.getElementById("projCanvas");
    if (heroCanvas) heroCanvas.remove();
    requestAnimationFrame(() => {
      if (heroContainer) activeRenderer = new CloudRenderer(heroContainer, { lowres: false });
    });
  } else if (p.animation === "wave" && typeof WaveRenderer !== "undefined") {
    // For wavelength: use Three.js wave renderer (hero only — one instance)
    const heroContainer = document.querySelector(".project-canvas");
    const heroCanvas = document.getElementById("projCanvas");
    if (heroCanvas) heroCanvas.remove();
    if (heroContainer) {
      activeRenderer = new WaveRenderer(heroContainer, { lowres: false });
    }
  } else if (p.animation === "world" && typeof WorldRenderer !== "undefined") {
    // For latitude: use Three.js world network renderer
    const heroContainer = document.querySelector(".project-canvas");
    const heroCanvas = document.getElementById("projCanvas");
    if (heroCanvas) heroCanvas.remove();
    if (heroContainer) {
      activeRenderer = new WorldRenderer(heroContainer, { lowres: false });
    }
  } else if (p.animation === "thread3d" && typeof ThreadRenderer !== "undefined") {
    // For threadwork: rippling spider web image with scroll zoom
    const heroContainer = document.querySelector(".project-canvas");
    const heroCanvas = document.getElementById("projCanvas");
    if (heroCanvas) heroCanvas.remove();
    if (heroContainer) {
      heroContainer.style.background = "#000";
      activeRenderer = new ThreadRenderer(heroContainer, { lowres: false });
    }
  } else {
    initProjectAnimation(document.getElementById("projCanvas"), p.animation, true);
  }
}

/* ===========================================================
   CANVAS ANIMATIONS
   Each project has a unique animation matching its content.
   =========================================================== */

function setupCanvas(canvas) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h: rect.height, dpr };
}

/* ---- Subpage hero: subtle drifting particle field ---- */
function initHeroCanvas(canvas) {
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let { ctx, w, h } = setupCanvas(canvas);
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
    r: Math.random() * 1.5 + 0.3,
    a: Math.random() * 0.5 + 0.1,
  }));
  function resize() { ({ ctx, w, h } = setupCanvas(canvas)); }
  addEventListener("resize", resize);
  function loop() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---- Thumbnail animations for work archive ---- */
function initThumbAnimation(canvas, type) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const previews = {
    sun: drawSunPreview,
    cloud: drawCloudPreview,
    wave: drawWavePreview,
    paths: drawPathsPreview,
    threads: drawThreadsPreview,
    pulse: drawPulsePreview,
  };
  let { ctx, w, h } = setupCanvas(canvas);
  let t = 0;
  function resize() { ({ ctx, w, h } = setupCanvas(canvas)); }
  addEventListener("resize", resize);
  function loop() {
    t += 0.016;
    ctx.clearRect(0, 0, w, h);
    if (previews[type]) previews[type](ctx, w, h, t);
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---- Full project animation (hero + visual) ---- */
function initProjectAnimation(canvas, type, isHero) {
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const animations = {
    sun: animateSun,
    cloud: animateCloud,
    wave: animateWave,
    paths: animatePaths,
    threads: animateThreads,
    pulse: animatePulse,
  };
  let { ctx, w, h } = setupCanvas(canvas);
  let t = 0;
  let mx = 0.5, my = 0.5;
  function resize() { ({ ctx, w, h } = setupCanvas(canvas)); }
  addEventListener("resize", resize);
  canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width;
    my = (e.clientY - r.top) / r.height;
  });
  function loop() {
    t += 0.016;
    ctx.clearRect(0, 0, w, h);
    if (animations[type]) animations[type](ctx, w, h, t, mx, my, isHero);
    requestAnimationFrame(loop);
  }
  loop();
}

/* ============== ANIMATION: SUN (Lumen — solar energy) ============== */
// Photorealistic sun rendered with per-pixel ImageData:
//  - Multi-octave value noise for real granulation texture
//  - Physical limb darkening: I(μ) = I₀(1 - u + u·μ), μ = √(1-r²)
//  - Blackbody color mapping (~5778K → yellow-white)
//  - Animated plasma flow (noise scrolls and morphs over time)
//  - Sunspots (dark cooler regions with penumbra)
//  - Layered corona, prominences, streamers, solar wind
// Surface rendered to small offscreen canvas, scaled up for performance.

// --- Value noise helpers (hash-based, no precomputed tables) ---
function hash2(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
function smoothstep(t) { return t * t * (3 - 2 * t); }
function valueNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const v00 = hash2(ix, iy);
  const v10 = hash2(ix + 1, iy);
  const v01 = hash2(ix, iy + 1);
  const v11 = hash2(ix + 1, iy + 1);
  const sx = smoothstep(fx), sy = smoothstep(fy);
  return (v00 * (1 - sx) + v10 * sx) * (1 - sy) + (v01 * (1 - sx) + v11 * sx) * sy;
}
// Multi-octave fractal noise
function fbm(x, y, octaves) {
  let sum = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum;
}

// Offscreen canvas for per-pixel sun surface (reused across frames)
let _sunOffscreen = null;
let _sunOffCtx = null;
let _sunImgData = null;
let _sunRenderSize = 0;

// Precomputed noise textures (generated once, scrolled each frame)
let _sunNoiseTex = null;   // fine granulation noise (256x256)
let _sunNoiseTex2 = null;  // large-scale flow noise (128x128)
let _sunSpotTex = null;    // sunspot mask noise (128x128)
const NOISE_TEX_SIZE = 256;
const NOISE_TEX2_SIZE = 128;

function generateNoiseTexture(size, scale, octaves, offset) {
  const tex = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * scale + offset;
      const ny = (y / size) * scale + offset;
      tex[y * size + x] = fbm(nx, ny, octaves);
    }
  }
  return tex;
}

function ensureNoiseTextures() {
  if (_sunNoiseTex) return;
  _sunNoiseTex = generateNoiseTexture(NOISE_TEX_SIZE, 20, 4, 0);
  _sunNoiseTex2 = generateNoiseTexture(NOISE_TEX2_SIZE, 8, 3, 50);
  _sunSpotTex = generateNoiseTexture(NOISE_TEX2_SIZE, 5, 2, 200);
}

// Sample a scrolling noise texture with bilinear interpolation
function sampleNoise(tex, texSize, u, v) {
  // u, v are in 0..1 — wrap around
  let fu = u - Math.floor(u);
  let fv = v - Math.floor(v);
  const x = fu * texSize;
  const y = fv * texSize;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ix1 = (ix + 1) % texSize;
  const iy1 = (iy + 1) % texSize;
  const v00 = tex[iy * texSize + ix];
  const v10 = tex[iy * texSize + ix1];
  const v01 = tex[iy1 * texSize + ix];
  const v11 = tex[iy1 * texSize + ix1];
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  return (v00 * (1 - sx) + v10 * sx) * (1 - sy) + (v01 * (1 - sx) + v11 * sx) * sy;
}

function getSunOffscreen(size) {
  if (!_sunOffscreen || _sunRenderSize !== size) {
    _sunOffscreen = document.createElement("canvas");
    _sunOffscreen.width = size;
    _sunOffscreen.height = size;
    _sunOffCtx = _sunOffscreen.getContext("2d");
    _sunImgData = _sunOffCtx.createImageData(size, size);
    _sunRenderSize = size;
  }
  return { canvas: _sunOffscreen, ctx: _sunOffCtx, img: _sunImgData };
}

// Blackbody color approximation for temperature T (Kelvin)
// Returns [r, g, b] in 0-255
function blackbody(T) {
  // Approximation by Tanner Helland
  const t = T / 100;
  let r, g, b;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.6017523791;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }
  if (t >= 66) {
    b = 255;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  }
  return [
    Math.max(0, Math.min(255, r)),
    Math.max(0, Math.min(255, g)),
    Math.max(0, Math.min(255, b)),
  ];
}

// Precompute base sun color from blackbody at 5778K
const SUN_BASE_RGB = blackbody(5778);
const SUN_HOT_RGB = blackbody(6200);  // hotter granules
const SUN_COOL_RGB = blackbody(4500); // cooler lanes / sunspot penumbra
const SUN_DARK_RGB = blackbody(3500); // sunspot umbra

function animateSun(ctx, w, h, t, mx, my, isHero) {
  const cx = w / 2 + (mx - 0.5) * 30;
  const cy = h / 2 + (my - 0.5) * 30;
  const R = Math.min(w, h) * (isHero ? 0.2 : 0.17);
  const pulse = 1 + Math.sin(t * 0.8) * 0.02;

  // ============ CORONA (drawn first, behind the disc) ============
  const coronaLayers = [
    { r: R * 4.5, alpha: 0.012, c: [255, 130, 30] },
    { r: R * 3.0, alpha: 0.025, c: [255, 150, 45] },
    { r: R * 2.2, alpha: 0.05, c: [255, 170, 55] },
    { r: R * 1.7, alpha: 0.09, c: [255, 190, 70] },
    { r: R * 1.35, alpha: 0.16, c: [255, 210, 100] },
    { r: R * 1.12, alpha: 0.28, c: [255, 230, 140] },
  ];
  for (const layer of coronaLayers) {
    const r = layer.r * pulse;
    const grad = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, r);
    grad.addColorStop(0, `rgba(${layer.c[0]},${layer.c[1]},${layer.c[2]},${layer.alpha})`);
    grad.addColorStop(1, `rgba(${layer.c[0]},${layer.c[1]},${layer.c[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ============ CORONAL STREAMERS ============
  const numStreamers = 14;
  for (let i = 0; i < numStreamers; i++) {
    const angle = (i / numStreamers) * Math.PI * 2 + t * 0.025;
    const len = R * (1.4 + Math.sin(t * 0.4 + i * 1.3) * 0.5 + Math.sin(t * 0.2 + i * 2.1) * 0.3);
    const x1 = cx + Math.cos(angle) * R * 1.01;
    const y1 = cy + Math.sin(angle) * R * 1.01;
    const x2 = cx + Math.cos(angle) * (R + len);
    const y2 = cy + Math.sin(angle) * (R + len);
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, "rgba(255,200,100,0.1)");
    grad.addColorStop(0.5, "rgba(255,170,70,0.04)");
    grad.addColorStop(1, "rgba(255,140,40,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2 + Math.sin(t + i) * 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX = (x1 + x2) / 2 + Math.cos(angle + Math.PI / 2) * 6;
    const midY = (y1 + y2) / 2 + Math.sin(angle + Math.PI / 2) * 6;
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();
  }

  // ============ PROMINENCES (arcing flares) ============
  const numProm = isHero ? 5 : 3;
  for (let i = 0; i < numProm; i++) {
    const baseAngle = (i / numProm) * Math.PI * 2 + t * 0.015;
    const arcSpan = 0.12 + Math.sin(t * 0.3 + i) * 0.04;
    const arcHeight = R * (0.12 + Math.sin(t * 0.35 + i * 1.7) * 0.06);
    const steps = 20;
    ctx.strokeStyle = "rgba(255,130,30,0.06)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const a = baseAngle - arcSpan / 2 + u * arcSpan;
      const rise = Math.sin(u * Math.PI) * arcHeight;
      const r = R + rise;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,170,60,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const a = baseAngle - arcSpan / 2 + u * arcSpan;
      const rise = Math.sin(u * Math.PI) * arcHeight;
      const r = R + rise;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // ============ SUN SURFACE (per-pixel ImageData) ============
  // Precomputed noise textures are scrolled each frame — no hash calls per pixel
  ensureNoiseTextures();
  const renderSize = isHero ? 180 : 120;
  const { canvas: offCanvas, ctx: offCtx, img: imgData } = getSunOffscreen(renderSize);

  // Scroll offsets for plasma flow (UV coordinates into noise textures)
  const scrollU = t * 0.015;
  const scrollV = t * 0.01;
  const half = renderSize / 2;
  const data = imgData.data;

  for (let py = 0; py < renderSize; py++) {
    for (let px = 0; px < renderSize; px++) {
      const idx = (py * renderSize + px);
      const dx = (px - half) / half;
      const dy = (py - half) / half;
      const distSq = dx * dx + dy * dy;
      const i4 = idx * 4;

      if (distSq > 1.0) {
        data[i4 + 3] = 0;
        continue;
      }

      const mu = Math.sqrt(1 - distSq);

      // Sample precomputed noise textures with scrolling UVs
      // Map disc coordinates to noise UV (0..1), scrolling over time
      const u = (dx + 1) * 0.5 + scrollU;
      const v = (dy + 1) * 0.5 + scrollV;
      // fine granulation
      let n = sampleNoise(_sunNoiseTex, NOISE_TEX_SIZE, u * 3, v * 3);
      // large-scale flow
      n = n * 0.65 + sampleNoise(_sunNoiseTex2, NOISE_TEX2_SIZE, u * 1.5, v * 1.5) * 0.35;

      // Limb darkening (u ≈ 0.6)
      const limb = 0.4 + 0.6 * mu;

      let brightness = (n - 0.42) * 0.6 + 0.5;
      brightness = brightness < 0 ? 0 : brightness > 1 ? 1 : brightness;
      brightness *= limb;
      brightness += mu * mu * 0.08;

      // Sunspots
      const spotN = sampleNoise(_sunSpotTex, NOISE_TEX2_SIZE, u + scrollU * 0.3, v + scrollV * 0.3);
      if (spotN > 0.68 && mu > 0.25) {
        const spotStrength = (spotN - 0.68) / 0.15;
        brightness *= (1 - spotStrength * 0.65);
      }

      // Color mapping via blackbody interpolation
      let r, g, b;
      if (brightness > 0.5) {
        const t2 = (brightness - 0.5) * 2;
        r = SUN_BASE_RGB[0] + (SUN_HOT_RGB[0] - SUN_BASE_RGB[0]) * t2;
        g = SUN_BASE_RGB[1] + (SUN_HOT_RGB[1] - SUN_BASE_RGB[1]) * t2;
        b = SUN_BASE_RGB[2] + (SUN_HOT_RGB[2] - SUN_BASE_RGB[2]) * t2;
      } else {
        const t2 = brightness * 2;
        r = SUN_COOL_RGB[0] + (SUN_BASE_RGB[0] - SUN_COOL_RGB[0]) * t2;
        g = SUN_COOL_RGB[1] + (SUN_BASE_RGB[1] - SUN_COOL_RGB[1]) * t2;
        b = SUN_COOL_RGB[2] + (SUN_BASE_RGB[2] - SUN_COOL_RGB[2]) * t2;
      }

      if (brightness < 0.25) {
        const dark = (0.25 - brightness) / 0.25;
        r = r * (1 - dark * 0.5) + SUN_DARK_RGB[0] * dark * 0.5;
        g = g * (1 - dark * 0.5) + SUN_DARK_RGB[1] * dark * 0.5;
        b = b * (1 - dark * 0.5) + SUN_DARK_RGB[2] * dark * 0.5;
      }

      const edgeFade = Math.min(1, (1 - Math.sqrt(distSq)) * renderSize * 0.5);

      data[i4]     = r < 0 ? 0 : r > 255 ? 255 : r;
      data[i4 + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      data[i4 + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      data[i4 + 3] = edgeFade * 255;
    }
  }
  offCtx.putImageData(imgData, 0, 0);

  // Draw the surface disc scaled up, with smoothing
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(offCanvas, cx - R, cy - R, R * 2, R * 2);
  ctx.restore();

  // ============ INNER CORE GLOW ============
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.4);
  coreGrad.addColorStop(0, `rgba(255,255,245,${0.15 + Math.sin(t * 1.2) * 0.04})`);
  coreGrad.addColorStop(1, "rgba(255,255,245,0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // ============ SOLAR WIND PARTICLES ============
  const numWind = isHero ? 35 : 20;
  for (let i = 0; i < numWind; i++) {
    const seed = i * 3.1;
    const cycleLen = 3 + (seed % 2);
    const phase = ((t + seed * 0.7) % cycleLen) / cycleLen;
    const angle = seed * 1.9 + t * 0.04;
    const dist = R * (1.1 + phase * 2.5);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const alpha = (1 - phase) * 0.35;
    const size = 1 + phase * 1.5;
    ctx.fillStyle = `rgba(255,200,110,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawSunPreview(ctx, w, h, t) { animateSun(ctx, w, h, t, 0.5, 0.5, false); }

/* ============== ANIMATION: CLOUD (Strata — generative fintech identity) ============== */
function animateCloud(ctx, w, h, t, mx, my, isHero) {
  const cx = w / 2 + (mx - 0.5) * 40;
  const cy = h / 2 + (my - 0.5) * 40;
  const numP = isHero ? 200 : 120;

  for (let i = 0; i < numP; i++) {
    const seed = i * 0.1;
    const angle = seed * 7 + t * 0.05;
    const dist = (Math.sin(seed * 3 + t * 0.1) * 0.5 + 0.5) * Math.min(w, h) * 0.35;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist * 0.7;
    const size = 1 + Math.sin(seed * 5 + t) * 1.5;
    const alpha = 0.15 + Math.sin(t + seed * 3) * 0.1;

    // fintech palette: teal/cyan/green (data + finance)
    const r = 20 + Math.sin(seed * 2) * 30;
    const g = 180 + Math.cos(seed * 3) * 50;
    const b = 160 + Math.sin(seed * 4 + t) * 60;
    ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.5, size), 0, Math.PI * 2);
    ctx.fill();
  }

  // central glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.2);
  grad.addColorStop(0, "rgba(0,200,180,0.15)");
  grad.addColorStop(1, "rgba(0,200,180,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
function drawCloudPreview(ctx, w, h, t) { animateCloud(ctx, w, h, t, 0.5, 0.5, false); }

/* ============== ANIMATION: WAVE (Wavelength — audio-reactive music) ============== */
function animateWave(ctx, w, h, t, mx, my, isHero) {
  const cy = h / 2;
  const layers = isHero ? 5 : 3;

  for (let layer = 0; layer < layers; layer++) {
    const offset = layer * 0.3;
    const amp = (40 + layer * 15) * (1 + Math.sin(t * 0.5 + layer) * 0.3);
    const freq = 0.008 + layer * 0.002;
    const alpha = 0.15 + (1 - layer / layers) * 0.25;

    ctx.beginPath();
    ctx.moveTo(0, cy);
    for (let x = 0; x <= w; x += 2) {
      const y = cy +
        Math.sin(x * freq + t * 2 + offset) * amp +
        Math.sin(x * freq * 2 + t * 1.5 + offset) * amp * 0.4 +
        Math.sin(x * freq * 0.5 + t * 0.8) * amp * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(0,220,255,${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // frequency bars at bottom
  const bars = 60;
  const barW = w / bars;
  for (let i = 0; i < bars; i++) {
    const val = Math.abs(Math.sin(t * 3 + i * 0.3) * Math.sin(t + i * 0.1)) * h * 0.25;
    const x = i * barW;
    const grad = ctx.createLinearGradient(x, h, x, h - val);
    grad.addColorStop(0, "rgba(0,220,255,0.05)");
    grad.addColorStop(1, "rgba(0,220,255,0.4)");
    ctx.fillStyle = grad;
    ctx.fillRect(x + 1, h - val, barW - 2, val);
  }
}
function drawWavePreview(ctx, w, h, t) {
  // 2D preview of the Wavelength fat-lines spiral
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 120;

  // build a 2D spiral from the same 3D formula, projected and rotated
  const points = [];
  for (let i = -50; i < 50; i++) {
    const tt = i / 3;
    const x = tt * Math.sin(2 * tt);
    const y = tt;
    const z = tt * Math.cos(2 * tt);
    // rotate around Y axis
    const rotY = t * 0.2;
    const rx = x * Math.cos(rotY) + z * Math.sin(rotY);
    const rz = -x * Math.sin(rotY) + z * Math.cos(rotY);
    // simple perspective
    const persp = 60 / (60 - rz);
    points.push({
      x: cx + rx * scale * persp,
      y: cy + y * scale * persp,
      t: (i + 50) / 100, // 0..1 for color
    });
  }

  // draw segments with rainbow stroke
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const hue = p0.t * 360;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.9)`;
    ctx.lineWidth = 6;
    ctx.stroke();
  }
}

/* ============== ANIMATION: PATHS (Latitude — travel routes) ============== */
function animatePaths(ctx, w, h, t, mx, my, isHero) {
  // grid of "cities"
  const cities = isHero ? 12 : 8;
  const pts = [];
  for (let i = 0; i < cities; i++) {
    const seed = i * 1.7;
    pts.push({
      x: (Math.sin(seed) * 0.4 + 0.5) * w,
      y: (Math.cos(seed * 1.3) * 0.4 + 0.5) * h,
    });
  }

  // draw connection paths with traveling dots
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      if (Math.abs(i - j) > 3) continue;
      const p1 = pts[i], p2 = pts[j];
      const mx2 = (p1.x + p2.x) / 2;
      const my2 = (p1.y + p2.y) / 2 - 30;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(mx2, my2, p2.x, p2.y);
      ctx.stroke();

      // traveling dot
      const progress = ((t * 0.3 + i * 0.15) % 1);
      const px = (1-progress)*(1-progress)*p1.x + 2*(1-progress)*progress*mx2 + progress*progress*p2.x;
      const py = (1-progress)*(1-progress)*p1.y + 2*(1-progress)*progress*my2 + progress*progress*p2.y;
      ctx.fillStyle = "rgba(0,255,180,0.8)";
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // city nodes
  for (const p of pts) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    // pulse ring
    const pulseR = 3 + (t * 20 % 15);
    ctx.strokeStyle = `rgba(255,255,255,${0.3 - (pulseR - 3) / 15 * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
    ctx.stroke();
  }
}
function drawPathsPreview(ctx, w, h, t) { animatePaths(ctx, w, h, t, 0.5, 0.5, false); }

/* ============== ANIMATION: THREADS (Threadwork — fashion/textile) ============== */
function animateThreads(ctx, w, h, t, mx, my, isHero) {
  const cx = w / 2, cy = h / 2;
  const numThreads = isHero ? 24 : 16;

  // Two sets of parallel threads crossing at an angle, like a weave
  const angle1 = Math.sin(t * 0.1) * 0.3 + 0.4;
  const angle2 = -Math.sin(t * 0.1) * 0.3 - 0.4;

  for (let set = 0; set < 2; set++) {
    const angle = set === 0 ? angle1 : angle2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const perpX = -sin, perpY = cos;
    const spread = Math.min(w, h) * 0.6;
    const threadCount = numThreads;

    for (let i = 0; i < threadCount; i++) {
      const offset = (i / threadCount - 0.5) * spread;
      // thread start and end points (long lines through center)
      const len = Math.max(w, h) * 1.2;
      const sx = cx + cos * len + perpX * offset;
      const sy = cy + sin * len + perpY * offset;
      const ex = cx - cos * len + perpX * offset;
      const ey = cy - sin * len + perpY * offset;

      // wave the thread
      const waveAmp = 8 + Math.sin(t + i * 0.3) * 4;
      const segments = 30;
      ctx.beginPath();
      for (let s = 0; s <= segments; s++) {
        const u = s / segments;
        const baseX = sx + (ex - sx) * u;
        const baseY = sy + (ey - sy) * u;
        const wave = Math.sin(u * Math.PI * 4 + t * 1.5 + i * 0.5) * waveAmp * Math.sin(u * Math.PI);
        const px = baseX + perpX * wave;
        const py = baseY + perpY * wave;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      // warm fashion palette: cream/gold/amber
      if (set === 0) {
        ctx.strokeStyle = `rgba(220,190,140,${0.15 + (i % 3 === 0 ? 0.15 : 0)})`;
      } else {
        ctx.strokeStyle = `rgba(180,150,110,${0.1 + (i % 4 === 0 ? 0.12 : 0)})`;
      }
      ctx.lineWidth = i % 3 === 0 ? 1.2 : 0.6;
      ctx.stroke();
    }
  }

  // weave intersection points — bright dots where threads cross
  const dotCount = isHero ? 40 : 24;
  for (let i = 0; i < dotCount; i++) {
    const seed = i * 2.3;
    const x = cx + Math.sin(seed + t * 0.2) * w * 0.25;
    const y = cy + Math.cos(seed * 1.3 + t * 0.15) * h * 0.25;
    const twinkle = 0.3 + Math.sin(t * 2 + seed) * 0.3;
    ctx.fillStyle = `rgba(240,220,180,${twinkle})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawThreadsPreview(ctx, w, h, t) { animateThreads(ctx, w, h, t, 0.5, 0.5, false); }

/* ============== PULSE: Realistic CSS smartwatch + canvas screen ============== */

// Injects a CSS-rendered watch (metal case, bands, crown, glass) over
// the canvas. The canvas only draws the screen content (watch face UI).
function injectPulseWatch(container, canvasId, isHero) {
  if (!container) return;
  // Clear any existing canvas content (it stays as background)
  const existingCanvas = document.getElementById(canvasId);
  if (existingCanvas) existingCanvas.style.opacity = "0"; // hide bg canvas

  // Build the watch HTML
  const watchHTML = `
    <div class="pulse-watch-container ${isHero ? '' : 'thumb'}">
      <div class="pulse-watch">
        <div class="watch-band watch-band-top"></div>
        <div class="watch-case">
          <div class="watch-crown"></div>
          <div class="watch-side-btn"></div>
          <div class="watch-screen">
            <canvas class="watch-screen-canvas" id="${canvasId}-screen"></canvas>
          </div>
        </div>
        <div class="watch-band watch-band-bottom"></div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", watchHTML);

  // Init the screen canvas animation
  const screenCanvas = document.getElementById(canvasId + "-screen");
  if (screenCanvas) {
    // wait a frame for layout
    requestAnimationFrame(() => initPulseScreen(screenCanvas, isHero));
  }
}

// Draws the watch face UI inside the screen canvas
function initPulseScreen(canvas, isHero) {
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let { ctx, w, h } = setupCanvas(canvas);
  let t = 0;
  function resize() { ({ ctx, w, h } = setupCanvas(canvas)); }
  addEventListener("resize", resize);
  // also observe the canvas size changing (when container resizes)
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
  }
  function loop() {
    t += 0.016;
    ctx.clearRect(0, 0, w, h);
    drawWatchFace(ctx, w, h, t);
    requestAnimationFrame(loop);
  }
  loop();
}

// The actual watch face content — drawn inside the screen
function drawWatchFace(ctx, w, h, t) {
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.46; // fills most of the screen

  // ---- Heartbeat cycle ----
  const beatPeriod = 1.0;
  const beatPhase = (t % beatPeriod) / beatPeriod;
  const qrsPhase = 0.25;
  const distFromQRS = Math.abs(beatPhase - qrsPhase);
  const pulseGlow = Math.max(0, 1 - distFromQRS * 14);

  // ---- Screen background: deep black with subtle green tint on beat ----
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  bgGrad.addColorStop(0, `rgba(8,12,10,1)`);
  bgGrad.addColorStop(0.7, `rgba(4,6,5,1)`);
  bgGrad.addColorStop(1, `rgba(0,0,0,1)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // green ambient glow on beat
  if (pulseGlow > 0.01) {
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
    glowGrad.addColorStop(0, `rgba(0,255,160,${pulseGlow * 0.08})`);
    glowGrad.addColorStop(1, "rgba(0,255,160,0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // ---- Activity rings (Apple Watch style) ----
  const rings = [
    { r: R * 0.88, color: [0, 255, 160], progress: (t * 0.07) % 1, lw: R * 0.07 },
    { r: R * 0.72, color: [255, 80, 100], progress: (t * 0.05) % 1, lw: R * 0.07 },
    { r: R * 0.56, color: [100, 180, 255], progress: (t * 0.04) % 1, lw: R * 0.07 },
  ];
  for (const ring of rings) {
    // background track
    ctx.strokeStyle = `rgba(${ring.color[0]},${ring.color[1]},${ring.color[2]},0.07)`;
    ctx.lineWidth = ring.lw;
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    // progress arc
    const endA = -Math.PI / 2 + ring.progress * Math.PI * 2;
    ctx.strokeStyle = `rgba(${ring.color[0]},${ring.color[1]},${ring.color[2]},${0.75 + pulseGlow * 0.2})`;
    ctx.lineWidth = ring.lw;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, -Math.PI / 2, endA);
    ctx.stroke();
    ctx.lineCap = "butt";
    // glowing tip
    const tipX = cx + Math.cos(endA) * ring.r;
    const tipY = cy + Math.sin(endA) * ring.r;
    const tipR = ring.lw * 0.6;
    const tipGrad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, tipR * 2);
    tipGrad.addColorStop(0, `rgba(${ring.color[0]},${ring.color[1]},${ring.color[2]},1)`);
    tipGrad.addColorStop(0.5, `rgba(${ring.color[0]},${ring.color[1]},${ring.color[2]},0.5)`);
    tipGrad.addColorStop(1, `rgba(${ring.color[0]},${ring.color[1]},${ring.color[2]},0)`);
    ctx.fillStyle = tipGrad;
    ctx.beginPath();
    ctx.arc(tipX, tipY, tipR * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- BPM display in center ----
  const bpm = 72 + Math.round(Math.sin(t * 0.3) * 2);
  const bpmPulse = 1 + pulseGlow * 0.06;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(bpmPulse, bpmPulse);
  // BPM number
  ctx.fillStyle = `rgba(255,255,255,${0.9 + pulseGlow * 0.1})`;
  ctx.font = "700 " + (R * 0.32) + "px 'Roboto Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(bpm, 0, -R * 0.03);
  // BPM label
  ctx.font = "400 " + (R * 0.1) + "px 'Roboto Condensed', sans-serif";
  ctx.fillStyle = `rgba(0,255,160,${0.5 + pulseGlow * 0.3})`;
  ctx.fillText("BPM", 0, R * 0.17);
  ctx.restore();

  // ---- Heart icon (beats with pulse) ----
  const heartSize = R * 0.06 * (1 + pulseGlow * 0.6);
  const hx = cx - R * 0.22, hy = cy - R * 0.25;
  ctx.fillStyle = `rgba(255,80,100,${0.5 + pulseGlow * 0.5})`;
  ctx.beginPath();
  ctx.arc(hx, hy, heartSize, 0, Math.PI * 2);
  ctx.arc(hx + heartSize * 1.2, hy, heartSize, 0, Math.PI * 2);
  ctx.moveTo(hx - heartSize, hy + heartSize * 0.3);
  ctx.lineTo(hx + heartSize * 0.6, hy + heartSize * 1.8);
  ctx.lineTo(hx + heartSize * 2.2, hy + heartSize * 0.3);
  ctx.closePath();
  ctx.fill();

  // ---- Time display at top ----
  const hours = Math.floor(t / 3600) % 24;
  const mins = Math.floor(t / 60) % 60;
  const secs = Math.floor(t) % 60;
  const timeStr = "10:" + String(24 + (Math.floor(t * 0.5) % 30)).padStart(2, "0");
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "400 " + (R * 0.09) + "px 'Roboto Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(timeStr, cx, cy - R * 0.38);

  // ---- Date at bottom ----
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "400 " + (R * 0.07) + "px 'Roboto Condensed', sans-serif";
  ctx.fillText("TUE 14 NOV", cx, cy + R * 0.38);

  // ---- ECG trace across the middle of the screen ----
  const ecgY = cy + R * 0.55;
  const ecgAmp = R * 0.08;
  const ecgSpeed = t * 0.8;
  const beatSpacing = w * 0.4;
  // glow
  ctx.strokeStyle = `rgba(0,255,160,${0.05 + pulseGlow * 0.08})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  drawECGTrace(ctx, w, ecgY, ecgAmp, ecgSpeed, beatSpacing);
  ctx.stroke();
  // main
  ctx.strokeStyle = `rgba(0,255,160,${0.4 + pulseGlow * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawECGTrace(ctx, w, ecgY, ecgAmp, ecgSpeed, beatSpacing);
  ctx.stroke();
}

// ECG waveform function: returns y-offset (-1..1) for a given phase 0..1
function ecgWaveform(phase) {
  const p = phase;
  let y = 0;
  y += 0.12 * Math.exp(-Math.pow((p - 0.10) / 0.03, 2));   // P wave
  y -= 0.08 * Math.exp(-Math.pow((p - 0.20) / 0.012, 2));  // Q dip
  y += 0.85 * Math.exp(-Math.pow((p - 0.23) / 0.010, 2));  // R spike
  y -= 0.25 * Math.exp(-Math.pow((p - 0.26) / 0.012, 2));  // S dip
  y += 0.20 * Math.exp(-Math.pow((p - 0.42) / 0.06, 2));   // T wave
  return y;
}

// Draws a repeating ECG trace across the full width
function drawECGTrace(ctx, w, baseY, amp, speed, spacing) {
  for (let x = 0; x <= w; x += 1) {
    const phase = (((x / spacing) + speed) % 1);
    const y = baseY - ecgWaveform(phase) * amp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

// Fallback for thumbnails (work.html) — draws a simplified watch on canvas
function animatePulse(ctx, w, h, t, mx, my, isHero) {
  // Draw a simple watch shape for thumbnails
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.28;
  const beatPhase = (t % 1.0) / 1.0;
  const pulseGlow = Math.max(0, 1 - Math.abs(beatPhase - 0.25) * 14);

  // glow
  const glowGrad = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.5);
  glowGrad.addColorStop(0, `rgba(0,255,160,${0.05 + pulseGlow * 0.1})`);
  glowGrad.addColorStop(1, "rgba(0,255,160,0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);

  // watch case (metallic)
  const caseGrad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  caseGrad.addColorStop(0, "#3a3a40");
  caseGrad.addColorStop(0.5, "#1e1e24");
  caseGrad.addColorStop(1, "#3a3a40");
  ctx.fillStyle = caseGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
  ctx.fill();

  // screen
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // activity ring
  ctx.strokeStyle = `rgba(0,255,160,${0.7 + pulseGlow * 0.2})`;
  ctx.lineWidth = R * 0.08;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.65, -Math.PI / 2, -Math.PI / 2 + ((t * 0.07) % 1) * Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = "butt";

  // BPM
  ctx.fillStyle = `rgba(255,255,255,${0.85 + pulseGlow * 0.15})`;
  ctx.font = "700 " + (R * 0.3) + "px 'Roboto Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("72", cx, cy);
}
function drawPulsePreview(ctx, w, h, t) {
  // 2D preview of the 3D Pulse smartwatch
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 200;

  // Simulate 3D rotation
  const rotY = t * 0.3;
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);

  // Heartbeat pulse
  const beat1 = Math.sin(t * 2.3) * 0.5 + 0.5;
  const beat2 = Math.sin(t * 1.7 + 1.2) * 0.5 + 0.5;
  const beatEnv = beat1 * 0.6 + beat2 * 0.4;
  const pulseScale = 1 + beatEnv * 0.04;

  const watchW = 70 * scale * pulseScale;
  const watchH = 85 * scale * pulseScale;
  const watchD = 15 * scale;

  // Apply fake 3D perspective — width narrows with rotation
  const perspW = watchW * Math.abs(cosY) + watchD * Math.abs(sinY);

  // Glow on beat
  const glowGrad = ctx.createRadialGradient(cx, cy, watchW * 0.3, cx, cy, watchW * 1.8);
  glowGrad.addColorStop(0, `rgba(0,255,160,${0.04 + beatEnv * 0.08})`);
  glowGrad.addColorStop(1, "rgba(0,255,160,0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);

  // Watch band (top)
  ctx.fillStyle = "#1a1a1e";
  ctx.beginPath();
  ctx.ellipse(cx, cy - watchH * 0.6, watchW * 0.35, watchH * 0.25, 0, 0, Math.PI);
  ctx.fill();

  // Watch band (bottom)
  ctx.beginPath();
  ctx.ellipse(cx, cy + watchH * 0.6, watchW * 0.35, watchH * 0.25, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Watch case — metallic gradient
  const caseGrad = ctx.createLinearGradient(cx - perspW, cy - watchH, cx + perspW, cy + watchH);
  caseGrad.addColorStop(0, "#555");
  caseGrad.addColorStop(0.3, "#aaa");
  caseGrad.addColorStop(0.5, "#888");
  caseGrad.addColorStop(0.7, "#666");
  caseGrad.addColorStop(1, "#333");
  ctx.fillStyle = caseGrad;
  ctx.beginPath();
  ctx.roundRect(cx - perspW / 2, cy - watchH / 2, perspW, watchH, watchW * 0.2);
  ctx.fill();

  // Screen
  const screenW = perspW * 0.75;
  const screenH = watchH * 0.78;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(cx - screenW / 2, cy - screenH / 2, screenW, screenH, screenW * 0.15);
  ctx.fill();

  // Activity rings (only visible when facing forward)
  const visibility = Math.abs(cosY);
  if (visibility > 0.3) {
    ctx.globalAlpha = visibility;
    const ringR = screenW * 0.3;

    // Ring 1 (green)
    ctx.strokeStyle = `rgba(0,255,160,${0.8 + beatEnv * 0.2})`;
    ctx.lineWidth = screenW * 0.05;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + (t * 0.15 % 1) * Math.PI * 2);
    ctx.stroke();

    // Ring 2 (pink)
    ctx.strokeStyle = `rgba(255,85,120,${0.8})`;
    ctx.lineWidth = screenW * 0.04;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR * 0.72, -Math.PI / 2, -Math.PI / 2 + (t * 0.12 % 1) * Math.PI * 2);
    ctx.stroke();

    // Ring 3 (blue)
    ctx.strokeStyle = `rgba(100,170,255,${0.8})`;
    ctx.lineWidth = screenW * 0.035;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR * 0.5, -Math.PI / 2, -Math.PI / 2 + (t * 0.1 % 1) * Math.PI * 2);
    ctx.stroke();

    // BPM text
    ctx.fillStyle = `rgba(255,255,255,${0.9})`;
    ctx.font = "700 " + (screenW * 0.2) + "px 'Roboto Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("72", cx, cy);

    ctx.globalAlpha = 1;
  }

  // Crown (visible on side when rotated)
  if (sinY > 0.2) {
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(cx + perspW / 2 + 3 * scale, cy - watchH * 0.15, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}
