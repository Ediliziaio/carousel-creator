

# Nuovi template "killer" per il carosello

Aggiungo 6 nuovi template scelti per coprire casi d'uso ad alto engagement (educational, growth, storytelling) che oggi mancano. Ogni template è studiato per i 4 formati esistenti (portrait/square/story/landscape) con stile coerente al sistema attuale.

## I 6 nuovi template

### 1. `myth` — Mito vs Realtà (categoria `text`)
Due card affiancate (verticalmente in story, orizzontalmente altrove): "MITO" con icona ❌ + claim falso barrato, "REALTÀ" con icona ✅ + claim vero in evidenza. Perfetto per debunking e contenuti educativi.
- Campi: `eyebrow`, `title`, `myth: { label, text }`, `reality: { label, text }`, opzionale `source`

### 2. `process` — Processo numerato a step (categoria `data`)
Lista verticale di 3-6 step con numero grande circolare a sinistra, titolo + descrizione breve a destra, linea verticale di connessione tra step. Ideale per how-to e tutorial sintetici.
- Campi: `eyebrow`, `title`, `steps: [{ number?, title, desc }]` (numerazione automatica se omessa)
- Limiti validation: min 3, max 6 step

### 3. `prosCons` — Pro & Contro (categoria `data`)
Due colonne ben distinte: "PRO" (verde, ✓) e "CONTRO" (rosso, ✗), ognuna con 2-5 bullet point. Decisioni, recensioni, comparazioni rapide.
- Campi: `eyebrow`, `title`, `pros: string[]`, `cons: string[]`
- Limiti: 2-5 per colonna

### 4. `quoteBig` — Citazione gigante full-bleed (categoria `text`)
Citazione tipografica enorme (200px+ in portrait), virgolette decorative giganti come elemento di sfondo, autore + ruolo + foto opzionale piccola in basso. Stile editoriale "rivista".
- Campi: `quote`, `author`, `role?`, `avatar?`
- Diverso da `imageQuote` (che ha immagine sinistra/destra) e da `testimonial` (più strutturato): qui il quote È il protagonista assoluto

### 5. `roadmap` — Roadmap con stati (categoria `data`)
Timeline orizzontale (verticale in story) con 3-5 milestone, ognuno con stato visivo (✓ done / ⏳ in progress / ○ planned), titolo, periodo (es. "Q1 2026"), descrizione breve. Ideale per product updates e annunci.
- Campi: `eyebrow`, `title`, `milestones: [{ status: "done"|"progress"|"planned", period, title, desc }]`
- Limiti: 3-5 milestone

### 6. `cta` — Call To Action finale (categoria `ref`)
Slide di chiusura ad alto impatto: titolo grande con verbo all'imperativo, sottotitolo, "bottone" prominente con label CTA (es. "Salva questo post"), opzionale handle social/URL piccolo in basso. Da usare come ultima slide del carosello.
- Campi: `headline`, `subtitle?`, `buttonLabel`, `handle?`

## Modifiche tecniche

### `src/lib/templates.ts`
- Estendo `TemplateId` con: `"myth" | "process" | "prosCons" | "quoteBig" | "roadmap" | "cta"`
- Aggiungo le 6 interfacce data corrispondenti (`MythData`, `ProcessData`, `ProsConsData`, `QuoteBigData`, `RoadmapData`, `CtaData`) all'union `AnyTemplateData`
- Estendo `TEMPLATE_META` con label/desc/category per ognuno
- Estendo `makeDefaultData()` con contenuti default realistici (italiani, allineati al tono attuale)
- Aggiorno `getStylableFields()` per esporre i campi testuali stilizzabili di ogni nuovo template

### `src/lib/store.ts`
- Aggiorno `DEFAULT_TEMPLATES_PER_CATEGORY` per includere i nuovi ID nelle categorie corrispondenti:
  - `text`: aggiunge `myth`, `quoteBig`
  - `data`: aggiunge `process`, `prosCons`, `roadmap`
  - `ref`: aggiunge `cta`
- `mergePickerState` già gestisce l'append automatico per utenti con stato persistito → zero-migration

### `src/components/slides/SlideRenderer.tsx`
- Aggiungo 6 case nel `switch(slide.template)` di `renderBody()`
- Ognuno usa `fieldStyle()` per gli override e `renderHighlighted()` per i marker `==testo==`
- Layout responsive ai 4 formati via classi `tpl-*` + `fmt-*`

### `src/components/slides/slide-styles.css`
- Nuove classi `.tpl-myth`, `.tpl-process`, `.tpl-prosCons`, `.tpl-quoteBig`, `.tpl-roadmap`, `.tpl-cta` con:
  - Layout flex/grid base
  - Override `.fmt-story` (stack verticale stretto)
  - Override `.fmt-landscape` (più orizzontale, font ridotto)
  - Override `.fmt-square` (bilanciato)
  - Tipografia coerente con i template esistenti (eyebrow uppercase, title bold, body regular)

### `src/components/SlideEditorForm.tsx`
- 6 nuovi editor: `MythEditor`, `ProcessEditor`, `ProsConsEditor`, `QuoteBigEditor`, `RoadmapEditor`, `CtaEditor`
- Ognuno usa i pattern esistenti: `Field` per scalari, `ArrayField` per liste (steps, pros, cons, milestones), `ItemCounter` per limiti
- Per `roadmap.status` uso un `<select>` (done/progress/planned) con label localizzate
- `FontSizeSlider` integrato sui campi testuali principali

### `src/lib/validation.ts`
- Aggiungo case nel `validateSlideData()` per ogni nuovo template:
  - `myth`: required `title`, `myth.text`, `reality.text`
  - `process`: required `title`, `steps` min 3 max 6, ogni step richiede `title`
  - `prosCons`: required `title`, `pros` 2-5, `cons` 2-5
  - `quoteBig`: required `quote` (10-280 char), `author` (max 60)
  - `roadmap`: required `title`, `milestones` 3-5, ogni milestone richiede `title` e `period`
  - `cta`: required `headline`, `buttonLabel`
- Aggiorno `LIMITS` con le nuove soglie

## Coerenza visiva

Tutti i nuovi template:
- Riusano le CSS variables esistenti (`--slide-bg`, `--slide-fg`, `--slide-accent`, ecc.)
- Rispettano gli effetti brand attuali (gradient, shadow, border, corner, divider)
- Supportano gli highlight `==testo==` nei campi testuali principali
- Funzionano con i 4 formati (portrait, square, story, landscape)
- Si integrano nel `NewSlideDialog` senza modifiche al picker (popolato automaticamente via `templatesPerCategory`)

## File toccati

**Modificati:**
- `src/lib/templates.ts` — types, meta, default data, stylable fields
- `src/lib/store.ts` — `DEFAULT_TEMPLATES_PER_CATEGORY` con i nuovi ID
- `src/lib/validation.ts` — regole per i 6 nuovi template
- `src/components/slides/SlideRenderer.tsx` — 6 nuovi case di rendering
- `src/components/slides/slide-styles.css` — classi `.tpl-*` per i 6 nuovi template + override per formato
- `src/components/SlideEditorForm.tsx` — 6 nuovi editor

**Non toccati:**
- `NewSlideDialog.tsx`, `SlidesSidebar.tsx` — il picker legge dinamicamente da store, zero modifiche
- `FontSizeSlider.tsx`, `TextStylePopover.tsx` — riutilizzati su qualsiasi fieldPath
- `ExportButton.tsx`, `lib/export.ts` — export agnostico al template

## Fuori scope

- **Animazioni di transizione** tra slide (resta statico come oggi)
- **Template con video** o componenti interattivi (carousel statico per export PNG/JPG)
- **AI-generated content** dentro i nuovi template (l'utente compila a mano)
- **Migrazione di slide esistenti** verso i nuovi template (utente sceglie manualmente in "Nuova slide")
- **Combinazioni preset salvate** automaticamente per i nuovi template (utente li salva manualmente come "combo" se vuole)

