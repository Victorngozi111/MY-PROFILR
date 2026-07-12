const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
const root = document.documentElement;
root.classList.add("anim-ready");

const topbar = document.getElementById("topbar");
window.addEventListener("scroll", () => {
  if (topbar) topbar.classList.toggle("scrolled", window.scrollY > 20);
}, { passive: true });

const htmlEl = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
htmlEl.dataset.theme = localStorage.getItem("vv-theme") || "dark";
themeToggle && themeToggle.addEventListener("click", () => {
  const next = htmlEl.dataset.theme === "dark" ? "light" : "dark";
  htmlEl.dataset.theme = next;
  localStorage.setItem("vv-theme", next);
});

const hamburger = document.getElementById("hamburger");
const overlay = document.getElementById("mobile-overlay");
const closeMenu = document.getElementById("close-menu");
hamburger && hamburger.addEventListener("click", () => overlay.classList.add("open"));
closeMenu && closeMenu.addEventListener("click", () => overlay.classList.remove("open"));
document.querySelectorAll(".mnav-link, .mnav-cta").forEach(l =>
  l.addEventListener("click", () => overlay.classList.remove("open"))
);

const navLinks = document.querySelectorAll(".nav > a");
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
  });
}, { threshold: 0.4 });
["services", "why", "work", "pricing", "about", "faq", "contact"].forEach(id => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});

document.querySelectorAll(".magnetic").forEach(btn => {
  btn.addEventListener("mousemove", e => {
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.28;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.28;
    btn.style.transition = "transform 0.15s ease";
    btn.style.transform = `translate(${x}px, ${y}px)`;
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transition = "transform 0.6s cubic-bezier(0.22,1,0.36,1)";
    btn.style.transform = "";
  });
});

document.querySelectorAll("[data-tilt]").forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    card.style.setProperty("--mx", px * 100 + "%");
    card.style.setProperty("--my", py * 100 + "%");
    if (reduceMotion) return;
    card.style.transition = "transform 0.1s ease";
    card.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 9}deg) rotateX(${(0.5 - py) * 9}deg) translateY(-6px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transition = "transform 0.55s cubic-bezier(0.22,1,0.36,1)";
    card.style.transform = "";
  });
});

const portrait = document.getElementById("portrait");
const heroVisual = document.getElementById("hero-visual");
if (portrait && heroVisual && !reduceMotion) {
  const layers = portrait.querySelectorAll("[data-depth]");
  heroVisual.addEventListener("mousemove", e => {
    const rect = heroVisual.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    portrait.style.transform = `rotateY(${px * 16}deg) rotateX(${-py * 16}deg)`;
    layers.forEach(layer => {
      const d = parseFloat(layer.dataset.depth);
      layer.style.transform = `translate3d(${px * d * 60}px, ${py * d * 60}px, ${d * 70}px)`;
    });
  });
  heroVisual.addEventListener("mouseleave", () => {
    portrait.style.transform = "";
    layers.forEach(layer => { layer.style.transform = ""; });
  });
}

const animateCounter = el => {
  const target = Number(el.dataset.count || "0");
  const suffix = el.dataset.suffix || "";
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  const step = now => {
    const p = Math.min((now - start) / 1700, 1);
    el.textContent = Math.floor(ease(p) * target) + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  };
  requestAnimationFrame(step);
};
const counterObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    animateCounter(entry.target);
    obs.unobserve(entry.target);
  });
}, { threshold: 0.5 });
document.querySelectorAll(".stat-num[data-count]").forEach(el => counterObserver.observe(el));

const revealEls = document.querySelectorAll(".reveal");
const GRID_SELECTOR = ".service-grid, .why-grid, .process-grid, .project-grid, .testimonial-grid";
if (hasGSAP && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll(GRID_SELECTOR).forEach(grid => {
    const items = grid.querySelectorAll(".reveal");
    if (!items.length) return;
    gsap.fromTo(items, { opacity: 0, y: 48 }, {
      opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: grid, start: "top 85%" }
    });
  });

  revealEls.forEach(el => {
    if (el.closest(GRID_SELECTOR)) return;
    gsap.fromTo(el, { opacity: 0, y: 34 }, {
      opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" }
    });
  });

  if (portrait) {
    gsap.to(portrait, {
      yPercent: -16, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }
  gsap.to(".hero-content", {
    yPercent: -8, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
} else {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}

let introPlayed = false;
function startIntro() {
  if (introPlayed) return;
  introPlayed = true;
  if (!hasGSAP || reduceMotion) return;
  const tl = gsap.timeline();
  tl.from(".eyebrow", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" })
    .from(".hero-title", { y: 34, opacity: 0, duration: 0.7 }, "-=0.3")
    .from(".sub", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
    .from(".hero-actions", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
    .from(".stat", { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, "-=0.4")
    .from(".portrait", { opacity: 0, scale: 0.92, duration: 0.9, ease: "power3.out" }, "-=0.9")
    .from(".chip", { opacity: 0, y: 14, duration: 0.5, stagger: 0.12 }, "-=0.5");
}

function dismissPreloader() {
  const pre = document.getElementById("preloader");
  const bar = document.getElementById("pre-bar");
  if (bar) bar.style.width = "100%";
  if (pre) pre.classList.add("done");
  startIntro();
}
window.addEventListener("load", () => setTimeout(dismissPreloader, 500));
setTimeout(dismissPreloader, 3000);

const loadingEl = document.getElementById("proj-loading");
const plBar = document.getElementById("pl-bar");
const plStatus = document.getElementById("pl-status");
const modalEl = document.getElementById("proj-modal");
const pmBackdrop = document.getElementById("pm-backdrop");
const pmClose = document.getElementById("pm-close");
const pmCloseBtn = document.getElementById("pm-close-btn");
const pmScreen = document.getElementById("pm-screen");
const pmUrlBar = document.getElementById("pm-url-bar");
const pmProjTag = document.getElementById("pm-proj-tag");
const pmProjTitle = document.getElementById("pm-proj-title");
const pmProjDesc = document.getElementById("pm-proj-desc");
const pmVisitBtn = document.getElementById("pm-visit-btn");

const LOAD_STEPS = [
  ["Connecting to server", 14],
  ["Fetching project files", 34],
  ["Loading assets", 56],
  ["Rendering interface", 76],
  ["Almost ready", 92],
  ["Done", 100]
];

function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove("open");
  setTimeout(() => { if (!modalEl.classList.contains("open")) pmScreen.innerHTML = ""; }, 350);
}
pmClose && pmClose.addEventListener("click", closeModal);
pmCloseBtn && pmCloseBtn.addEventListener("click", closeModal);
pmBackdrop && pmBackdrop.addEventListener("click", closeModal);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

function openProjectModal(card) {
  const url = card.dataset.url || "";
  const title = card.dataset.title || "";
  const desc = card.dataset.desc || "";
  const tag = card.dataset.tag || "";
  const isLive = card.dataset.live === "true";
  const screenBg = card.dataset.screenBg || "linear-gradient(135deg, #0c1f4a, #0ea5e9)";

  loadingEl.classList.add("active");
  plBar.style.width = "0%";
  plStatus.textContent = "Initializing";

  let i = 0;
  const interval = setInterval(() => {
    if (i >= LOAD_STEPS.length) {
      clearInterval(interval);
      loadingEl.classList.remove("active");

      pmUrlBar.textContent = url ? new URL(url).hostname : title.toLowerCase().replace(/\s+/g, "") + ".vventures.app";
      pmProjTag.textContent = tag;
      pmProjTitle.textContent = title;
      pmProjDesc.textContent = desc;
      pmScreen.style.background = screenBg;

      if (isLive && url && !url.includes("wa.me")) {
        pmScreen.innerHTML = "";
        const frame = document.createElement("iframe");
        frame.className = "pm-iframe";
        frame.src = url;
        frame.title = title + " live preview";
        const sw = pmScreen.clientWidth || 760;
        const sh = pmScreen.clientHeight || 330;
        const scale = sw / 1280;
        frame.style.width = "1280px";
        frame.style.height = Math.ceil(sh / scale) + "px";
        frame.style.transform = "scale(" + scale + ")";
        pmScreen.appendChild(frame);
        pmVisitBtn.style.display = "";
        pmVisitBtn.href = url;
      } else if (isLive && url) {
        pmScreen.innerHTML = `<div style="text-align:center;padding:20px;">
          <div style="font-family:'Sora',sans-serif;font-size:3rem;font-weight:800;color:rgba(255,255,255,0.16);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:18px;">${title.split(" ").slice(0, 2).join(" ")}</div>
          <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,0.16);border:1px solid rgba(34,197,94,0.4);padding:6px 16px;border-radius:999px;font-size:0.8rem;font-weight:700;color:#4ade80;">
            <span style="width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block;"></span> LIVE &amp; RUNNING
          </div></div>`;
        pmVisitBtn.style.display = "";
        pmVisitBtn.href = url;
      } else {
        pmScreen.innerHTML = `<div class="pm-screen-soon">
          <svg class="pm-cs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8a2 2 0 0 0-3 0z"/><path d="M12 15 9 12a11 11 0 0 1 6-9c2.5 0 4 1.5 4 4a11 11 0 0 1-9 6z"/><path d="M15 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>
          <div class="pm-cs-title">In Development</div>
          <div class="pm-cs-text">This project is being built. Contact us for early access or to learn more.</div>
          <a class="pm-cs-wa" href="https://wa.me/2349138966840" target="_blank" rel="noreferrer">Get Early Access →</a>
        </div>`;
        pmVisitBtn.style.display = "none";
      }
      setTimeout(() => modalEl.classList.add("open"), 60);
      return;
    }
    const [msg, pct] = LOAD_STEPS[i];
    plStatus.textContent = msg;
    plBar.style.width = pct + "%";
    i++;
  }, 300);
}

document.querySelectorAll(".project-card").forEach(card => {
  card.addEventListener("click", () => openProjectModal(card));
});
