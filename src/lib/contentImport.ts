import type { TemplateId, AnyTemplateData } from "./templates";
import { TEMPLATE_ORDER, makeDefaultData } from "./templates";

export interface ImportedItem {
  template: TemplateId;
  data: AnyTemplateData;
  /** Per-item warnings (unknown fields, fallbacks). */
  warnings: string[];
}

export interface ImportResult {
  items: ImportedItem[];
  errors: string[];
}

const VALID_TEMPLATES = new Set<TemplateId>(TEMPLATE_ORDER);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Parse a content bundle. Accepted shapes:
 *   - Array of { template, data }
 *   - { items: [ { template, data } ] }
 */
export function parseContentBundle(input: unknown): ImportResult {
  const errors: string[] = [];
  let arr: unknown;
  if (Array.isArray(input)) arr = input;
  else if (isPlainObject(input) && Array.isArray((input as { items?: unknown }).items)) {
    arr = (input as { items: unknown[] }).items;
  } else {
    errors.push("Formato non riconosciuto: serve un array di { template, data } oppure { items: [...] }.");
    return { items: [], errors };
  }
  const list = arr as unknown[];
  if (list.length === 0) {
    errors.push("Nessuna slide nel bundle.");
    return { items: [], errors };
  }

  const items: ImportedItem[] = [];
  list.forEach((raw, idx) => {
    if (!isPlainObject(raw)) {
      errors.push(`Slide #${idx + 1}: deve essere un oggetto`);
      return;
    }
    const tpl = raw.template;
    if (typeof tpl !== "string" || !VALID_TEMPLATES.has(tpl as TemplateId)) {
      errors.push(`Slide #${idx + 1}: template "${String(tpl)}" non valido`);
      return;
    }
    const template = tpl as TemplateId;
    const data = isPlainObject(raw.data) ? raw.data : {};
    const base = makeDefaultData(template) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...base };
    const warnings: string[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (!(k in base)) {
        warnings.push(`Campo "${k}" sconosciuto per ${template}: ignorato.`);
        continue;
      }
      // Deep-merge plain objects one level (e.g. problem/solution).
      if (isPlainObject(v) && isPlainObject(base[k])) {
        merged[k] = { ...(base[k] as object), ...(v as object) };
      } else {
        merged[k] = v;
      }
    }
    items.push({ template, data: merged as AnyTemplateData, warnings });
  });

  return { items, errors };
}

/**
 * Parse a simple CSV in format: template,field,value (one row per field).
 * Rows with the same template are grouped into a single item in order.
 * Field paths support dot notation: e.g. problem.text
 */
export function parseSimpleCsv(csv: string): ImportResult {
  const errors: string[] = [];
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (lines.length === 0) {
    return { items: [], errors: ["CSV vuoto."] };
  }
  // Skip header if present.
  const start = lines[0].toLowerCase().startsWith("template,") ? 1 : 0;
  // Group consecutive rows by (template + slideIndex). For simplicity: each new occurrence of a template starts a new slide.
  const groups: { template: TemplateId; rows: { field: string; value: string }[] }[] = [];
  let lastTpl: TemplateId | null = null;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const parts = parseCsvLine(line);
    if (parts.length < 3) {
      errors.push(`Riga ${i + 1}: serve formato template,field,value`);
      continue;
    }
    const [tpl, field, ...rest] = parts;
    if (!VALID_TEMPLATES.has(tpl as TemplateId)) {
      errors.push(`Riga ${i + 1}: template "${tpl}" non valido`);
      continue;
    }
    const value = rest.join(",");
    const t = tpl as TemplateId;
    // Open a new group when the template changes OR when a duplicate field would be set.
    let group = groups[groups.length - 1];
    if (!group || group.template !== t || group.rows.some((r) => r.field === field)) {
      group = { template: t, rows: [] };
      groups.push(group);
    }
    lastTpl = t;
    void lastTpl;
    group.rows.push({ field, value });
  }

  const items: ImportedItem[] = groups.map((g) => {
    const data: Record<string, unknown> = {};
    for (const r of g.rows) {
      setByPath(data, r.field, coerceValue(r.value));
    }
    const base = makeDefaultData(g.template) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...base };
    const warnings: string[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (!(k in base)) {
        warnings.push(`Campo "${k}" sconosciuto per ${g.template}: ignorato.`);
        continue;
      }
      if (isPlainObject(v) && isPlainObject(base[k])) {
        merged[k] = { ...(base[k] as object), ...(v as object) };
      } else {
        merged[k] = v;
      }
    }
    return { template: g.template, data: merged as AnyTemplateData, warnings };
  });

  return { items, errors };
}

function parseCsvLine(line: string): string[] {
  // Minimal CSV parser supporting quoted values.
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur.trim()); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let ref: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!isPlainObject(ref[k])) ref[k] = {};
    ref = ref[k] as Record<string, unknown>;
  }
  ref[parts[parts.length - 1]] = value;
}

function coerceValue(v: string): unknown {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v !== "" && !isNaN(Number(v)) && /^-?\d+(?:\.\d+)?$/.test(v)) return Number(v);
  return v;
}

export const SAMPLE_BUNDLES: { name: string; json: string }[] = [
  {
    name: "Sales (3 slide)",
    json: JSON.stringify(
      [
        { template: "hook", data: { eyebrow: "LEGGI FINO ALLA FINE", hook: "Stai bruciando il tuo budget ads.", subhook: "E nemmeno te ne accorgi." } },
        { template: "problemSolution", data: { eyebrow: "Il vero problema", problem: { label: "IL PROBLEMA", text: "Spendi 1000€/mese in ads ma non sai cosa converte." }, solution: { label: "LA SOLUZIONE", text: "Un sistema di tracking semplice che ti dice esattamente dove tagliare." } } },
        { template: "offer", data: { productName: "Audit Ads Gratuito", priceNew: "0", currency: "€", includes: ["Analisi 7 giorni", "Report PDF", "Call 30 min"], ctaLabel: "PRENOTA →" } },
      ],
      null,
      2,
    ),
  },
  {
    name: "Educational (2 slide)",
    json: JSON.stringify(
      [
        { template: "tipPack", data: { eyebrow: "Quick wins", title: "5 hack per LinkedIn.", tips: [
          { icon: "🪝", title: "Hook breve", text: "Massimo 8 parole." },
          { icon: "📏", title: "Riga corta", text: "Max 60 caratteri per riga." },
          { icon: "🧲", title: "PDF sopra", text: "Allega documenti per più reach." },
          { icon: "💬", title: "Rispondi tutti", text: "Nei primi 30 minuti." },
        ] } },
        { template: "framework", data: { title: "Il metodo SCAR.", acronym: "SCAR", letters: [
          { letter: "S", name: "Situation", desc: "Inquadra il contesto." },
          { letter: "C", name: "Complication", desc: "Spiega il problema." },
          { letter: "A", name: "Answer", desc: "Dai la soluzione." },
          { letter: "R", name: "Result", desc: "Mostra il risultato." },
        ] } },
      ],
      null,
      2,
    ),
  },
];
