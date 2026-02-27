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
const BLIND_COUNT = 30;
const svgNS = "http://www.w3.org/2000/svg";

let blindsSets = [];
let master;

function createBlinds(groupId) {
  const g = document.getElementById(groupId);
  if (!g) return null;
  g.innerHTML = "";

  const width = window.innerWidth;
  const height = window.innerHeight;
  const vbHeight = (height / width) * 100;
  const h = vbHeight / BLIND_COUNT;
  const blinds = [];
  let currentY = 0;

  for (let i = 0; i < BLIND_COUNT; i++) {
    const centerY = vbHeight - (currentY + h / 2);

    const rectTop = document.createElementNS(svgNS, "rect");
    const rectBottom = document.createElementNS(svgNS, "rect");

    [rectTop, rectBottom].forEach((r) => {
      r.setAttribute("x", 0);
      r.setAttribute("width", 100);
      r.setAttribute("height", 0);
      r.setAttribute("fill", "white");
      r.setAttribute("shape-rendering", "crispEdges");
    });

    rectTop.setAttribute("y", centerY);
    rectBottom.setAttribute("y", centerY);

    g.appendChild(rectTop);
    g.appendChild(rectBottom);

    blinds.push({
      top: rectTop,
      bottom: rectBottom,
      y: centerY,
      h: h / 2
    });
    currentY += h;
  }
  return blinds;
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
    }

    const blindId = svg.querySelector('g[id^="blinds"]').id;
    const blinds = createBlinds(blindId);
    if (blinds) blindsSets.push(blinds);
  });

  buildMasterTimeline();
}

/* =========================
Animation
========================= */
function openBlinds(blinds) {
  return gsap.timeline().to(
    blinds.flatMap((b) => [b.top, b.bottom]), {
      attr: {
        y: (i) => {
          const b = blinds[Math.floor(i / 2)];
          return i % 2 === 0 ? b.y - b.h : b.y;
        },
        height: (i) => {
          const b = blinds[Math.floor(i / 2)];
          return b.h + 0.01;
        }
      },
      ease: "power3.out",
      stagger: {
        each: 0.02,
        from: "start"
      }
    }
  );
}

function textIn(el) {
  return gsap.to(el, {
    clipPath: "inset(0% 0% 0% 0%)",
    y: 0,
    duration: 1.5,
    ease: "expo.out"
  });
}

function textOut(el) {
  return gsap.to(el, {
    clipPath: "inset(0% 0% 100% 0%)",
    y: -30,
    duration: 1.2,
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

  blindsSets.forEach((blinds, i) => {
    master.add(openBlinds(blinds));
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
  resizeTimer = setTimeout(updateLayout, 250);
});
