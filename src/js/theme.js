// Svijetla/tamna tema i akcentna boja iz Windowsa.
(function () {
  const KEY = 'izborni-indeksi-tema';
  const root = document.documentElement;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const T = window.__TAURI__;
  const DEFAULT_ACCENT = '#0067c0';

  const pref = () => localStorage.getItem(KEY) || 'system';
  function applyTheme() {
    const p = pref();
    root.dataset.theme = p === 'system' ? (mq.matches ? 'dark' : 'light') : p;
    try { T?.window?.getCurrentWindow?.().setTheme(p === 'system' ? null : p); } catch (e) { /* van Tauri-ja */ }
  }

  function hexToRgb(h) {
    const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function onColor(hex) {
    const rgb = hexToRgb(hex); if (!rgb) return '#ffffff';
    const [r, g, b] = rgb.map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return L > 0.36 ? '#000000' : '#ffffff';
  }
  function cssAccent() {
    // Rezerva: CSS sistemska boja AccentColor (gdje je pregledač podržava)
    if (!window.CSS || !CSS.supports('color', 'AccentColor')) return null;
    const el = document.createElement('span');
    el.style.color = 'AccentColor'; document.body.appendChild(el);
    const c = getComputedStyle(el).color; el.remove();
    const m = c.match(/\d+/g); if (!m) return null;
    return '#' + m.slice(0, 3).map((x) => Number(x).toString(16).padStart(2, '0')).join('');
  }
  async function applyAccent() {
    let hex = null;
    try { if (T?.core?.invoke) hex = await T.core.invoke('system_accent'); } catch (e) { /* nije Windows */ }
    if (!hex) hex = cssAccent();
    if (!hexToRgb(hex)) hex = DEFAULT_ACCENT;
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--on-accent', onColor(hex));
  }

  applyTheme();
  mq.addEventListener('change', applyTheme);
  window.addEventListener('focus', applyAccent);
  document.addEventListener('DOMContentLoaded', () => {
    applyAccent();
    const sel = document.getElementById('theme-select');
    if (sel) {
      sel.value = pref();
      sel.addEventListener('change', () => { localStorage.setItem(KEY, sel.value); applyTheme(); });
    }
  });
})();
