// Provjera proračuna na primjeru CG 2020 (očekivane vrijednosti iz originalnih Excel alata).
// Pokretanje: npm test
const assert = require('assert');
const I = require('../src/js/compute.js');
global.window = {};
require('../src/js/seed.js');
const e = window.SEED_ELECTIONS.find((x) => x.id === 'cg2020');
const V = e.lists.map((l) => l.votes), S = e.lists.map((l) => l.seats);
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} != ${b}`);

close(I.enp(V), 3.964396, 1e-6, 'ENEP');
close(I.enp(S), 3.708875, 1e-6, 'ENPP');
close(I.lsq(V, S), 1.7064, 1e-3, 'LSq'); // Gallagherov fajl daje 1,7043 jer zaokružuje procente na 2 decimale

// pravila cenzusa iz podataka izbora (kao u aplikaciji)
const rulesOf = (x) => x.lists.map((l) => { const r = x.rules.find((q) => q.id === l.rule); return !r || r.id === 'opsti' ? null : { key: r.id, ...r }; });
const args = (x) => ({ votes: x.lists.map((l) => l.votes), seats: 81, threshold: 3, rules: rulesOf(x) });
const r = I.allocate(args(e));
assert.deepStrictEqual(r.seats, S, "D'Hondt CG 2020");

const units = e.units.map((u) => ({ valid: u.valid, votes: e.lists.map((l) => u.votes[l.id]) }));
const n = I.nationalisation(units, e.lists.length);
const pnsw = [0.666763, 0.2578, 0.34788, 0.751171, 0.609342, 0.68751, 0.092161, 0.922271, 0.8062, 0.099751, 0.767277];
const spns = [0.636634, 0.220863, 0.308401, 0.727048, 0.575862, 0.658743, 0.070214, 0.913797, 0.786629, 0.076686, 0.744436];
n.parties.forEach((p, i) => { close(p.pnsw, pnsw[i], 1e-6, 'PNSw ' + i); close(p.spns, spns[i], 1e-6, 'sPNS ' + i); });
close(n.systemPnsw, 0.785371, 1e-6, 'PNSw sistema');
close(n.systemSpns, 0.767352, 1e-6, 'sPNS sistema');
close(n.E, 7.899557, 1e-6, 'E');
close(n.n2district, 3.535673, 1e-6, 'N2 jedinice');

const vol = I.volatility(
  [{ id: 'a', name: 'A', value: 40 }, { id: 'b', name: 'B', value: 35 }, { id: 'c', name: 'C', value: 25 }],
  [{ id: 'a', name: 'A', value: 30 }, { id: 'bc', name: 'B+C', value: 50 }, { id: 'd', name: 'D', value: 20 }],
  [['a', 'a'], ['b', 'bc'], ['c', 'bc']]
);
close(vol.total, 20, 1e-9, 'TV'); close(vol.typeA, 10, 1e-9, 'Tip A'); close(vol.typeB, 10, 1e-9, 'Tip B');
// Raspodjela mandata po zakonskim pravilima (od 2012; 2006. i 2009. imale su posebnu izbornu jedinicu za Albance)
for (const x of window.SEED_ELECTIONS.filter((x) => !['cg2006', 'cg2009'].includes(x.id))) {
  const a = I.allocate(args(x));
  assert.deepStrictEqual(a.seats, x.lists.map((l) => l.seats), "D'Hondt " + x.id);
}
// Nacionalizacija 2023 (Bochsler, Nacionalization_Index_2023)
const e23 = window.SEED_ELECTIONS.find((x) => x.id === 'cg2023');
const n23 = I.nationalisation(e23.units.map((u) => ({ valid: u.valid, votes: e23.lists.map((l) => u.votes[l.id]) })), e23.lists.length);
close(n23.systemPnsw, 0.728396, 1e-6, 'PNSw 2023'); close(n23.systemSpns, 0.716889, 1e-6, 'sPNS 2023'); close(n23.E, 8.796419, 1e-6, 'E 2023');
// 2006. i 2009: posebna izborna jedinica (čl. 94a tada važećeg zakona)
for (const id of ['cg2006', 'cg2009']) {
  const x = window.SEED_ELECTIONS.find((y) => y.id === id);
  const a = I.allocateSpecial({ votes: x.lists.map((l) => l.votes), seats: 81, threshold: 3,
    special: { seats: x.special.seats, votes: x.lists.map((l) => x.special.votes[l.id]) } });
  assert.deepStrictEqual(a.seats, x.lists.map((l) => l.seats), 'Posebna jedinica ' + id);
}
// Dodatni indeksi: jednostavni primjeri + 2020 (nezavisno izračunato u Pythonu)
close(I.lh([50, 30, 20], [60, 30, 10]), 10, 1e-9, 'LH primjer');
close(I.slIndex([50, 50], [75, 25]), 25, 1e-9, 'SL primjer');            // (25²/50 + 25²/50)
close(I.raeF([60, 40]), 0.48, 1e-12, 'Rae F primjer');
close(I.golosov([50, 50]), 2, 1e-12, 'Golosov dvije jednake');
close(I.golosov([100]), 1, 1e-12, 'Golosov jedna');
close(I.lh(V, S), 2.8565717875663723, 1e-9, 'LH 2020');
close(I.slIndex(V, S), 0.8724386514840975, 1e-9, 'SL 2020');
close(I.raeF(V), 0.7477547650043894, 1e-12, 'F glasovi 2020'); close(I.raeF(S), 0.7303764670019814, 1e-12, 'F mandati 2020');
close(I.golosov(V), 3.7404036071389055, 1e-9, 'Golosov glasovi 2020'); close(I.golosov(S), 3.445795070270455, 1e-9, 'Golosov mandati 2020');
close(I.advantage(V, S)[7], 1.0565239663940147, 1e-9, 'Odnos prednosti DPS 2020');
// Zvanični broj važećih glasova (provjera unosa): zbir glasova lista mora biti jednak
for (const x of window.SEED_ELECTIONS) {
  assert.strictEqual(x.lists.reduce((a, l) => a + l.votes, 0), x.validTotal, 'Važeći glasovi ' + x.id);
  assert.strictEqual(x.lists.reduce((a, l) => a + l.seats, 0), 81, 'Mandati ' + x.id);
}
// Pravila cenzusa, opšti slučajevi
{
  const v = [500, 300, 150, 30, 20];
  // bez pravila: cenzus 5% -> 30 i 20 ne ulaze
  assert.deepStrictEqual(I.allocate({ votes: v, seats: 10, threshold: 5 }).seats, [6, 3, 1, 0, 0], 'opšti cenzus');
  // izuzeće od cenzusa (0%) za posljednju listu
  const ex = I.allocate({ votes: v, seats: 10, threshold: 5, rules: [null, null, null, null, { key: 'm', kind: 'own', pct: 0 }] });
  assert.strictEqual(ex.eligible[4], true, 'izuzeće 0%');
  // viši cenzus za koalicije (8%): lista sa 15% ulazi, lista sa 3% ne
  const co = I.allocate({ votes: v, seats: 10, threshold: 5, rules: [null, null, { key: 'k', kind: 'own', pct: 8 }, { key: 'k', kind: 'own', pct: 8 }, null] });
  assert.deepStrictEqual([co.eligible[2], co.eligible[3]], [true, false], 'cenzus za koalicije');
  // uvećani količnici: D'Hondt sa 35% uvećanja jednak je raspodjeli na glasove x 1,35
  const bo = I.allocate({ votes: [1000, 600, 100], seats: 20, threshold: 0, rules: [null, null, { key: 'b', kind: 'bonus', pct: 0, bonus: 35 }] });
  const ref = I.allocate({ votes: [1000, 600, 135], seats: 20, threshold: 0 });
  assert.deepStrictEqual(bo.seats, ref.seats, 'uvećani količnici');
  // posebna jedinica bez prenosa = dvije odvojene raspodjele
  const sp = I.allocateSpecial({ votes: [600, 400], seats: 10, threshold: 3, special: { seats: 2, votes: [100, 300], transfer: false } });
  assert.deepStrictEqual(sp.general, [7, 1], 'opšti dio'); assert.deepStrictEqual(sp.special, [0, 2], 'posebni dio');
  assert.deepStrictEqual(sp.seats, [7, 3], 'zbir');
}
// Opštinski rezultati (nacionalizacija): zbir po jedinicama = zvanični važeći glasovi; u svakoj jedinici važeći = zbir glasova lista
for (const x of window.SEED_ELECTIONS) {
  assert.ok(x.units.length >= 22, 'Jedinice ' + x.id);
  assert.strictEqual(x.units.reduce((a, u) => a + u.valid, 0), x.validTotal, 'Zbir jedinica ' + x.id);
  for (const u of x.units) assert.strictEqual(Object.values(u.votes).reduce((a, v) => a + v, 0), u.valid, 'Jedinica ' + x.id + ' ' + u.name);
  for (const l of x.lists) assert.strictEqual(x.units.reduce((a, u) => a + (u.votes[l.id] || 0), 0), l.votes, 'Lista po jedinicama ' + x.id + ' ' + l.name);
  const n = I.nationalisation(x.units.map((u) => ({ valid: u.valid, votes: x.lists.map((l) => u.votes[l.id] || 0) })), x.lists.length);
  assert.ok(n.systemPnsw > 0 && n.systemPnsw < 1 && n.systemSpns > 0 && n.systemSpns < 1, 'PNS ' + x.id);
  // izlaznost: glasali ≥ važeći + nevažeći − 2 (zvanične odluke same imaju razliku do 2 listića)
  assert.ok(Math.abs(x.voted - x.validTotal - x.invalid) <= 2, 'Izlaznost ' + x.id);
}
console.log('Svi testovi prošli.');
