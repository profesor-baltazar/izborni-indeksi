// Lokalno čuvanje podataka (offline). U Tauri aplikaciji localStorage je trajan i vezan za ovaj računar.
(function () {
  const KEY = 'izborni-indeksi-v1';
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
    s.elections.forEach((e) => e.lists.forEach((l) => {
      if (!l.type) {
        const t = String(l.thr ?? '').trim();
        l.type = t === '' ? 'opsti' : Number(t.replace(',', '.')) === 0.7 ? 'manjina' : Number(t.replace(',', '.')) === 0.35 ? 'hrvati' : 'drugi';
        l.grp = l.grp || '';
      }
      delete l.res;
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
    newElection(name) {
      const e = { id: uid('e'), name: name || 'Novi izbori', seats: 81, threshold: 3, method: 'dhondt', lists: [], units: [] };
      for (let i = 1; i <= 3; i++) e.lists.push(this.newList('Lista ' + i));
      this.state.elections.push(e);
      this.state.current = e.id;
      this.save();
      return e;
    },
    newList(name) { return { id: uid('l'), name: name || 'Nova lista', votes: 0, seats: 0, type: 'opsti', grp: '', thr: '' }; },
    newUnit(name) { return { id: uid('u'), name: name || 'Nova jedinica', valid: 0, votes: {} }; },
    duplicate(e) {
      const c = JSON.parse(JSON.stringify(e));
      c.id = uid('e'); c.name = e.name + ' (kopija)';
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
