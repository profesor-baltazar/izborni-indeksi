// Izborni indeksi - korisnički interfejs
(function () {
  const I = window.Indices, S = window.Store, P = window.Platform;
  const $ = (s, r = document) => r.querySelector(s);
  const main = $('#main');
  const LOC = 'sr-Latn-ME';

  // ---------- pomoćne ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function parseNum(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    let s = String(v ?? '').trim().replace(/\s| /g, '');
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  const fmt = (x, d = 2) => (Number.isFinite(x) ? x.toLocaleString(LOC, { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');
  const fmtInt = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString(LOC) : '–');
  const pct = (a, t) => (t > 0 ? (a / t) * 100 : 0);
  function toast(msg, ms = 2600) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
  }
  function modal(html, onMount) {
    return new Promise((resolve) => {
      const root = $('#modal-root');
      root.innerHTML = `<div class="modal-back"><div class="modal">${html}</div></div>`;
      const close = (val) => { root.innerHTML = ''; resolve(val); };
      root.querySelector('.modal-back').addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-close]');
        if (b) close(b.dataset.close);
        if (ev.target.classList.contains('modal-back')) close(null);
      });
      if (onMount) onMount(root.querySelector('.modal'), close);
    });
  }
  const confirmBox = (title, text, okLabel = 'Potvrdi', danger = false) => modal(
    `<h3>${esc(title)}</h3><p>${text}</p><div class="actions"><button class="btn" data-close="">Otkaži</button><button class="btn ${danger ? 'danger' : 'primary'}" data-close="ok">${esc(okLabel)}</button></div>`
  ).then((v) => v === 'ok');
  const promptBox = (title, value = '') => modal(
    `<h3>${esc(title)}</h3><input id="pb-in" class="title-input" style="width:100%;border-color:var(--border)" value="${esc(value)}"><div class="actions"><button class="btn" data-close="">Otkaži</button><button class="btn primary" id="pb-ok">U redu</button></div>`,
    (m, close) => {
      const inp = m.querySelector('#pb-in'); inp.focus(); inp.select();
      const ok = () => close(inp.value.trim() || null);
      m.querySelector('#pb-ok').addEventListener('click', ok);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(); });
    });
  function pickFile(accept) {
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = accept;
      inp.addEventListener('change', () => resolve(inp.files[0] || null));
      inp.click();
    });
  }

  // ---------- citiranje izvora ----------
  const CITES = {
    results: `<b>Izvori formula.</b> Indeks najmanjih kvadrata (LSq): Gallagher, M. (1991). Proportionality, disproportionality and electoral systems. <i>Electoral Studies</i> 10(1): 33–51.
      Efektivni broj stranaka (ENEP, ENPP): Laakso, M. i Taagepera, R. (1979). “Effective” number of parties: a measure with application to West Europe. <i>Comparative Political Studies</i> 12(1): 3–27.`,
    alloc: `<b>Metode.</b> D'Hondt (najveći količnik, djelioci 1, 2, 3…), Sainte-Laguë (djelioci 1, 3, 5…) i Hare–Niemeyer (prosta kvota i najveći ostatak).
      Kolone „poseban cenzus“ i „garantovani mandati“ služe za modelovanje posebnih pravila za manjinske liste. U priloženim izborima tako se dobija stvarna raspodjela mandata, osim 2009, kad je postojala posebna izborna jedinica za albansku manjinu.`,
    nat: `<b>Autor formule.</b> Ponderisani indeks nacionalizacije stranaka (PNSw) i standardizovani indeks nacionalizacije (sPNS) razvio je <b>Daniel Bochsler</b> (Univerzitet u Cirihu):
      Bochsler, D. (2010). Measuring party nationalisation: A new Gini-based indicator that corrects for the number of units. <i>Electoral Studies</i> 29(1): 155–168.
      Indeks se oslanja na Gini-zasnovan indeks nacionalizacije: Jones, M. P. i Mainwaring, S. (2003). The nationalization of parties and party systems. <i>Party Politics</i> 9(2): 139–166.
      Ova aplikacija je nezavisna implementacija Bochslerove formule; na podacima za CG 2020 daje iste vrijednosti kao njegov originalni Excel alat.`,
    vol: `<b>Izvori formula.</b> Ukupna volatilnost: Pedersen, M. N. (1979). The dynamics of European party systems: changing patterns of electoral volatility. <i>European Journal of Political Research</i> 7(1): 1–26.
      Podjela na tip A i tip B: Powell, E. N. i Tucker, J. A. (2014). Revisiting electoral volatility in post-communist countries: new data, new results and new approaches. <i>British Journal of Political Science</i> 44(1): 123–147.`,
  };
  const CITE_TEXT = (k) => CITES[k].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  // ---------- proračuni po modulu ----------
  function calcResults(e) {
    const V = e.lists.map((l) => parseNum(l.votes)), M = e.lists.map((l) => parseNum(l.seats));
    const tv = I.sum(V), ts = I.sum(M);
    return { V, M, tv, ts, lsq: I.lsq(V, M), enep: I.enp(V), enpp: I.enp(M) };
  }
  function calcAlloc(e) {
    const V = e.lists.map((l) => parseNum(l.votes));
    const r = I.allocate({ votes: V, seats: parseNum(e.seats), method: e.method, threshold: parseNum(e.threshold),
      thresholds: e.lists.map((l) => (String(l.thr ?? '').trim() === '' ? null : parseNum(l.thr))), reserved: e.lists.map((l) => parseNum(l.res)) });
    return { V, tv: I.sum(V), ...r, lsq: I.lsq(V, r.seats) };
  }
  function unitValid(u, e) {
    const v = parseNum(u.valid);
    return v > 0 ? v : e.lists.reduce((s, l) => s + parseNum(u.votes[l.id]), 0);
  }
  function calcNat(e) {
    const units = e.units.map((u) => ({ valid: unitValid(u, e), votes: e.lists.map((l) => parseNum(u.votes[l.id])) }));
    const sums = e.lists.map((_, j) => I.sum(units.map((u) => u.votes[j])));
    const missingValid = e.units.some((u) => !(parseNum(u.valid) > 0));
    if (units.length < 2) return { units, sums, ok: false, missingValid };
    return { units, sums, ok: true, missingValid, ...I.nationalisation(units, e.lists.length) };
  }
  function calcVol() {
    const v = S.state.vol;
    const A = S.byId(v.a), B = S.byId(v.b);
    if (!A || !B || A === B) return null;
    const key = S.linkKey(A.id, B.id);
    const links = S.state.links[key] || [];
    const val = (l) => parseNum(v.basis === 'seats' ? l.seats : l.votes);
    const r = I.volatility(A.lists.map((l) => ({ id: l.id, name: l.name, value: val(l) })), B.lists.map((l) => ({ id: l.id, name: l.name, value: val(l) })), links);
    return { A, B, key, links, ...r };
  }

  // ---------- prikaz ----------
  function renderNav() {
    document.querySelectorAll('#module-nav a').forEach((a) => a.classList.toggle('on', a.dataset.mod === S.state.module));
    $('#election-nav').innerHTML = S.state.elections.map((e) =>
      `<a data-el="${e.id}" class="${e.id === S.state.current ? 'on' : ''}"><span>${esc(e.name)}</span><span class="sub">${e.lists.length}</span></a>`).join('')
      || '<div class="muted" style="padding:6px 10px;font-size:12px">Još nema izbora</div>';
  }

  const printHead = (e, title) => `<div class="print-head"><b>${esc(title)}</b><br><span class="muted">${esc(e ? e.name : '')} · ${new Date().toLocaleDateString(LOC)}</span></div>`;

  function electionHead(e, extra = '') {
    return `<div class="head">
      <input class="title-input" data-bind="name" value="${esc(e.name)}" title="Klikni da promijeniš naziv izbora">
      ${extra}
      <button class="btn small" data-act="dup">Dupliraj</button>
      <button class="btn small danger" data-act="del-election">Obriši izbore</button>
    </div>`;
  }

  const MODULES = {
    results: {
      title: 'Rezultati i indeksi',
      render(e) {
        const rows = e.lists.map((l) => `<tr data-id="${l.id}">
          <td class="l"><input class="name" data-f="name" title="${esc(l.name)}" value="${esc(l.name)}" placeholder="Naziv liste ili stranke"></td>
          <td><input data-f="votes" value="${esc(l.votes)}" inputmode="decimal"></td>
          <td><input class="sm" data-f="seats" value="${esc(l.seats)}" inputmode="numeric"></td>
          <td data-out="pv-${l.id}"></td><td data-out="ps-${l.id}"></td>
          <td class="no-print"><button class="icon-btn" data-act="del-list" title="Ukloni listu">✕</button></td></tr>`).join('');
        return `${printHead(e, 'Rezultati i indeksi')}${electionHead(e, `
          <button class="btn small" data-act="paste-lists">Zalijepi iz Excela</button>
          <button class="btn small" data-act="import-lists">Uvezi XLSX/CSV</button>`)}
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">Lista / stranka</th><th>Glasovi</th><th>Mandati</th><th>% glasova</th><th>% mandata</th><th class="no-print"></th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td class="l">Ukupno</td><td data-out="tv"></td><td data-out="ts"></td><td>100,00</td><td>100,00</td><td class="no-print"></td></tr></tfoot>
          </table></div>
          <div class="row no-print" style="margin-top:8px"><button class="btn small" data-act="add-list">+ Dodaj listu</button>
            <span class="muted" style="font-size:12px">Imena lista mijenjaš direktno u tabeli. „Ostali“ unesi kao posljednji red, ako ih ima.</span></div>
          <div class="metrics">
            <div class="metric"><div class="k">Indeks disproporcionalnosti (LSq)</div><div class="v" data-out="lsq"></div><div class="h">0 = savršena proporcionalnost</div></div>
            <div class="metric alt"><div class="k">Efektivni broj izbornih stranaka (ENEP)</div><div class="v" data-out="enep"></div><div class="h">na osnovu glasova</div></div>
            <div class="metric alt"><div class="k">Efektivni broj parlamentarnih stranaka (ENPP)</div><div class="v" data-out="enpp"></div><div class="h">na osnovu mandata</div></div>
          </div>
          <div class="cite">${CITES.results}</div>`;
      },
      paint(e) {
        const r = calcResults(e), o = {};
        e.lists.forEach((l, i) => { o['pv-' + l.id] = fmt(pct(r.V[i], r.tv)); o['ps-' + l.id] = fmt(pct(r.M[i], r.ts)); });
        Object.assign(o, { tv: fmtInt(r.tv), ts: fmtInt(r.ts), lsq: fmt(r.lsq), enep: fmt(r.enep), enpp: fmt(r.enpp) });
        return o;
      },
      table(e) {
        const r = calcResults(e);
        return {
          header: ['Lista', 'Glasovi', 'Mandati', '% glasova', '% mandata'],
          rows: e.lists.map((l, i) => [l.name, r.V[i], r.M[i], pct(r.V[i], r.tv), pct(r.M[i], r.ts)]),
          summary: [['LSq (Gallagher)', r.lsq], ['ENEP', r.enep], ['ENPP', r.enpp], ['Ukupno glasova', r.tv], ['Ukupno mandata', r.ts]],
        };
      },
    },

    alloc: {
      title: 'Raspodjela mandata',
      render(e) {
        const rows = e.lists.map((l) => `<tr data-id="${l.id}">
          <td class="l clip" title="${esc(l.name)}">${esc(l.name)}</td><td>${fmtInt(parseNum(l.votes))}</td><td data-out="pv-${l.id}"></td>
          <td><input class="sm" data-f="thr" value="${esc(l.thr ?? '')}" placeholder="opšti"></td>
          <td><input class="sm" data-f="res" value="${esc(l.res || '')}" placeholder="0"></td>
          <td data-out="al-${l.id}" style="font-weight:600"></td><td>${fmtInt(parseNum(l.seats))}</td><td data-out="df-${l.id}"></td></tr>`).join('');
        return `${printHead(e, 'Raspodjela mandata')}${electionHead(e)}
          <div class="row" style="margin-bottom:12px">
            <label class="field">Broj mandata<input data-bind="seats" value="${esc(e.seats)}" inputmode="numeric"></label>
            <label class="field">Metoda<select data-bind="method">
              <option value="dhondt" ${e.method === 'dhondt' ? 'selected' : ''}>D'Hondt</option>
              <option value="sainte-lague" ${e.method === 'sainte-lague' ? 'selected' : ''}>Sainte-Laguë</option>
              <option value="hare" ${e.method === 'hare' ? 'selected' : ''}>Hare–Niemeyer</option></select></label>
            <label class="field">Opšti cenzus (%)<input data-bind="threshold" value="${esc(e.threshold)}" inputmode="decimal"></label>
            <div class="spacer"></div>
            <button class="btn small accent" data-act="apply-alloc">Upiši kao stvarne mandate</button>
          </div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">Lista</th><th>Glasovi</th><th>% glasova</th><th>Poseban cenzus (%)</th><th>Garantovani mandati</th><th>Dodijeljeno</th><th>Stvarno</th><th>Razlika</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td class="l">Ukupno</td><td data-out="tv"></td><td></td><td></td><td></td><td data-out="tal"></td><td data-out="tst"></td><td></td></tr></tfoot>
          </table></div>
          <div data-out-html="allocwarn"></div>
          <div class="metrics"><div class="metric"><div class="k">LSq za ovu raspodjelu</div><div class="v" data-out="lsq"></div><div class="h">Gallagherov indeks disproporcionalnosti</div></div></div>
          <div class="cite">${CITES.alloc}</div>`;
      },
      paint(e) {
        const r = calcAlloc(e), o = {};
        e.lists.forEach((l, i) => {
          o['pv-' + l.id] = fmt(pct(r.V[i], r.tv));
          o['al-' + l.id] = r.eligible[i] || r.seats[i] ? String(r.seats[i]) : '—';
          const d = r.seats[i] - parseNum(l.seats);
          o['df-' + l.id] = d === 0 ? '0' : (d > 0 ? '+' : '') + d;
        });
        o.tv = fmtInt(r.tv); o.tal = String(I.sum(r.seats)); o.tst = fmtInt(I.sum(e.lists.map((l) => parseNum(l.seats))));
        o.lsq = fmt(r.lsq);
        o.allocwarn = r.tie ? '<div class="warn">Posljednji mandat je neriješen (isti količnik/ostatak). Zakon obično propisuje kako se takav slučaj rješava; provjeri ručno.</div>' : '';
        return o;
      },
      table(e) {
        const r = calcAlloc(e);
        return {
          header: ['Lista', 'Glasovi', '% glasova', 'Poseban cenzus', 'Garantovani', 'Dodijeljeno', 'Stvarno', 'Razlika'],
          rows: e.lists.map((l, i) => [l.name, r.V[i], pct(r.V[i], r.tv), l.thr === '' ? '' : parseNum(l.thr), parseNum(l.res), r.seats[i], parseNum(l.seats), r.seats[i] - parseNum(l.seats)]),
          summary: [['Metoda', { dhondt: "D'Hondt", 'sainte-lague': 'Sainte-Laguë', hare: 'Hare–Niemeyer' }[e.method]], ['Broj mandata', parseNum(e.seats)], ['Opšti cenzus (%)', parseNum(e.threshold)], ['LSq za raspodjelu', r.lsq]],
        };
      },
    },

    nat: {
      title: 'Nacionalizacija stranaka',
      render(e) {
        const head = e.lists.map((l) => `<th class="clip-h" title="${esc(l.name)}">${esc(l.name)}</th>`).join('');
        const rows = e.units.map((u) => `<tr data-uid="${u.id}">
          <td class="l"><input class="name" data-uf="name" value="${esc(u.name)}" placeholder="Opština / jedinica"></td>
          <td><input data-uf="valid" value="${esc(u.valid)}"></td>
          ${e.lists.map((l) => `<td><input class="sm" data-uv="${l.id}" value="${esc(u.votes[l.id] ?? '')}"></td>`).join('')}
          <td class="no-print"><button class="icon-btn" data-act="del-unit" title="Ukloni jedinicu">✕</button></td></tr>`).join('');
        const res = e.lists.map((l) => `<tr><td class="l clip" title="${esc(l.name)}">${esc(l.name)}</td><td data-out="ns-${l.id}"></td><td data-out="nsh-${l.id}"></td><td data-out="np-${l.id}"></td><td data-out="nz-${l.id}" style="font-weight:600"></td><td data-out="nc-${l.id}"></td></tr>`).join('');
        return `${printHead(e, 'Nacionalizacija stranaka')}${electionHead(e, `
          <button class="btn small" data-act="paste-units">Zalijepi iz Excela</button>
          <button class="btn small" data-act="import-units">Uvezi XLSX/CSV</button>`)}
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">Teritorijalna jedinica</th><th>Važeći glasovi</th>${head}<th class="no-print"></th></tr></thead>
            <tbody>${rows || `<tr><td colspan="${e.lists.length + 3}" class="empty">Dodaj opštine (ili druge jedinice) i unesi glasove svake liste u njima.</td></tr>`}</tbody>
            <tfoot><tr><td class="l">Zbir jedinica</td><td data-out="nvalid"></td>${e.lists.map((l) => `<td data-out="nsum-${l.id}"></td>`).join('')}<td class="no-print"></td></tr></tfoot>
          </table></div>
          <div class="row no-print" style="margin-top:8px">
            <button class="btn small" data-act="add-unit">+ Dodaj jedinicu</button>
            <button class="btn small ghost" data-act="clear-units">Obriši sve jedinice</button>
            <span class="muted" style="font-size:12px">„Važeći glasovi“ su svi važeći glasovi u jedinici (uključujući ostale liste). Prazno = zbir unesenih lista.</span>
          </div>
          <div data-out-html="natwarn"></div>
          <div class="metrics">
            <div class="metric"><div class="k">sPNS sistema (standardizovan)</div><div class="v" data-out="sys-s"></div><div class="h">ponderisan udjelom glasova</div></div>
            <div class="metric"><div class="k">PNSw sistema (ponderisan)</div><div class="v" data-out="sys-w"></div><div class="h">0 = koncentrisano, 1 = ravnomjerno</div></div>
            <div class="metric alt"><div class="k">Efektivni broj jedinica (E)</div><div class="v" data-out="E"></div><div class="h" data-out="ucount"></div></div>
            <div class="metric alt"><div class="k">N2 državni / N2 jedinice</div><div class="v" data-out="n2"></div><div class="h">efektivni broj stranaka</div></div>
          </div>
          <h2>Rezultati po listama</h2>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">Lista</th><th>Glasovi (zbir)</th><th>Udio</th><th>PNSw</th><th>sPNS</th><th>Teritorijalna pokrivenost</th></tr></thead>
            <tbody>${res}</tbody></table></div>
          <div class="cite">${CITES.nat}</div>`;
      },
      paint(e) {
        const r = calcNat(e), o = {};
        const tot = I.sum(r.sums);
        o.nvalid = fmtInt(I.sum(r.units.map((u) => u.valid)));
        e.lists.forEach((l, j) => {
          o['nsum-' + l.id] = fmtInt(r.sums[j]);
          o['ns-' + l.id] = fmtInt(r.sums[j]);
          o['nsh-' + l.id] = fmt(pct(r.sums[j], tot)) + ' %';
          const p = r.ok ? r.parties[j] : null;
          o['np-' + l.id] = p ? fmt(p.pnsw, 3) : '–';
          o['nz-' + l.id] = p ? fmt(p.spns, 3) : '–';
          o['nc-' + l.id] = p && Number.isFinite(p.pnsw) ? fmt(p.coverage * 100, 1) + ' %' : '–';
        });
        o['sys-s'] = r.ok ? fmt(r.systemSpns, 3) : '–';
        o['sys-w'] = r.ok ? fmt(r.systemPnsw, 3) : '–';
        o.E = r.ok ? fmt(r.E, 2) : '–';
        o.ucount = r.ok ? `od ${r.unitCount} jedinica` : 'potrebne su bar 2 jedinice';
        o.n2 = r.ok ? `${fmt(r.n2national)} / ${fmt(r.n2district)}` : '–';
        o.natwarn = r.missingValid && e.units.length ? '<div class="warn">Za neke jedinice nisu uneseni važeći glasovi, pa je korišćen zbir unesenih lista. Za tačan PNS unesi sve važeće glasove.</div>' : '';
        return o;
      },
      table(e) {
        const r = calcNat(e); const tot = I.sum(r.sums);
        return {
          header: ['Lista', 'Glasovi (zbir jedinica)', 'Udio %', 'PNSw', 'sPNS', 'Pokrivenost %'],
          rows: e.lists.map((l, j) => { const p = r.ok ? r.parties[j] : {}; return [l.name, r.sums[j], pct(r.sums[j], tot), p.pnsw ?? '', p.spns ?? '', Number.isFinite(p.pnsw) ? p.coverage * 100 : '']; }),
          summary: r.ok ? [['sPNS sistema', r.systemSpns], ['PNSw sistema', r.systemPnsw], ['Efektivni broj jedinica (E)', r.E], ['Broj jedinica', r.unitCount], ['N2 državni', r.n2national], ['N2 jedinice (ponderisan)', r.n2district]] : [['Napomena', 'Potrebne su bar 2 teritorijalne jedinice']],
          units: { header: ['Jedinica', 'Važeći glasovi', ...e.lists.map((l) => l.name)], rows: e.units.map((u) => [u.name, parseNum(u.valid), ...e.lists.map((l) => parseNum(u.votes[l.id]))]) },
        };
      },
    },

    vol: {
      title: 'Volatilnost',
      render() {
        const els = S.state.elections;
        const v = S.state.vol;
        if (els.length >= 2) {
          if (!S.byId(v.a) || !S.byId(v.b) || v.a === v.b) { v.a = els[els.length - 2].id; v.b = els[els.length - 1].id; }
        }
        const opts = (sel) => els.map((e) => `<option value="${e.id}" ${e.id === sel ? 'selected' : ''}>${esc(e.name)}</option>`).join('');
        const explain = `<div class="explain">
          <b>Kako se računa.</b> Volatilnost pokazuje koliki se dio biračkog tijela „preselio“ između stranaka od jednih do drugih izbora.
          Za svaku stranku uzmeš udio glasova u procentima na prvim i na drugim izborima, izračunaš razliku, sabereš apsolutne vrijednosti svih razlika i podijeliš sa 2:
          <code>TV = ½ · Σ |pᵢ,₂ − pᵢ,₁|</code>. Dijeli se sa 2 jer se svaki procenat koji jedna stranka izgubi pojavljuje kao dobitak neke druge.
          0 znači identične rezultate, a 100 da su glasove dobile potpuno nove stranke.
          <br><b>Primjer:</b> A 40% → 30%, B 35% → 45%, C 25% → 25%: (10 + 10 + 0) / 2 = <b>10</b>.
          <br><b>Tip A</b> je dio volatilnosti nastao ulaskom novih i izlaskom starih stranaka, a <b>tip B</b> pomjeranje glasova među strankama koje su učestvovale na oba izbora. TV = A + B.
          <br><b>Koalicije i podjele:</b> ispod poveži svaku listu sa drugih izbora sa njenim prethodnikom (ili sa više njih, ako je koalicija). Povezane liste se tretiraju kao jedna cjelina i udjeli im se sabiraju.
        </div>`;
        if (els.length < 2) {
          return `<div class="head"><h1>Volatilnost</h1></div>${explain}
            <div class="card empty" style="margin-top:14px">Za volatilnost su potrebni bar dvoje izbora. Dodaj i druge izbore (npr. CG 2016) u modulu „Rezultati i indeksi“.<br><br>
            <button class="btn primary" data-act="new-election">+ Novi izbori</button></div><div class="cite">${CITES.vol}</div>`;
        }
        const A = S.byId(v.a), B = S.byId(v.b);
        const key = S.linkKey(A.id, B.id);
        if (!S.state.links[key]) { S.state.links[key] = autoLinks(A, B); S.save(); }
        const links = S.state.links[key];
        const linkRows = B.lists.map((lb) => `<div class="link-row"><div><b>${esc(lb.name)}</b><div class="muted" style="font-size:12px">prethodnik(ci):</div></div>
          <div class="chips">${A.lists.map((la) => `<span class="chip ${links.some(([x, y]) => x === la.id && y === lb.id) ? 'on' : ''}" data-act="toggle-link" data-a="${la.id}" data-b="${lb.id}" title="${esc(la.name)}">${esc(la.name)}</span>`).join('')}</div></div>`).join('');
        return `${printHead(null, 'Volatilnost')}<div class="head"><h1>Volatilnost</h1></div>
          <div class="row" style="margin-bottom:12px">
            <label class="field">Prvi izbori (t₁)<select data-vol="a">${opts(v.a)}</select></label>
            <label class="field">Drugi izbori (t₂)<select data-vol="b">${opts(v.b)}</select></label>
            <label class="field">Osnova<select data-vol="basis"><option value="votes" ${v.basis !== 'seats' ? 'selected' : ''}>Glasovi (izborna volatilnost)</option><option value="seats" ${v.basis === 'seats' ? 'selected' : ''}>Mandati (parlamentarna volatilnost)</option></select></label>
          </div>
          ${A === B ? '<div class="warn">Izaberi dvoje različitih izbora.</div>' : `
          <div class="metrics">
            <div class="metric"><div class="k">Ukupna volatilnost (Pedersen)</div><div class="v" data-out="tv"></div><div class="h">u procentnim poenima</div></div>
            <div class="metric alt"><div class="k">Tip A (nove i ugašene stranke)</div><div class="v" data-out="ta"></div></div>
            <div class="metric alt"><div class="k">Tip B (stabilne stranke)</div><div class="v" data-out="tb"></div></div>
          </div>
          <div data-out-html="volwarn"></div>
          <h2>Promjene po strankama</h2>
          <div class="table-wrap"><table class="grid"><thead><tr><th class="l">Na t₁</th><th class="l">Na t₂</th><th>% t₁</th><th>% t₂</th><th>Promjena</th><th>Tip</th></tr></thead><tbody data-out-html="volrows"></tbody></table></div>
          <h2 class="no-print">Povezivanje lista</h2>
          <div class="row no-print" style="margin-bottom:8px"><button class="btn small" data-act="auto-links">Poveži liste istog imena</button><button class="btn small ghost" data-act="clear-links">Ukloni sve veze</button>
            <span class="muted" style="font-size:12px">Klikni na ime liste sa t₁ da je povežeš ili odvežeš.</span></div>
          <div class="links no-print">${linkRows}</div>`}
          <h2>Objašnjenje</h2>${explain}
          <div class="cite">${CITES.vol}</div>`;
      },
      paint() {
        const r = calcVol(); if (!r) return {};
        const name = (a) => (a.length ? a.map(esc).join(' + ') : '<span class="muted">—</span>');
        const tag = { stabilna: '<span class="tag">stabilna</span>', nova: '<span class="tag new">nova</span>', 'izašla': '<span class="tag out">ugašena</span>' };
        return {
          tv: fmt(r.total), ta: fmt(r.typeA), tb: fmt(r.typeB),
          volwarn: r.links.length ? '' : '<div class="warn">Nijedna lista nije povezana sa prethodnicom, pa se sve liste računaju kao nove (volatilnost 100). Poveži liste u dijelu „Povezivanje lista“ ispod.</div>',
          volrows: r.rows.map((x) => `<tr><td class="l clip" title="${esc(x.from.join(' + '))}">${name(x.from)}</td><td class="l clip" title="${esc(x.to.join(' + '))}">${name(x.to)}</td><td>${fmt(x.pa)}</td><td>${fmt(x.pb)}</td><td class="${x.change > 0 ? 'pos' : x.change < 0 ? 'neg' : ''}">${x.change > 0 ? '+' : ''}${fmt(x.change)}</td><td>${tag[x.kind]}</td></tr>`).join(''),
        };
      },
      table() {
        const r = calcVol(); if (!r) return null;
        return {
          header: ['Na t1', 'Na t2', '% t1', '% t2', 'Promjena', 'Tip'],
          rows: r.rows.map((x) => [x.from.join(' + '), x.to.join(' + '), x.pa, x.pb, x.change, x.kind === 'izašla' ? 'ugašena' : x.kind]),
          summary: [['Prvi izbori', r.A.name], ['Drugi izbori', r.B.name], ['Osnova', S.state.vol.basis === 'seats' ? 'mandati' : 'glasovi'], ['Ukupna volatilnost (TV)', r.total], ['Tip A', r.typeA], ['Tip B', r.typeB]],
        };
      },
    },
  };

  function autoLinks(A, B) {
    const norm = (s) => String(s).trim().toLowerCase();
    const out = [];
    B.lists.forEach((lb) => A.lists.forEach((la) => { if (norm(la.name) && norm(la.name) === norm(lb.name)) out.push([la.id, lb.id]); }));
    return out;
  }

  function render() {
    renderNav();
    const mod = MODULES[S.state.module];
    const e = S.current();
    if (S.state.module !== 'vol' && !e) {
      main.innerHTML = `<div class="card empty">Nema izbora. <br><br><button class="btn primary" data-act="new-election">+ Novi izbori</button></div>`;
      return;
    }
    main.innerHTML = mod.render(e);
    paint();
  }
  function paint() {
    const mod = MODULES[S.state.module];
    const o = mod.paint(S.current()) || {};
    main.querySelectorAll('[data-out]').forEach((el) => { const k = el.dataset.out; if (k in o) el.textContent = o[k]; });
    main.querySelectorAll('[data-out-html]').forEach((el) => { const k = el.dataset.outHtml; if (k in o) el.innerHTML = o[k]; });
  }

  // ---------- događaji ----------
  let saveTimer;
  const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => S.save(), 300); };

  main.addEventListener('input', (ev) => {
    const t = ev.target, e = S.current();
    if (t.dataset.bind && e) {
      e[t.dataset.bind] = t.value;
      if (t.dataset.bind === 'name') renderNav();
    } else if (t.dataset.f && e) {
      const l = e.lists.find((x) => x.id === t.closest('tr').dataset.id);
      if (l) l[t.dataset.f] = t.dataset.f === 'name' ? t.value : t.value.trim();
    } else if ((t.dataset.uf || t.dataset.uv) && e) {
      const u = e.units.find((x) => x.id === t.closest('tr').dataset.uid);
      if (u) { if (t.dataset.uf) u[t.dataset.uf] = t.value; else u.votes[t.dataset.uv] = t.value.trim(); }
    } else return;
    saveSoon(); paint();
  });
  main.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset.vol) { S.state.vol[t.dataset.vol] = t.value; S.save(); render(); }
    else if (t.tagName === 'SELECT' && t.dataset.bind) { S.save(); paint(); }
  });

  document.addEventListener('click', async (ev) => {
    const nav = ev.target.closest('[data-mod]');
    if (nav) { S.state.module = nav.dataset.mod; S.save(); render(); return; }
    const el = ev.target.closest('[data-el]');
    if (el) { S.state.current = el.dataset.el; S.save(); render(); return; }
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    const e = S.current();
    const act = b.dataset.act;
    switch (act) {
      case 'new-election': return newElection();
      case 'dup': S.duplicate(e); render(); toast('Napravljena kopija izbora'); break;
      case 'del-election':
        if (await confirmBox('Obriši izbore', `Da li sigurno želiš da obrišeš „${esc(e.name)}“? Ovo se ne može poništiti (osim iz rezervne kopije).`, 'Obriši', true)) { S.remove(e.id); render(); }
        break;
      case 'add-list': e.lists.push(S.newList('Lista ' + (e.lists.length + 1))); S.save(); render();
        main.querySelector(`tr[data-id="${e.lists[e.lists.length - 1].id}"] input.name`)?.select(); break;
      case 'del-list': {
        const id = b.closest('tr').dataset.id; const l = e.lists.find((x) => x.id === id);
        if (await confirmBox('Ukloni listu', `Ukloniti „${esc(l.name)}“ iz ovih izbora (zajedno sa njenim glasovima po jedinicama)?`, 'Ukloni', true)) {
          e.lists = e.lists.filter((x) => x.id !== id); e.units.forEach((u) => delete u.votes[id]);
          Object.keys(S.state.links).forEach((k) => { S.state.links[k] = S.state.links[k].filter(([a, c]) => a !== id && c !== id); });
          S.save(); render();
        }
        break;
      }
      case 'apply-alloc': {
        const r = calcAlloc(e); e.lists.forEach((l, i) => { l.seats = r.seats[i]; }); S.save(); render(); toast('Mandati upisani'); break;
      }
      case 'add-unit': e.units.push(S.newUnit('Jedinica ' + (e.units.length + 1))); S.save(); render();
        main.querySelector(`tr[data-uid="${e.units[e.units.length - 1].id}"] input.name`)?.select(); break;
      case 'del-unit': { const id = b.closest('tr').dataset.uid; e.units = e.units.filter((u) => u.id !== id); S.save(); render(); break; }
      case 'clear-units':
        if (await confirmBox('Obriši jedinice', 'Obrisati sve teritorijalne jedinice za ove izbore?', 'Obriši', true)) { e.units = []; S.save(); render(); }
        break;
      case 'paste-lists': return pasteDialog('lists');
      case 'paste-units': return pasteDialog('units');
      case 'import-lists': return importFile('lists');
      case 'import-units': return importFile('units');
      case 'toggle-link': {
        const key = S.linkKey(S.state.vol.a, S.state.vol.b); const L = S.state.links[key] || (S.state.links[key] = []);
        const i = L.findIndex(([x, y]) => x === b.dataset.a && y === b.dataset.b);
        if (i >= 0) L.splice(i, 1); else L.push([b.dataset.a, b.dataset.b]);
        S.save(); render(); break;
      }
      case 'auto-links': { const A = S.byId(S.state.vol.a), B = S.byId(S.state.vol.b); S.state.links[S.linkKey(A.id, B.id)] = autoLinks(A, B); S.save(); render(); break; }
      case 'clear-links': S.state.links[S.linkKey(S.state.vol.a, S.state.vol.b)] = []; S.save(); render(); break;
    }
  });

  async function newElection() {
    const name = await promptBox('Naziv novih izbora', 'Crna Gora 2016 — parlamentarni izbori');
    if (!name) return;
    S.newElection(name);
    S.state.module = 'results'; S.save(); render();
    toast('Dodaj liste i unesi glasove i mandate');
  }
  $('#new-election').addEventListener('click', newElection);

  // ---------- uvoz ----------
  function parseDelimited(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
    if (!lines.length) return [];
    const first = lines[0];
    const sep = first.includes('\t') ? '\t' : (first.split(';').length >= first.split(',').length ? ';' : ',');
    return lines.map((l) => l.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, '$1')));
  }
  async function readWorkbookRows(file) {
    if (/\.csv$|\.txt$|\.tsv$/i.test(file.name)) return parseDelimited(await file.text());
    if (/\.xls$/i.test(file.name)) throw new Error('Stari .xls format nije podržan. U Excelu sačuvaj kao .xlsx ili kopiraj ćelije i koristi „Zalijepi iz Excela“.');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];
    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const vals = [];
      for (let c = 1; c <= row.cellCount; c++) {
        let v = row.getCell(c).value;
        if (v && typeof v === 'object') v = v.result ?? v.text ?? (v.richText ? v.richText.map((t) => t.text).join('') : '');
        vals.push(v ?? '');
      }
      rows.push(vals);
    });
    return rows;
  }
  const isNumeric = (v) => typeof v === 'number' || (/^[\d\s.,]+$/.test(String(v).trim()) && String(v).trim() !== '');
  const isTotalRow = (name) => /^(ukupno|total|whole country|zbir|svega)$/i.test(String(name).trim());

  function applyRows(kind, rows) {
    const e = S.current();
    rows = rows.filter((r) => r.some((c) => String(c).trim() !== ''));
    if (!rows.length) throw new Error('Nema podataka.');
    if (kind === 'lists') {
      const hasHeader = !isNumeric(rows[0][1] ?? '');
      const data = (hasHeader ? rows.slice(1) : rows).filter((r) => String(r[0]).trim() && !isTotalRow(r[0]));
      e.lists = data.map((r) => ({ ...S.newList(String(r[0]).trim()), votes: parseNum(r[1]), seats: parseNum(r[2]) }));
      e.units.forEach((u) => (u.votes = {}));
      return `Uvezeno lista: ${e.lists.length}`;
    }
    const hasHeader = !isNumeric(rows[0][2] ?? rows[0][1] ?? '');
    let cols;
    let created = 0;
    if (hasHeader) {
      cols = rows[0].slice(2).map((h) => {
        const name = String(h).trim(); if (!name) return null;
        let l = e.lists.find((x) => x.name.trim().toLowerCase() === name.toLowerCase());
        if (!l) { l = S.newList(name); e.lists.push(l); created++; }
        return l.id;
      });
    } else {
      cols = e.lists.map((l) => l.id);
    }
    const data = (hasHeader ? rows.slice(1) : rows).filter((r) => String(r[0]).trim() && !isTotalRow(r[0]));
    e.units = data.map((r) => {
      const u = S.newUnit(String(r[0]).trim()); u.valid = parseNum(r[1]);
      cols.forEach((id, j) => { if (id) u.votes[id] = parseNum(r[j + 2]); });
      return u;
    });
    return `Uvezeno jedinica: ${e.units.length}` + (created ? `, novih lista: ${created} (unesi im državne rezultate u modulu „Rezultati“)` : '');
  }

  const FORMAT_HELP = {
    lists: 'Kolone: <b>naziv liste</b>, <b>glasovi</b>, <b>mandati</b>. Prvi red smije biti zaglavlje. Postojeće liste ovih izbora biće zamijenjene.',
    units: 'Kolone: <b>naziv jedinice</b>, <b>važeći glasovi</b>, pa po jedna kolona za svaku listu. U prvom redu napiši imena lista (iste kao u modulu „Rezultati“); nepoznata imena dodaju se kao nove liste. Bez zaglavlja kolone se redom dodjeljuju postojećim listama. Red „Ukupno“ se preskače.',
  };
  async function importFile(kind) {
    const f = await pickFile('.xlsx,.csv,.tsv,.txt,.xls');
    if (!f) return;
    try {
      const rows = await readWorkbookRows(f);
      if (!(await confirmBox('Uvoz iz fajla', `${FORMAT_HELP[kind]}<br><br>Fajl: <b>${esc(f.name)}</b>, redova: ${rows.length}. Nastaviti?`, 'Uvezi'))) return;
      const msg = applyRows(kind, rows); S.save(); render(); toast(msg, 4000);
    } catch (err) { toast(err.message || String(err), 5000); }
  }
  function pasteDialog(kind) {
    modal(`<h3>Zalijepi iz Excela</h3><p class="muted">${FORMAT_HELP[kind]} U Excelu označi ćelije, kopiraj (Ctrl+C) i zalijepi ovdje (Ctrl+V).</p>
      <textarea id="paste-ta" placeholder="Opština\tVažeći glasovi\tLista 1\tLista 2"></textarea>
      <div class="actions"><button class="btn" data-close="">Otkaži</button><button class="btn primary" id="paste-ok">Uvezi</button></div>`,
    (m, close) => {
      m.querySelector('#paste-ta').focus();
      m.querySelector('#paste-ok').addEventListener('click', () => {
        try { const msg = applyRows(kind, parseDelimited(m.querySelector('#paste-ta').value)); S.save(); close(); render(); toast(msg, 4000); }
        catch (err) { toast(err.message || String(err), 5000); }
      });
    });
  }

  // ---------- izvoz ----------
  const fileBase = () => {
    const e = S.state.module === 'vol' ? null : S.current();
    const n = (e ? e.name : 'volatilnost').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/Đ/g, 'Dj').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_');
    return n.slice(0, 60) + '_' + new Date().toISOString().slice(0, 10);
  };
  function csvCell(v) {
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(6).replace('.', ',');
    const s = String(v ?? '');
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  async function exportCsv() {
    const mod = MODULES[S.state.module]; const t = mod.table(S.current());
    if (!t) return toast('Nema podataka za izvoz');
    const lines = [t.header, ...t.rows, [], ...t.summary, [], ['Izvor', CITE_TEXT(S.state.module)]].map((r) => r.map(csvCell).join(';'));
    const bytes = new TextEncoder().encode('﻿' + lines.join('\r\n'));
    const p = await P.saveFile(`${fileBase()}_${S.state.module}.csv`, bytes);
    if (p) toast('Sačuvano: ' + p);
  }
  async function buildWorkbook() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Izborni indeksi'; wb.created = new Date();
    const blue = 'FF' + (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6) || '0067C0');
    const addSheet = (name, t, title) => {
      if (!t) return;
      const ws = wb.addWorksheet(name);
      ws.addRow([title]).font = { bold: true, size: 13, color: { argb: blue } };
      ws.addRow([]);
      const h = ws.addRow(t.header);
      h.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } }; });
      t.rows.forEach((r) => ws.addRow(r));
      ws.addRow([]);
      t.summary.forEach((r) => { const x = ws.addRow(r); x.getCell(1).font = { bold: true }; });
      ws.columns.forEach((col, i) => { col.width = i === 0 ? 34 : 16; col.numFmt = '#,##0.00##'; });
      if (t.units) {
        const wu = wb.addWorksheet(name + ' - jedinice');
        const hh = wu.addRow(t.units.header);
        hh.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } }; });
        t.units.rows.forEach((r) => wu.addRow(r));
        wu.columns.forEach((col, i) => { col.width = i === 0 ? 24 : 12; });
      }
    };
    const e = S.current();
    if (e) {
      addSheet('Rezultati', MODULES.results.table(e), e.name + ' — rezultati i indeksi');
      addSheet('Raspodjela', MODULES.alloc.table(e), e.name + ' — raspodjela mandata');
      if (e.units.length >= 2) addSheet('Nacionalizacija', MODULES.nat.table(e), e.name + ' — nacionalizacija stranaka (Bochsler 2010)');
    }
    const vt = S.state.elections.length >= 2 ? MODULES.vol.table() : null;
    if (vt) addSheet('Volatilnost', vt, 'Volatilnost');
    const src = wb.addWorksheet('Izvori');
    src.addRow(['Izvori formula']).font = { bold: true, size: 13, color: { argb: blue } };
    ['results', 'nat', 'vol'].forEach((k) => src.addRow([CITE_TEXT(k)]));
    src.getColumn(1).width = 140;
    src.getColumn(1).alignment = { wrapText: true, vertical: 'top' };
    return new Uint8Array(await wb.xlsx.writeBuffer());
  }
  async function exportXlsx() {
    try { const p = await P.saveFile(fileBase() + '.xlsx', await buildWorkbook()); if (p) toast('Sačuvano: ' + p); }
    catch (err) { toast('Izvoz nije uspio: ' + (err.message || err), 5000); }
  }
  async function exportDrive() {
    try {
      let st = await P.driveStatus();
      if (st.desktopOnly) return toast('Google Drive radi samo u desktop aplikaciji.', 4000);
      if (!st.configured || !st.connected) { await driveDialog(); st = await P.driveStatus(); if (!st.connected) return; }
      toast('Šaljem na Google Drive…', 10000);
      const res = await P.driveUpload(fileBase() + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', await buildWorkbook());
      const open = await modal(`<h3>Poslato na Google Drive</h3><p>Fajl je u folderu <b>Izborni indeksi</b> na tvom Google Drive-u.</p>
        <div class="actions"><button class="btn" data-close="">Zatvori</button>${res.link ? '<button class="btn primary" data-close="open">Otvori na Drive-u</button>' : ''}</div>`);
      $('#toast').classList.remove('show');
      if (open === 'open' && res.link) P.openUrl(res.link);
    } catch (err) { toast('Slanje nije uspjelo: ' + (err.message || err), 6000); }
  }
  $('#exp-csv').addEventListener('click', exportCsv);
  $('#exp-xlsx').addEventListener('click', exportXlsx);
  $('#exp-pdf').addEventListener('click', () => window.print());
  $('#exp-drive').addEventListener('click', exportDrive);

  // ---------- Google Drive ----------
  async function driveDialog() {
    const st = await P.driveStatus();
    if (st.desktopOnly) return toast('Google Drive radi samo u desktop aplikaciji.', 4000);
    if (!st.configured) {
      await modal(`<h3>Podešavanje Google Drive-a</h3>
        <p>Aplikacija radi potpuno offline. Internet i Google nalog koriste se samo kad pošalješ fajl na Drive. Jednom je potrebno da učitaš „OAuth client“ fajl iz Google Cloud konzole:</p>
        <ol><li>Na <b>console.cloud.google.com</b> napravi projekat i uključi <b>Google Drive API</b>.</li>
        <li><b>APIs &amp; Services → OAuth consent screen</b>: tip „External“, dodaj sebe (i kolege) kao test korisnike.</li>
        <li><b>Credentials → Create credentials → OAuth client ID → Desktop app</b>, pa preuzmi JSON.</li>
        <li>Učitaj taj JSON ovdje.</li></ol>
        <div class="actions"><button class="btn" data-close="">Otkaži</button><button class="btn primary" id="cfg-load">Učitaj JSON…</button></div>`,
      (m, close) => {
        m.querySelector('#cfg-load').addEventListener('click', async () => {
          const f = await pickFile('.json'); if (!f) return;
          try { await P.driveSetClient(await f.text()); close('ok'); toast('Google klijent podešen'); }
          catch (err) { toast(String(err.message || err), 5000); }
        });
      });
      if (!(await P.driveStatus()).configured) return;
    }
    const s2 = await P.driveStatus();
    if (s2.connected) {
      const v = await modal(`<h3>Google Drive</h3><p>Povezano. Aplikacija ima pristup samo fajlovima koje je sama napravila (dozvola <code>drive.file</code>).</p>
        <div class="actions"><button class="btn danger" data-close="disc">Prekini vezu</button><button class="btn primary" data-close="">Zatvori</button></div>`);
      if (v === 'disc') { await P.driveDisconnect(); toast('Veza prekinuta'); }
    } else {
      const v = await modal(`<h3>Poveži Google nalog</h3><p>Otvoriće se pregledač sa Google prijavom. Nakon prijave vrati se u aplikaciju. Traži se samo pristup fajlovima koje ova aplikacija napravi.</p>
        <div class="actions"><button class="btn" data-close="">Otkaži</button><button class="btn primary" data-close="go">Poveži</button></div>`);
      if (v === 'go') {
        toast('Čekam prijavu u pregledaču…', 120000);
        try { await P.driveConnect(); toast('Google Drive povezan'); }
        catch (err) { toast('Povezivanje nije uspjelo: ' + (err.message || err), 6000); }
      }
    }
  }
  $('#drive-btn').addEventListener('click', driveDialog);

  // ---------- rezervna kopija ----------
  $('#backup-btn').addEventListener('click', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(S.state, null, 1));
    const p = await P.saveFile('izborni_indeksi_kopija_' + new Date().toISOString().slice(0, 10) + '.json', bytes);
    if (p) toast('Kopija sačuvana');
  });
  $('#restore-btn').addEventListener('click', async () => {
    const f = await pickFile('.json'); if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!Array.isArray(s.elections)) throw new Error('Fajl nije kopija ove aplikacije.');
      if (!(await confirmBox('Vrati iz kopije', `Zamijeniti sve trenutne podatke sa kopijom (${s.elections.length} izbora)?`, 'Zamijeni', true))) return;
      s.links = s.links || {}; s.vol = s.vol || { a: null, b: null, basis: 'votes' }; s.module = s.module || 'results';
      S.replaceAll(s); render(); toast('Podaci vraćeni');
    } catch (err) { toast(err.message || String(err), 5000); }
  });

  render();
})();
