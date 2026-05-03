/**
 * Parser unificato per import bulk di contenuti da file: .md/.txt, .csv,
 * .json, .xlsx, .docx, .pdf. Per ogni formato estrae testo plain e lo
 * spezza in blocchi (= 1 contenuto) usando la regola:
 *   - Ogni `# Titolo` (heading H1) inizia un nuovo blocco.
 *   - Oppure `---` (3+ trattini) come separatore esplicito.
 *   - Oppure pagebreak (per docx/pdf) come fallback.
 *
 * Output: array di { name, brief } dove brief è il markdown del contenuto
 * pronto per essere passato al parser textToSlides quando l'utente
 * aprirà la card per la prima volta.
 *
 * Le librerie pesanti (xlsx/mammoth/pdfjs) sono caricate via dynamic import
 * solo quando necessario, per non gonfiare il bundle iniziale.
 */

export interface ImportedBrief {
  name: string;
  brief: string;
}

export type SupportedFile = "md" | "txt" | "csv" | "json" | "xlsx" | "docx" | "pdf";

export function detectFileType(file: File): SupportedFile | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "xlsx";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".pdf")) return "pdf";
  return null;
}

export async function parseFileToBriefs(file: File): Promise<ImportedBrief[]> {
  const type = detectFileType(file);
  if (!type) {
    throw new Error(
      `Tipo file non supportato: ${file.name}. Usa .md/.txt, .csv, .json, .xlsx, .docx o .pdf.`,
    );
  }
  switch (type) {
    case "md":
    case "txt":
      return splitTextIntoBriefs(await file.text());
    case "csv":
      return parseCsv(await file.text());
    case "json":
      return parseJsonBriefs(await file.text());
    case "xlsx":
      return parseXlsx(file);
    case "docx":
      return parseDocx(file);
    case "pdf":
      return parsePdf(file);
  }
}

/* ===== Strategia comune: spezza per heading ===== */

/**
 * Spezza un testo in blocchi separati. Regole, in ordine di priorità:
 * 1. `---` su una riga propria (separatore esplicito) → nuovo blocco
 * 2. `# Heading` (H1 markdown) → nuovo blocco, il testo del heading diventa name
 * 3. Se nessuno dei 2 → tutto il testo è un singolo blocco
 */
export function splitTextIntoBriefs(text: string): ImportedBrief[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Tentativo 1: separatore ---
  if (/^---+\s*$/m.test(normalized)) {
    return normalized
      .split(/\n---+\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => makeBriefFromBlock(block));
  }

  // Tentativo 2: split per # H1
  const lines = normalized.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (/^#\s+\S/.test(line) && current.length > 0) {
      blocks.push(current.join("\n").trim());
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current.join("\n").trim());

  if (blocks.length > 1) return blocks.filter(Boolean).map((b) => makeBriefFromBlock(b));

  // Singolo blocco
  return [makeBriefFromBlock(normalized)];
}

function makeBriefFromBlock(block: string): ImportedBrief {
  // Il name è il primo `# H1` se esiste, altrimenti la prima riga (max 80 char).
  const match = /^#\s+(.+)$/m.exec(block);
  const fallback = block.split("\n").find((l) => l.trim()) ?? "Senza titolo";
  const name = (match ? match[1] : fallback).trim().slice(0, 100);
  return { name: name || "Senza titolo", brief: block };
}

/* ===== Parser specifici per formato ===== */

/** CSV: colonna 1 = name, colonna 2 = brief (markdown). Header opzionale. */
function parseCsv(csv: string): ImportedBrief[] {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (lines.length === 0) return [];
  const start = /^(name|titolo|title)\s*,/i.test(lines[0]) ? 1 : 0;
  const out: ImportedBrief[] = [];
  for (let i = start; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    if (parts.length < 1) continue;
    const name = (parts[0] ?? "").trim();
    const brief = (parts[1] ?? parts[0] ?? "").trim();
    if (name) out.push({ name, brief });
  }
  return out;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.replace(/\\n/g, "\n"));
}

/** JSON: array di { name, brief } oppure array di stringhe. */
function parseJsonBriefs(json: string): ImportedBrief[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error("JSON deve essere un array di { name, brief } o stringhe.");
  }
  return parsed
    .map((item): ImportedBrief | null => {
      if (typeof item === "string") return makeBriefFromBlock(item);
      if (item && typeof item === "object") {
        const name = (item.name || item.titolo || item.title || "").toString().trim();
        const brief = (item.brief || item.body || item.content || item.text || "")
          .toString()
          .trim();
        if (name && brief) return { name: name.slice(0, 100), brief };
        if (brief) return makeBriefFromBlock(brief);
      }
      return null;
    })
    .filter(Boolean) as ImportedBrief[];
}

/**
 * XLSX: convenzione colonne (case-insensitive header):
 *   colonna 1: name | titolo | title
 *   colonna 2: brief | body | content | testo
 * Se non c'è header, usa colonne posizionali (A=name, B=brief).
 */
async function parseXlsx(file: File): Promise<ImportedBrief[]> {
  const xlsx = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = xlsx.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: "",
  });
  const out: ImportedBrief[] = [];
  for (const row of rows) {
    const keys = Object.keys(row).map((k) => k.toLowerCase());
    const findKey = (...candidates: string[]) =>
      Object.keys(row).find((k) =>
        candidates.some((c) => k.toLowerCase() === c || k.toLowerCase().includes(c)),
      );
    const nameKey = findKey("name", "titolo", "title", "nome");
    const briefKey = findKey("brief", "body", "content", "testo", "contenuto", "text");
    const name = nameKey ? String(row[nameKey] ?? "").trim() : "";
    const brief = briefKey ? String(row[briefKey] ?? "").trim() : "";
    if (name || brief) {
      out.push({
        name: name || (brief.split("\n")[0] ?? "").slice(0, 100) || "Senza titolo",
        brief: brief || `# ${name}\n`,
      });
    } else if (keys.length === 0) {
      // fallback: prima cella
      const v = String(Object.values(row)[0] ?? "").trim();
      if (v) out.push(makeBriefFromBlock(v));
    }
  }
  return out;
}

/** DOCX: estrae testo plain con mammoth, poi splitta come markdown. */
async function parseDocx(file: File): Promise<ImportedBrief[]> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  // Estrai HTML preservando heading H1/H2/H3, poi convertiamo in markdown light.
  const result = await mammoth.convertToHtml({ arrayBuffer: buf });
  const html = result.value;
  // Regex semplici: <h1>X</h1> → # X\n, <h2>X</h2> → ## X\n, <p>X</p> → X\n.
  const md = html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<\/?(p|ul|ol|strong|em|b|i|br)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return splitTextIntoBriefs(md);
}

/** PDF: estrae testo per pagina via pdfjs, poi splitta come markdown. */
async function parsePdf(file: File): Promise<ImportedBrief[]> {
  // pdfjs richiede setup worker. Usiamo modalità "fake worker" per semplicità
  // in browser (più lento ma niente dipendenza esterna da setup).
  const pdfjs = await import("pdfjs-dist");
  // Worker via CDN (jsDelivr, già usato dai progetti pdfjs).
  // Versione coerente con il package installato.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const text = tc.items
      .map((it) => ("str" in it ? (it.str as string) : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(text);
  }
  // Strategia: se in tutto il PDF compaiono `# heading`, splitta per quelli;
  // altrimenti ogni pagina = un blocco.
  const fullText = pages.join("\n\n");
  if (/^#\s+\S/m.test(fullText)) {
    return splitTextIntoBriefs(fullText);
  }
  return pages
    .filter((p) => p.length > 20)
    .map((p, i) => ({
      name: (p.split(". ")[0] ?? `Pagina ${i + 1}`).slice(0, 100),
      brief: p,
    }));
}
