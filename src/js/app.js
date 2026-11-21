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
  // naziv izbora za prikaz: naziv + godina
  const elTitle = (e) => (e ? [e.name, e.year].filter((x) => x !== '' && x !== undefined && x !== null).join(' ') : '');
  // izbori jedne države, hronološki (bez godine na kraju, redom unosa)
  const elsOf = (cid) => S.state.elections.filter((e) => e.country === cid).map((e, i) => [e, i])
    .sort((a, b) => (Number(a[0].year) || 1e9) - (Number(b[0].year) || 1e9) || a[1] - b[1]).map((x) => x[0]);
  // oznaka godine u uporednoj tabeli; dvoje izbora iste godine u istoj državi: 2012a, 2012b
  function yearLabel(e, pool) {
    if (!e.year) return elTitle(e);
    const same = (pool || elsOf(e.country)).filter((x) => x.country === e.country && String(x.year) === String(e.year));
    return same.length > 1 ? e.year + 'abcdefgh'[same.indexOf(e)] : String(e.year);
  }
  function electionBox(title, name = '', year = '') {
    return modal(`<h3>${esc(title)}</h3>
      <div class="row" style="gap:10px;align-items:flex-end">
        <label class="field" style="flex:1">${t('Naziv izbora')}<input id="eb-name" value="${esc(name)}" placeholder="${t('npr. Parlamentarni izbori')}"></label>
        <label class="field" style="width:110px">${t('Godina')}<input id="eb-year" value="${esc(year)}" inputmode="numeric" maxlength="4"></label>
      </div>
      <div class="muted small" style="margin-top:6px">${t('U uporednim tabelama i na grafikonu prikazuje se godina.')}</div>
      <div class="actions"><button class="btn" data-close="">${t('Otkaži')}</button><button class="btn primary" id="eb-ok">${t('U redu')}</button></div>`,
    (m, close) => {
      const n = m.querySelector('#eb-name'), y = m.querySelector('#eb-year'); n.focus();
      const ok = () => {
        const yy = y.value.trim();
        if (!n.value.trim()) { n.focus(); return; }
        if (!/^\d{4}$/.test(yy)) { y.focus(); y.classList.add('bad'); return; }
        close({ name: n.value.trim(), year: Number(yy) });
      };
      m.querySelector('#eb-ok').addEventListener('click', ok);
      [n, y].forEach((x) => x.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ok(); }));
    });
  }
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
        <b>Pravila cenzusa</b> se zadaju za svake izbore. Svaka lista ima jedno pravilo: <i>samostalno</i> (lista ulazi u raspodjelu ako ima najmanje zadati procenat; 0% znači bez cenzusa);
        <i>zbirna lista</i> (liste tog pravila koje ne pređu opšti cenzus, a imaju najmanje zadati procenat, učestvuju kao jedna lista sa najviše zadatim brojem mandata, koji se zatim dijele među njima istom metodom);
        <i>garantovani mandat</i> (ako nijedna lista tog pravila ne pređe opšti cenzus, najuspješnija sa najmanje zadatim procentom dobija zadati broj mandata);
        <i>uvećani količnici</i> (količnici liste uvećavaju se za zadati procenat).
        Za Crnu Goru od 2011. (čl. 94 Zakona o izboru odbornika i poslanika): manjinske liste – zbirna lista, 0,7%, najviše 3 mandata; liste hrvatskog naroda – garantovani mandat, 0,35%, 1 mandat.
        <b>Posebna izborna jedinica:</b> dio mandata bira se odvojeno. Sa prenosom glasova (Crna Gora 2006. i 2009, čl. 94a tada važećeg zakona: pet mandata na posebno određenim biračkim mjestima) lista koja u jednoj jedinici ne učestvuje ili ne osvoji mandat, tim glasovima dodaje glasove iz druge; bez prenosa se obje raspodjele računaju odvojeno i mandati saberu.`,
      nat: `<b>Autor formule.</b> Ponderisani indeks nacionalizacije stranaka (PNSw) i standardizovani indeks nacionalizacije (sPNS) razvio je <b>Daniel Bochsler</b> (Univerzitet u Cirihu):
        Bochsler, D. (2010). Measuring party nationalisation: A new Gini-based indicator that corrects for the number of units. <i>Electoral Studies</i> 29(1): 155–168.
        Indeks se oslanja na Gini-zasnovan indeks nacionalizacije: Jones, M. P. i Mainwaring, S. (2003). The nationalization of parties and party systems. <i>Party Politics</i> 9(2): 139–166.
        Ova aplikacija je nezavisna implementacija Bochslerove formule; na podacima za Crnu Goru 2020. i 2023. daje iste vrijednosti kao njegov originalni Excel alat.`,
      vol: `<b>Izvori formula.</b> Ukupna volatilnost: Pedersen, M. N. (1979). The dynamics of European party systems: changing patterns of electoral volatility. <i>European Journal of Political Research</i> 7(1): 1–26.
        Podjela na tip A i tip B: Powell, E. N. i Tucker, J. A. (2014). Revisiting electoral volatility in post-communist countries: new data, new results and new approaches. <i>British Journal of Political Science</i> 44(1): 123–147.`,
      compare: `<b>Poređenje.</b> Isti indeksi kao u modulima „Rezultati i indeksi“ (LSq, Loosemore–Hanby, Sainte-Laguë, ENEP, ENPP, Golosov, Rae F), „Nacionalizacija stranaka“ (sPNS i PNSw sistema, samo za izbore sa bar dvije teritorijalne jedinice) i „Volatilnost“ (Pedersen; tip A i B po Powellu i Tuckeru).
        Volatilnost se računa prema prethodnim izabranim izborima iste države (hronološki, po godini), na osnovu glasova i veza između lista sačuvanih u modulu „Volatilnost“. Izvori formula navedeni su u tim modulima.`,
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
        <b>Threshold rules</b> are set for each election. Each list has one rule: <i>on its own</i> (the list takes part in the allocation if it has at least the given percentage; 0% means no threshold);
        <i>combined list</i> (lists with this rule that do not pass the general threshold but have at least the given percentage take part as one list with at most the given number of seats, which are then divided among them by the same method);
        <i>guaranteed seat</i> (if no list with this rule passes the general threshold, the most successful one with at least the given percentage wins the given number of seats);
        <i>increased quotients</i> (the list's quotients are increased by the given percentage).
        For Montenegro since 2011 (Art. 94 of the Law on the Election of Councillors and Members of Parliament): minority lists – combined list, 0.7%, at most 3 seats; lists of the Croatian people – guaranteed seat, 0.35%, 1 seat.
        <b>Special electoral unit:</b> part of the seats is elected separately. With vote transfer (Montenegro 2006 and 2009, Art. 94a of the law then in force: five seats at specially designated polling stations) a list that does not take part or does not win a seat in one unit adds those votes to the other; without transfer both allocations are calculated separately and the seats are added up.`,
      nat: `<b>Formula author.</b> The weighted party nationalisation score (PNSw) and the standardised party nationalisation score (sPNS) were developed by <b>Daniel Bochsler</b> (University of Zurich):
        Bochsler, D. (2010). Measuring party nationalisation: A new Gini-based indicator that corrects for the number of units. <i>Electoral Studies</i> 29(1): 155–168.
        The index builds on the Gini-based party nationalisation score: Jones, M. P. and Mainwaring, S. (2003). The nationalization of parties and party systems. <i>Party Politics</i> 9(2): 139–166.
        This application is an independent implementation of Bochsler's formula; on the data for Montenegro 2020 and 2023 it gives the same values as his original Excel tool.`,
      vol: `<b>Formula sources.</b> Total volatility: Pedersen, M. N. (1979). The dynamics of European party systems: changing patterns of electoral volatility. <i>European Journal of Political Research</i> 7(1): 1–26.
        Split into type A and type B: Powell, E. N. and Tucker, J. A. (2014). Revisiting electoral volatility in post-communist countries: new data, new results and new approaches. <i>British Journal of Political Science</i> 44(1): 123–147.`,
      compare: `<b>Comparison.</b> The same indices as in the modules “Results and indices” (LSq, Loosemore–Hanby, Sainte-Laguë, ENEP, ENPP, Golosov, Rae F), “Party nationalisation” (system sPNS and PNSw, only for elections with at least two territorial units) and “Volatility” (Pedersen; types A and B after Powell and Tucker).
        Volatility is calculated against the previous selected election of the same country (chronologically, by year), from votes and the links between lists saved in the “Volatility” module. Formula sources are given in those modules.`,
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
  // Pravila cenzusa izbora -> pravilo za svaku listu (null = opšti cenzus)
  const ruleOf = (e, l) => (e.rules || []).find((r) => r.id === l.rule) || null;
  function listRules(e) {
    return e.lists.map((l) => {
      const r = ruleOf(e, l);
      if (!r || r.id === 'opsti') return null;
      return { key: r.id, kind: r.kind, pct: parseNum(r.pct), cap: parseNum(r.cap), seats: parseNum(r.seats), bonus: parseNum(r.bonus) };
    });
  }
  function calcAlloc(e) {
    const V = e.lists.map((l) => parseNum(l.votes));
    const rules = listRules(e);
    let r;
    if (hasSpecial(e)) {
      const sp = e.special;
      r = I.allocateSpecial({ votes: V, seats: parseNum(e.seats), method: e.method, threshold: parseNum(e.threshold), rules,
        special: { seats: parseNum(sp.seats), votes: e.lists.map((l) => parseNum(sp.votes?.[l.id])), threshold: String(sp.threshold ?? '').trim() === '' ? undefined : parseNum(sp.threshold), transfer: sp.transfer !== false } });
    } else {
      r = I.allocate({ votes: V, seats: parseNum(e.seats), method: e.method, threshold: parseNum(e.threshold), rules });
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
  // Pregled kroz vrijeme: korisnik bira izbore (redosljed kao u listi izbora) i indekse za grafikon
  // [ključ, oznaka, decimale, puno ime, boja linije]
  const TREND_COLS = [
    ['lsq', 'LSq', 2, 'Gallagherov indeks najmanjih kvadrata (disproporcionalnost)', 'var(--accent)'],
    ['lh', 'LH', 2, 'Loosemore–Hanby indeks disproporcionalnosti', '#D85A30'],
    ['sl', 'SL', 2, 'Sainte-Laguë indeks disproporcionalnosti', '#7F77DD'],
    ['enep', 'ENEP', 2, 'Efektivni broj izbornih stranaka (po glasovima, Laakso–Taagepera)', '#1D9E75'],
    ['enpp', 'ENPP', 2, 'Efektivni broj parlamentarnih stranaka (po mandatima, Laakso–Taagepera)', '#BA7517'],
    ['golV', 'Golosov (gl.)', 2, 'Golosovljev efektivni broj stranaka, po glasovima', '#D4537E'],
    ['golM', 'Golosov (m.)', 2, 'Golosovljev efektivni broj stranaka, po mandatima', '#993556'],
    ['raeV', 'Rae F (gl.)', 3, 'Raeov indeks frakcionalizacije, po glasovima', '#0F6E56'],
    ['raeM', 'Rae F (m.)', 3, 'Raeov indeks frakcionalizacije, po mandatima', '#854F0B'],
    ['spns', 'sPNS', 3, 'Standardizovani indeks nacionalizacije stranačkog sistema (Bochsler)', '#534AB7'],
    ['pnsw', 'PNSw', 3, 'Ponderisani indeks nacionalizacije stranačkog sistema (Bochsler)', '#185FA5'],
    ['tv', 'TV', 2, 'Ukupna volatilnost (Pedersen), prema prethodnim izabranim izborima', '#A32D2D'],
    ['ta', 'A', 2, 'Volatilnost tipa A (nove i ugašene stranke), prema prethodnim izabranim izborima', '#639922'],
    ['tb', 'B', 2, 'Volatilnost tipa B (stranke prisutne na oba izbora), prema prethodnim izabranim izborima', '#5F5E5A'],
  ];
  const colOf = (k) => TREND_COLS.find((c) => c[0] === k);
  // padajuća lista indeksa: puno ime (skraćenica), po grupama
  const IDX_GROUPS = [
    ['Disproporcionalnost', [['lsq', 'Gallagherov indeks najmanjih kvadrata'], ['lh', 'Loosemore–Hanby indeks'], ['sl', 'Sainte-Laguë indeks']]],
    ['Broj stranaka i fragmentacija', [['enep', 'Efektivni broj izbornih stranaka'], ['enpp', 'Efektivni broj parlamentarnih stranaka'],
      ['golV', 'Golosovljev efektivni broj stranaka – glasovi'], ['golM', 'Golosovljev efektivni broj stranaka – mandati'],
      ['raeV', 'Raeov indeks frakcionalizacije – glasovi'], ['raeM', 'Raeov indeks frakcionalizacije – mandati']]],
    ['Nacionalizacija', [['spns', 'Standardizovani indeks nacionalizacije'], ['pnsw', 'Ponderisani indeks nacionalizacije']]],
    ['Volatilnost', [['tv', 'Ukupna volatilnost (Pedersen)'], ['ta', 'Volatilnost tipa A'], ['tb', 'Volatilnost tipa B']]],
  ];
  // Padajuća lista sa više izbora (države, izbori, indeksi)
  let openMsel = null;
  function mselHtml(id, title, groups, chosen, shortOf, extraFoot = '') {
    const shown = chosen.length > 3 ? t('{n} izabrano', { n: chosen.length }) : chosen.map(shortOf).join(', ');
    const body = groups.map(([g, items, gid]) => `${g ? `<div class="msel-g">${esc(g)}${gid ? ` <button class="msel-all" data-act="msel-group" data-id="${id}" data-g="${gid}">${t('sve')}</button>` : ''}</div>` : ''}${items.map(([v, label, hint]) =>
      `<label class="msel-i"><input type="checkbox" data-msel="${id}" data-v="${esc(v)}" ${chosen.includes(v) ? 'checked' : ''}> <span>${esc(label)}${hint ? ` <b>(${esc(hint)})</b>` : ''}</span></label>`).join('')}`).join('')
      || `<div class="muted small" style="padding:8px">${t('Prvo izaberi državu.')}</div>`;
    return `<div class="msel ${openMsel === id ? 'open' : ''}">
      <button class="msel-btn" data-act="msel-toggle" data-id="${id}"><span class="msel-k">${esc(title)}:</span> <span class="msel-v">${esc(shown || t('nijedan'))}</span><span class="msel-c">▾</span></button>
      <div class="msel-pop">${body}<div class="msel-foot">${extraFoot}<button class="btn small ghost" data-act="msel-none" data-id="${id}">${t('Poništi izbor')}</button><button class="btn small primary" data-act="msel-toggle" data-id="${id}">${t('Gotovo')}</button></div></div>
    </div>`;
  }
  const IDX_ORDER = IDX_GROUPS.flatMap(([, it]) => it.map((x) => x[0]));
  // promjena izbora u padajućoj listi
  function mselSet(id, values) {
    const st = cmpState();
    if (id === 'cmp-c') st.countries = S.state.countries.map((c) => c.id).filter((x) => values.includes(x));
    else if (id === 'cmp-e') st.sel = S.state.elections.map((e) => e.id).filter((x) => values.includes(x));
    else if (id === 'cmp-i') st.idx = IDX_ORDER.filter((x) => values.includes(x));
    S.save(); render();
  }
  function mselGet(id) { const st = cmpState(); return id === 'cmp-c' ? st.countries : id === 'cmp-e' ? st.sel : st.idx; }

  // Poređenje: države -> izbori -> indeksi; ništa od izbora nije unaprijed izabrano
  function cmpState() {
    const st = S.state.cmp || (S.state.cmp = { countries: [], sel: [], idx: ['enep'] });
    // do 1.2: "Pregled kroz vrijeme" (state.trend) prelazi u poređenje
    if (S.state.trend) {
      const old = S.state.trend;
      (old.sel || []).forEach((id) => { const e = S.byId(id); if (e && !st.sel.includes(id)) st.sel.push(id); if (e && !st.countries.includes(e.country)) st.countries.push(e.country); });
      const oi = Array.isArray(old.idx) ? old.idx : old.metric ? [old.metric] : [];
      if (oi.length) st.idx = oi;
      delete S.state.trend;
    }
    if (!Array.isArray(st.idx)) st.idx = [];
    st.countries = st.countries.filter((id) => S.country(id));
    st.sel = st.sel.filter((id) => { const e = S.byId(id); return e && st.countries.includes(e.country); });
    const order = IDX_GROUPS.flatMap(([, it]) => it.map((x) => x[0]));
    st.idx = order.filter((k) => st.idx.includes(k));
    return st;
  }
  function rowValues(e, prev) {
    const r = calcResults(e), n = calcNat(e), v = prev ? volPair(prev, e) : null;
    return { e, prev, linked: !!v, lsq: r.lsq, lh: r.lh, sl: r.sl, enep: r.enep, enpp: r.enpp, golV: r.golV, golM: r.golM, raeV: r.raeV, raeM: r.raeM,
      spns: n.ok ? n.systemSpns : NaN, pnsw: n.ok ? n.systemPnsw : NaN, tv: v ? v.total : NaN, ta: v ? v.typeA : NaN, tb: v ? v.typeB : NaN };
  }
  // redovi: po državama (redom izbora), izbori redosljedom iz liste; volatilnost prema prethodnim izabranim izborima iste države
  function cmpRows() {
    const st = cmpState(), out = [];
    S.state.countries.filter((c) => st.countries.includes(c.id)).forEach((c) => {
      const els = elsOf(c.id).filter((e) => st.sel.includes(e.id));
      els.forEach((e, i) => out.push({ c: c.name, cid: c.id, yl: yearLabel(e, els), ...rowValues(e, i ? els[i - 1] : null) }));
    });
    const so = st.sort;
    if (so && so.k) {
      const val = (r) => (so.k === 'country' ? r.c : so.k === 'year' ? (Number(r.e.year) || 0) + r.yl : r[so.k]);
      out.sort((a, b) => {
        const x = val(a), y = val(b);
        if (typeof x === 'string') return so.dir * x.localeCompare(y, L.locale());
        if (!Number.isFinite(x)) return 1; if (!Number.isFinite(y)) return -1;
        return so.dir * (x - y);
      });
    }
    return out;
  }
  function wrapText(s, max = 20) {
    const out = []; let line = '';
    String(s).split(/\s+/).forEach((w) => { if (line && (line + ' ' + w).length > max) { out.push(line); line = w; } else line = line ? line + ' ' + w : w; });
    if (line) out.push(line);
    return out;
  }
  const PALETTE = ['var(--accent)', '#D85A30', '#1D9E75', '#7F77DD', '#BA7517', '#D4537E', '#0F6E56', '#993C1D', '#534AB7', '#854F0B', '#378ADD', '#639922'];
  // Grafikon: na osi godine (ili naziv izbora kad se godina u državi ponavlja); jedna linija po državi i indeksu
  function cmpChart(rows, keys) {
    if (!keys.length) return '';
    // grafikon kroz vrijeme ima smisla tek kad bar jedna država ima dvoje ili više izbora
    if (!rows.some((r) => rows.filter((x) => x.cid === r.cid).length > 1)) return '';
    const rowKey = (r) => r.yl;
    let cats = [];
    rows.forEach((r) => { const k = rowKey(r); if (!cats.includes(k)) cats.push(k); });
    if (cats.every((k) => /^\d{4}[a-h]?$/.test(k))) cats.sort();
    const cids = [...new Set(rows.map((r) => r.cid))];
    const series = [];
    cids.forEach((cid) => keys.forEach((k) => {
      const pts = rows.filter((r) => r.cid === cid && Number.isFinite(r[k])).map((r) => ({ x: cats.indexOf(rowKey(r)), y: r[k], r }));
      if (pts.length) series.push({ cid, k, c: colOf(k), pts: pts.sort((a, b) => a.x - b.x) });
    }));
    if (!series.length) return `<div class="muted" style="padding:12px">${t('Za izabrane izbore nema vrijednosti ovih indeksa.')}</div>`;
    const multiC = cids.length > 1;
    series.forEach((x, i) => { x.color = PALETTE[i % PALETTE.length]; x.label = (multiC ? S.country(x.cid).name + ' – ' : '') + t(x.c[1]); });
    const labels = cats.map((l) => wrapText(l));
    const lines = Math.max(...labels.map((l) => l.length));
    const W = 960, padL = 56, padR = 16, padT = 16 + Math.ceil(series.length / 4) * 20, padB = 16 + lines * 14, inset = 40, plotH = 210, H = padT + plotH + padB;
    const all = series.flatMap((x) => x.pts.map((p) => p.y));
    let lo = Math.min(...all), hi = Math.max(...all);
    if (hi === lo) { hi += 1; lo = Math.max(0, lo - 1); }
    const span = hi - lo; lo = Math.max(0, lo - span * 0.1); hi += span * 0.1;
    const n = cats.length;
    const X = (i) => (n === 1 ? (padL + W - padR) / 2 : padL + inset + (i * (W - padL - padR - 2 * inset)) / (n - 1));
    const Y = (y) => padT + (1 - (y - lo) / (hi - lo)) * plotH;
    const dec = Math.max(...series.map((x) => x.c[2]));
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const yv = lo + ((hi - lo) * k) / 4, yy = Y(yv);
      g += `<line x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}" class="ch-grid"/><text x="${padL - 6}" y="${yy + 4}" text-anchor="end" class="ch-ax">${fmt(yv, dec)}</text>`;
    }
    cats.forEach((c, i) => { g += `<text x="${X(i)}" y="${padT + plotH + 18}" text-anchor="middle" class="ch-ax">${labels[i].map((l, j) => `<tspan x="${X(i)}" dy="${j ? 14 : 0}">${esc(l)}</tspan>`).join('')}</text>`; });
    series.forEach((x, i) => {
      const lx = padL + (i % 4) * 225, ly = 12 + Math.floor(i / 4) * 20;
      g += `<g><title>${esc(t(x.c[3]))}</title><line x1="${lx}" x2="${lx + 18}" y1="${ly}" y2="${ly}" stroke="${x.color}" stroke-width="3"/><text x="${lx + 24}" y="${ly + 4}" class="ch-ax">${esc(x.label)}</text></g>`;
    });
    series.forEach((x, si) => {
      g += `<path d="${x.pts.map((p, k) => `${k ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')}" fill="none" stroke="${x.color}" stroke-width="2.5"/>`;
      g += x.pts.map((p) => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4" class="ch-dot" style="stroke:${x.color}"><title>${esc(S.country(x.cid).name)} · ${esc(elTitle(p.r.e))} · ${esc(t(x.c[1]))}: ${fmt(p.y, x.c[2])}</title></circle>`
        + (series.length <= 2 ? `<text x="${X(p.x)}" y="${si === 0 ? Y(p.y) - 9 : Y(p.y) + 18}" text-anchor="middle" class="ch-val" style="fill:${x.color}">${fmt(p.y, x.c[2])}</text>` : '')).join('');
    });
    return `<div class="card chart-card"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg></div>`;
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
    $('#election-nav').innerHTML = S.state.countries.map((c) => {
      const els = elsOf(c.id);
      const open = !S.state.collapsed.includes(c.id);
      return `<div class="country ${open ? '' : 'closed'}" data-cid="${c.id}">
        <div class="country-row" data-act="toggle-country"><span class="caret">${open ? '▾' : '▸'}</span><span class="cname">${esc(c.name)}</span>
          <span class="country-tools"><button class="icon-btn" data-act="rename-country" title="${t('Preimenuj državu')}">✎</button><button class="icon-btn" data-act="del-country" title="${t('Obriši državu')}">✕</button></span></div>
        ${open ? `<div class="country-els">${els.map((e) => `<a data-el="${e.id}" class="${e.id === S.state.current ? 'on' : ''}"><span>${esc(elTitle(e))}</span></a>`).join('')}
          <button class="add-el" data-act="new-election-in" data-cid="${c.id}">${t('+ Novi izbori')}</button></div>` : ''}
      </div>`;
    }).join('') || `<div class="muted" style="padding:6px 10px;font-size:12px">${t('Dodaj državu, pa u njoj izbore.')}</div>`;
  }

  const printHead = (e, title) => `<div class="print-head"><b>${esc(title)}</b><br><span class="muted">${esc(e ? elTitle(e) : '')} · ${new Date().toLocaleDateString(L.locale())}</span></div>`;

  function electionHead(e, extra = '') {
    const c = S.country(e.country);
    return `${c ? `<div class="crumb">${esc(c.name)}</div>` : ''}<div class="head">
      <input class="title-input" data-bind="name" value="${esc(e.name)}" title="${t('Klikni da promijeniš naziv izbora')}">
      <label class="year-field" title="${t('Godina izbora')}"><span>${t('Godina')}</span><input data-bind="year" value="${esc(e.year ?? '')}" inputmode="numeric" maxlength="4"></label>
      ${extra}
      <button class="btn small" data-act="dup">${t('Dupliraj')}</button>
      <button class="btn small danger" data-act="del-election">${t('Obriši izbore')}</button>
    </div>`;
  }

  // Pravila cenzusa: svaki izbori imaju svoja; "Opšti" postoji uvijek i koristi opšti cenzus izbora
  const RULE_KINDS = {
    own: 'Samostalno, sa ovim cenzusom',
    pool: 'Zbirna lista, ako ne pređu opšti cenzus',
    guar: 'Garantovani mandat, ako nijedna ne pređe opšti cenzus',
    bonus: 'Količnici uvećani za određeni procenat',
  };
  // broj u polju za unos u formatu jezika (0.7 -> 0,7)
  const numIn = (v) => (typeof v === 'number' && L.lang === 'me' ? String(v).replace('.', ',') : esc(v ?? ''));
  const ruleName = (r) => (r.id === 'opsti' ? t('Opšti') : t(r.name || ''));
  const rulePct = (r, e) => (r.id === 'opsti' ? parseNum(e.threshold) : parseNum(r.pct));
  function thrLabel(l, e) {
    const r = ruleOf(e, l) || { id: 'opsti' };
    return `${ruleName(r)} (${fmt(rulePct(r, e), 2).replace(/[,.]?0+$/, '')}%)`;
  }
  function thrCell(l, e) {
    const cur = (ruleOf(e, l) || { id: 'opsti' }).id;
    const opts = (e.rules || []).map((r) => `<option value="${esc(r.id)}" ${r.id === cur ? 'selected' : ''}>${esc(thrLabel({ rule: r.id }, e))}</option>`).join('');
    return `<td class="l thr-cell"><select data-f="rule" title="${t('Pravilo cenzusa koje važi za ovu listu')}">${opts}</select></td>`;
  }
  function rulesEditor(e) {
    const rows = (e.rules || []).map((r) => {
      if (r.id === 'opsti') {
        return `<tr><td class="l">${esc(t('Opšti'))}</td><td>${fmt(parseNum(e.threshold), 2).replace(/[,.]?0+$/, '')} %</td><td class="l muted">${t('opšti cenzus izbora (polje iznad)')}</td><td></td></tr>`;
      }
      const extra = r.kind === 'pool' ? `<span class="muted">${t('najviše')}</span> <input class="sm" data-rule-f="cap" value="${esc(r.cap ?? '')}" inputmode="numeric"> <span class="muted">${t('mandata')}</span>`
        : r.kind === 'guar' ? `<input class="sm" data-rule-f="seats" value="${esc(r.seats ?? 1)}" inputmode="numeric"> <span class="muted">${t('mandat(a)')}</span>`
        : r.kind === 'bonus' ? `<span class="muted">+</span><input class="sm" data-rule-f="bonus" value="${numIn(r.bonus)}" inputmode="decimal"> <span class="muted">%</span>` : '';
      return `<tr data-rid="${esc(r.id)}"><td class="l"><input class="name" data-rule-f="name" value="${esc(r.name || '')}" placeholder="${t('Naziv pravila')}"></td>
        <td><input class="sm" data-rule-f="pct" value="${numIn(r.pct)}" inputmode="decimal"> %</td>
        <td class="l rule-kind"><select data-rule-f="kind">${Object.entries(RULE_KINDS).map(([k, v]) => `<option value="${k}" ${k === r.kind ? 'selected' : ''}>${t(v)}</option>`).join('')}</select> ${extra}</td>
        <td class="no-print"><button class="icon-btn" data-act="del-rule" title="${t('Ukloni pravilo')}">✕</button></td></tr>`;
    }).join('');
    return `<h2>${t('Pravila cenzusa')}</h2>
      <div class="table-wrap"><table class="grid rules">
        <thead><tr><th class="l">${t('Naziv pravila')}</th><th>${t('Cenzus')}</th><th class="l">${t('Šta važi za liste sa ovim pravilom')}</th><th class="no-print"></th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <div class="row no-print" style="margin-top:8px"><button class="btn small" data-act="add-rule">${t('+ Dodaj pravilo')}</button></div>`;
  }
  function specialEditor(e) {
    const sp = e.special;
    if (!sp) return `<div class="row no-print" style="margin-top:14px"><button class="btn small" data-act="add-special">${t('+ Dodaj posebnu izbornu jedinicu')}</button></div>`;
    return `<h2>${t('Posebna izborna jedinica')}</h2>
      <div class="row" style="margin-bottom:6px">
        <label class="field">${t('Broj mandata u posebnoj jedinici')}<input data-spf="seats" value="${esc(sp.seats ?? '')}" inputmode="numeric"></label>
        <label class="field">${t('Cenzus u posebnoj jedinici (%)')}<input data-spf="threshold" value="${numIn(sp.threshold)}" placeholder="${esc(fmt(parseNum(e.threshold), 1))}" inputmode="decimal"></label>
        <label class="check"><input type="checkbox" data-spf="transfer" ${sp.transfer !== false ? 'checked' : ''}> ${t('Prenos glasova između opšte i posebne raspodjele')}</label>
        <button class="btn small danger no-print" data-act="del-special">${t('Ukloni posebnu jedinicu')}</button>
      </div>
      <div class="muted small">${t('Glasovi lista u tabeli su ukupni; u kolonu „Posebna jedinica“ upiši koliko je od toga dobijeno u posebnoj jedinici.')}
        ${sp.transfer !== false ? t('Sa prenosom glasova: lista koja u jednoj raspodjeli ne učestvuje ili ne osvoji mandat, tim glasovima dodaje glasove iz druge (Crna Gora 2006. i 2009). Tada se primjenjuje samo opšti cenzus.') : t('Bez prenosa: opšta raspodjela (sa pravilima cenzusa) i posebna jedinica računaju se odvojeno, a mandati se saberu.')}</div>`;
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
          <td class="no-print"><button class="icon-btn" data-act="del-list" title="${t('Ukloni listu')}">✕</button></td></tr>`).join('');
        return `${printHead(e, t('Rezultati i indeksi'))}${electionHead(e, `
          <button class="btn small" data-act="paste-lists">${t('Zalijepi iz Excela')}</button>
          <button class="btn small" data-act="import-lists">${t('Uvezi XLS/XLSX/CSV')}</button>`)}
          <div class="row" style="margin-bottom:12px">
            <label class="field">${t('Važeći glasovi (zvanično)')}<input data-bind="validTotal" value="${esc(e.validTotal ?? '')}" inputmode="numeric" title="${t('Unesi zvanični broj važećih glasova da bi aplikacija provjerila zbir glasova lista')}"></label>
            <label class="field">${t('Broj mandata')}<input data-bind="seats" value="${esc(e.seats)}" inputmode="numeric"></label>
          </div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">${t('Lista / stranka')}</th><th>${t('Glasovi')}</th><th>${t('Mandati')}</th><th title="${t('Udio mandata podijeljen udjelom glasova (1 = proporcionalno)')}">${t('Odnos prednosti')}</th><th class="no-print"></th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td class="l">${t('Ukupno')}</td><td data-out="tv"></td><td data-out="ts"></td><td></td><td class="no-print"></td></tr></tfoot>
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
          header: [t('Lista'), t('Glasovi'), t('Mandati'), t('Odnos prednosti')],
          rows: e.lists.map((l, i) => [l.name, r.V[i], r.M[i], Number.isFinite(r.adv[i]) ? r.adv[i] : '']),
          summary: [['LSq (Gallagher)', r.lsq], ['Loosemore–Hanby', r.lh], [t('Sainte-Laguë indeks'), r.sl], ['ENEP', r.enep], ['ENPP', r.enpp],
            [t('Golosov (glasovi)'), r.golV], [t('Golosov (mandati)'), r.golM], [t('Rae F (glasovi)'), r.raeV], [t('Rae F (mandati)'), r.raeM],
            [t('Ukupno glasova'), r.tv], [t('Važeći glasovi (zvanično)'), parseNum(e.validTotal) || ''], [t('Ukupno mandata'), r.ts]],
        };
      },
    },

    alloc: {
      render(e) {
        const sp = !!e.special;
        const rows = e.lists.map((l) => `<tr data-id="${l.id}">
          <td class="l clip" title="${esc(l.name)}">${esc(l.name)}</td><td>${fmtInt(parseNum(l.votes))}</td>
          ${sp ? `<td><input data-sp="${l.id}" value="${esc(e.special.votes?.[l.id] ?? '')}" inputmode="numeric"></td>` : ''}${thrCell(l, e)}
          <td data-out="al-${l.id}" style="font-weight:600"></td><td>${fmtInt(parseNum(l.seats))}</td><td data-out="df-${l.id}"></td></tr>`).join('');
        return `${printHead(e, t('Raspodjela mandata'))}${electionHead(e)}
          <div class="row" style="margin-bottom:12px">
            <label class="field">${t('Broj mandata')}<input data-bind="seats" value="${esc(e.seats)}" inputmode="numeric"></label>
            <label class="field">${t('Metoda')}<select data-bind="method">
              ${Object.entries(METHODS).map(([k, v]) => `<option value="${k}" ${e.method === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            <label class="field">${t('Opšti cenzus (%)')}<input data-bind="threshold" value="${esc(e.threshold)}" inputmode="decimal"></label>
          </div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th class="l">${t('Lista')}</th><th>${t('Glasovi')}</th>${sp ? `<th>${t('Posebna jedinica')}</th>` : ''}<th class="l">${t('Cenzus')}</th><th>${t('Dodijeljeno')}</th><th>${t('Stvarno')}</th><th>${t('Razlika')}</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td class="l">${t('Ukupno')}</td><td data-out="tv"></td>${sp ? '<td data-out="tsp"></td>' : ''}<td></td><td data-out="tal"></td><td data-out="tst"></td><td></td></tr></tfoot>
          </table></div>
          <div data-out-html="allocwarn"></div>
          ${rulesEditor(e)}
          ${specialEditor(e)}
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
        o.tsp = e.special ? fmtInt(I.sum(e.lists.map((l) => parseNum(e.special.votes?.[l.id])))) : '';
        o.tv = fmtInt(r.tv); o.tal = String(I.sum(r.seats)); o.tst = fmtInt(I.sum(e.lists.map((l) => parseNum(l.seats))));
        o.lsq = fmt(r.lsq);
        const w = [];
        if (r.tie) w.push(t('Posljednji mandat je neriješen (isti količnik/ostatak). Zakon obično propisuje kako se takav slučaj rješava; provjeri ručno.'));
        if (hasSpecial(e) && e.special.transfer !== false && e.lists.some((l) => l.rule && l.rule !== 'opsti')) w.push(t('Uz prenos glasova u posebnoj jedinici primjenjuje se samo opšti cenzus; pravila cenzusa lista se ne koriste.'));
        o.allocwarn = w.length ? `<div class="warn">${w.map(esc).join('<br>')}</div>` : '';
        return o;
      },
      table(e) {
        const r = calcAlloc(e), sp = hasSpecial(e);
        const ruleRows = (e.rules || []).filter((x) => x.id !== 'opsti').map((x) => {
          const d = x.kind === 'pool' ? t('najviše {n} mandata', { n: parseNum(x.cap) }) : x.kind === 'guar' ? t('{n} mandat(a)', { n: parseNum(x.seats) || 1 }) : x.kind === 'bonus' ? `+${fmt(parseNum(x.bonus), 1)}%` : '';
          return [t('Pravilo cenzusa'), `${ruleName(x)}: ${fmt(parseNum(x.pct), 2)}%, ${t(RULE_KINDS[x.kind] || '')}${d ? ', ' + d : ''}`];
        });
        return {
          header: [t('Lista'), t('Glasovi'), ...(sp ? [t('Posebna jedinica')] : []), t('Cenzus'), t('Dodijeljeno'), t('Stvarno'), t('Razlika')],
          rows: e.lists.map((l, i) => [l.name, r.V[i], ...(sp ? [parseNum(e.special.votes?.[l.id])] : []), thrLabel(l, e), r.seats[i], parseNum(l.seats), r.seats[i] - parseNum(l.seats)]),
          summary: [[t('Metoda'), METHODS[e.method]], [t('Broj mandata'), parseNum(e.seats)], [t('Opšti cenzus (%)'), parseNum(e.threshold)], ...ruleRows,
            ...(sp ? [[t('Mandata u posebnoj jedinici'), parseNum(e.special.seats)], [t('Prenos glasova između opšte i posebne raspodjele'), e.special.transfer !== false ? t('da') : t('ne')]] : []),
            [t('LSq za raspodjelu'), r.lsq]],
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
            <thead><tr><th class="l">${t('Lista')}</th><th title="${t('Ponderisani indeks nacionalizacije stranke (Bochsler)')}">PNSw</th><th title="${t('Standardizovani indeks nacionalizacije stranke (Bochsler)')}">sPNS</th></tr></thead>
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

    compare: {
      render() {
        const st = cmpState();
        const name = (k) => t(colOf(k)[1]), full = (k) => t(colOf(k)[3]);
        const head = `${printHead(null, t('Poređenje'))}<div class="head"><h1>${t('Poređenje')}</h1></div>`;
        if (!S.state.elections.length) return `${head}<div class="card empty">${t('Nema izbora.')}</div>`;
        const cGroups = [[null, S.state.countries.map((c) => [c.id, c.name])]];
        const eGroups = S.state.countries.filter((c) => st.countries.includes(c.id)).map((c) => [c.name, elsOf(c.id).map((e) => [e.id, elTitle(e)]), c.id]);
        const iGroups = IDX_GROUPS.map(([g, items]) => [t(g), items.map(([k, n]) => [k, t(n), t(colOf(k)[1])])]);
        const picker = `<div class="cmp-pick3 no-print">
            ${mselHtml('cmp-c', t('Države'), cGroups, st.countries, (id) => S.country(id)?.name || '')}
            ${mselHtml('cmp-e', t('Izbori'), eGroups, st.sel, (id) => elTitle(S.byId(id)), st.countries.length ? `<button class="btn small ghost" data-act="cmp-latest" style="margin-right:auto">${t('Posljednji izbori svake države')}</button>` : '')}
            ${mselHtml('cmp-i', t('Indeksi'), iGroups, st.idx, (k) => t(colOf(k)[1]))}
          </div>`;
        const rows = cmpRows();
        if (!rows.length || !st.idx.length) {
          return `${head}${picker}<div class="card empty trend-empty">${t('Izaberi države, izbore i indekse.')}<br><span class="muted">${t('Grafikon i tabela pojavljuju se kad izabereš bar jedne izbore i jedan indeks.')}</span></div><div class="cite">${cite('compare')}</div>`;
        }
        const hasVol = st.idx.some((k) => ['tv', 'ta', 'tb'].includes(k));
        const so = st.sort || {};
        const grouped = !so.k || so.k === 'country';
        const arrow = (k) => (so.k === k ? (so.dir < 0 ? ' ↓' : ' ↑') : '');
        const th = (k, label, cls = '', title = '') => `<th class="sortable ${cls}" data-act="cmp-sort" data-k="${k}" title="${esc(title || t('Klikni za sortiranje'))}">${esc(label)}${arrow(k)}</th>`;
        const avg = (k) => { const v = rows.map((r) => r[k]).filter(Number.isFinite); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
        const body = rows.map((r, i) => {
          const first = !grouped || !i || rows[i - 1].cid !== r.cid;
          return `<tr class="${grouped && i && rows[i - 1].cid !== r.cid ? 'grp' : ''}"><td class="l">${first ? esc(r.c) : ''}</td><td class="l" title="${esc(elTitle(r.e))}">${esc(r.yl)}</td>
          ${st.idx.map((k) => `<td>${fmt(r[k], colOf(k)[2])}</td>`).join('')}
          ${hasVol ? `<td class="no-print l">${r.prev ? `<button class="btn small ghost" data-act="cmp-links" data-a="${r.prev.id}" data-b="${r.e.id}">${r.linked ? t('Uredi veze') : t('Poveži liste')}</button>` : ''}</td>` : ''}</tr>`;
        }).join('');
        const unlinked = hasVol && rows.some((r) => r.prev && !r.linked);
        return `${head}${picker}${cmpChart(rows, st.idx)}
          <div class="table-wrap" style="margin-top:14px"><table class="grid cmp">
            <thead><tr>${th('country', t('Država'), 'l')}${th('year', t('Godina'), 'l')}${st.idx.map((k) => th(k, name(k), '', full(k))).join('')}${hasVol ? '<th class="no-print"></th>' : ''}</tr></thead>
            <tbody>${body}</tbody>
            ${rows.length > 1 ? `<tfoot><tr><td class="l">${t('Prosjek')}</td><td></td>${st.idx.map((k) => `<td>${fmt(avg(k), colOf(k)[2])}</td>`).join('')}${hasVol ? '<td class="no-print"></td>' : ''}</tr></tfoot>` : ''}
          </table></div>
          ${unlinked ? `<div class="warn">${t('Volatilnost (TV, A, B) se računa prema prethodnim izabranim izborima iste države i prikazuje samo kad su njihove liste povezane u modulu „Volatilnost“. Za ostale klikni „Poveži liste“.')}</div>` : ''}
          <div class="cite">${cite('compare')}</div>`;
      },
      paint() { return {}; },
      table() {
        const st = cmpState(), rows = cmpRows();
        if (!rows.length || !st.idx.length) return null;
        return { header: [t('Država'), t('Godina'), t('Izbori'), ...st.idx.map((k) => t(colOf(k)[1]))],
          rows: rows.map((r) => [r.c, r.yl, elTitle(r.e), ...st.idx.map((k) => (Number.isFinite(r[k]) ? r[k] : ''))]),
          summary: [...st.idx.map((k) => [t(colOf(k)[1]), t(colOf(k)[3])]),
            ...(st.idx.some((k) => ['tv', 'ta', 'tb'].includes(k)) ? [[t('Napomena'), t('Volatilnost je računata prema prethodnim izabranim izborima iste države, na osnovu glasova i sačuvanih veza između lista.')]] : [])] };
      },
    },

    vol: {
      render() {
        const els = S.state.elections;
        const v = S.state.vol;
        if (els.length >= 2) {
          if (!S.byId(v.a) || !S.byId(v.b) || v.a === v.b) { v.a = els[els.length - 2].id; v.b = els[els.length - 1].id; }
        }
        const opts = (sel) => S.state.countries.map((c) => `<optgroup label="${esc(c.name)}">${elsOf(c.id).map((e) => `<option value="${e.id}" ${e.id === sel ? 'selected' : ''}>${esc(elTitle(e))}</option>`).join('')}</optgroup>`).join('');
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
          summary: [[t('Prvi izbori'), elTitle(r.A)], [t('Drugi izbori'), elTitle(r.B)], [t('Osnova'), S.state.vol.basis === 'seats' ? t('mandati') : t('glasovi')], [t('Ukupna volatilnost (TV)'), r.total], [t('Tip A'), r.typeA], [t('Tip B'), r.typeB]],
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
    if (!MODULES[S.state.module]) S.state.module = S.state.module === 'trend' ? 'compare' : 'results';
    renderNav();
    const mod = MODULES[S.state.module];
    const e = S.current();
    if (!['vol', 'compare'].includes(S.state.module) && !e) {
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

  // nazivi pravila u padajućim listama osvježavaju se bez ponovnog crtanja (da se ne izgubi fokus)
  function refreshRuleLabels(e) {
    main.querySelectorAll('select[data-f="rule"] option').forEach((o) => { o.textContent = thrLabel({ rule: o.value }, e); });
  }
  // ---------- događaji ----------
  let saveTimer;
  const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => S.save(), 300); };

  main.addEventListener('input', (ev) => {
    const el = ev.target, e = S.current();
    if (el.dataset.bind && e) {
      e[el.dataset.bind] = el.value;
      if (el.dataset.bind === 'name' || el.dataset.bind === 'year') renderNav();
      if (el.dataset.bind === 'year') e.year = /^\d{4}$/.test(el.value.trim()) ? Number(el.value.trim()) : el.value.trim();
      if (el.dataset.bind === 'threshold') refreshRuleLabels(e);
    } else if (el.dataset.f && e) {
      const l = e.lists.find((x) => x.id === el.closest('tr').dataset.id);
      if (l) l[el.dataset.f] = el.dataset.f === 'name' ? el.value : el.value.trim();
    } else if (el.dataset.sp && e && e.special) {
      (e.special.votes = e.special.votes || {})[el.dataset.sp] = el.value.trim();
    } else if (el.dataset.ruleF && e) {
      const r = (e.rules || []).find((x) => x.id === el.closest('tr').dataset.rid);
      if (!r) return;
      r[el.dataset.ruleF] = el.dataset.ruleF === 'name' ? el.value : el.value.trim();
      if (el.dataset.ruleF === 'kind') { S.save(); render(); return; }
      saveSoon(); refreshRuleLabels(e); paint(); return;
    } else if (el.dataset.spf && e && e.special) {
      e.special[el.dataset.spf] = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (el.type === 'checkbox') { S.save(); render(); return; }
    } else if ((el.dataset.uf || el.dataset.uv) && e) {
      const u = e.units.find((x) => x.id === el.closest('tr').dataset.uid);
      if (u) { if (el.dataset.uf) u[el.dataset.uf] = el.value; else u.votes[el.dataset.uv] = el.value.trim(); }
    } else return;
    saveSoon(); paint();
  });
  main.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset.vol) { S.state.vol[el.dataset.vol] = el.value; S.save(); render(); }
    else if (el.dataset.f === 'rule') { S.save(); render(); }
    else if (el.tagName === 'SELECT' && el.dataset.bind) { S.save(); paint(); }
  });

  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset && el.dataset.msel) {
      const id = el.dataset.msel, v = el.dataset.v, cur = mselGet(id);
      mselSet(id, el.checked ? [...cur, v] : cur.filter((x) => x !== v));
    }
  });
  document.addEventListener('mousedown', (ev) => {
    if (openMsel && !ev.target.closest('.msel')) { openMsel = null; render(); }
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
      case 'new-election-in': return newElection(b.dataset.cid);
      case 'toggle-country': {
        if (ev.target.closest('.country-tools')) break;
        const id = b.closest('[data-cid]').dataset.cid, i = S.state.collapsed.indexOf(id);
        if (i >= 0) S.state.collapsed.splice(i, 1); else S.state.collapsed.push(id);
        S.save(); renderNav(); break;
      }
      case 'rename-country': {
        const c = S.country(b.closest('[data-cid]').dataset.cid);
        const n = await promptBox(t('Naziv države'), c.name); if (n) { c.name = n; S.save(); render(); } break;
      }
      case 'del-country': {
        const c = S.country(b.closest('[data-cid]').dataset.cid), k = S.state.elections.filter((x) => x.country === c.id).length;
        if (await confirmBox(t('Obriši državu'), t('Obrisati „{name}“ i sve njene izbore ({n})?', { name: esc(c.name), n: k }), t('Obriši'), true)) { S.removeCountry(c.id); render(); }
        break;
      }
      case 'cmp-sort': {
        const st = cmpState(), k = b.dataset.k, so = st.sort || {};
        const numeric = !['country', 'year'].includes(k);
        // prvi klik: brojevi od najvećeg, tekst/godina od najmanjeg; drugi klik obrnuto; treći vraća redosljed po državama
        if (so.k !== k) st.sort = { k, dir: numeric ? -1 : 1 };
        else if (so.dir === (numeric ? -1 : 1)) st.sort = { k, dir: -so.dir };
        else st.sort = null;
        S.save(); render(); break;
      }
      case 'cmp-latest': {
        const st = cmpState();
        // posljednji izbori sa unesenim glasovima
        mselSet('cmp-e', st.countries.map((cid) => elsOf(cid).filter((x) => x.year && x.lists.some((l) => parseNum(l.votes) > 0)).slice(-1)[0]?.id).filter(Boolean)); break;
      }
      case 'msel-toggle': openMsel = openMsel === b.dataset.id ? null : b.dataset.id; render(); break;
      case 'msel-none': mselSet(b.dataset.id, []); break;
      case 'msel-group': { const ids = S.state.elections.filter((x) => x.country === b.dataset.g).map((x) => x.id); const cur = mselGet('cmp-e');
        mselSet('cmp-e', ids.every((x) => cur.includes(x)) ? cur.filter((x) => !ids.includes(x)) : [...cur, ...ids]); break; }
      case 'cmp-links': S.state.vol.a = b.dataset.a; S.state.vol.b = b.dataset.b; S.state.module = 'vol'; S.save(); render(); break;
      case 'clear-links': S.state.links[S.linkKey(S.state.vol.a, S.state.vol.b)] = []; S.save(); render(); break;
    }
  });

  async function newElection(cid) {
    if (!S.state.countries.length) { toast(t('Prvo dodaj državu')); return; }
    const country = typeof cid === 'string' ? cid : (S.current()?.country || S.state.countries[0].id);
    const r = await electionBox(t('Novi izbori – {c}', { c: S.country(country).name }), '', new Date().getFullYear());
    if (!r) return;
    S.newElection(r.name, (i) => `${t('Lista')} ${i}`, country, r.year);
    S.state.collapsed = S.state.collapsed.filter((x) => x !== country);
    S.state.module = 'results'; S.save(); render();
    toast(t('Dodaj liste i unesi glasove i mandate'));
  }
  $('#new-country').addEventListener('click', async () => {
    const n = await promptBox(t('Naziv države'));
    if (!n) return;
    const c = S.newCountry(n); S.save(); renderNav(); newElection(c.id);
  });

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
    const e = ['vol', 'compare'].includes(S.state.module) ? null : S.current();
    const c = e ? S.country(e.country) : null;
    const n = (e ? (c ? c.name + ' ' : '') + elTitle(e) : (S.state.module === 'compare' ? t('poredjenje') : t('volatilnost'))).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/Đ/g, 'Dj').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_');
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
    wb.creator = t('Indeksi izbornih i stranačkih sistema'); wb.created = new Date();
    const blue = 'FF' + (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6) || '0067C0');
    const headStyle = (row) => row.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } }; });
    const addSheet = (name, tb, title) => {
      if (!tb) return;
      const ws = wb.addWorksheet(name);
      ws.addRow([title]).font = { bold: true, size: 13, color: { argb: blue } };
      ws.addRow([]);
      headStyle(ws.addRow(tb.header));
      const clean = (r) => r.map((c) => (typeof c === 'number' && !Number.isFinite(c) ? '' : c));
      tb.rows.forEach((r) => ws.addRow(clean(r)));
      ws.addRow([]);
      tb.summary.forEach((r) => { const x = ws.addRow(clean(r)); x.getCell(1).font = { bold: true }; });
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
      addSheet(t('Rezultati'), MODULES.results.table(e), t('{name} — rezultati i indeksi', { name: elTitle(e) }));
      addSheet(t('Raspodjela'), MODULES.alloc.table(e), t('{name} — raspodjela mandata', { name: elTitle(e) }));
      if (e.units.length >= 2) addSheet(t('Nacionalizacija'), MODULES.nat.table(e), t('{name} — nacionalizacija stranaka (Bochsler 2010)', { name: elTitle(e) }));
    }
    const vt = S.state.elections.length >= 2 ? MODULES.vol.table() : null;
    if (vt) addSheet(t('Volatilnost'), vt, t('Volatilnost'));
    const tt = MODULES.compare.table();
    if (tt) addSheet(t('Poređenje'), tt, t('Poređenje'));
    const src = wb.addWorksheet(t('Izvori'));
    src.addRow([t('Izvori formula')]).font = { bold: true, size: 13, color: { argb: blue } };
    ['results', 'alloc', 'nat', 'vol', 'compare'].forEach((k) => src.addRow([CITE_TEXT(k)]));
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
