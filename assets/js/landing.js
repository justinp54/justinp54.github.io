// 랜딩 스크롤 연출. GSAP ScrollTrigger로 패널이 들어올 때 나타나게 하고,
// 스크롤 진행도를 무대에 전달해 3D 연출이 따라오게 한다.
(function () {
  const stage = document.querySelector("[data-landing-stage]");
  const panels = Array.from(document.querySelectorAll(".panel"));
  if (panels.length === 0) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 움직임을 줄이도록 설정한 사용자에게는 애니메이션 없이 최종 상태만 보여준다
  if (reduceMotion || typeof window.gsap === "undefined") {
    panels.forEach((panel) => panel.classList.add("is-visible"));
    return;
  }

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  panels.forEach((panel) => {
    const target = panel.querySelector(".panel-card, .panel-copy");
    if (!target) return;

    gsap.fromTo(
      target,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: panel, start: "top 75%", once: true },
      }
    );
  });

  // 히어로 제목은 줄 단위로 조금씩 늦게 올라온다
  const titleLines = document.querySelectorAll(".panel-hero .title-line");
  if (titleLines.length > 0) {
    gsap.fromTo(titleLines, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.12, delay: 0.15 });
  }

  if (!stage) return;

  // 각 패널의 morph 값을 스크롤에 따라 보간해 무대에 넘긴다
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
