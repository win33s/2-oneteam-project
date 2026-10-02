// 화면 전체에 걸리는 인터랙션: 스크롤 진행률, 스크롤 등장 효과, 누른 자리에서 퍼지는 물결.

const REVEAL = ".row, .panel, .stat, .venue-hero, .tl-item, .rec, .fresh, .mail-list, .confirmed-line, .home-foot";
const PRESSABLE = ".btn, .chip, .ask button, .row-ctrl > button, .next, .logout, .ghost";

export function initEffects() {
  const root = document.documentElement;

  // 스크롤 진행률(--scroll: 0~1)과 스크롤 거리(--sy: px)를 CSS 변수로 내보낸다
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--scroll", max > 0 ? Math.min(1, window.scrollY / max) : 0);
      root.style.setProperty("--sy", window.scrollY);
      root.toggleAttribute("data-scrolled", window.scrollY > 8);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // 누른 위치를 버튼에 알려 주어 그 자리에서 물결이 퍼지게 한다
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest?.(PRESSABLE);
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${e.clientX - r.left}px`);
    el.style.setProperty("--ry", `${e.clientY - r.top}px`);
  });

  // 스크롤해서 화면에 들어오는 블록을 아래에서 떠오르게 한다
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const seen = new WeakSet();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        io.unobserve(el);
        el.classList.add("rv-in");
        // 등장이 끝나면 클래스를 걷어 내 hover 등 원래 움직임과 겹치지 않게 한다
        setTimeout(() => el.classList.remove("rv", "rv-in"), 1100);
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
  );
  const scan = (node) => {
    if (!(node instanceof Element)) return;
    const list = node.matches(REVEAL) ? [node] : [];
    list.push(...node.querySelectorAll(REVEAL));
    for (const el of list) {
      if (seen.has(el)) continue;
      seen.add(el);
      el.classList.add("rv");
      io.observe(el);
    }
  };
  new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach(scan))).observe(document.body, { childList: true, subtree: true });
  scan(document.body);
}
