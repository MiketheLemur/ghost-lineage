"use strict";
// ghost-lineage engine — a phylogenetic tree machine.
// No DOM, no dependencies. Runs in Node (require) and in the browser (global).
// One tick = one million years. Species branch, drift, and mostly die.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

var GENUS_A = ["lem", "macr", "noc", "ten", "sif", "cheir", "ind", "eur", "had", "vag", "micr", "cerc", "gal", "oto"];
var GENUS_B = ["ur", "oris", "agus", "ites", "ops", "ella", "odon", "ax", "emus", "ula"];
var EPI_A = ["parv", "magn", "noct", "diur", "vel", "sylv", "rhip", "aeth", "crypt", "pall", "fusc", "alb", "brev", "long"];
var EPI_B = ["us", "a", "is", "or", "ix", "ula", "ensis"];

function World(seed, opts) {
  this.rng = mulberry32((seed >>> 0) || 1);
  this.params = Object.assign(
    { mutation: 0.15, extinction: 1.0, speciation: 0.06, bolideChance: 0.02, carrying: 120 },
    opts || {}
  );
  this.t = 0;
  this.env = { heat: 0, wet: 0 }; // the optimum the world is currently shopping for
  this.species = [];              // every species ever, index by id-1
  this.alive = [];                // ids currently walking the earth
  this.ledger = [];               // event log, newest first, capped
  this.nextId = 1;
  this.usedNames = {};
  this.bolideTicks = 0;
  this.born = 0; this.died = 0;
  var root = this._spawn(null, { size: 0, armor: 0, noct: 0, spd: 0 }, "Prolemur primigenius");
  this._log("birth", root, "Life wakes up. Prolemur primigenius crawls out of the ledger.");
}

World.prototype._pick = function (arr) {
  return arr[Math.floor(this.rng() * arr.length)];
};

World.prototype._gauss = function () {
  // Box–Muller, mean 0, sd 1
  var u = 1 - this.rng(), v = this.rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

World.prototype._traitName = function (traits) {
  // epithet suffix nudged by dominant trait, so names hint at the animal
  if (traits.noct > 1.2) return "noctis";
  if (traits.armor > 1.2) return "armata";
  if (traits.size > 1.2) return "gigas";
  if (traits.size < -1.2) return "minuta";
  if (traits.spd > 1.2) return "velox";
  return null;
};

World.prototype._name = function (traits) {
  var name;
  for (var tries = 0; tries < 50; tries++) {
    var hint = this._traitName(traits);
    var epi = hint || (this._pick(EPI_A) + this._pick(EPI_B));
    name = this._pick(GENUS_A) + this._pick(GENUS_B) + " " + epi;
    if (!this.usedNames[name]) break;
  }
  var n = 2;
  while (this.usedNames[name]) { name = name + " " + n; n++; }
  this.usedNames[name] = true;
  return name;
};

World.prototype._spawn = function (parentId, traits, forcedName) {
  var sp = {
    id: this.nextId++,
    name: forcedName || this._name(traits),
    parent: parentId,
    children: [],
    bornAt: this.t,
    diedAt: null,
    traits: { size: traits.size, armor: traits.armor, noct: traits.noct, spd: traits.spd },
    lineage: 0
  };
  this.species.push(sp);
  this.alive.push(sp.id);
  this.born++;
  if (parentId !== null) {
    var p = this.species[parentId - 1];
    p.children.push(sp.id);
    sp.lineage = p.lineage + 1;
  }
  return sp;
};

World.prototype._maladapt = function (traits) {
  // how far the animal is from what the world currently rewards
  var e = this.env;
  return (Math.abs(traits.size - e.heat) +
          Math.abs(traits.armor + e.heat) +
          Math.abs(traits.noct - e.wet) +
          Math.abs(traits.spd + e.wet)) / 4;
};

World.prototype._log = function (type, sp, text) {
  this.ledger.unshift({ t: this.t, type: type, name: sp.name, text: text });
  if (this.ledger.length > 400) this.ledger.length = 400;
};

World.prototype._kill = function (sp, cause) {
  sp.diedAt = this.t;
  var i = this.alive.indexOf(sp.id);
  if (i >= 0) this.alive.splice(i, 1);
  this.died++;
  var age = this.t - sp.bornAt;
  var epitaph = cause === "bolide"
    ? " — the sky fell and it had nowhere to hide."
    : (age > 60 ? " — a living fossil, outlasted everything, then didn't."
      : this._maladapt(sp.traits) > 1.5 ? " — the world moved on and it couldn't follow."
      : " — chance is a predator too.");
  this._log("death", sp, "† " + sp.name + " dies after " + age + " Myr" + epitaph);
};

World.prototype._speciate = function (parent) {
  var m = this.params.mutation;
  var child = this._spawn(parent.id, {
    size: parent.traits.size + this._gauss() * m,
    armor: parent.traits.armor + this._gauss() * m,
    noct: parent.traits.noct + this._gauss() * m,
    spd: parent.traits.spd + this._gauss() * m
  });
  this._log("birth", child, "✦ " + child.name + " buds off " + parent.name + ".");
};

World.prototype.tick = function () {
  var self = this, r = this.rng, p = this.params;
  this.t++;

  // the climate wanders
  this.env.heat = Math.max(-2.5, Math.min(2.5, this.env.heat + (r() - 0.5) * 0.5));
  this.env.wet = Math.max(-2.5, Math.min(2.5, this.env.wet + (r() - 0.5) * 0.5));

  // bolides: rare, rude, non-negotiable
  if (this.bolideTicks > 0) {
    this.bolideTicks--;
    if (this.bolideTicks === 0) {
      var s = this.alive.map(function (id) { return self.species[id - 1]; });
      this._log("bolide", s[0] || this.species[0], "☄ The dust settles. The survivors look around at all the room.");
    }
  } else if (r() < p.bolideChance) {
    this.bolideTicks = 3;
    this._log("bolide", this.species[this.alive[0] - 1] || this.species[0],
      "☄ BOLIDE. A rock the size of a bad decision crosses the sky.");
  }
  var doom = this.bolideTicks > 0 ? 8 : 1;

  var crowding = Math.min(1, this.alive.length / p.carrying);
  var snapshot = this.alive.slice(); // births/deaths during tick don't act this tick
  var self2 = this;
  snapshot.forEach(function (id) {
    var sp = self2.species[id - 1];
    if (sp.diedAt !== null) return;
    var px = Math.min(0.9, (0.012 + self2._maladapt(sp.traits) * 0.045) * p.extinction * doom + crowding * 0.02);
    if (r() < px) { self2._kill(sp, doom > 1 ? "bolide" : "drift"); return; }
    var pq = p.speciation * (1 - crowding * 0.8);
    if (r() < pq && self2.born < 3000) self2._speciate(sp);
  });

  // if everything dies, life finds a way — one scrappy survivor restarts the tree
  if (this.alive.length === 0) {
    var last = this.species[this.species.length - 1];
    var fresh = this._spawn(last.id, { size: this.env.heat, armor: -this.env.heat, noct: this.env.wet, spd: -this.env.wet });
    this._log("birth", fresh, "✦ From the ash, " + fresh.name + ". Somebody always makes it. Annoying, really.");
  }
};

World.prototype.summonBolide = function () {
  this.bolideTicks = 3;
  var s = this.species[this.alive[0] - 1];
  this._log("bolide", s, "☄ BOLIDE, summoned. A rock the size of a bad decision crosses the sky.");
};

World.prototype.longestLineage = function () {
  var best = null;
  this.alive.forEach(function (id) {
    var sp = this.species[id - 1];
    if (!best || (this.t - sp.bornAt) > (this.t - best.bornAt)) best = sp;
  }, this);
  return best;
};

World.prototype.stats = function () {
  var coel = this.longestLineage();
  return {
    t: this.t, born: this.born, died: this.died, alive: this.alive.length,
    envHeat: this.env.heat, envWet: this.env.wet,
    bolide: this.bolideTicks > 0,
    longest: coel ? { name: coel.name, age: this.t - coel.bornAt } : null
  };
};

if (typeof module !== "undefined" && module.exports) module.exports = { World: World, mulberry32: mulberry32 };
else if (typeof window !== "undefined") window.GhostLineage = { World: World, mulberry32: mulberry32 };
