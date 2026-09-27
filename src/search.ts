/* Tool search, shared by the sidebar panel and the omnibox.
   Ranked rather than filtered: the legacy app used a plain substring test on
   one concatenated string, so "bmi" ranked "Pediatric BMI" the same as
   "BMI Calculator". */
import type { Calculator } from './types';

export interface SearchHit {
  id: string;
  calc: Calculator;
  score: number;
}

/** Which department(s) a tool sits in, for matching "surgery" as a query. */
function categoriesOf(id: string, registry: Record<string, string[]>): string {
  const out: string[] = [];
  for (const cat in registry) if (registry[cat].includes(id)) out.push(cat);
  return out.join(' ');
}

/**
 * Rank tools against a query. Higher is better; non-matches are dropped.
 * Scoring favours, in order: exact id, name prefix, name word-start,
 * name substring, synonym, description, category.
 */
export function searchTools(
  query: string,
  calcs: Record<string, Calculator>,
  registry: Record<string, string[]> = {},
  limit = 50,
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];

  for (const id of Object.keys(calcs)) {
    const calc = calcs[id];
    const name = calc.name.toLowerCase();
    const desc = (calc.desc || '').toLowerCase();
    const about = (calc.about || '').toLowerCase();
    const syn = (calc.synonyms || []).join(' ').toLowerCase();
    const cats = categoriesOf(id, registry).toLowerCase();

    /* Every term must land somewhere, so "wells pe" does not match "Wells DVT". */
    let total = 0;
    let matchedAll = true;
    for (const term of terms) {
      let best = 0;
      if (id === term) best = 1000;
      else if (name.startsWith(term)) best = 500;
      else if (new RegExp('\\b' + escapeRe(term)).test(name)) best = 300;
      else if (name.includes(term)) best = 200;
      else if (id.startsWith(term)) best = 180;
      else if (new RegExp('\\b' + escapeRe(term)).test(syn)) best = 150;
      else if (syn.includes(term)) best = 100;
      else if (desc.includes(term)) best = 60;
      else if (cats.includes(term)) best = 40;
      else if (about.includes(term)) best = 20;
      if (!best) { matchedAll = false; break; }
      total += best;
    }
    if (!matchedAll) continue;

    /* Shorter names win ties, "BMI Calculator" over "Pediatric BMI". */
    total += Math.max(0, 40 - name.length);
    hits.push({ id, calc, score: total });
  }

  return hits.sort((a, b) => b.score - a.score || a.calc.name.localeCompare(b.calc.name)).slice(0, limit);
}

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
