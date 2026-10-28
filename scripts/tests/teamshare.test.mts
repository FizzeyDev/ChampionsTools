/* eslint-disable @typescript-eslint/no-explicit-any -- tsx exposes CJS named exports under `default` */
import test from "node:test";
import assert from "node:assert/strict";
import * as TS from "../../src/lib/share/teamShare";
import * as TY from "../../src/lib/calc/types";
import * as SP from "../../src/lib/champions/statPoints";

const share = ((TS as any).encodeTeam ? TS : (TS as any).default) as typeof TS;
const ty = ((TY as any).defaultPokemon ? TY : (TY as any).default) as typeof TY;
const sp = ((SP as any).spToEv ? SP : (SP as any).default) as typeof SP;

test("team link round trip keeps the build", () => {
  const g = ty.defaultPokemon("Garchomp", ["Earthquake", "Dragon Claw", "Protect", "Rock Slide"]);
  g.item = "Choice Scarf";
  g.ability = "Rough Skin";
  g.nature = "Jolly";
  g.evs = { hp: 0, atk: sp.spToEv(32), def: 0, spa: 0, spd: sp.spToEv(2), spe: sp.spToEv(32) };
  const back = share.decodeTeam(share.encodeTeam([g, ty.defaultPokemon("")]))!;
  assert.equal(back.length, 1);
  assert.equal(back[0].species, "Garchomp");
  assert.equal(back[0].item, "Choice Scarf");
  assert.equal(back[0].nature, "Jolly");
  assert.deepEqual(back[0].moves, ["Earthquake", "Dragon Claw", "Protect", "Rock Slide"]);
  assert.equal(back[0].evs.spe, sp.spToEv(32));
  assert.equal(back[0].evs.spd, sp.spToEv(2));
});

test("team link rejects garbage and unknown species", () => {
  assert.equal(share.decodeTeam("!!!"), null);
  const bad = btoa(JSON.stringify([{ s: "NotAPokemon" }]));
  assert.equal(share.decodeTeam(bad), null);
  const mixed = btoa(JSON.stringify([{ s: "NotAPokemon" }, { s: "Garchomp", sp: [99, -4, "x"] }]));
  const ok = share.decodeTeam(mixed)!;
  assert.equal(ok.length, 1);
  assert.equal(ok[0].evs.hp, sp.spToEv(32)); // clamped to the 32 SP cap
  assert.equal(ok[0].evs.atk, 0);
});
