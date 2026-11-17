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

  // Raspodjela mandata. thresholds: niz (u %), null/'' = koristi opšti cenzus.
  // reserved: garantovani mandati po listi (posebna pravila za manjinske liste);
  // takva lista dobija tačno toliko mandata i ne učestvuje u raspodjeli ostatka.
  function allocate({ votes, seats, method = 'dhondt', threshold = 0, thresholds = [], reserved = [] }) {
    const total = sum(votes);
    const n = votes.length;
    const res = votes.map((_, i) => Math.max(0, Math.floor(num(reserved[i]))));
    const eligible = votes.map((v, i) => {
      if (res[i] > 0) return false;
      const t = thresholds[i] === null || thresholds[i] === undefined || thresholds[i] === '' ? threshold : Number(thresholds[i]);
      return total > 0 && (num(v) / total) * 100 >= t && num(v) > 0;
    });
    const out = res.slice();
    seats = Math.max(0, seats - sum(res));
    let tie = false;
    if (method === 'hare') {
      const ev = votes.reduce((s, v, i) => s + (eligible[i] ? num(v) : 0), 0);
      if (ev === 0) return { seats: out, eligible, tie };
      const q = ev / seats;
      const rem = [];
      votes.forEach((v, i) => {
        if (!eligible[i]) return;
        const exact = num(v) / q;
        out[i] = Math.floor(exact);
        rem.push({ i, r: exact - out[i], v: num(v) });
      });
      let left = seats - rem.reduce((s, x) => s + out[x.i], 0);
      rem.sort((a, b) => b.r - a.r || b.v - a.v);
      if (left > 0 && left < rem.length && rem[left - 1].r === rem[left].r) tie = true;
      for (let k = 0; k < left && k < rem.length; k++) out[rem[k].i]++;
      return { seats: out, eligible, tie, quota: q };
    }
    const div = method === 'sainte-lague' ? (s) => 2 * s + 1 : (s) => s + 1;
    let lastQ = null;
    const start = sum(out);
    for (let k = 0; k < seats; k++) {
      let best = -1, bq = -1;
      for (let i = 0; i < n; i++) {
        if (!eligible[i]) continue;
        const q = num(votes[i]) / div(out[i]);
        if (q > bq || (q === bq && num(votes[i]) > num(votes[best]))) { bq = q; best = i; }
      }
      if (best < 0) break;
      out[best]++;
      lastQ = bq;
    }
    // provjera neriješenog posljednjeg mandata
    if (lastQ !== null) {
      for (let i = 0; i < n; i++) if (eligible[i] && Math.abs(num(votes[i]) / div(out[i]) - lastQ) < 1e-9) tie = true;
    }
    return { seats: out, eligible, tie };
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
