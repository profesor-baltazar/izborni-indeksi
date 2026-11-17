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

const r = I.allocate({ votes: V, seats: 81, threshold: 3, thresholds: e.lists.map((l) => (l.thr === '' ? null : Number(l.thr))), reserved: e.lists.map((l) => l.res) });
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
// Raspodjela mandata svih izbora (osim 2009, kad je postojala posebna izborna jedinica za albansku manjinu)
for (const x of window.SEED_ELECTIONS.filter((x) => x.id !== 'cg2009')) {
  const a = I.allocate({ votes: x.lists.map((l) => l.votes), seats: 81, threshold: 3, thresholds: x.lists.map((l) => (l.thr === '' ? null : Number(l.thr))), reserved: x.lists.map((l) => l.res) });
  assert.deepStrictEqual(a.seats, x.lists.map((l) => l.seats), "D'Hondt " + x.id);
}
// Nacionalizacija 2023 (Bochsler, Nacionalization_Index_2023)
const e23 = window.SEED_ELECTIONS.find((x) => x.id === 'cg2023');
const n23 = I.nationalisation(e23.units.map((u) => ({ valid: u.valid, votes: e23.lists.map((l) => u.votes[l.id]) })), e23.lists.length);
close(n23.systemPnsw, 0.728396, 1e-6, 'PNSw 2023'); close(n23.systemSpns, 0.716889, 1e-6, 'sPNS 2023'); close(n23.E, 8.796419, 1e-6, 'E 2023');
console.log('Svi testovi prošli.');
