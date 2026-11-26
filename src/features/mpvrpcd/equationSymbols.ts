import type { NotationKey } from "./modelFormulation";

const symbolKeys: Partial<Record<string, NotationKey>> = {
  x: "route", z: "used", CD: "assignment", y: "load", DT: "departure",
  I: "stock", IA: "unload", ID: "reload", AT: "arrival", H: "replayEnd",
  tc: "travelCost", c: "rental", R: "road", V: "volume", Q: "capacity",
  s: "supply", d: "demand", et: "travelTime", T: "horizon", M: "largeNumber",
  K: "trucks", k: "truck", P: "products", p: "product", TP: "waves", t: "wave",
  N: "stops", S: "stops", D: "stops", S_0: "stopsByType", D_0: "stopsByType",
  i: "stop", j: "stop", "\\ell": "stop",
};

// Skip TeX commands and environment names. A variable and its subscript form one target.
const token = /\\(?:begin|end)\{[^}]+\}|\\(?!ell\b)[A-Za-z]+|\\[^A-Za-z]|(CD|DT|IA|ID|AT|TP|tc|et|\\ell|[A-Za-z])(_(?:\{[^}]*\}|[A-Za-z0-9]))?/g;
const stopSubscripts = new Set<NotationKey>(["route", "load", "departure", "travelTime", "stopsByType"]);

function markSymbol(key: NotationKey, latex: string) {
  return `\\htmlData{equation-symbol=${key}}{${latex}}`;
}

export function annotateFormula(latex: string) {
  const symbols = new Set<NotationKey>();
  const marked = latex.replace(token, (term, base?: string, subscript?: string) => {
    const key = base && (symbolKeys[term] ?? symbolKeys[base]);
    if (!key) return term;
    symbols.add(key);
    if (subscript?.includes("0") && stopSubscripts.has(key)) {
      symbols.add("dock");
      const indices = subscript.replace(/^_\{?|\}$/g, "");
      return markSymbol(key, `${base}_{${indices.replace("0", markSymbol("dock", "0"))}}`);
    }
    return markSymbol(key, term);
  });
  return { marked, symbols };
}
