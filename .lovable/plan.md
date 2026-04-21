

# Fix errori + Multi-formato slide stile Canva

## 1. Fix hydration mismatch DndContext (errore console al boot)

**Causa:** `SlidesSidebar` usa `@dnd-kit` con auto-generated `aria-describedby` ID che differisce tra SSR e client (`DndDescribedBy-4` vs `-0`). Soluzione standard: rendere il DnD solo lato client.

**Fix:** in `SlidesSidebar.tsx` aggiungo `useEffect` con flag `mounted` — finché non montato, renderizzo la lista delle slide **senza** `DndContext`/`SortableContext` (solo i bottoni statici). Dopo il mount, attivo il drag-and-drop. Stesso pattern per `ExportBatchPreviewDialog` (anche lì c'è DnD).

Risultato: nessuna divergenza SSR↔client, nessun warning di idratazione.

## 2. Fix "Error in route match" all'avvio

**Causa probabile:** `useCarousel` viene letto durante SSR ma lo store ha `skipHydration: true`. Su SSR i selettori restituiscono lo stato di default, sul client dopo `rehydrate()` cambiano → mismatch su titolo carosello, lingue, ecc.

**Fix:** in `routes/index.tsx` aggiungo lo stesso pattern `mounted` per il `<header>` e per il blocco di `SlideRenderer` nascosto usato per export — uso dei valori `DEFAULT_BRAND` durante SSR e passo a quelli dello store solo dopo mount. In alternativa più semplice: imposto `ssr: false` sulla route `/` via `createFileRoute("/")({ ssr: false, ... })` — TanStack Start supporta esplicitamente questo flag per route che dipendono da stato browser-only (localStorage). Scelgo questa via, più pulita e meno invasiva.

## 3. Formato slide stile Canva (Portrait / Square / Stories / Custom)

Nuovo concetto: ogni slide ha un **formato** indipendente.

**Estensione modello dati** (`src/lib/templates.ts`):
```ts
export type SlideFormat = "portrait" | "square" | "story" | "landscape";
export const FORMAT_DIMENSIONS: Record<SlideFormat, { w: number; h: number; label: string; ratio: string }> = {
  portrait:  { w: 1080, h: 1350, label: "Post verticale",  ratio: "4:5"  },
  square:    { w: 1080, h: 1080, label: "Post quadrato",    ratio: "1:1"  },
  story:     { w: 1080, h: 1920, label: "Storia / Reel",    ratio: "9:16" },
  landscape: { w: 1920, h: 1080, label: "Landscape / X",    ratio: "16:9" },
};
export interface Slide { id: string; template: TemplateId; format: SlideFormat; data: SlideDataField; }
```

`makeDefaultSlide(template, format = "portrait")` accetta il formato. Migrazione: slide esistenti senza `format` → trattate come `"portrait"` di default (in `mergeBrand` / `loadJSON` faccio fill-in).

**Rendering dinamico** (`src/components/slides/SlideRenderer.tsx` + `slide-styles.css`):
- `.slide-frame` non hardcoda più `width: 1080px; height: 1350px` — diventa variabile via `--slide-w`, `--slide-h` iniettate inline dal renderer in base al formato della slide
- `.slide-inner` si adatta proporzionalmente: padding/scale calcolati come funzione del formato (story ha più altezza → contenuto stretchato verticalmente; landscape → due colonne più larghe)
- Per i template che hanno layout fissi grid (es. `tpl-grid2x2`), aggiungo varianti `.fmt-story .tpl-grid2x2` con grid 1×4 verticale invece di 2×2 — più sensato in 9:16

**Picker nuova slide stile Canva** (`SlidesSidebar.tsx`):
- Sostituisco l'attuale `DropdownMenu` con un **`Dialog`** "Nuova slide" più ricco
- Layout 2 colonne:
  - **Sinistra**: scelta del formato (4 card con anteprima proporzionale: Portrait 4:5, Square 1:1, Story 9:16, Landscape 16:9) — selezionabili
  - **Destra**: griglia 2×col di template (i 12 esistenti) con mini-thumbnail visiva, label e descrizione
- Footer: bottone "Crea slide" che chiama `addSlide(template, format)`
- Default sensato: il formato selezionato persiste nella sessione (state locale del componente, non nello store) così se l'utente ne crea 5 di seguito non deve ri-cliccare

**Sidebar miniature responsive al formato:**
- `MiniPreview` calcola `scale` in base al formato (story → height 280, square → 200×200, ecc.) mantenendo larghezza max 200px
- Badge del formato (es. "9:16") accanto al numero della slide

**Anteprima principale:**
- `ScaledPreview` in `routes/index.tsx` riceve dimensioni `w/h` invece di hardcoded 1080/1350 — già usa `getBoundingClientRect`, basta parametrizzare i divisori

**Export/PNG:**
- `src/lib/export.ts` cattura il nodo già con dimensioni reali → funziona automaticamente. I file mantengono nome + dimensione corretta del formato.
- Nel filename includo il formato: `slide-01-1080x1350.png` per chiarezza

**Validazione (`src/lib/validation.ts`):** invariata, controlla solo i contenuti.

**Default iniziale:** le 2 slide di partenza restano `portrait` per coerenza.

## 4. UX picker nuove slide — categorizzazione

Raggruppo i 12 template in 3 categorie nel picker (tab interne):
- **Testo & Titolo**: cover, center, split, bignum
- **Liste & Dati**: grid2x2, timeline, checklist, stat, compare
- **Riferimento**: vocab, qa

Ogni card template mostra una **mini-anteprima generata** (riusando `SlideRenderer` con dati di default a `scale 0.15`) — esattamente quello che vede l'utente cliccando, no icone generiche. Costo: 12 mini-render una volta sola al mount del dialog.

## File toccati

**Nuovi:**
- `src/components/NewSlideDialog.tsx` — modal "Nuova slide" con format-picker + template-picker visivo

**Modificati:**
- `src/lib/templates.ts` — aggiunta `SlideFormat`, `FORMAT_DIMENSIONS`, campo `format` su `Slide`, `makeDefaultSlide(template, format)`
- `src/lib/store.ts` — `addSlide(template, format)`, migrazione slide legacy in `loadJSON` e in `merge` del persist (fill `format = "portrait"`)
- `src/components/slides/SlideRenderer.tsx` — passa `--slide-w`/`--slide-h` come CSS vars + classe `fmt-{format}`
- `src/components/slides/slide-styles.css` — `.slide-frame` usa `width: var(--slide-w)`/`height: var(--slide-h)`; varianti `.fmt-square`, `.fmt-story`, `.fmt-landscape` per template che cambiano layout (grid2x2, split, compare)
- `src/components/SlidesSidebar.tsx` — sostituisce dropdown con `NewSlideDialog`, fix hydration con `mounted` flag, mini-preview adattiva al formato, badge formato
- `src/components/ExportBatchPreviewDialog.tsx` — fix hydration con `mounted` flag, thumbnail adattive al formato
- `src/routes/index.tsx` — `ssr: false` sulla route, `ScaledPreview` parametrizzato w/h, hidden export refs usano dimensioni dal formato
- `src/lib/export.ts` — filename con dimensioni reali del formato della slide
- `src/lib/validation.ts` — nessuna modifica strutturale

**Non toccati:**
- `src/components/SlideEditorForm.tsx` — il form edita i dati, agnostico al formato
- `src/lib/i18n.ts`, `src/lib/history.ts`, `src/lib/presets.ts` — invariati
- `src/components/BrandSettingsDialog.tsx` — il brand è globale, non per-formato

## Fuori scope
- **Resize/conversione automatica** di una slide da un formato all'altro mantenendo il layout perfetto (i template si adattano via CSS, no algoritmo di reflow del contenuto)
- **Posizionamento libero degli elementi** stile Canva (l'editor resta template-driven, non free-form canvas)
- **Anteprima animata multi-formato** (resta export PNG statico)
- **Formati custom arbitrari** (i 4 preset coprono i casi reali: post, square, story, landscape — aggiungere "custom WxH" introduce edge case CSS molto pesanti)

