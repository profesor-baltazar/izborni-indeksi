// Izborni indeksi - korisnički interfejs
(function () {
  const I = window.Indices, S = window.Store, P = window.Platform, L = window.I18N;
  const t = L.t;
  const $ = (s, r = document) => r.querySelector(s);
  const main = $('#main');

  // ---------- pomoćne ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function parseNum(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    let s = String(v ?? '').trim().replace(/\s| /g, '');
    if (!s) return 0;
    if (L.lang === 'en') {
      if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
      else s = s.replace(',', '.');
    } else if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  const fmt = (x, d = 2) => (Number.isFinite(x) ? x.toLocaleString(L.locale(), { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');
  const fmtInt = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString(L.locale()) : '–');
  function toast(msg, ms = 2600) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(el._h); el._h = setTimeout(() => el.classList.remove('show'), ms);
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
  const confirmBox = (title, text, okLabel = t('Potvrdi'), danger = false) => modal(
    `<h3>${esc(title)}</h3><p>${text}</p><div class="actions"><button class="btn" data-close="">${t('Otkaži')}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-close="ok">${esc(okLabel)}</button></div>`
  ).then((v) => v === 'ok');
  const promptBox = (title, value = '', placeholder = '') => modal(
    `<h3>${esc(title)}</h3><input id="pb-in" class="title-input" style="width:100%;border-color:var(--border)" value="${esc(value)}" placeholder="${esc(placeholder)}"><div class="actions"><button class="btn" data-close="">${t('Otkaži')}</button><button class="btn primary" id="pb-ok">${t('U redu')}</button></div>`,
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

  // ---------- izvori formula ----------
  const CITES = {
    me: {
      results: `<b>Izvori formula.</b> Indeks najmanjih kvadrata (LSq): Gallagher, M. (1991). Proportionality, disproportionality and electoral systems. <i>Electoral Studies</i> 10(1): 33–51.
        Efektivni broj stranaka (ENEP, ENPP): Laakso, M. i Taagepera, R. (1979). “Effective” number of parties: a measure with application to West Europe. <i>Comparative Political Studies</i> 12(1): 3–27.
        Loosemore–Hanby indeks: Loosemore, J. i Hanby, V. J. (1971). The theoretical limits of maximum distortion: some analytic expressions for electoral systems. <i>British Journal of Political Science</i> 1(4): 467–477.
        Sainte-Laguë indeks: Sainte-Laguë, A. (1910). La représentation proportionnelle et la méthode des moindres carrés. <i>Annales scientifiques de l'École Normale Supérieure</i> 27: 529–542.
        Frakcionalizacija (F): Rae, D. W. (1967). <i>The Political Consequences of Electoral Laws</i>. New Haven: Yale University Press.
        Golosovljev efektivni broj stranaka: Golosov, G. V. (2010). The effective number of parties: a new approach. <i>Party Politics</i> 16(2): 171–192.
        Odnos prednosti (advantage ratio, udio mandata / udio glasova): Taagepera, R. i Shugart, M. S. (1989). <i>Seats and Votes</i>. New Haven: Yale University Press.`,
      alloc: `<b>Metode.</b> D'Hondt (djelioci 1, 2, 3…), Sainte-Laguë (djelioci 1, 3, 5…) i Hare–Niemeyer (prosta kvota i najveći ostatak).
        <b>Cenzus po listi</b> (čl. 94 Zakona o izboru odbornika i poslanika, od izmjena iz 2011): <i>Manjinski 0,7%</i> – manjinske liste koje ne pređu opšti cenzus, a imaju najmanje 0,7% glasova, učestvuju u raspodjeli kao jedna zbirna lista, sa najviše tri mandata, koji se zatim dijele među njima istom metodom;
        <i>Hrvatski 0,35%</i> – ako nijedna lista hrvatskog naroda ne ispuni te uslove, najuspješnija sa najmanje 0,35% glasova dobija jedan mandat.
        <b>Posebna izborna jedinica</b> postoji samo za izbore 2006. i 2009. (čl. 94a tada važećeg zakona, ukinut izmjenama iz 2011): pet mandata bira se na posebno određenim biračkim mjestima; cenzus je 3% u opštoj, odnosno u posebnoj jedinici; lista koja u jednoj jedinici ne učestvuje ili ne osvoji mandat, tim glasovima dodaje glasove iz druge.`,
      nat: `<b>Autor formule.</b> Ponderisani indeks nacionalizacije stranaka (PNSw) i standardizovani indeks nacionalizacije (sPNS) razvio je <b>Daniel Bochsler</b> (Univerzitet u Cirihu):
        Bochsler, D. (2010). Measuring party nationalisation: A new Gini-based indicator that corrects for the number of units. <i>Electoral Studies</i> 29(1): 155–168.
        Indeks se oslanja na Gini-zasnovan indeks nacionalizacije: Jones, M. P. i Mainwaring, S. (2003). The nationalization of parties and party systems. <i>Party Politics</i> 9(2): 139–166.
        Ova aplikacija je nezavisna implementacija Bochslerove formule; na podacima za Crnu Goru 2020. i 2023. daje iste vrijednosti kao njegov originalni Excel alat.`,
      vol: `<b>Izvori formula.</b> Ukupna volatilnost: Pedersen, M. N. (1979). The dynamics of European party systems: changing patterns of electoral volatility. <i>European Journal of Political Research</i> 7(1): 1–26.
        Podjela na tip A i tip B: Powell, E. N. i Tucker, J. A. (2014). Revisiting electoral volatility in post-communist countries: new data, new results and new approaches. <i>British Journal of Political Science</i> 44(1): 123–147.`,
      trend: `<b>Pregled.</b> Isti indeksi kao u modulima „Rezultati i indeksi“ (LSq, Loosemore–Hanby, Sainte-Laguë, ENEP, ENPP, Golosov, Rae F), „Nacionalizacija stranaka“ (sPNS i PNSw sistema, samo za izbore sa bar dvije teritorijalne jedinice) i „Volatilnost“ (Pedersen; tip A i B po Powellu i Tuckeru).
        Volatilnost se računa prema prethodnim izborima u listi izbora, na osnovu glasova i veza između lista sačuvanih u modulu „Volatilnost“. Izvori formula navedeni su u tim modulima.`,
      explain: `<b>Kako se računa.</b> Volatilnost pokazuje koliki se dio biračkog tijela „preselio“ između stranaka od jednih do drugih izbora.
        Za svaku stranku uzmeš udio glasova u procentima na prvim i na drugim izborima, izračunaš razliku, sabereš apsolutne vrijednosti svih razlika i podijeliš sa 2:
        <code>TV = ½ · Σ |pᵢ,₂ − pᵢ,₁|</code>. Dijeli se sa 2 jer se svaki procenat koji jedna stranka izgubi pojavljuje kao dobitak neke druge.
        0 znači identične rezultate, a 100 da su glasove dobile potpuno nove stranke.
        <br><b>Primjer:</b> A 40% → 30%, B 35% → 45%, C 25% → 25%: (10 + 10 + 0) / 2 = <b>10</b>.
        <br><b>Tip A</b> je dio volatilnosti nastao ulaskom novih i izlaskom starih stranaka, a <b>tip B</b> pomjeranje glasova među strankama koje su učestvovale na oba izbora. TV = A + B.
        <br><b>Koalicije i podjele:</b> ispod poveži svaku listu sa drugih izbora sa njenim prethodnikom (ili sa više njih, ako je koalicija). Povezane liste se tretiraju kao jedna cjelina i udjeli im se sabiraju.`,
    },
    en: {
      results: `<b>Formula sources.</b> Least squares index (LSq): Gallagher, M. (1991). Proportionality, disproportionality and electoral systems. <i>Electoral Studies</i> 10(1): 33–51.
        Effective number of parties (ENEP, ENPP): Laakso, M. and Taagepera, R. (1979). “Effective” number of parties: a measure with application to West Europe. <i>Comparative Political Studies</i> 12(1): 3–27.
        Loosemore–Hanby index: Loosemore, J. and Hanby, V. J. (1971). The theoretical limits of maximum distortion: some analytic expressions for electoral systems. <i>British Journal of Political Science</i> 1(4): 467–477.
        Sainte-Laguë index: Sainte-Laguë, A. (1910). La représentation proportionnelle et la méthode des moindres carrés. <i>Annales scientifiques de l'École Normale Supérieure</i> 27: 529–542.
        Fractionalisation (F): Rae, D. W. (1967). <i>The Political Consequences of Electoral Laws</i>. New Haven: Yale University Press.
        Golosov's effective number of parties: Golosov, G. V. (2010). The effective number of parties: a new approach. <i>Party Politics</i> 16(2): 171–192.
        Advantage ratio (seat share / vote share): Taagepera, R. and Shugart, M. S. (1989). <i>Seats and Votes</i>. New Haven: Yale University Press.`,
      alloc: `<b>Methods.</b> D'Hondt (divisors 1, 2, 3…), Sainte-Laguë (divisors 1, 3, 5…) and Hare–Niemeyer (simple quota and largest remainder).
        <b>Threshold per list</b> (Art. 94 of the Law on the Election of Councillors and Members of Parliament, as amended in 2011): <i>Minority 0.7%</i> – minority lists that do not pass the general threshold but have at least 0.7% of the votes take part in the allocation as one combined list, with at most three seats, which are then divided among them by the same method;
        <i>Croatian 0.35%</i> – if no list of the Croatian people meets these conditions, the most successful one with at least 0.35% of the votes wins one seat.
        <b>Special electoral unit</b> exists only for the 2006 and 2009 elections (Art. 94a of the law then in force, abolished by the 2011 amendments): five seats are elected at specially designated polling stations; the threshold is 3% in the general and in the special unit; a list that does not take part or does not win a seat in one unit adds those votes to the other.`,
      nat: `<b>Formula author.</b> The weighted party nationalisation score (PNSw) and the standardised party nationalisation score (sPNS) were developed by <b>Daniel Bochsler</b> (University of Zurich):
        Bochsler, D. (2010). Measuring party nationalisation: A new Gini-based indicator that corrects for the number of units. <i>Electoral Studies</i> 29(1): 155–168.
        The index builds on the Gini-based party nationalisation score: Jones, M. P. and Mainwaring, S. (2003). The nationalization of parties and party systems. <i>Party Politics</i> 9(2): 139–166.
        This application is an independent implementation of Bochsler's formula; on the data for Montenegro 2020 and 2023 it gives the same values as his original Excel tool.`,
      vol: `<b>Formula sources.</b> Total volatility: Pedersen, M. N. (1979). The dynamics of European party systems: changing patterns of electoral volatility. <i>European Journal of Political Research</i> 7(1): 1–26.
        Split into type A and type B: Powell, E. N. and Tucker, J. A. (2014). Revisiting electoral volatility in post-communist countries: new data, new results and new approaches. <i>British Journal of Political Science</i> 44(1): 123–147.`,
      trend: `<b>Overview.</b> The same indices as in the modules “Results and indices” (LSq, Loosemore–Hanby, Sainte-Laguë, ENEP, ENPP, Golosov, Rae F), “Party nationalisation” (system sPNS and PNSw, only for elections with at least two territorial units) and “Volatility” (Pedersen; types A and B after Powell and Tucker).
        Volatility is calculated against the previous election in the list of elections, from votes and the links between lists saved in the “Volatility” module. Formula sources are given in those modules.`,
      explain: `<b>How it is calculated.</b> Volatility shows what share of the electorate “moved” between parties from one election to the next.
        For each party, take its vote share in percent at the first and at the second election, compute the difference, add up the absolute values of all differences and divide by 2:
        <code>TV = ½ · Σ |pᵢ,₂ − pᵢ,₁|</code>. It is divided by 2 because every percentage point one party loses appears as a gain for another.
        0 means identical results, and 100 means that all votes went to entirely new parties.
        <br><b>Example:</b> A 40% → 30%, B 35% → 45%, C 25% → 25%: (10 + 10 + 0) / 2 = <b>10</b>.
        <br><b>Type A</b> is the part of volatility caused by new parties entering and old ones withdrawing, and <b>type B</b> is the shift of votes between parties that ran in both elections. TV = A + B.
        <br><b>Coalitions and splits:</b> below, link each list from the second election to its predecessor (or to several, if it is a coalition). Linked lists are treated as one unit and their shares are added up.`,
    },
  };
  const cite = (k) => CITES[L.lang][k];
  const CITE_TEXT = (k) => cite(k).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  // ---------- proračuni po modulu ----------
  function calcResults(e) {
    const V = e.lists.map((l) => parseNum(l.votes)), M = e.lists.map((l) => parseNum(l.seats));
    const tv = I.sum(V), ts = I.sum(M);
    return { V, M, tv, ts, lsq: I.lsq(V, M), lh: I.lh(V, M), sl: I.slIndex(V, M), enep: I.enp(V), enpp: I.enp(M),
      golV: I.golosov(V), golM: I.golosov(M), raeV: I.raeF(V), raeM: I.raeF(M), adv: I.advantage(V, M) };
  }
  // Provjera unosa: zbir glasova prema zvaničnom broju važećih glasova i zbir mandata prema broju mandata
  function validation(e, r) {
    const out = [];
    const off = parseNum(e.validTotal);
    if (off > 0 && r.tv !== off) {
      const d = r.tv - off;
      out.push(t('Zbir glasova lista ({a}) razlikuje se od zvaničnog broja važećih glasova ({b}) za {d}.', { a: fmtInt(r.tv), b: fmtInt(off), d: (d > 0 ? '+' : '') + fmtInt(d) }));
    }
    const seats = parseNum(e.seats);
    if (seats > 0 && r.ts > 0 && r.ts !== seats) out.push(t('Zbir mandata ({a}) nije jednak broju mandata u skupštini ({b}).', { a: fmtInt(r.ts), b: fmtInt(seats) }));
    return out;
  }
  const hasSpecial = (e) => !!(e.special && parseNum(e.special.seats) > 0);
  function calcAlloc(e) {
    const V = e.lists.map((l) => parseNum(l.votes));
    let r;
    if (hasSpecial(e)) {
      r = I.allocateSpecial({ votes: V, seats: parseNum(e.seats), method: e.method, threshold: parseNum(e.threshold),
        special: { seats: parseNum(e.special.seats), votes: e.lists.map((l) => parseNum(e.special.votes?.[l.id])) } });
    } else {
      r = I.allocate({ votes: V, seats: parseNum(e.seats), method: e.method, threshold: parseNum(e.threshold),
        types: e.lists.map((l) => l.type || 'opsti') });
    }
    return { V, tv: I.sum(V), ...r, lsq: I.lsq(V, r.seats) };
  }
  function unitValid(u, e) {
    const v = parseNum(u.valid);
    return v > 0 ? v : e.lists.reduce((s, l) => s + parseNum(u.votes[l.id]), 0);
  }
  function calcNat(e) {
    const units = e.units.map((u) => ({ valid: unitValid(u, e), votes: e.lists.map((l) => parseNum(u.votes[l.id])) }));
    const missingValid = e.units.some((u) => !(parseNum(u.valid) > 0));
    if (units.length < 2) return { units, ok: false, missingValid };
    return { units, ok: true, missingValid, ...I.nationalisation(units, e.lists.length) };
  }
  function volPair(A, B, basis = 'votes') {
    const links = S.state.links[S.linkKey(A.id, B.id)];
    if (!links || !links.length) return null;
    const val = (l) => parseNum(basis === 'seats' ? l.seats : l.votes);
    return I.volatility(A.lists.map((l) => ({ id: l.id, name: l.name, value: val(l) })), B.lists.map((l) => ({ id: l.id, name: l.name, value: val(l) })), links);
  }
  // Pregled kroz vrijeme: jedan red po izborima, redosljedom iz liste izbora
  const TREND_COLS = [
    ['lsq', 'LSq', 2], ['lh', 'LH', 2], ['sl', 'SL', 2], ['enep', 'ENEP', 2], ['enpp', 'ENPP', 2],
    ['golV', 'Golosov (gl.)', 2], ['golM', 'Golosov (m.)', 2], ['raeV', 'Rae F (gl.)', 3], ['raeM', 'Rae F (m.)', 3],
    ['spns', 'sPNS', 3], ['pnsw', 'PNSw', 3], ['tv', 'TV', 2], ['ta', 'A', 2], ['tb', 'B', 2],
  ];
  function calcTrend() {
    const els = S.state.elections;
    return els.map((e, i) => {
      const r = calcResults(e), n = calcNat(e);
      const prev = i > 0 ? els[i - 1] : null;
      const v = prev ? volPair(prev, e) : null;
      return { e, prev, linked: !!v, lsq: r.lsq, lh: r.lh, sl: r.sl, enep: r.enep, enpp: r.enpp, golV: r.golV, golM: r.golM, raeV: r.raeV, raeM: r.raeM,
        spns: n.ok ? n.systemSpns : NaN, pnsw: n.ok ? n.systemPnsw : NaN, tv: v ? v.total : NaN, ta: v ? v.typeA : NaN, tb: v ? v.typeB : NaN };
    });
  }
  const shortName = (e) => (/(\d{4})(?!.*\d{4})/.exec(e.name) || [])[1] || e.name;
  function trendChart(rows, key) {
    const pts = rows.map((r, i) => ({ i, x: shortName(r.e), y: r[key] })).filter((p) => Number.isFinite(p.y));
    if (pts.length < 2) return `<div class="muted" style="padding:12px">${t('Za grafikon su potrebne vrijednosti za bar dvoje izbora.')}</div>`;
    const W = 960, H = 250, padL = 56, padR = 16, padT = 22, padB = 30, inset = 28;
    let lo = Math.min(...pts.map((p) => p.y)), hi = Math.max(...pts.map((p) => p.y));
    if (hi === lo) { hi += 1; lo = Math.max(0, lo - 1); }
    const span = hi - lo; lo = Math.max(0, lo - span * 0.1); hi += span * 0.1;
    const n = rows.length;
    const X = (i) => padL + inset + (n === 1 ? 0 : (i * (W - padL - padR - 2 * inset)) / (n - 1));
    const Y = (y) => padT + (1 - (y - lo) / (hi - lo)) * (H - padT - padB);
    const dec = (TREND_COLS.find((c) => c[0] === key) || [])[2] ?? 2;
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const yv = lo + ((hi - lo) * k) / 4, yy = Y(yv);
      g += `<line x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}" class="ch-grid"/><text x="${padL - 6}" y="${yy + 4}" text-anchor="end" class="ch-ax">${fmt(yv, dec)}</text>`;
    }
    rows.forEach((r, i) => { g += `<text x="${X(i)}" y="${H - 12}" text-anchor="middle" class="ch-ax">${esc(shortName(r.e))}</text>`; });
    const path = pts.map((p, k) => `${k ? 'L' : 'M'}${X(p.i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
    const dots = pts.map((p) => `<circle cx="${X(p.i)}" cy="${Y(p.y)}" r="4" class="ch-dot"><title>${esc(p.x)}: ${fmt(p.y, dec)}</title></circle><text x="${X(p.i)}" y="${Y(p.y) - 9}" text-anchor="middle" class="ch-val">${fmt(p.y, dec)}</text>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}<path d="${path}" class="ch-line"/>${dots}</svg>`;
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
      `<a data-el="${e.id}" class="${e.id === S.state.current ? 'on' : ''}"><span>${esc(e.name)}</span></a>`).join('')
      || `<div class="muted" style="padding:6px 10px;font-size:12px">${t('Još nema izbora')}</div>`;
  }

  const printHead = (e, title) => `<div class="print-head"><b>${esc(title)}</b><br><span class="muted">${esc(e ? e.name : '')} · ${new Date().toLocaleDateString(L.locale())}</span></div>`;

  function electionHead(e, extra = '') {
    return `<div class="head">
      <input class="title-input" data-bind="name" value="${esc(e.name)}" title="${t('Klikni da promijeniš naziv izbora')}">
      ${extra}
      <button class="btn small" data-act="dup">${t('Dupliraj')}</button>
      <button class="btn small danger" data-act="del-election">${t('Obriši izbore')}</button>
    </div>`;
  }

  // Izbor cenzusa po listi
  const THR_TYPES = ['opsti', 'manjina', 'hrvati'];
  function thrLabel(l, e) {
    const k = THR_TYPES.includes(l.type) ? l.type : 'opsti';
    if (k === 'opsti') return t('Opšti ({p}%)', { p: fmt(parseNum(e.threshold), 1) });
    return k === 'manjina' ? t('Manjinski (0,7%)') : t('Hrvatski (0,35%)');
  }
  function thrCell(l, e) {
    const cur = THR_TYPES.includes(l.type) ? l.type : 'opsti';
    const opts = THR_TYPES.map((k) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${thrLabel({ type: k }, e)}</option>`).join('');
    return `<td class="l thr-cell"><select data-f="type" title="${t('Cenzus koji važi za ovu listu')}">${opts}</select></td>`;
  }

  const METHODS = { dhondt: "D'Hondt", 'sainte-lague': 'Sainte-Laguë', hare: 'Hare–Niemeyer' };

  const MODULES = {
    results: {
      render(e) {
        const rows = e.lists.map((l) => `<tr data-id="${l.id}">
          <td class="l"><input class="name" data-f="name" title="${esc(l.name)}" value="${esc(l.name)}" placeholder="${t('Naziv liste ili stranke')}"></td>
          <td><input data-f="votes" value="${esc(l.votes)}" inputmode="decimal"></td>
          <td><input class="sm" data-f="seats" value="${esc(l.seats)}" inputmode="numeric"></td>
          <td data-out="adv-${l.id}"></td>
          ${thrCell(l, e)}
          <td class="no-print"><button class="icon-btn" data-act="del-list" title="${t('Ukloni listu')}">✕</button></td></tr>`).join('');
        return `${printHead(e, t('Rezultati i indeksi'))}${electionHead(e, `
          <button class="btn small" data-act="paste-lists">${t('Zalijepi iz Excela')}</button>
          <button class="btn small" data-act="import-lists">${t('Uvezi XLS/XLSX/CSV')}</button>`)}
          <div class="row" style="margin-bottom:12px">
            <label class="field">${t('Važeći glasovi (zvanično)')}<input data-bind="validTotal" value="${esc(e.validTotal ?? '')}" inputmode="numeric" title="${t('Unesi zvanični broj važećih glasova da bi aplikacija provjerila zbir glasova lista')}"></label>
            <label class="field">${t('Broj mandata')}<input data-bind="seats" value="${esc(e.seats)}" inputmode="numeric"></label>
          </div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">${t('Lista / stranka')}</th><th>${t('Glasovi')}</th><th>${t('Mandati')}</th><th title="${t('Udio mandata podijeljen udjelom glasova (1 = proporcionalno)')}">${t('Odnos prednosti')}</th><th class="l">${t('Cenzus')}</th><th class="no-print"></th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td class="l">${t('Ukupno')}</td><td data-out="tv"></td><td data-out="ts"></td><td></td><td></td><td class="no-print"></td></tr></tfoot>
          </table></div>
          <div class="row no-print" style="margin-top:8px"><button class="btn small" data-act="add-list">${t('+ Dodaj listu')}</button></div>
          <div data-out-html="valwarn"></div>
          <h2>${t('Disproporcionalnost')}</h2>
          <div class="metrics">
            <div class="metric"><div class="k">${t('Gallagher (LSq)')}</div><div class="v" data-out="lsq"></div><div class="h">${t('0 = savršena proporcionalnost')}</div></div>
            <div class="metric"><div class="k">${t('Loosemore–Hanby (D)')}</div><div class="v" data-out="lh"></div><div class="h">${t('½ zbira apsolutnih razlika')}</div></div>
            <div class="metric"><div class="k">${t('Sainte-Laguë indeks')}</div><div class="v" data-out="sl"></div><div class="h">${t('relativna odstupanja')}</div></div>
          </div>
          <h2>${t('Fragmentacija i broj stranaka')}</h2>
          <div class="metrics">
            <div class="metric alt"><div class="k">${t('Efektivni broj izbornih stranaka (ENEP)')}</div><div class="v" data-out="enep"></div><div class="h">${t('na osnovu glasova')}</div></div>
            <div class="metric alt"><div class="k">${t('Efektivni broj parlamentarnih stranaka (ENPP)')}</div><div class="v" data-out="enpp"></div><div class="h">${t('na osnovu mandata')}</div></div>
            <div class="metric alt"><div class="k">${t('Golosov (glasovi / mandati)')}</div><div class="v" data-out="gol"></div><div class="h">${t('efektivni broj stranaka')}</div></div>
            <div class="metric alt"><div class="k">${t('Rae F (glasovi / mandati)')}</div><div class="v" data-out="rae"></div><div class="h">${t('0 = jedna stranka, → 1 = rascjepkano')}</div></div>
          </div>
          <div class="cite">${cite('results')}</div>`;
      },
      paint(e) {
        const r = calcResults(e);
        const o = { tv: fmtInt(r.tv), ts: fmtInt(r.ts), lsq: fmt(r.lsq), lh: fmt(r.lh), sl: fmt(r.sl), enep: fmt(r.enep), enpp: fmt(r.enpp),
          gol: `${fmt(r.golV)} / ${fmt(r.golM)}`, rae: `${fmt(r.raeV, 3)} / ${fmt(r.raeM, 3)}` };
        e.lists.forEach((l, i) => { o['adv-' + l.id] = r.ts > 0 ? fmt(r.adv[i]) : '–'; });
        const w = validation(e, r);
        o.valwarn = w.length ? `<div class="warn">${w.map(esc).join('<br>')}</div>` : '';
        return o;
      },
      table(e) {
        const r = calcResults(e);
        return {
          header: [t('Lista'), t('Glasovi'), t('Mandati'), t('Odnos prednosti'), t('Cenzus')],
          rows: e.lists.map((l, i) => [l.name, r.V[i], r.M[i], Number.isFinite(r.adv[i]) ? r.adv[i] : '', thrLabel(l, e)]),
          summary: [['LSq (Gallagher)', r.lsq], ['Loosemore–Hanby', r.lh], [t('Sainte-Laguë indeks'), r.sl], ['ENEP', r.enep], ['ENPP', r.enpp],
            [t('Golosov (glasovi)'), r.golV], [t('Golosov (mandati)'), r.golM], [t('Rae F (glasovi)'), r.raeV], [t('Rae F (mandati)'), r.raeM],
            [t('Ukupno glasova'), r.tv], [t('Važeći glasovi (zvanično)'), parseNum(e.validTotal) || ''], [t('Ukupno mandata'), r.ts]],
        };
      },
    },

    alloc: {
      render(e) {
        const sp = hasSpecial(e);
        const rows = e.lists.map((l) => `<tr data-id="${l.id}">
          <td class="l clip" title="${esc(l.name)}">${esc(l.name)}</td><td>${fmtInt(parseNum(l.votes))}</td>
          ${sp ? `<td><input data-sp="${l.id}" value="${esc(e.special.votes?.[l.id] ?? '')}" inputmode="numeric"></td>` : thrCell(l, e)}
          <td data-out="al-${l.id}" style="font-weight:600"></td><td>${fmtInt(parseNum(l.seats))}</td><td data-out="df-${l.id}"></td></tr>`).join('');
        return `${printHead(e, t('Raspodjela mandata'))}${electionHead(e)}
          <div class="row" style="margin-bottom:12px">
            <label class="field">${t('Broj mandata')}<input data-bind="seats" value="${esc(e.seats)}" inputmode="numeric"></label>
            <label class="field">${t('Metoda')}<select data-bind="method">
              ${Object.entries(METHODS).map(([k, v]) => `<option value="${k}" ${e.method === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            <label class="field">${t('Opšti cenzus (%)')}<input data-bind="threshold" value="${esc(e.threshold)}" inputmode="decimal"></label>
          </div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">${t('Lista')}</th><th>${t('Glasovi')}</th>${sp ? `<th>${t('Glasovi u posebnoj jedinici')}</th>` : `<th class="l">${t('Cenzus')}</th>`}<th>${t('Dodijeljeno')}</th><th>${t('Stvarno')}</th><th>${t('Razlika')}</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td class="l">${t('Ukupno')}</td><td data-out="tv"></td><td data-out="tsp"></td><td data-out="tal"></td><td data-out="tst"></td><td></td></tr></tfoot>
          </table></div>
          <div data-out-html="allocwarn"></div>
          <div class="metrics"><div class="metric"><div class="k">${t('LSq za ovu raspodjelu')}</div><div class="v" data-out="lsq"></div><div class="h">${t('Gallagherov indeks disproporcionalnosti')}</div></div></div>
          <div class="cite">${cite('alloc')}</div>`;
      },
      paint(e) {
        const r = calcAlloc(e), o = {};
        e.lists.forEach((l, i) => {
          o['al-' + l.id] = r.eligible[i] || r.seats[i] ? String(r.seats[i]) : '—';
          const d = r.seats[i] - parseNum(l.seats);
          o['df-' + l.id] = d === 0 ? '0' : (d > 0 ? '+' : '') + d;
        });
        o.tsp = hasSpecial(e) ? fmtInt(I.sum(e.lists.map((l) => parseNum(e.special.votes?.[l.id])))) : '';
        o.tv = fmtInt(r.tv); o.tal = String(I.sum(r.seats)); o.tst = fmtInt(I.sum(e.lists.map((l) => parseNum(l.seats))));
        o.lsq = fmt(r.lsq);
        o.allocwarn = r.tie ? `<div class="warn">${t('Posljednji mandat je neriješen (isti količnik/ostatak). Zakon obično propisuje kako se takav slučaj rješava; provjeri ručno.')}</div>` : '';
        return o;
      },
      table(e) {
        const r = calcAlloc(e), sp = hasSpecial(e);
        return {
          header: [t('Lista'), t('Glasovi'), sp ? t('Glasovi u posebnoj jedinici') : t('Cenzus'), t('Dodijeljeno'), t('Stvarno'), t('Razlika')],
          rows: e.lists.map((l, i) => [l.name, r.V[i], sp ? parseNum(e.special.votes?.[l.id]) : thrLabel(l, e), r.seats[i], parseNum(l.seats), r.seats[i] - parseNum(l.seats)]),
          summary: [[t('Metoda'), METHODS[e.method]], [t('Broj mandata'), parseNum(e.seats)], [t('Opšti cenzus (%)'), parseNum(e.threshold)], [t('LSq za raspodjelu'), r.lsq]],
        };
      },
    },

    nat: {
      render(e) {
        const head = e.lists.map((l) => `<th class="clip-h" title="${esc(l.name)}">${esc(l.name)}</th>`).join('');
        const rows = e.units.map((u) => `<tr data-uid="${u.id}">
          <td class="l"><input class="name" data-uf="name" value="${esc(u.name)}" placeholder="${t('Opština / jedinica')}"></td>
          <td><input data-uf="valid" value="${esc(u.valid)}"></td>
          ${e.lists.map((l) => `<td><input class="sm" data-uv="${l.id}" value="${esc(u.votes[l.id] ?? '')}"></td>`).join('')}
          <td class="no-print"><button class="icon-btn" data-act="del-unit" title="${t('Ukloni jedinicu')}">✕</button></td></tr>`).join('');
        const res = e.lists.map((l) => `<tr><td class="l clip" title="${esc(l.name)}">${esc(l.name)}</td><td data-out="np-${l.id}"></td><td data-out="nz-${l.id}" style="font-weight:600"></td></tr>`).join('');
        return `${printHead(e, t('Nacionalizacija stranaka'))}${electionHead(e, `
          <button class="btn small" data-act="paste-units">${t('Zalijepi iz Excela')}</button>
          <button class="btn small" data-act="import-units">${t('Uvezi XLS/XLSX/CSV')}</button>`)}
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">${t('Teritorijalna jedinica')}</th><th>${t('Važeći glasovi')}</th>${head}<th class="no-print"></th></tr></thead>
            <tbody>${rows || `<tr><td colspan="${e.lists.length + 3}" class="empty">${t('Dodaj opštine (ili druge jedinice) i unesi glasove svake liste u njima.')}</td></tr>`}</tbody>
          </table></div>
          <div class="row no-print" style="margin-top:8px">
            <button class="btn small" data-act="add-unit">${t('+ Dodaj jedinicu')}</button>
            <button class="btn small ghost" data-act="clear-units">${t('Obriši sve jedinice')}</button>
          </div>
          <div data-out-html="natwarn"></div>
          <div class="metrics">
            <div class="metric"><div class="k">${t('sPNS sistema (standardizovan)')}</div><div class="v" data-out="sys-s"></div><div class="h">${t('ponderisan udjelom glasova')}</div></div>
            <div class="metric"><div class="k">${t('PNSw sistema (ponderisan)')}</div><div class="v" data-out="sys-w"></div><div class="h">${t('0 = koncentrisano, 1 = ravnomjerno')}</div></div>
            <div class="metric alt"><div class="k">${t('Efektivni broj jedinica (E)')}</div><div class="v" data-out="E"></div><div class="h" data-out="ucount"></div></div>
            <div class="metric alt"><div class="k">${t('N2 državni / N2 jedinice')}</div><div class="v" data-out="n2"></div><div class="h">${t('efektivni broj stranaka')}</div></div>
          </div>
          <h2>${t('Po listama')}</h2>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">${t('Lista')}</th><th>PNSw</th><th>sPNS</th></tr></thead>
            <tbody>${res}</tbody></table></div>
          <div class="cite">${cite('nat')}</div>`;
      },
      paint(e) {
        const r = calcNat(e), o = {};
        e.lists.forEach((l, j) => {
          const p = r.ok ? r.parties[j] : null;
          o['np-' + l.id] = p ? fmt(p.pnsw, 3) : '–';
          o['nz-' + l.id] = p ? fmt(p.spns, 3) : '–';
        });
        o['sys-s'] = r.ok ? fmt(r.systemSpns, 3) : '–';
        o['sys-w'] = r.ok ? fmt(r.systemPnsw, 3) : '–';
        o.E = r.ok ? fmt(r.E, 2) : '–';
        o.ucount = r.ok ? t('od {n} jedinica', { n: r.unitCount }) : t('potrebne su bar 2 jedinice');
        o.n2 = r.ok ? `${fmt(r.n2national)} / ${fmt(r.n2district)}` : '–';
        o.natwarn = r.missingValid && e.units.length ? `<div class="warn">${t('Za neke jedinice nisu uneseni važeći glasovi, pa je korišćen zbir unesenih lista. Za tačan PNS unesi sve važeće glasove.')}</div>` : '';
        return o;
      },
      table(e) {
        const r = calcNat(e);
        return {
          header: [t('Lista'), 'PNSw', 'sPNS'],
          rows: e.lists.map((l, j) => { const p = r.ok ? r.parties[j] : {}; return [l.name, p.pnsw ?? '', p.spns ?? '']; }),
          summary: r.ok ? [[t('sPNS sistema (standardizovan)'), r.systemSpns], [t('PNSw sistema (ponderisan)'), r.systemPnsw], [t('Efektivni broj jedinica (E)'), r.E], [t('Broj jedinica'), r.unitCount], [t('N2 državni'), r.n2national], [t('N2 jedinice (ponderisan)'), r.n2district]] : [[t('Napomena'), t('Potrebne su bar 2 teritorijalne jedinice')]],
          units: { header: [t('Jedinica'), t('Važeći glasovi'), ...e.lists.map((l) => l.name)], rows: e.units.map((u) => [u.name, parseNum(u.valid), ...e.lists.map((l) => parseNum(u.votes[l.id]))]) },
        };
      },
    },

    trend: {
      render() {
        const rows = calcTrend();
        if (!rows.length) return `<div class="card empty">${t('Nema izbora.')}</div>`;
        const tr0 = S.state.trend || (S.state.trend = { metric: 'lsq' });
        const name = (k) => t((TREND_COLS.find((c) => c[0] === k) || [k, k])[1]);
        const body = rows.map((r) => `<tr><td class="l clip" title="${esc(r.e.name)}">${esc(r.e.name)}</td>
          ${TREND_COLS.map(([k, , d]) => `<td>${fmt(r[k], d)}</td>`).join('')}
          <td class="no-print l">${r.prev ? `<button class="btn small ghost" data-act="trend-links" data-a="${r.prev.id}" data-b="${r.e.id}">${r.linked ? t('Uredi veze') : t('Poveži liste')}</button>` : ''}</td></tr>`).join('');
        const unlinked = rows.some((r) => r.prev && !r.linked);
        return `${printHead(null, t('Pregled kroz vrijeme'))}<div class="head"><h1>${t('Pregled kroz vrijeme')}</h1></div>
          <div class="row" style="margin-bottom:8px">
            <label class="field">${t('Grafikon')}<select data-trend="metric">${TREND_COLS.map(([k]) => `<option value="${k}" ${k === tr0.metric ? 'selected' : ''}>${esc(name(k))}</option>`).join('')}</select></label>
          </div>
          <div class="card chart-card">${trendChart(rows, tr0.metric)}</div>
          <div class="table-wrap" style="margin-top:14px"><table class="grid trend">
            <thead><tr><th class="l">${t('Izbori')}</th>${TREND_COLS.map(([k]) => `<th>${esc(name(k))}</th>`).join('')}<th class="no-print"></th></tr></thead>
            <tbody>${body}</tbody></table></div>
          ${unlinked ? `<div class="warn">${t('Volatilnost (TV, A, B) se prikazuje samo za uzastopne izbore čije su liste povezane u modulu „Volatilnost“. Za ostale klikni „Poveži liste“.')}</div>` : ''}
          <div class="cite">${cite('trend')}</div>`;
      },
      paint() { return {}; },
      table() {
        const rows = calcTrend();
        if (!rows.length) return null;
        return {
          header: [t('Izbori'), ...TREND_COLS.map((c) => t(c[1]))],
          rows: rows.map((r) => [r.e.name, ...TREND_COLS.map(([k]) => (Number.isFinite(r[k]) ? r[k] : ''))]),
          summary: [[t('Napomena'), t('Volatilnost je računata prema prethodnim izborima u listi, na osnovu glasova i sačuvanih veza između lista.')]],
        };
      },
    },

    vol: {
      render() {
        const els = S.state.elections;
        const v = S.state.vol;
        if (els.length >= 2) {
          if (!S.byId(v.a) || !S.byId(v.b) || v.a === v.b) { v.a = els[els.length - 2].id; v.b = els[els.length - 1].id; }
        }
        const opts = (sel) => els.map((e) => `<option value="${e.id}" ${e.id === sel ? 'selected' : ''}>${esc(e.name)}</option>`).join('');
        const explain = `<div class="explain">${cite('explain')}</div>`;
        if (els.length < 2) {
          return `<div class="head"><h1>${t('Volatilnost')}</h1></div>${explain}
            <div class="card empty" style="margin-top:14px">${t('Za volatilnost su potrebni bar dvoje izbora. Dodaj i druge izbore u modulu „Rezultati i indeksi“.')}<br><br>
            <button class="btn primary" data-act="new-election">${t('+ Novi izbori')}</button></div><div class="cite">${cite('vol')}</div>`;
        }
        const A = S.byId(v.a), B = S.byId(v.b);
        const key = S.linkKey(A.id, B.id);
        if (!S.state.links[key]) { S.state.links[key] = autoLinks(A, B); S.save(); }
        const links = S.state.links[key];
        const linkRows = B.lists.map((lb) => `<div class="link-row"><div><b>${esc(lb.name)}</b><div class="muted" style="font-size:12px">${t('prethodnik(ci):')}</div></div>
          <div class="chips">${A.lists.map((la) => `<span class="chip ${links.some(([x, y]) => x === la.id && y === lb.id) ? 'on' : ''}" data-act="toggle-link" data-a="${la.id}" data-b="${lb.id}" title="${esc(la.name)}">${esc(la.name)}</span>`).join('')}</div></div>`).join('');
        return `${printHead(null, t('Volatilnost'))}<div class="head"><h1>${t('Volatilnost')}</h1></div>
          <div class="row" style="margin-bottom:12px">
            <label class="field">${t('Prvi izbori (t₁)')}<select data-vol="a">${opts(v.a)}</select></label>
            <label class="field">${t('Drugi izbori (t₂)')}<select data-vol="b">${opts(v.b)}</select></label>
            <label class="field">${t('Osnova')}<select data-vol="basis"><option value="votes" ${v.basis !== 'seats' ? 'selected' : ''}>${t('Glasovi (izborna volatilnost)')}</option><option value="seats" ${v.basis === 'seats' ? 'selected' : ''}>${t('Mandati (parlamentarna volatilnost)')}</option></select></label>
          </div>
          ${A === B ? `<div class="warn">${t('Izaberi dvoje različitih izbora.')}</div>` : `
          <div class="metrics">
            <div class="metric"><div class="k">${t('Ukupna volatilnost (Pedersen)')}</div><div class="v" data-out="tv"></div><div class="h">${t('u procentnim poenima')}</div></div>
            <div class="metric alt"><div class="k">${t('Tip A (nove i ugašene stranke)')}</div><div class="v" data-out="ta"></div></div>
            <div class="metric alt"><div class="k">${t('Tip B (stabilne stranke)')}</div><div class="v" data-out="tb"></div></div>
          </div>
          <div data-out-html="volwarn"></div>
          <h2 class="no-print">${t('Povezivanje lista')}</h2>
          <div class="row no-print" style="margin-bottom:8px"><button class="btn small" data-act="auto-links">${t('Poveži liste istog imena')}</button><button class="btn small ghost" data-act="clear-links">${t('Ukloni sve veze')}</button></div>
          <div class="links no-print">${linkRows}</div>`}
          <h2>${t('Objašnjenje')}</h2>${explain}
          <div class="cite">${cite('vol')}</div>`;
      },
      paint() {
        const r = calcVol(); if (!r) return {};
        return {
          tv: fmt(r.total), ta: fmt(r.typeA), tb: fmt(r.typeB),
          volwarn: r.links.length ? '' : `<div class="warn">${t('Nijedna lista nije povezana sa prethodnicom, pa se sve liste računaju kao nove (volatilnost 100). Poveži liste u dijelu „Povezivanje lista“ ispod.')}</div>`,
        };
      },
      table() {
        const r = calcVol(); if (!r) return null;
        return {
          header: [t('Na t1'), t('Na t2')],
          rows: r.rows.map((x) => [x.from.join(' + '), x.to.join(' + ')]),
          summary: [[t('Prvi izbori'), r.A.name], [t('Drugi izbori'), r.B.name], [t('Osnova'), S.state.vol.basis === 'seats' ? t('mandati') : t('glasovi')], [t('Ukupna volatilnost (TV)'), r.total], [t('Tip A'), r.typeA], [t('Tip B'), r.typeB]],
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
    if (!['vol', 'trend'].includes(S.state.module) && !e) {
      main.innerHTML = `<div class="card empty">${t('Nema izbora.')}<br><br><button class="btn primary" data-act="new-election">${t('+ Novi izbori')}</button></div>`;
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
    const el = ev.target, e = S.current();
    if (el.dataset.bind && e) {
      e[el.dataset.bind] = el.value;
      if (el.dataset.bind === 'name') renderNav();
    } else if (el.dataset.f && e) {
      const l = e.lists.find((x) => x.id === el.closest('tr').dataset.id);
      if (l) l[el.dataset.f] = el.dataset.f === 'name' ? el.value : el.value.trim();
    } else if (el.dataset.sp && e && e.special) {
      (e.special.votes = e.special.votes || {})[el.dataset.sp] = el.value.trim();
    } else if ((el.dataset.uf || el.dataset.uv) && e) {
      const u = e.units.find((x) => x.id === el.closest('tr').dataset.uid);
      if (u) { if (el.dataset.uf) u[el.dataset.uf] = el.value; else u.votes[el.dataset.uv] = el.value.trim(); }
    } else return;
    saveSoon(); paint();
  });
  main.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset.vol) { S.state.vol[el.dataset.vol] = el.value; S.save(); render(); }
    else if (el.dataset.trend) { (S.state.trend = S.state.trend || {})[el.dataset.trend] = el.value; S.save(); render(); }
    else if (el.dataset.f === 'type') { S.save(); render(); }
    else if (el.tagName === 'SELECT' && el.dataset.bind) { S.save(); paint(); }
  });

  document.addEventListener('click', async (ev) => {
    const nav = ev.target.closest('[data-mod]');
    if (nav) { S.state.module = nav.dataset.mod; S.save(); render(); return; }
    const elc = ev.target.closest('[data-el]');
    if (elc) { S.state.current = elc.dataset.el; S.save(); render(); return; }
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    const e = S.current();
    switch (b.dataset.act) {
      case 'new-election': return newElection();
      case 'dup': S.duplicate(e, t(' (kopija)')); render(); toast(t('Napravljena kopija izbora')); break;
      case 'del-election':
        if (await confirmBox(t('Obriši izbore'), t('Da li sigurno želiš da obrišeš „{name}“? Ovo se ne može poništiti (osim iz rezervne kopije).', { name: esc(e.name) }), t('Obriši'), true)) { S.remove(e.id); render(); }
        break;
      case 'add-list': e.lists.push(S.newList(`${t('Lista')} ${e.lists.length + 1}`)); S.save(); render();
        main.querySelector(`tr[data-id="${e.lists[e.lists.length - 1].id}"] input.name`)?.select(); break;
      case 'del-list': {
        const id = b.closest('tr').dataset.id; const l = e.lists.find((x) => x.id === id);
        if (await confirmBox(t('Ukloni listu'), t('Ukloniti „{name}“ iz ovih izbora (zajedno sa njenim glasovima po jedinicama)?', { name: esc(l.name) }), t('Ukloni'), true)) {
          e.lists = e.lists.filter((x) => x.id !== id); e.units.forEach((u) => delete u.votes[id]);
          Object.keys(S.state.links).forEach((k) => { S.state.links[k] = S.state.links[k].filter(([a, c]) => a !== id && c !== id); });
          S.save(); render();
        }
        break;
      }
      case 'add-unit': e.units.push(S.newUnit(`${t('Jedinica')} ${e.units.length + 1}`)); S.save(); render();
        main.querySelector(`tr[data-uid="${e.units[e.units.length - 1].id}"] input.name`)?.select(); break;
      case 'del-unit': { const id = b.closest('tr').dataset.uid; e.units = e.units.filter((u) => u.id !== id); S.save(); render(); break; }
      case 'clear-units':
        if (await confirmBox(t('Obriši jedinice'), t('Obrisati sve teritorijalne jedinice za ove izbore?'), t('Obriši'), true)) { e.units = []; S.save(); render(); }
        break;
      case 'paste-lists': return pasteDialog('lists');
      case 'paste-units': return pasteDialog('units');
      case 'import-lists': return importFile('lists');
      case 'import-units': return importFile('units');
      case 'toggle-link': {
        const key = S.linkKey(S.state.vol.a, S.state.vol.b); const Lk = S.state.links[key] || (S.state.links[key] = []);
        const i = Lk.findIndex(([x, y]) => x === b.dataset.a && y === b.dataset.b);
        if (i >= 0) Lk.splice(i, 1); else Lk.push([b.dataset.a, b.dataset.b]);
        S.save(); render(); break;
      }
      case 'auto-links': { const A = S.byId(S.state.vol.a), B = S.byId(S.state.vol.b); S.state.links[S.linkKey(A.id, B.id)] = autoLinks(A, B); S.save(); render(); break; }
      case 'trend-links': S.state.vol.a = b.dataset.a; S.state.vol.b = b.dataset.b; S.state.module = 'vol'; S.save(); render(); break;
      case 'clear-links': S.state.links[S.linkKey(S.state.vol.a, S.state.vol.b)] = []; S.save(); render(); break;
    }
  });

  async function newElection() {
    const name = await promptBox(t('Naziv novih izbora'));
    if (!name) return;
    S.newElection(name, (i) => `${t('Lista')} ${i}`);
    S.state.module = 'results'; S.save(); render();
    toast(t('Dodaj liste i unesi glasove i mandate'));
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
  const num = (v) => (typeof v === 'number' ? v : parseNum(v));
  // Čita prvi list (XLS, XLSX, ODS) ili CSV; prepoznaje Bochslerov šablon za nacionalizaciju
  async function readWorkbook(file) {
    if (/\.(csv|txt|tsv)$/i.test(file.name)) return { rows: parseDelimited(await file.text()) };
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    const tpl = bochslerTemplate(wb);
    if (tpl) return { rows: [], tpl };
    const ws = wb.Sheets[wb.SheetNames[0]];
    return { rows: XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' }) };
  }
  // Bochsler (2010), Excel alat: list "data", red sa "districts" / "Valid votes" / "Party 1"…, zatim "whole country" i jedinice
  function bochslerTemplate(wb) {
    const ws = wb.Sheets.data; if (!ws) return null;
    const a = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
    const h = a.findIndex((r, i) => i < 30 && String(r[2] ?? '').trim().toLowerCase() === 'districts');
    if (h < 0) return null;
    const hdr = a[h], country = a[h + 1] || [];
    const unitRows = a.slice(h + 2).filter((r) => String(r[2] ?? '').trim() && num(r[3]) > 0 && typeof r[2] === 'string');
    let last = -1;
    for (let c = 4; c < hdr.length; c++) {
      if (!String(hdr[c] ?? '').trim()) break;
      if (num(country[c]) > 0 || unitRows.some((r) => num(r[c]) > 0)) last = c;
    }
    if (last < 4) return null;
    const cols = []; for (let c = 4; c <= last; c++) cols.push(c);
    return {
      parties: cols.map((c) => ({ name: String(hdr[c]).trim(), total: num(country[c]) })),
      countryValid: num(country[3]),
      units: unitRows.map((r) => ({ name: String(r[2]).trim(), valid: num(r[3]), votes: cols.map((c) => num(r[c])) })),
    };
  }
  // Povezivanje kolona šablona sa listama: po imenu, inače po redosljedu (ako je broj isti), inače nove liste
  function planTemplate(e, tpl) {
    const norm = (x) => String(x).trim().toLowerCase();
    const byName = tpl.parties.map((p) => e.lists.find((l) => norm(l.name) === norm(p.name)) || null);
    let mode, map;
    if (byName.every(Boolean)) { mode = 'name'; map = byName.map((l) => l.id); }
    else if (tpl.parties.length === e.lists.length) { mode = 'order'; map = e.lists.map((l) => l.id); }
    else { mode = 'new'; map = byName.map((l) => (l ? l.id : null)); }
    const mismatch = map.map((id, j) => {
      const l = id && e.lists.find((x) => x.id === id);
      return l && tpl.parties[j].total > 0 && parseNum(l.votes) !== tpl.parties[j].total ? `${l.name}: ${fmtInt(parseNum(l.votes))} ≠ ${fmtInt(tpl.parties[j].total)}` : null;
    }).filter(Boolean);
    return { mode, map, mismatch };
  }
  async function importTemplate(e, tpl, file) {
    const plan = planTemplate(e, tpl);
    const how = { name: t('kolone su povezane sa listama po nazivu'), order: t('kolone su povezane sa listama redom (Party 1 = prva lista u tabeli, Party 2 = druga…)'), new: t('broj kolona ({a}) se razlikuje od broja lista ({b}), pa će nepovezane kolone biti dodate kao nove liste', { a: tpl.parties.length, b: e.lists.length }) }[plan.mode];
    let text = t('Prepoznat je Bochslerov Excel šablon za nacionalizaciju: <b>{u}</b> jedinica i <b>{p}</b> stranaka; {how}. Postojeće jedinice ovih izbora biće zamijenjene.', { u: tpl.units.length, p: tpl.parties.length, how });
    if (plan.mismatch.length) text += `<div class="warn">${t('Glasovi za cijelu državu iz šablona ne poklapaju se sa glasovima lista:')}<br>${plan.mismatch.slice(0, 8).map(esc).join('<br>')}${plan.mismatch.length > 8 ? '<br>…' : ''}</div>`;
    text += `<br>${t('Fajl: <b>{name}</b>. Nastaviti?', { name: esc(file.name) })}`;
    if (!(await confirmBox(t('Uvoz iz fajla'), text, t('Uvezi')))) return null;
    let created = 0;
    const ids = plan.map.map((id, j) => {
      if (id) return id;
      const l = { ...S.newList(tpl.parties[j].name), votes: tpl.parties[j].total }; e.lists.push(l); created++; return l.id;
    });
    e.units = tpl.units.map((u) => { const x = S.newUnit(u.name); x.valid = u.valid; ids.forEach((id, j) => { x.votes[id] = u.votes[j]; }); return x; });
    if (!(parseNum(e.validTotal) > 0) && tpl.countryValid > 0) e.validTotal = tpl.countryValid;
    return t('Uvezeno jedinica: {n}', { n: e.units.length }) + (created ? t(', novih lista: {n} (unesi im državne rezultate u modulu „Rezultati“)', { n: created }) : '');
  }
  const isNumeric = (v) => typeof v === 'number' || (/^[\d\s.,]+$/.test(String(v).trim()) && String(v).trim() !== '');
  const isTotalRow = (name) => /^(ukupno|total|whole country|zbir|svega)$/i.test(String(name).trim());

  function applyRows(kind, rows) {
    const e = S.current();
    rows = rows.filter((r) => r.some((c) => String(c).trim() !== ''));
    if (!rows.length) throw new Error(t('Nema podataka.'));
    if (kind === 'lists') {
      const hasHeader = !isNumeric(rows[0][1] ?? '');
      const data = (hasHeader ? rows.slice(1) : rows).filter((r) => String(r[0]).trim() && !isTotalRow(r[0]));
      e.lists = data.map((r) => ({ ...S.newList(String(r[0]).trim()), votes: parseNum(r[1]), seats: parseNum(r[2]) }));
      e.units.forEach((u) => (u.votes = {}));
      return t('Uvezeno lista: {n}', { n: e.lists.length });
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
    return t('Uvezeno jedinica: {n}', { n: e.units.length }) + (created ? t(', novih lista: {n} (unesi im državne rezultate u modulu „Rezultati“)', { n: created }) : '');
  }

  const formatHelp = (kind) => (kind === 'lists'
    ? t('Kolone: <b>naziv liste</b>, <b>glasovi</b>, <b>mandati</b>. Prvi red smije biti zaglavlje. Postojeće liste ovih izbora biće zamijenjene.')
    : t('Kolone: <b>naziv jedinice</b>, <b>važeći glasovi</b>, pa po jedna kolona za svaku listu. U prvom redu napiši imena lista (iste kao u modulu „Rezultati“); nepoznata imena dodaju se kao nove liste. Bez zaglavlja kolone se redom dodjeljuju postojećim listama. Red „Ukupno“ se preskače.'));
  async function importFile(kind) {
    const f = await pickFile('.xlsx,.xls,.ods,.csv,.tsv,.txt');
    if (!f) return;
    try {
      const { rows, tpl } = await readWorkbook(f);
      if (tpl) {
        const msg = await importTemplate(S.current(), tpl, f);
        if (msg) { S.save(); if (kind === 'lists') S.state.module = 'nat'; S.save(); render(); toast(msg, 4000); }
        return;
      }
      if (!(await confirmBox(t('Uvoz iz fajla'), `${formatHelp(kind)}<br><br>${t('Fajl: <b>{name}</b>, redova: {n}. Nastaviti?', { name: esc(f.name), n: rows.length })}`, t('Uvezi')))) return;
      const msg = applyRows(kind, rows); S.save(); render(); toast(msg, 4000);
    } catch (err) { toast(err.message || String(err), 5000); }
  }
  function pasteDialog(kind) {
    modal(`<h3>${t('Zalijepi iz Excela')}</h3><p class="muted">${formatHelp(kind)} ${t('U Excelu označi ćelije, kopiraj (Ctrl+C) i zalijepi ovdje (Ctrl+V).')}</p>
      <textarea id="paste-ta" placeholder="${esc(t('Opština\tVažeći glasovi\tLista 1\tLista 2'))}"></textarea>
      <div class="actions"><button class="btn" data-close="">${t('Otkaži')}</button><button class="btn primary" id="paste-ok">${t('Uvezi')}</button></div>`,
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
    const e = ['vol', 'trend'].includes(S.state.module) ? null : S.current();
    const n = (e ? e.name : (S.state.module === 'trend' ? t('kroz_vrijeme') : t('volatilnost'))).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/Đ/g, 'Dj').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_');
    return n.slice(0, 60) + '_' + new Date().toISOString().slice(0, 10);
  };
  function csvCell(v, sep) {
    if (typeof v === 'number') { const s = Number.isInteger(v) ? String(v) : v.toFixed(6); return sep === ';' ? s.replace('.', ',') : s; }
    const s = String(v ?? '');
    return new RegExp(`[${sep}"\\n]`).test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  async function exportCsv() {
    const mod = MODULES[S.state.module]; const tb = mod.table(S.current());
    if (!tb) return toast(t('Nema podataka za izvoz'));
    const sep = L.lang === 'en' ? ',' : ';';
    const lines = [tb.header, ...tb.rows, [], ...tb.summary, [], [t('Izvor'), CITE_TEXT(S.state.module)]].map((r) => r.map((c) => csvCell(c, sep)).join(sep));
    const bytes = new TextEncoder().encode('﻿' + lines.join('\r\n'));
    const p = await P.saveFile(`${fileBase()}_${S.state.module}.csv`, bytes);
    if (p) toast(t('Sačuvano: {p}', { p }));
  }
  async function buildWorkbook() {
    const wb = new ExcelJS.Workbook();
    wb.creator = t('Izborni indeksi'); wb.created = new Date();
    const blue = 'FF' + (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6) || '0067C0');
    const headStyle = (row) => row.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } }; });
    const addSheet = (name, tb, title) => {
      if (!tb) return;
      const ws = wb.addWorksheet(name);
      ws.addRow([title]).font = { bold: true, size: 13, color: { argb: blue } };
      ws.addRow([]);
      headStyle(ws.addRow(tb.header));
      tb.rows.forEach((r) => ws.addRow(r));
      ws.addRow([]);
      tb.summary.forEach((r) => { const x = ws.addRow(r); x.getCell(1).font = { bold: true }; });
      ws.columns.forEach((col, i) => { col.width = i === 0 ? 34 : 16; col.numFmt = '#,##0.00##'; });
      if (tb.units) {
        const wu = wb.addWorksheet(`${name} - ${t('jedinice')}`);
        headStyle(wu.addRow(tb.units.header));
        tb.units.rows.forEach((r) => wu.addRow(r));
        wu.columns.forEach((col, i) => { col.width = i === 0 ? 24 : 12; });
      }
    };
    const e = S.current();
    if (e) {
      addSheet(t('Rezultati'), MODULES.results.table(e), t('{name} — rezultati i indeksi', { name: e.name }));
      addSheet(t('Raspodjela'), MODULES.alloc.table(e), t('{name} — raspodjela mandata', { name: e.name }));
      if (e.units.length >= 2) addSheet(t('Nacionalizacija'), MODULES.nat.table(e), t('{name} — nacionalizacija stranaka (Bochsler 2010)', { name: e.name }));
    }
    const vt = S.state.elections.length >= 2 ? MODULES.vol.table() : null;
    if (vt) addSheet(t('Volatilnost'), vt, t('Volatilnost'));
    const tt = MODULES.trend.table();
    if (tt) addSheet(t('Kroz vrijeme'), tt, t('Pregled kroz vrijeme'));
    const src = wb.addWorksheet(t('Izvori'));
    src.addRow([t('Izvori formula')]).font = { bold: true, size: 13, color: { argb: blue } };
    ['results', 'alloc', 'nat', 'vol', 'trend'].forEach((k) => src.addRow([CITE_TEXT(k)]));
    src.getColumn(1).width = 140;
    src.getColumn(1).alignment = { wrapText: true, vertical: 'top' };
    return new Uint8Array(await wb.xlsx.writeBuffer());
  }
  async function exportXlsx() {
    try { const p = await P.saveFile(fileBase() + '.xlsx', await buildWorkbook()); if (p) toast(t('Sačuvano: {p}', { p })); }
    catch (err) { toast(t('Izvoz nije uspio: {e}', { e: err.message || err }), 5000); }
  }
  $('#exp-csv').addEventListener('click', exportCsv);
  $('#exp-xlsx').addEventListener('click', exportXlsx);
  $('#exp-pdf').addEventListener('click', () => window.print());

  // ---------- rezervna kopija ----------
  $('#backup-btn').addEventListener('click', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(S.state, null, 1));
    const p = await P.saveFile(t('izborni_indeksi_kopija_') + new Date().toISOString().slice(0, 10) + '.json', bytes);
    if (p) toast(t('Kopija sačuvana'));
  });
  $('#restore-btn').addEventListener('click', async () => {
    const f = await pickFile('.json'); if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!Array.isArray(s.elections)) throw new Error(t('Fajl nije kopija ove aplikacije.'));
      if (!(await confirmBox(t('Vrati iz kopije'), t('Zamijeniti sve trenutne podatke sa kopijom ({n} izbora)?', { n: s.elections.length }), t('Zamijeni'), true))) return;
      s.links = s.links || {}; s.vol = s.vol || { a: null, b: null, basis: 'votes' }; s.module = s.module || 'results';
      S.replaceAll(s); render(); toast(t('Podaci vraćeni'));
    } catch (err) { toast(err.message || String(err), 5000); }
  });

  // ---------- jezik ----------
  const langSel = $('#lang-select');
  langSel.value = L.lang;
  langSel.addEventListener('change', () => { L.set(langSel.value); render(); });

  // ---------- verzija ----------
  (async () => {
    try {
      const v = await window.__TAURI__?.app?.getVersion?.();
      if (v) $('#app-version').textContent = 'v' + v;
    } catch (e) { /* van Tauri-ja nema verzije */ }
  })();

  // ---------- ažuriranje ----------
  // Provjera pri pokretanju; bez interneta ili u lokalno izgrađenoj verziji jednostavno ne prikazuje ništa.
  (async () => {
    const invoke = window.__TAURI__?.core?.invoke;
    if (!invoke) return;
    let info = null;
    try { info = await invoke('check_update'); } catch (e) { return; }
    if (!info) return;
    const bar = document.createElement('div');
    bar.className = 'update-bar no-print';
    bar.innerHTML = `<span data-u="msg">${esc(t('Dostupna je nova verzija {v}.', { v: info.version }))}</span>
      <button class="btn small primary" data-u="go">${t('Ažuriraj i ponovo pokreni')}</button>
      <button class="btn small ghost" data-u="later">${t('Kasnije')}</button>`;
    document.body.insertBefore(bar, document.querySelector('.layout'));
    bar.querySelector('[data-u="later"]').addEventListener('click', () => bar.remove());
    bar.querySelector('[data-u="go"]').addEventListener('click', async (ev) => {
      ev.target.disabled = true;
      bar.querySelector('[data-u="msg"]').textContent = t('Preuzimam ažuriranje…');
      try { await invoke('install_update'); }
      catch (err) { ev.target.disabled = false; bar.querySelector('[data-u="msg"]').textContent = String(err); }
    });
  })();

  L.apply();
  render();
})();
