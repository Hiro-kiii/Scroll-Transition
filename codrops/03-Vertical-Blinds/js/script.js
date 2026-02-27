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
Create Blinds Effect
========================= */
const BLIND_COUNT = 12;
const svgNS = "http://www.w3.org/2000/svg";
let blindsSets = [];
let master;

function createBlinds(groupId, isFirstLayer, vbWidth) {
  const g = document.getElementById(groupId);
  if (!g) return null;
  g.innerHTML = "";

  const w = vbWidth / BLIND_COUNT; 
  const blinds = [];
  let currentX = 0;

  for (let i = 0; i < BLIND_COUNT; i++) {
    const centerX = currentX + w / 2;
    const rectLeft = document.createElementNS(svgNS, "rect");
    const rectRight = document.createElementNS(svgNS, "rect");

    [rectLeft, rectRight].forEach((r) => {
      r.setAttribute("y", "0");
      r.setAttribute("height", "100"); 
      r.setAttribute("width", isFirstLayer ? (w / 2 + 0.1) : "0");
      r.setAttribute("fill", "white");
      r.setAttribute("shape-rendering", "crispEdges");
    });

    if (isFirstLayer) {
      rectLeft.setAttribute("x", centerX - w / 2);
      rectRight.setAttribute("x", centerX);
    } else {
      rectLeft.setAttribute("x", centerX);
      rectRight.setAttribute("x", centerX);
    }

    g.appendChild(rectLeft);
    g.appendChild(rectRight);

    blinds.push({ left: rectLeft, right: rectRight, x: centerX, w: w / 2 });
    currentX += w;
  }
  return blinds;
}

/* =========================
Update Layout
========================= */
function updateLayout() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  const vbWidth = (width / height) * 100;
  const vbHeight = 100;

  const layers = document.querySelectorAll(".layer");
  blindsSets = [];

  layers.forEach((svg, i) => {
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
      img.setAttribute("preserveAspectRatio", "xMidYMid slice");
    }

    const blindElement = svg.querySelector('g[id^="blinds"]');
    if (blindElement) {
      const blinds = createBlinds(blindElement.id, i === 0, vbWidth);
      if (blinds) blindsSets.push(blinds);
    }
  });

  buildMasterTimeline();
}

/* =========================
Animation
========================= */
function openBlinds(blinds) {
  return gsap.to(blinds.flatMap((b) => [b.left, b.right]), {
    attr: {
      x: (i) => {
        const b = blinds[Math.floor(i / 2)];
        return i % 2 === 0 ? b.x - b.w : b.x;
      },
      width: (i) => {
        const b = blinds[Math.floor(i / 2)];
        return b.w + 0.05; 
      }
    },
    ease: "none",
    stagger: { each: 0.02, from: "start" }
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
      scrub: 2.0,
      invalidateOnRefresh: true
    }
  });

  gsap.set(texts, { clipPath: "inset(0% 0% 100% 0%)", y: 40, opacity: 0 });
  gsap.set(texts[0], { clipPath: "inset(0% 0% 0% 0%)", y: 0, opacity: 1 });

  blindsSets.forEach((blinds, i) => {
    if (i === 0) return;

    if (texts[i - 1]) {
      master.to(texts[i - 1], {
        clipPath: "inset(0% 0% 100% 0%)",
        y: -40,
        opacity: 0,
        duration: 0.8
      }, ">");
    }

    master.add(openBlinds(blinds), "-=0.3");

    if (texts[i]) {
      master.to(texts[i], {
        clipPath: "inset(0% 0% 0% 0%)",
        y: 0,
        opacity: 1,
        duration: 0.8
      }, "-=0.5");
    }
    
    master.to({}, { duration: 1 });
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
    updateLayout();
    ScrollTrigger.refresh();
  }, 250);
});