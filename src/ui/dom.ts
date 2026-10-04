// Tiny helpers for building the HTML menus, positioned in logical pixels.

import { imageUrl, type ImageGroup } from '../engine/assets';

type Props = {
  class?: string;
  text?: string;
  style?: Partial<CSSStyleDeclaration>;
  // [left, top, width?, height?] in logical pixels
  at?: [number, number, number?, number?];
  onClick?: (e: MouseEvent) => void;
} & Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  children: Array<Node | null | false> = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  const { class: cls, text, style, at, onClick, ...attrs } = props;
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  if (at) {
    const [left, top, width, height] = at;
    el.style.position = 'absolute';
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    if (width !== undefined) el.style.width = `${width}px`;
    if (height !== undefined) el.style.height = `${height}px`;
  }
  if (style) Object.assign(el.style, style);
  if (onClick) el.addEventListener('click', onClick as EventListener);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c) el.appendChild(c);
  return el;
}

export function bg(group: ImageGroup, key: string): string {
  return `url("${imageUrl(group, key)}")`;
}

// A clickable menu label that turns white on hover, like the original's
// MouseMove colour swaps.
export function menuLink(text: string, at: [number, number, number, number], font: string, onClick: () => void, enabled = true) {
  const el = h('div', { class: `link${enabled ? '' : ' disabled'}`, text, at, style: { font, color: '#000' } });
  if (enabled) {
    el.addEventListener('mouseenter', () => (el.style.color = '#fff'));
    el.addEventListener('mouseleave', () => (el.style.color = '#000'));
    el.addEventListener('click', onClick);
  }
  return el;
}
