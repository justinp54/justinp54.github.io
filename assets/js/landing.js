// 랜딩 스크롤 연출. 인덱스 활성 표시를 갱신하고, 스크롤 진행도를 3D 무대에 전달한다.
(function () {
  const stage = document.querySelector("[data-landing-stage]");
  const panels = Array.from(document.querySelectorAll(".hero, .panel"));
  const indexLinks = Array.from(document.querySelectorAll(".landing-index a"));
  if (panels.length === 0) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setActiveIndex = (id) => {
    indexLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.index === id));
  };

  // 어느 섹션을 보고 있는지 표시하는 것은 애니메이션과 무관하므로 항상 동작시킨다
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveIndex(entry.target.id);
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  panels.forEach((panel) => panel.id && observer.observe(panel));

  if (reduceMotion || typeof window.gsap === "undefined") return;

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  panels.forEach((panel) => {
    if (panel.classList.contains("hero")) return;
    gsap.fromTo(
      panel.children,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.06,
        scrollTrigger: { trigger: panel, start: "top 80%", once: true },
      }
    );
  });

  if (!stage) return;

  // 각 구간의 morph 값을 스크롤에 따라 보간해 무대에 넘긴다
  panels.forEach((panel, index) => {
    const from = parseFloat(panel.dataset.morph || "0");
    const next = panels[index + 1];
    const to = next ? parseFloat(next.dataset.morph || "0") : from;

    window.ScrollTrigger.create({
      trigger: panel,
      start: "top center",
      end: "bottom center",
      onUpdate: (self) => {
        const morph = from + (to - from) * self.progress;
        stage.dataset.morph = morph.toFixed(3);
        stage.dataset.stage = panel.dataset.stage || "";
        stage.dispatchEvent(new CustomEvent("stagemorph", { detail: { morph, stage: panel.dataset.stage } }));
      },
    });
  });
})();
