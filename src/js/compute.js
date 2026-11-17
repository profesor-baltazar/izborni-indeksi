// Izborni indeksi - čiste računske funkcije (bez UI-ja), testirane u Node-u.
(function (root) {
  const sum = (a) => a.reduce((s, x) => s + (Number(x) || 0), 0);
  const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

  function shares(values) {
    const t = sum(values);
    return values.map((v) => (t > 0 ? num(v) / t : 0));
  }

  // Gallagher (1991): LSq = sqrt( 1/2 * sum (v_i - s_i)^2 ), v i s u procentima
  function lsq(votes, seats) {
    const v = shares(votes), s = shares(seats);
    let acc = 0;
    for (let i = 0; i < v.length; i++) acc += (v[i] * 100 - s[i] * 100) ** 2;
    return Math.sqrt(acc / 2);
  }

  // Laakso i Taagepera (1979): N = 1 / sum p_i^2
  function enp(values) {
    const p = shares(values);
    const h = p.reduce((s, x) => s + x * x, 0);
    return h > 0 ? 1 / h : NaN;
  }

  // Raspodjela mandata (D'Hondt, Sainte-Laguë, Hare–Niemeyer) sa cenzusom po listi.
  // types[i]: 'opsti' (opšti cenzus), 'manjina' (manjinska lista), 'hrvati' (lista hrvatskog naroda), 'drugi' (thresholds[i] %)
  // groups[i]: naziv manjine; liste iste manjine se sabiraju (čl. 94 st. 2 t. 1 Zakona o izboru odbornika i poslanika)
  // rules: { minority: 0.7, cap: 3, croat: 0.35 }
  function divisorAlloc(v, seats, method) {
    const out = v.map(() => 0);
    let tie = false;
    if (!v.some((x) => x > 0) || seats <= 0) return { seats: out, tie };
    if (method === 'hare') {
      const ev = sum(v), q = ev / seats;
      const rem = v.map((x, i) => { out[i] = Math.floor(x / q); return { i, r: x / q - out[i], x }; }).filter((r) => r.x > 0);
      const left = seats - sum(out);
      rem.sort((a, b) => b.r - a.r || b.x - a.x);
      if (left > 0 && left < rem.length && Math.abs(rem[left - 1].r - rem[left].r) < 1e-12) tie = true;
      for (let k = 0; k < left && k < rem.length; k++) out[rem[k].i]++;
      return { seats: out, tie };
    }
    const div = method === 'sainte-lague' ? (s) => 2 * s + 1 : (s) => s + 1;
    let lastQ = null;
    for (let k = 0; k < seats; k++) {
      let best = -1, bq = -1;
      v.forEach((x, i) => { if (x <= 0) return; const q = x / div(out[i]); if (q > bq || (q === bq && x > v[best])) { bq = q; best = i; } });
      if (best < 0) break;
      out[best]++; lastQ = bq;
    }
    if (lastQ !== null) v.forEach((x, i) => { if (x > 0 && Math.abs(x / div(out[i]) - lastQ) < 1e-9) tie = true; });
    return { seats: out, tie };
  }

  function allocate({ votes, seats, method = 'dhondt', threshold = 3, types = [], groups = [], thresholds = [], rules = {} }) {
    const R = { minority: 0.7, cap: 3, croat: 0.35, ...rules };
    const n = votes.length, V = votes.map(num), total = sum(V);
    const pct = (i) => (total > 0 ? (V[i] / total) * 100 : 0);
    const type = (i) => types[i] || 'opsti';
    const out = new Array(n).fill(0);
    const eff = V.map((_, i) => (type(i) === 'manjina' ? R.minority : type(i) === 'hrvati' ? R.croat : type(i) === 'drugi' ? num(thresholds[i]) : threshold));
    const eligible = new Array(n).fill(false);
    const note = new Array(n).fill('');
    // 1) liste sa opštim ili sopstvenim cenzusom
    const units = []; // { members:[i], votes, cap }
    for (let i = 0; i < n; i++) {
      const t = type(i);
      if ((t === 'opsti' || t === 'drugi') && V[i] > 0 && pct(i) >= eff[i]) units.push({ members: [i], votes: V[i] });
    }
    // 2) manjinske liste: koja pređe opšti cenzus, ide samostalno; inače se liste iste manjine sa >= 0,7% sabiraju (najviše 3 mandata)
    const grpNames = [...new Set(V.map((_, i) => (type(i) === 'manjina' ? String(groups[i] || '').trim().toLowerCase() || '#' + i : null)).filter(Boolean))];
    grpNames.forEach((g) => {
      const mem = V.map((_, i) => i).filter((i) => type(i) === 'manjina' && (String(groups[i] || '').trim().toLowerCase() || '#' + i) === g);
      const over = mem.filter((i) => pct(i) >= threshold);
      if (over.length) { over.forEach((i) => units.push({ members: [i], votes: V[i] })); return; }
      const ok = mem.filter((i) => V[i] > 0 && pct(i) >= R.minority);
      if (ok.length) { units.push({ members: ok, votes: sum(ok.map((i) => V[i])), cap: R.cap, pooled: ok.length > 1 }); ok.forEach((i) => (note[i] = ok.length > 1 ? 'zbirna lista' : '')); }
    });
    // 3) hrvatske liste: samostalno ako pređu opšti cenzus; inače najuspješnija sa >= 0,35% dobija jedan mandat
    const cro = V.map((_, i) => i).filter((i) => type(i) === 'hrvati');
    let fixed = 0;
    const croOver = cro.filter((i) => pct(i) >= threshold);
    if (croOver.length) croOver.forEach((i) => units.push({ members: [i], votes: V[i] }));
    else if (cro.length) {
      const best = cro.reduce((a, b) => (V[b] > V[a] ? b : a));
      if (pct(best) >= R.croat && V[best] > 0) { out[best] = 1; fixed = 1; eligible[best] = true; note[best] = '1 mandat (0,35%)'; }
    }
    units.forEach((u) => u.members.forEach((i) => (eligible[i] = true)));
    // 4) raspodjela među jedinicama, uz ograničenje broja mandata zbirnih lista
    let active = units.slice(), avail = Math.max(0, seats - fixed), tie = false, guard = 0;
    const unitSeats = new Map();
    while (guard++ < 50) {
      const r = divisorAlloc(active.map((u) => u.votes), avail, method);
      const over = active.findIndex((u, k) => u.cap && r.seats[k] > u.cap);
      if (over < 0) { active.forEach((u, k) => unitSeats.set(u, r.seats[k])); tie = r.tie; break; }
      unitSeats.set(active[over], active[over].cap);
      avail -= active[over].cap;
      active = active.filter((_, k) => k !== over);
    }
    // 5) mandati zbirne liste dijele se među njenim listama istom metodom
    units.forEach((u) => {
      const s = unitSeats.get(u) || 0;
      if (u.members.length === 1) out[u.members[0]] += s;
      else { const r = divisorAlloc(u.members.map((i) => V[i]), s, method); u.members.forEach((i, k) => (out[i] += r.seats[k])); }
    });
    return { seats: out, eligible, tie, eff, note };
  }

  // Bochsler (2010): ponderisani PNS i standardizovani PNS (10 jedinica).
  // valid[i] = važeći glasovi u jedinici i; pv[i] = glasovi stranke u jedinici i
  function pnsParty(valid, pv) {
    const units = valid.map((v, i) => ({ v: num(v), p: num(pv[i]) })).filter((u) => u.v > 0);
    const V = sum(units.map((u) => u.v)), P = sum(units.map((u) => u.p));
    if (V <= 0 || P <= 0) return { pnsw: NaN, spns: NaN, coverage: 0 };
    units.sort((a, b) => a.p / a.v - b.p / b.v);
    let cum = 0, acc = 0;
    for (const u of units) { cum += u.p; acc += u.v * (cum - u.p / 2); }
    const pnsw = (2 * acc) / (V * P);
    const E = effectiveUnits(valid);
    const spns = E > 1 ? Math.pow(pnsw, 1 / Math.log10(E)) : NaN;
    const coverage = sum(units.filter((u) => u.p > 0).map((u) => u.v)) / V;
    return { pnsw, spns, coverage };
  }

  function effectiveUnits(valid) {
    const V = sum(valid);
    const sq = valid.reduce((s, v) => s + num(v) ** 2, 0);
    return sq > 0 ? (V * V) / sq : NaN;
  }

  // units: [{valid, votes:[po strankama]}]; nationalVotes opciono (inače zbir jedinica)
  function nationalisation(units, partyCount, nationalVotes) {
    const valid = units.map((u) => num(u.valid));
    const parties = [];
    for (let j = 0; j < partyCount; j++) parties.push(pnsParty(valid, units.map((u) => u.votes[j])));
    const nat = nationalVotes && sum(nationalVotes) > 0 ? nationalVotes.map(num)
      : Array.from({ length: partyCount }, (_, j) => sum(units.map((u) => u.votes[j])));
    const w = shares(nat);
    let sw = 0, ss = 0, wsum = 0, wsum2 = 0;
    parties.forEach((r, j) => {
      if (Number.isFinite(r.pnsw)) { sw += w[j] * r.pnsw; wsum += w[j]; }
      if (Number.isFinite(r.spns)) { ss += w[j] * r.spns; wsum2 += w[j]; }
    });
    const districtEnp = units.map((u) => enp(u.votes));
    const vw = shares(valid);
    const n2district = districtEnp.reduce((s, x, i) => s + (Number.isFinite(x) ? x * vw[i] : 0), 0);
    return {
      parties,
      systemPnsw: wsum > 0 ? sw / wsum : NaN,
      systemSpns: wsum2 > 0 ? ss / wsum2 : NaN,
      E: effectiveUnits(valid),
      n2national: enp(nat),
      n2district,
      unitCount: units.filter((u) => num(u.valid) > 0).length,
    };
  }

  // Volatilnost: Pedersen (1979); podjela na tip A i B po Powell i Tucker (2014).
  // a, b: [{id, name, value}] (glasovi ili mandati); links: [[idA, idB], ...]
  function volatility(a, b, links) {
    const sa = shares(a.map((x) => x.value)), sb = shares(b.map((x) => x.value));
    const parent = {};
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const unite = (x, y) => { parent[find(x)] = find(y); };
    a.forEach((x) => (parent['A:' + x.id] = 'A:' + x.id));
    b.forEach((x) => (parent['B:' + x.id] = 'B:' + x.id));
    links.forEach(([ia, ib]) => { if (parent['A:' + ia] && parent['B:' + ib]) unite('A:' + ia, 'B:' + ib); });
    const groups = {};
    const g = (k) => (groups[find(k)] = groups[find(k)] || { A: [], B: [], pa: 0, pb: 0 });
    a.forEach((x, i) => { const G = g('A:' + x.id); G.A.push(x.name); G.pa += sa[i] * 100; });
    b.forEach((x, i) => { const G = g('B:' + x.id); G.B.push(x.name); G.pb += sb[i] * 100; });
    let total = 0, typeA = 0, typeB = 0;
    const rows = Object.values(groups).map((G) => {
      const d = G.pb - G.pa;
      const kind = G.A.length && G.B.length ? 'stabilna' : G.A.length ? 'izašla' : 'nova';
      total += Math.abs(d) / 2;
      if (kind === 'stabilna') typeB += Math.abs(d) / 2; else typeA += Math.abs(d) / 2;
      return { from: G.A, to: G.B, pa: G.pa, pb: G.pb, change: d, kind };
    });
    rows.sort((x, y) => Math.abs(y.change) - Math.abs(x.change));
    return { total, typeA, typeB, rows };
  }

  const api = { sum, shares, lsq, enp, allocate, pnsParty, effectiveUnits, nationalisation, volatility };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Indices = api;
})(this);
