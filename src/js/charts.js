// Grafikoni (SVG, bez interneta): polukrug skupštine, stubići, pita; izvoz u SVG i PNG.
(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cut = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
  const tw = (s, size = 12) => String(s).length * size * 0.56; // približna širina teksta

  // ---------- polukrug skupštine ----------
  // Raspored mandata u redove (unutrašnji poluprečnik 0,4 spoljašnjeg); mandati se dodjeljuju po uglu, slijeva nadesno.
  function arcLayout(N) {
    if (!(N > 0)) return { pts: [], dot: 0 };
    const r0 = 0.4;
    const radii = (R) => Array.from({ length: R }, (_, j) => (R === 1 ? 1 : r0 + ((1 - r0) * j) / (R - 1)));
    const gapOf = (R) => (R === 1 ? 1 - r0 : (1 - r0) / (R - 1));
    const capOf = (R) => radii(R).map((r) => Math.floor((Math.PI * r) / gapOf(R)) + 1);
    let R = 1;
    while (capOf(R).reduce((a, b) => a + b, 0) < N) R++;
    const rad = radii(R), cap = capOf(R), sumR = rad.reduce((a, b) => a + b, 0);
    // raspodjela mandata po redovima srazmjerno poluprečniku (najveći ostatak)
    const raw = rad.map((r) => (N * r) / sumR);
    const n = raw.map((x, j) => Math.min(cap[j], Math.floor(x)));
    let left = N - n.reduce((a, b) => a + b, 0);
    const order = raw.map((x, j) => [x - Math.floor(x), j]).sort((a, b) => b[0] - a[0]);
    while (left > 0) { for (const [, j] of order) { if (left > 0 && n[j] < cap[j]) { n[j]++; left--; } } }
    const pts = [];
    n.forEach((k, j) => { for (let i = 0; i < k; i++) { const th = k === 1 ? Math.PI / 2 : Math.PI * (1 - i / (k - 1)); pts.push({ th, r: rad[j] }); } });
    pts.sort((a, b) => b.th - a.th || b.r - a.r);
    return { pts, dot: gapOf(R) * 0.38 };
  }
  function arc({ parties, total, majority, labels, womenLabel }) {
    const N = parties.reduce((a, p) => a + p.n, 0);
    const W = 640, cx = W / 2, cy = 300, S = 270;
    const { pts, dot } = arcLayout(N);
    let k = 0, g = '';
    parties.forEach((p) => {
      for (let i = 0; i < p.n; i++, k++) {
        const q = pts[k], x = (cx + q.r * Math.cos(q.th) * S).toFixed(1), y = (cy - q.r * Math.sin(q.th) * S).toFixed(1), rr = dot * S;
        // mandati žena: prsten u boji stranke sa bijelim središtem
        g += i < (p.w || 0)
          ? `<circle cx="${x}" cy="${y}" r="${(rr * 0.72).toFixed(1)}" fill="#ffffff" stroke="${p.color}" stroke-width="${(rr * 0.56).toFixed(1)}"><title>${esc(p.label)}: ${p.n} (${esc(womenLabel)}: ${p.w})</title></circle>`
          : `<circle cx="${x}" cy="${y}" r="${rr.toFixed(1)}" fill="${p.color}"><title>${esc(p.label)}: ${p.n}</title></circle>`;
      }
    });
    g += `<text x="${cx}" y="${cy - 18}" text-anchor="middle" class="ch-title" style="font-size:40px;font-weight:700">${N}</text>`;
    if (majority) g += `<text x="${cx}" y="${cy + 6}" text-anchor="middle" class="ch-ax" style="font-size:13px">${esc(majority)}</text>`;
    // legenda u dvije kolone
    const shown = parties.filter((p) => p.n > 0);
    const colW = (W - 40) / 2, rows = Math.ceil(shown.length / 2);
    shown.forEach((p, i) => {
      const x = 20 + (i % 2) * colW, y = cy + 44 + Math.floor(i / 2) * 22;
      g += `<circle cx="${x + 7}" cy="${y - 4}" r="6" fill="${p.color}"/><text x="${x + 20}" y="${y}" class="ch-ax" style="font-size:12.5px">${esc(cut(p.label, womenLabel ? 27 : 31))}</text>`
        + `<text x="${x + colW - 14}" y="${y}" text-anchor="end" class="ch-title" style="font-size:12.5px;font-weight:700">${p.n}${womenLabel ? ` <tspan style="font-weight:400">(${p.w || 0})</tspan>` : ''}</text>`;
    });
    let H = cy + 44 + rows * 22 + 6;
    if (womenLabel) {
      g += `<circle cx="27" cy="${H + 2}" r="5" fill="#fff" stroke="#777" stroke-width="3.5"/><text x="40" y="${H + 6}" class="ch-ax" style="font-size:12px">= ${esc(womenLabel)} (${parties.reduce((a, p) => a + (p.w || 0), 0)} / ${N})</text>`;
      H += 22;
    }
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img"><title>${esc(labels?.title || '')}</title>${g}</svg>`;
  }

  // ---------- stubići (vertikalni ili horizontalni) ----------
  // cats: nazivi kategorija; series: [{label, color, values, opacity}]
  function bars({ cats, series, horizontal, fmt, dec = 1, unit = '', title = '' }) {
    const all = series.flatMap((s) => s.values).filter(Number.isFinite);
    const max = Math.max(0, ...all) || 1;
    const legend = !title && series.length > 1 ? series.map((s) => ({ label: s.label, color: s.color, opacity: s.opacity })) : [];
    const head = !!(title || legend.length);
    let g = '', W, H;
    const legendSvg = (y0, W) => {
      let x = 20, out = '';
      legend.forEach((l) => { out += `<rect x="${x}" y="${y0 - 10}" width="14" height="14" rx="3" fill="${l.color}" fill-opacity="${l.opacity ?? 1}"/><text x="${x + 20}" y="${y0 + 1}" class="ch-ax" style="font-size:12px">${esc(l.label)}</text>`; x += 40 + tw(l.label); });
      return out;
    };
    if (horizontal) {
      const LBL = 40, labelW = Math.min(310, Math.max(...cats.map((c) => tw(cut(c, LBL), 12) * 1.08)) + 12);
      const barH = 14, gap = 4, groupH = series.length * (barH + gap) + 10;
      W = 760; const x0 = labelW + 10, plotW = W - x0 - 70, top = head ? 34 : 10;
      H = top + cats.length * groupH + 10;
      cats.forEach((c, i) => {
        const y = top + i * groupH;
        g += `<text x="${labelW}" y="${y + (groupH - 10) / 2 + 4}" text-anchor="end" class="ch-ax" style="font-size:12px"><title>${esc(c)}</title>${esc(cut(c, Math.min(LBL, Math.floor((labelW - 8) / 7))))}</text>`;
        series.forEach((s, j) => {
          const v = s.values[i]; if (!Number.isFinite(v)) return;
          const w = (v / max) * plotW, yy = y + j * (barH + gap);
          g += `<rect x="${x0}" y="${yy}" width="${Math.max(0, w).toFixed(1)}" height="${barH}" rx="2" fill="${s.perCat ? s.perCat[i] : s.color}" fill-opacity="${s.opacity ?? 1}"><title>${esc(c)} · ${esc(s.label)}: ${fmt(v, dec)}${unit}</title></rect>`
            + `<text x="${x0 + w + 5}" y="${yy + barH - 3}" class="ch-ax" style="font-size:11px">${fmt(v, dec)}${unit}</text>`;
        });
      });
      if (title) g += `<text x="20" y="20" class="ch-title" style="font-size:13px;font-weight:600">${esc(title)}</text>`;
      else if (legend.length) g += legendSvg(18, W);
    } else {
      const groupW = Math.max(34, series.length * 16 + 14);
      W = Math.max(960, 70 + cats.length * groupW + 20);
      const top = head ? 40 : 16, plotH = 230, x0 = 56, base = top + plotH;
      const labels = cats.map((c) => cut(c, 18));
      const rot = cats.length > 6;
      H = base + (rot ? 110 : 34);
      for (let k = 0; k <= 4; k++) {
        const yv = (max * k) / 4, yy = base - (yv / max) * plotH;
        g += `<line x1="${x0}" x2="${W - 10}" y1="${yy}" y2="${yy}" class="ch-grid"/><text x="${x0 - 6}" y="${yy + 4}" text-anchor="end" class="ch-ax">${fmt(yv, dec)}</text>`;
      }
      const step = (W - x0 - 20) / cats.length, bw = Math.min(22, (step - 10) / series.length);
      cats.forEach((c, i) => {
        const gx = x0 + i * step + (step - bw * series.length) / 2;
        series.forEach((s, j) => {
          const v = s.values[i]; if (!Number.isFinite(v)) return;
          const h = (v / max) * plotH;
          g += `<rect x="${(gx + j * bw).toFixed(1)}" y="${(base - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="2" fill="${s.perCat ? s.perCat[i] : s.color}" fill-opacity="${s.opacity ?? 1}"><title>${esc(c)} · ${esc(s.label)}: ${fmt(v, dec)}${unit}</title></rect>`;
        });
        const lx = x0 + i * step + step / 2;
        g += rot ? `<text transform="translate(${lx},${base + 12}) rotate(-40)" text-anchor="end" class="ch-ax" style="font-size:11px"><title>${esc(c)}</title>${esc(labels[i])}</text>`
          : `<text x="${lx}" y="${base + 18}" text-anchor="middle" class="ch-ax" style="font-size:11.5px"><title>${esc(c)}</title>${esc(labels[i])}</text>`;
      });
      if (title) g += `<text x="20" y="22" class="ch-title" style="font-size:13px;font-weight:600">${esc(title)}</text>`;
      else if (legend.length) g += legendSvg(20, W);
    }
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${g}</svg>`;
  }

  // ---------- pita ----------
  function pie({ items, fmt, title }) {
    const tot = items.reduce((a, x) => a + x.value, 0);
    if (!(tot > 0)) return '';
    const W = 700, cx = 190, cy = 190, R = 160;
    let a = -Math.PI / 2, g = '';
    items.forEach((x) => {
      const da = (x.value / tot) * Math.PI * 2, a2 = a + da;
      const p = (t) => `${(cx + R * Math.cos(t)).toFixed(2)},${(cy + R * Math.sin(t)).toFixed(2)}`;
      const pct = (x.value / tot) * 100;
      g += items.length === 1 ? `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${x.color}"/>`
        : `<path d="M${cx},${cy} L${p(a)} A${R},${R} 0 ${da > Math.PI ? 1 : 0} 1 ${p(a2)} Z" fill="${x.color}" stroke="#fff" stroke-width="1.5"><title>${esc(x.label)}: ${fmt(pct, 1)}%</title></path>`;
      if (pct >= 4) { const m = (a + a2) / 2; g += `<text x="${(cx + R * 0.66 * Math.cos(m)).toFixed(1)}" y="${(cy + R * 0.66 * Math.sin(m) + 4).toFixed(1)}" text-anchor="middle" style="font-size:12px;font-weight:700;fill:#fff">${fmt(pct, 1)}%</text>`; }
      a = a2;
    });
    if (title) g += `<text x="${cx}" y="${cy + R + 26}" text-anchor="middle" class="ch-ax" style="font-size:13px">${esc(title)}</text>`;
    items.forEach((x, i) => {
      const y = 30 + i * 22;
      g += `<rect x="390" y="${y - 11}" width="14" height="14" rx="3" fill="${x.color}"/><text x="412" y="${y}" class="ch-ax" style="font-size:12px">${esc(cut(x.label, 30))}</text><text x="${W - 10}" y="${y}" text-anchor="end" class="ch-title" style="font-size:12px;font-weight:700">${fmt((x.value / tot) * 100, 1)}%</text>`;
    });
    const H = Math.max(cy + R + 40, 30 + items.length * 22);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${g}</svg>`;
  }

  // ---------- izvoz ----------
  // Za izvoz se boje teksta i mreže fiksiraju na svijetlu temu (bijela pozadina), da slika izgleda isto u izvještaju.
  function serialize(svgEl) {
    const c = svgEl.cloneNode(true);
    const vb = (svgEl.getAttribute('viewBox') || '0 0 600 400').split(/\s+/).map(Number);
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    c.setAttribute('width', vb[2]); c.setAttribute('height', vb[3]);
    c.removeAttribute('class');
    const fix = { 'ch-ax': 'fill:#3a3a3a', 'ch-title': 'fill:#111', 'ch-val': '', 'ch-grid': 'stroke:#dcdcdc;stroke-width:1', 'ch-dot': 'fill:#fff;stroke-width:2.5', 'ch-line': 'fill:none;stroke-width:2.5' };
    c.querySelectorAll('[class]').forEach((el) => {
      const cls = el.getAttribute('class');
      const add = Object.entries(fix).filter(([k]) => cls.split(' ').includes(k)).map(([, v]) => v).join(';');
      el.setAttribute('style', [add, el.getAttribute('style') || ''].filter(Boolean).join(';'));
      el.removeAttribute('class');
    });
    c.querySelectorAll('[stroke^="var("],[fill^="var("]').forEach((el) => {
      ['stroke', 'fill'].forEach((a) => { const v = el.getAttribute(a); if (v && v.startsWith('var(')) el.setAttribute(a, getComputedStyle(document.documentElement).getPropertyValue(v.slice(4, -1)).trim() || '#0067c0'); });
    });
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#ffffff');
    c.insertBefore(bg, c.firstChild);
    c.setAttribute('style', 'font-family:Segoe UI, Arial, sans-serif');
    return { text: '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(c), w: vb[2], h: vb[3] };
  }
  async function toPng(svgEl, scale = 2) {
    const { text, w, h } = serialize(svgEl);
    const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const cv = document.createElement('canvas'); cv.width = w * scale; cv.height = h * scale;
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
      return new Uint8Array(await blob.arrayBuffer());
    } finally { URL.revokeObjectURL(url); }
  }
  const toSvg = (svgEl) => new TextEncoder().encode(serialize(svgEl).text);

  window.Charts = { arc, arcLayout, bars, pie, toPng, toSvg };
})();
