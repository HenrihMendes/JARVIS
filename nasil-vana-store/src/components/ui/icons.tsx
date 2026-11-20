import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20, p: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
  ...p,
});

export const IconBag = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M5 8h14l-1 12.5H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const IconSearch = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const IconMenu = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M3.5 8h17M3.5 16h11" /></svg>
);
export const IconClose = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="m5.5 5.5 13 13M18.5 5.5l-13 13" /></svg>
);
export const IconArrow = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 12h15.5M14 6.5 19.5 12 14 17.5" /></svg>
);
export const IconChevron = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="m9 5 7 7-7 7" /></svg>
);
export const IconPlus = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconMinus = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M5 12h14" /></svg>
);
export const IconCheck = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="m4.5 12.5 4.5 4.5 10.5-11" /></svg>
);
export const IconLock = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><rect x="5" y="10.5" width="14" height="10" rx="1" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
);
export const IconTruck = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3v3.5h-7" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>
);
export const IconReturn = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
);
export const IconChat = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z" /></svg>
);
export const IconPin = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>
);
export const IconInstagram = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" /></svg>
);
export const IconWhatsapp = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.3a8.5 8.5 0 1 1 15.6-4.5Z" /><path d="M9 8.5c.2-.6.5-.7.9-.7h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.7l-.5.6c-.1.2-.1.4 0 .6.6 1 1.4 1.8 2.4 2.4.2.1.4.1.6 0l.6-.5c.2-.2.5-.2.7-.1l1.6.7c.3.1.4.3.4.5v.5c0 .4-.1.7-.7.9-.9.4-2.4.4-4.4-1-1.6-1.2-2.6-2.6-3-3.7-.4-1.2-.1-2.3.3-2.9Z" fill="currentColor" stroke="none" /></svg>
);
export const IconFilter = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
);
export const IconZoom = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5" /></svg>
);
export const IconRuler = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><rect x="2.5" y="8" width="19" height="8" rx="1" /><path d="M6.5 8v3M10.5 8v4M14.5 8v3M18.5 8v4" /></svg>
);
export const IconSpark = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" strokeWidth={0.75} /></svg>
);
