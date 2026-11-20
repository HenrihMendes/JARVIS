/** Animação "voa para a sacola": a foto do produto encolhe em arco até o ícone da sacola. */
export function flyToBag(source: HTMLElement | null) {
  if (!source || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const bag = document.getElementById("bag-button");
  const img = source.querySelector("img");
  if (!bag || !img) return;
  const from = img.getBoundingClientRect();
  const to = bag.getBoundingClientRect();
  if (from.width === 0) return;
  const ghost = img.cloneNode() as HTMLImageElement;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    objectFit: "cover",
    zIndex: "90",
    pointerEvents: "none",
    borderRadius: "2px",
    boxShadow: "0 20px 50px -20px rgba(0,0,0,.45)",
  });
  document.body.appendChild(ghost);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const s = Math.max(0.06, 28 / from.width);
  const anim = ghost.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 80}px) scale(${(1 + s) / 2.4})`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.2 },
    ],
    { duration: 850, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
  );
  anim.onfinish = () => {
    ghost.remove();
    bag.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  };
}
