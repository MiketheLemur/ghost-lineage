// headless smoke test for the ghost-lineage engine
var GL = require("../lineage.js");
var failures = 0;
function check(cond, label) {
  if (!cond) { failures++; console.error("FAIL: " + label); }
  else console.log("ok: " + label);
}

// determinism: same seed => same history
var a = new GL.World(42), b = new GL.World(42);
for (var i = 0; i < 200; i++) { a.tick(); b.tick(); }
check(a.born === b.born && a.died === b.died && a.alive.length === b.alive.length,
  "deterministic under same seed (born=" + a.born + " died=" + a.died + ")");

// structural invariants
var okTree = true, okNames = true, seen = {};
a.species.forEach(function (sp) {
  if (sp.diedAt !== null && sp.diedAt < sp.bornAt) okTree = false;
  if (sp.parent !== null) {
    var p = a.species[sp.parent - 1];
    if (!p || p.children.indexOf(sp.id) < 0 || p.bornAt > sp.bornAt) okTree = false;
  }
  if (seen[sp.name]) okNames = false;
  seen[sp.name] = true;
});
check(okTree, "parent/child links and birth/death ordering consistent (" + a.species.length + " species)");
check(okNames, "all species names unique");
check(a.alive.every(function (id) { return a.species[id - 1].diedAt === null; }),
  "alive list matches null diedAt");

// life happened: branching occurred and extinctions occurred
check(a.born > 20, "tree branched (born=" + a.born + ")");
check(a.died > 0, "extinctions occurred (died=" + a.died + ")");
check(a.ledger.length > 0 && a.ledger.length <= 400, "ledger populated and capped (" + a.ledger.length + ")");

// bolide actually kills: same seed, one world gets a bolide, other doesn't
var c1 = new GL.World(7), c2 = new GL.World(7);
for (var j = 0; j < 100; j++) { c1.tick(); c2.tick(); }
var d1 = c1.died, d2 = c2.died;
c1.summonBolide();
for (var k = 0; k < 6; k++) { c1.tick(); c2.tick(); }
check((c1.died - d1) > (c2.died - d2),
  "bolide kills more than background (" + (c1.died - d1) + " vs " + (c2.died - d2) + ")");

// total extinction still recovers (life finds a way)
var d = new GL.World(999, { extinction: 50, bolideChance: 0.5 });
for (var m = 0; m < 300; m++) d.tick();
check(d.alive.length > 0, "world never stays dead (alive=" + d.alive.length + ")");

if (failures) { console.error(failures + " FAILURES"); process.exit(1); }
console.log("ALL GREEN");
