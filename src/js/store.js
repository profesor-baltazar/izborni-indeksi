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

  // Starije verzije: poseban cenzus (thr) i garantovani mandati (res) -> tip cenzusa
  function normalize(s) {
    const seeds = window.SEED_ELECTIONS || [];
    s.elections.forEach((e) => {
      // stari nazivi priloženih izbora ("Crna Gora 2006 — parlamentarni izbori") -> "Crna Gora - Parlamentarni izbori 2006"
      const m = /^Crna Gora (\d{4}) — parlamentarni izbori$/.exec(e.name || '');
      if (m) e.name = `Crna Gora - Parlamentarni izbori ${m[1]}`;
      // posebna izborna jedinica (2006, 2009) za podatke sačuvane prije nego što je dodata
      const seed = seeds.find((x) => x.id === e.id);
      if (seed && seed.special && !e.special && e.lists.every((l) => seed.lists.some((x) => x.id === l.id))) e.special = JSON.parse(JSON.stringify(seed.special));
    });
    s.elections.forEach((e) => e.lists.forEach((l) => {
      if (!['opsti', 'manjina', 'hrvati'].includes(l.type)) {
        const t = Number(String(l.thr ?? '').trim().replace(',', '.'));
        l.type = t === 0.7 ? 'manjina' : t === 0.35 ? 'hrvati' : 'opsti';
      }
      delete l.res; delete l.grp; delete l.thr;
    }));
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
      const e = { id: uid('e'), name: name || tr('Novi izbori'), seats: 81, threshold: 3, method: 'dhondt', lists: [], units: [] };
      for (let i = 1; i <= 3; i++) e.lists.push(this.newList(listName(i)));
      this.state.elections.push(e);
      this.state.current = e.id;
      this.save();
      return e;
    },
    newList(name) { return { id: uid('l'), name: name || tr('Nova lista'), votes: 0, seats: 0, type: 'opsti' }; },
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
