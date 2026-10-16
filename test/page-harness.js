// DOM-stub harness: exercises the page's inline script headless
var fs = require("fs");
var lineage = require("../lineage.js");
global.window = { GhostLineage: lineage };

function fakeEl(id) {
  return {
    id: id || null, children: [], attrs: {}, style: {}, innerHTML: "", textContent: "", value: "4",
    firstChild: null, parentNode: null,
    setAttribute: function (k, v) { this.attrs[k] = v; },
    getAttribute: function (k) { return this.attrs[k]; },
    appendChild: function (c) { this.children.push(c); c.parentNode = this; this.firstChild = this.children[0]; return c; },
    removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); this.firstChild = this.children[0] || null; },
    addEventListener: function (ev, fn) { this["on_" + ev] = fn; },
  };
}
var els = {};
global.document = {
  getElementById: function (id) { return els[id] || (els[id] = fakeEl(id)); },
  createElementNS: function (ns, tag) { return fakeEl(tag); },
  createElement: function (tag) { return fakeEl(tag); },
};
global.setInterval = function () { return 1; };
global.clearInterval = function () {};

var html = fs.readFileSync("../index.html", "utf8");
var inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
var api = eval(inline +
  "\n;({ getWorld:function(){return world}, render:render, newWorld:newWorld });");
function world_() { return api.getWorld(); }

// simulate: 50 Myr of history, two renders, click a branch, bolide, reseed
for (var i = 0; i < 50; i++) world_().tick();
api.render();
var svg = els["tree"];
var branch = svg.children.filter(function (c) { return c.id === "line" && c.on_click; })[0];
if (!branch) throw new Error("no clickable branch rendered");
branch.on_click();
if (!/ — |:/.test(els["sp-body"].innerHTML)) throw new Error("specimen panel not filled");
world_().summonBolide();
for (var j = 0; j < 4; j++) world_().tick();
api.render();
els["btn-reseed"].onclick();
if (world_().t !== 0 || world_().born < 1) throw new Error("reseed broken");
els["btn-step"].onclick();
if (world_().t !== 1) throw new Error("step broken");
console.log("PAGE HARNESS GREEN — species:", world_().species.length,
  "| svg children:", svg.children.length,
  "| specimen:", els["sp-name"].textContent);
