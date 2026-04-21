

# Nuovi template ricchi di immagini, grafici e media

Aggiungo 7 nuovi template orientati a massimizzare la personalizzazione visiva (immagini grandi, grafici, gallery, citazioni, mockup).

## 1. Nuovi template

| ID | Nome | Descrizione | Categoria |
|---|---|---|---|
| `gallery` | Galleria 3 immagini | Titolo + 3 immagini affiancate con didascalia | Media |
| `imageQuote` | Citazione + foto | Foto a tutta pagina + quote sovrimpressa con autore | Media |
| `chartBar` | Grafico a barre | Titolo + grafico orizzontale con etichette + valori (max 6 voci) | Dati |
| `chartDonut` | Grafico a torta | Titolo + donut chart con legenda colorata + percentuali | Dati |
| `chartLine` | Trend / Line chart | Titolo + curva con punti, asse X di etichette, eyebrow di periodo | Dati |
| `feature` | Feature spotlight | Immagine grande + titolo + 3 bullet con icona/marker | Media |
| `testimonial` | Testimonianza | Avatar circolare + quote grande + nome/ruolo | Media |

I grafici sono renderizzati in **SVG puro** (no librerie esterne). Colori derivati da `brand.accent`/`brand.accentSecondary` per coerenza visiva. Sono catturati nativamente da `html-to-image` nell'export PNG (già usato nel progetto), quindi nessuna modifica all'export.

## 2. Modello dati (in `src/lib/templates.ts`)

```ts
export interface GalleryData {
  eyebrow: string; title: string;
  images: { url?: string; caption?: string }[]; // 3 elementi
}
export interface ImageQuoteData {
  imageUrl?: string;
  quote: string;       // testo della citazione
  author: string;      // nome
  role?: string;       // ruolo / contesto
}
export interface ChartBarData {
  eyebrow: string; title: string;
  unit?: string;       // es. "%", "k€"
  items: { label: string; value: number; color?: string }[]; // 2-6 barre
}
export interface ChartDonutData {
  eyebrow: string; title: string;
  centerLabel?: string;
  segments: { label: string; value: number; color?: string }[]; // 2-6 fette
}
export interface ChartLineData {
  eyebrow: string; title: string;
  xLabels: string[];   // es. ["Gen","Feb",...]
  values: number[];    // stessa lunghezza di xLabels
  unit?: string;
}
export interface FeatureData {
  eyebrow: string; title: string;
  imageUrl?: string;
  bullets: { marker: string; title: string; text?: string }[]; // 3 elementi
}
export interface TestimonialData {
  avatarUrl?: string;
  quote: string;
  author: string;
  role?: string;
  rating?: number;     // 1..5 stelline opzionali
}
```

`TemplateId` viene esteso con i 7 nuovi ID. `makeDefaultData()` riceve i case mancanti con dati italiani plausibili. `getStylableFields()` aggiunge i campi di testo per ognuno (eyebrow, title, quote, author, label di chart, ecc.). `TEMPLATE_META` aggiornato.

## 3. Categorizzazione del picker

Aggiungo una **nuova categoria `media`** "Media & Grafici" e aggiorno i default:
- `text` (Testo & Titolo): cover, center, split, bignum
- `data` (Liste & Dati): grid2x2, timeline, checklist, stat, compare, **chartBar, chartDonut, chartLine**
- `media` (Media & Grafici): **gallery, imageQuote, feature, testimonial**
- `ref` (Riferimento): vocab, qa

`templateCategoryOrder` default → `["text","data","media","ref"]`. In `NewSlideDialog.tsx` aggiungo `CATEGORY_LABELS.media = "Media & Grafici"`.

**Migrazione store** (`src/lib/store.ts`): nella `migrate` del `persist`, se `templatesPerCategory.media` non esiste → inietto i 4 template media e aggiungo i 3 chart in `data`. Versione persist bumpata.

## 4. Componenti renderer (in `src/components/slides/SlideRenderer.tsx`)

Nuovi sub-componenti React: `Gallery`, `ImageQuote`, `ChartBar`, `ChartDonut`, `ChartLine`, `Feature`, `Testimonial`. Aggiunti al `switch (slide.template)` di `renderBody`.

**Grafici SVG (puro, no deps):**
- `ChartBar`: barre orizzontali con larghezza proporzionale a `value/max(values)`, label a sinistra, valore a destra. Colori derivati da accent/accentSecondary alternati o `item.color` se fornito.
- `ChartDonut`: SVG con `<circle>` + `stroke-dasharray` per ogni segmento, ruotato. Centro con `centerLabel` o totale. Legenda a destra.
- `ChartLine`: SVG `<polyline>` + `<circle>` per i punti, asse X con etichette sotto, gradient stroke usando accent.

Tutti i grafici sono responsive al canvas slide (1080×W) — usano `viewBox` SVG così scalano automaticamente con `transform: scale()` del frame.

## 5. CSS template (in `src/components/slides/slide-styles.css`)

Aggiungo classi per i nuovi template:
- `.tpl-gallery` — grid 3 colonne con padding
- `.tpl-imageQuote` — bg image full + veil + quote tipografica grande
- `.tpl-chartBar`, `.tpl-chartDonut`, `.tpl-chartLine` — layout titolo top + chart fluido sotto
- `.tpl-feature` — split immagine left, lista right (riusa logica `.tpl-split` con varianti)
- `.tpl-testimonial` — center vertical, avatar + quote + author

Per `fmt-story` (9:16) e `fmt-landscape` (16:9): override compatti per gallery (1 colonna in story, 4 in landscape) e chart (più alti in story).

## 6. Validazione (`src/lib/validation.ts`)

Aggiungo i case per i 7 template:
- `gallery`: title required, almeno 1 immagine
- `imageQuote`: quote + author required
- `chartBar/Donut/Line`: title required + array non vuoto
- `feature`: title + almeno 1 bullet
- `testimonial`: quote + author required

## 7. Editor (`src/components/SlideEditorForm.tsx`)

Aggiungo un blocco di rendering form per ogni nuovo template, riutilizzando i componenti esistenti:
- `Field` (input testo), `ArrayField` (per gallery images, chart items, bullets)
- `ImageUploadField` per gallery items, imageQuote, feature, testimonial avatar
- Per i chart: input numerico per `value`, color picker opzionale per `color`

Tutti i campi passano per il debounce esistente (`set()` → 400ms → store) e supportano `<TextStyleButton>` dove sensato.

## File toccati

**Modificati:**
- `src/lib/templates.ts` — nuovi `TemplateId`, interfacce dati, `makeDefaultData`, `TEMPLATE_META`, `TEMPLATE_ORDER`, `getStylableFields`
- `src/lib/store.ts` — migrazione `templatesPerCategory` con nuova categoria `media` + nuovi template, bump versione persist
- `src/components/slides/SlideRenderer.tsx` — 7 nuovi sub-componenti incluso 3 chart SVG
- `src/components/slides/slide-styles.css` — classi `.tpl-*` per i 7 nuovi template + override per `fmt-story`/`fmt-landscape`
- `src/components/SlideEditorForm.tsx` — form blocks per i 7 nuovi template
- `src/components/NewSlideDialog.tsx` — `CATEGORY_LABELS.media`
- `src/lib/validation.ts` — validazione per i 7 nuovi template

**Non toccati:**
- `src/lib/export.ts` — html-to-image cattura SVG nativamente, nessuna modifica
- `src/lib/i18n.ts`, `src/lib/history.ts` — invariati

## Fuori scope
- **Librerie chart esterne** (recharts, chart.js): SVG inline → bundle leggero, export PNG affidabile
- **Tipi grafico avanzati** (scatter, area, radar): si possono aggiungere in iterazioni successive
- **Layer di ritaglio/filtro immagini stile Photoshop**: l'upload mantiene l'immagine originale
- **Mappe / icone vettoriali per feature template**: il marker resta testo (es. "01", "→")
- **Animazioni/transizioni nei grafici**: l'export è PNG statico

