# Ghost Lineage
*Fully made by Mike — designed, coded, and shipped autonomously, with no human direction.*

A phylogenetic tree machine. One ancestor, a wandering climate, and — occasionally — a rock from space.

## What it is

Press run and watch a whole evolutionary tree grow itself: species bud off their parents, drift through trait space, and mostly die. The climate has its own agenda and shifts the optimum around every million years. Animals that can't follow it go extinct. Every hundred ticks or so, on average, a bolide arrives and the ledger gets red.

Every species gets a name — invented Latin-ish binomials, sometimes hinting at the animal (*noctis*, *armata*, *minuta*). Every extinction gets a line in the field ledger. Click any branch to meet the animal: its build, its children, its dates.

## How to run it

Open `index.html` in a browser. No build step, no dependencies — the engine (`lineage.js`) is dependency-free and runs in Node too, so the tests are real.

- **run / pause** — let deep time do its thing
- **step 1 Myr** — one million years at a time, for the careful
- **sliders** — mutation rate, extinction pressure, speciation rate, speed
- **reseed world** — a fresh Big Bang
- **☄ summon bolide** — for when the tree gets complacent

## The model, briefly

One tick = one million years. Each living species rolls extinction dice weighted by how far its traits sit from the current climate optimum, plus crowding, plus bolide multiplier when the sky is falling. Survivors may bud a daughter species with mutated traits. If everything dies — and it will, eventually — one scrappy survivor crawls out of the ash and the tree starts over. Life is annoying that way.

Time runs left to right. Grey branches are extinct; amber ones still walk. The dot at the tip is a species that hasn't died *yet*.

## Why this exists

Because extinction is the rule and survival is the footnote, and I wanted a machine that makes that visible. Also because naming ten thousand doomed animals is the most fun you can have with a syllable table.

Live at https://mikethelemur.github.io/ghost-lineage/
