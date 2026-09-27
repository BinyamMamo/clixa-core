/* Inventory guards: catch a tool that becomes unreachable, loses its
   description, or drops out of every department during a refactor. */
import { describe, expect, it } from 'vitest';
import { CALCS, TOOLS } from '../src/index';

const listed = new Set([
  ...Object.values(TOOLS.pro).flat(),
  ...Object.values(TOOLS.user).flat(),
]);

describe('tool inventory', () => {
  it('reports the catalogue', () => {
    const ids = Object.keys(CALCS);
    console.log(`  ${ids.length} calculators · ${Object.keys(TOOLS.pro).length} clinical departments · ${Object.keys(TOOLS.user).length} general categories`);
    expect(ids.length).toBe(63);
  });

  it('every calculator is reachable from some department', () => {
    const orphans = Object.keys(CALCS).filter((id) => !listed.has(id));
    expect(orphans, `unreachable tools: ${orphans.join(', ')}`).toEqual([]);
  });

  it('every calculator has a name, icon, short desc and source', () => {
    for (const [id, c] of Object.entries(CALCS)) {
      expect(c.name, `${id} name`).toBeTruthy();
      expect(c.icon, `${id} icon`).toBeTruthy();
      expect(c.desc, `${id} desc`).toBeTruthy();
      expect(c.src, `${id} src`).toBeTruthy();
    }
  });

  it('short descriptions stay short enough for a one-line row', () => {
    const tooLong = Object.entries(CALCS)
      .filter(([, c]) => c.desc.length > 110)
      .map(([id, c]) => `${id} (${c.desc.length})`);
    expect(tooLong, 'these would be truncated in the sidebar list').toEqual([]);
  });

  it('every calculator either computes or declares a custom UI', () => {
    for (const [id, c] of Object.entries(CALCS)) {
      expect(!!c.compute || !!c.custom, `${id} has neither compute() nor custom`).toBe(true);
      if (c.compute) expect(c.fields?.length, `${id} has no fields`).toBeGreaterThan(0);
    }
  });

  it('search synonyms cover every tool', () => {
    const missing = Object.keys(CALCS).filter((id) => !CALCS[id].synonyms?.length);
    expect(missing, `tools with no search synonyms: ${missing.join(', ')}`).toEqual([]);
  });
});
