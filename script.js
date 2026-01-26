const heroVisual = document.getElementById("hero-visual");
const cube = document.querySelector(".cube");
const counters = document.querySelectorAll(".stat-num[data-count]");
const revealItems = document.querySelectorAll(
  ".section, .about-card, .project-card, .service-card, .tool-card, .logo-card, .stat"
);

if (heroVisual && cube) {
  heroVisual.addEventListener("mousemove", (event) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    cube.style.transform = `translate(-50%, -50%) rotateX(${20 - y * 20}deg) rotateY(${x * 30}deg)`;
  });

  heroVisual.addEventListener("mouseleave", () => {
    cube.style.transform = "translate(-50%, -50%) rotateX(20deg) rotateY(20deg)";
  });
}

const animateCounter = (el) => {
  const target = Number(el.dataset.count || "0");
  const duration = 1600;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = `${value}${target === 100 ? "%" : "+"}`;
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        if (entry.target.classList.contains("stat")) {
          const num = entry.target.querySelector(".stat-num");
          if (num && !num.dataset.animated) {
            num.dataset.animated = "true";
            animateCounter(num);
          }
        }
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item) => {
  item.classList.add("reveal");
  observer.observe(item);
});
