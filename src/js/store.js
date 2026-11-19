// Lokalno čuvanje podataka (offline). U Tauri aplikaciji localStorage je trajan i vezan za ovaj računar.
(function () {
  const KEY = 'izborni-indeksi-v1';
  const tr = (s) => (window.I18N ? window.I18N.t(s) : s);
  const uid = (p) => p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.elections)) return s;
    } catch (e) { /* prazno ili oštećeno -> počni od primjera */ }
    return {
      elections: JSON.parse(JSON.stringify(window.SEED_ELECTIONS || [])),
      links: {},
      current: (window.SEED_ELECTIONS || []).slice(-1)[0]?.id || null,
      module: 'results',
      vol: { a: null, b: null, basis: 'votes' },
    };
  }

  const RULE_DEF = {
    manjina: { id: 'manjina', name: 'Manjinski', kind: 'pool', pct: 0.7, cap: 3 },
    hrvati: { id: 'hrvati', name: 'Hrvatski', kind: 'guar', pct: 0.35, seats: 1 },
  };
  function normalizeRules(e) {
    if (!Array.isArray(e.rules)) e.rules = [];
    if (!e.rules.some((r) => r.id === 'opsti')) e.rules.unshift({ id: 'opsti', name: 'Opšti', kind: 'own' });
    e.lists.forEach((l) => {
      if (l.rule === undefined) {
        const t = l.type && l.type !== 'opsti' ? l.type : 'opsti';
        if (RULE_DEF[t] && !e.rules.some((r) => r.id === t)) e.rules.push({ ...RULE_DEF[t] });
        l.rule = RULE_DEF[t] ? t : 'opsti';
      }
      delete l.type;
      if (!e.rules.some((r) => r.id === l.rule)) l.rule = 'opsti';
    });
    if (e.special && e.special.transfer === undefined) e.special.transfer = true;
  }
  // Starije verzije: poseban cenzus (thr) i garantovani mandati (res) -> tip cenzusa
  function normalize(s) {
    const seeds = window.SEED_ELECTIONS || [];
    s.elections.forEach((e) => {
      // stari nazivi priloženih izbora ("Crna Gora 2006 — parlamentarni izbori") -> "Crna Gora - Parlamentarni izbori 2006"
      const m = /^Crna Gora (\d{4}) — parlamentarni izbori$/.exec(e.name || '');
      if (m) e.name = `Crna Gora - Parlamentarni izbori ${m[1]}`;
      // posebna izborna jedinica (2006, 2009) za podatke sačuvane prije nego što je dodata
      const seed = seeds.find((x) => x.id === e.id);
      if (seed && seed.special && e.special === undefined && e.lists.every((l) => seed.lists.some((x) => x.id === l.id))) e.special = JSON.parse(JSON.stringify(seed.special));
      // zvanični broj važećih glasova (za provjeru unosa)
      // 2006: "Demokratska stranka Crne Gore – dio koji nedostaje" ima 1.286 glasova (u odluci RIK-a greškom 1.284)
      if (seed && e.id === 'cg2006') { const l = e.lists.find((x) => x.id === 'y2006l5'); if (l && Number(l.votes) === 1284) l.votes = 1286; }
      if (seed && e.validTotal === undefined) e.validTotal = seed.validTotal;
      // 2020: u Bochslerovom fajlu Rožaje greškom nose naziv "Tuzi"; ispravke naziva opština
      if (seed && e.id === 'cg2020') e.units.forEach((u) => { const su = seed.units.find((x) => x.id === u.id); if (su && u.name !== su.name && (u.name === 'Tuzi' || su.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === u.name)) u.name = su.name; });
    });
    s.elections.forEach((e) => {
      e.lists.forEach((l) => {
        if (l.rule === undefined && !['opsti', 'manjina', 'hrvati'].includes(l.type)) {
          const t = Number(String(l.thr ?? '').trim().replace(',', '.'));
          l.type = t === 0.7 ? 'manjina' : t === 0.35 ? 'hrvati' : 'opsti';
        }
        delete l.res; delete l.grp; delete l.thr;
      });
      // do 1.1: fiksni tipovi cenzusa (opsti/manjina/hrvati) -> pravila cenzusa izbora
      normalizeRules(e);
    });
    return s;
  }

  const Store = {
    state: normalize(load()),
    uid,
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { console.error(e); }
    },
    current() { return this.state.elections.find((e) => e.id === this.state.current) || null; },
    byId(id) { return this.state.elections.find((e) => e.id === id) || null; },
    newElection(name, listName = (i) => 'Lista ' + i) {
      const e = { id: uid('e'), name: name || tr('Novi izbori'), seats: 81, threshold: 3, method: 'dhondt', validTotal: '', rules: [{ id: 'opsti', name: 'Opšti', kind: 'own' }], lists: [], units: [] };
      for (let i = 1; i <= 3; i++) e.lists.push(this.newList(listName(i)));
      this.state.elections.push(e);
      this.state.current = e.id;
      this.save();
      return e;
    },
    newList(name) { return { id: uid('l'), name: name || tr('Nova lista'), votes: 0, seats: 0, rule: 'opsti' }; },
    newUnit(name) { return { id: uid('u'), name: name || tr('Nova jedinica'), valid: 0, votes: {} }; },
    duplicate(e, suffix = ' (kopija)') {
      const c = JSON.parse(JSON.stringify(e));
      c.id = uid('e'); c.name = e.name + suffix;
      this.state.elections.push(c); this.state.current = c.id; this.save();
      return c;
    },
    remove(id) {
      this.state.elections = this.state.elections.filter((e) => e.id !== id);
      Object.keys(this.state.links).forEach((k) => { if (k.includes(id)) delete this.state.links[k]; });
      if (this.state.current === id) this.state.current = this.state.elections[0]?.id || null;
      this.save();
    },
    linkKey(a, b) { return a + '|' + b; },
    replaceAll(s) { this.state = normalize(s); this.save(); },
  };
  window.Store = Store;
})();
