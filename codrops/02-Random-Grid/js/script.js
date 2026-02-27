gsap.registerPlugin(ScrollTrigger);

/* =========================
Initialize Lenis
========================= */
const isTouch = window.matchMedia("(pointer: coarse)").matches;
const lenis = new Lenis({
  lerp: 0.15,
  smoothWheel: true,
  smoothTouch: !isTouch
});

function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

/* =========================
Grid Settings (Responsive)
========================= */
function getGridCols() {
  if (window.innerWidth <= 599) {
    return 6; // SP
  } else if (window.innerWidth <= 1024) {
    return 10; // Tablet
  } else {
    return 14; // PC
  }
}

const GRID_ROWS = 0;

const svgNS = "http://www.w3.org/2000/svg";
let blindsSets = [];
let master;

/* =========================
Generate Grid (SVG Mask)
========================= */
function createBlinds(groupId) {
  const g = document.getElementById(groupId);
  if (!g) return null;
  g.innerHTML = "";

  const width = window.innerWidth;
  const height = window.innerHeight;

  const vbWidth = 100;
  const vbHeight = (height / width) * 100;

  const cols = getGridCols();
  const rows = GRID_ROWS || Math.round(cols * (vbHeight / vbWidth));

  const cellW = vbWidth / cols;
  const cellH = vbHeight / rows;

  const cells = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const rect = document.createElementNS(svgNS, "rect");

      rect.setAttribute("x", x * cellW);
      rect.setAttribute("y", y * cellH);
      rect.setAttribute("width", cellW);
      rect.setAttribute("height", cellH);
      rect.setAttribute("fill", "white");
      rect.setAttribute("shape-rendering", "crispEdges");

      rect.setAttribute("opacity", 0);

      g.appendChild(rect);
      cells.push(rect);
    }
  }

  return cells;
}

/* =========================
Update Layout
========================= */
function updateLayout() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const vbWidth = 100;
  const vbHeight = (height / width) * 100;

  const layers = document.querySelectorAll(".layer");
  blindsSets = [];

  layers.forEach((svg) => {
    svg.setAttribute("viewBox", `0 0 ${vbWidth} ${vbHeight}`);

    const maskRect = svg.querySelector("mask rect");
    if (maskRect) {
      maskRect.setAttribute("width", vbWidth);
      maskRect.setAttribute("height", vbHeight);
    }

    const img = svg.querySelector("image");
    if (img) {
      img.setAttribute("width", vbWidth);
      img.setAttribute("height", vbHeight);
    }

    const blindId = svg.querySelector('g[id^="blinds"]').id;
    const blinds = createBlinds(blindId);
    if (blinds) blindsSets.push(blinds);
  });

  buildMasterTimeline();
}

/* =========================
Random Grid Animation
========================= */
function openBlinds(cells) {
  const shuffled = gsap.utils.shuffle([...cells]);

  return gsap.timeline().to(shuffled, {
    opacity: 1,
    duration: 1.0,
    ease: "power3.out",
    stagger: {
      each: 0.02
    }
  });
}

function textIn(el) {
  return gsap.to(el, {
    clipPath: "inset(0% 0% 0% 0%)",
    y: 0,
    duration: 2.6,
    ease: "expo.out"
  });
}

function textOut(el) {
  return gsap.to(el, {
    clipPath: "inset(0% 0% 100% 0%)",
    y: 0,
    duration: 2.0,
    ease: "power2.inOut"
  });
}

/* =========================
Master Timeline
========================= */
function buildMasterTimeline() {
  if (master) master.kill();

  const texts = gsap.utils.toArray(".txt");

  master = gsap.timeline({
    scrollTrigger: {
      trigger: ".stage",
      start: "top top",
      end: "bottom bottom",
      scrub: 2.5,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  blindsSets.forEach((cells, i) => {
    master.add(openBlinds(cells));
    if (texts[i]) {
      master.add(textIn(texts[i]), "-=0.3");
      master.add(textOut(texts[i]), "+=0.8");
    }
  });
}

/* =========================
Progress Bar
========================= */
function initProgressBar() {
  const progressFills = gsap.utils.toArray(".progress-bar .fill");

  ScrollTrigger.create({
    trigger: ".stage",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.3,
    onUpdate: (self) => {
      const progress = self.progress;
      const totalSteps = progressFills.length;

      progressFills.forEach((fill, i) => {
        let p = (progress - i / totalSteps) * totalSteps;
        p = Math.max(0, Math.min(1, p));
        fill.style.width = `${p * 100}%`;
      });
    }
  });
}

/* =========================
Run
========================= */
updateLayout();
initProgressBar();

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ScrollTrigger.refresh();
    updateLayout();
  }, 250);
});
