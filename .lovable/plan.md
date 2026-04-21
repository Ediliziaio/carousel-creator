

# Nuovi template "killer" — focus marketing & vendita

Aggiungo **8 nuovi template** ad alta conversione, scelti come farebbe un esperto di marketing/sales sui caroselli Instagram/LinkedIn. Ciascuno copre un meccanismo psicologico specifico (curiosità, urgenza, autorità, prova sociale, obiezioni).

## Gli 8 nuovi template

### 1. `hook` — Hook iniziale shock (categoria `text`)
La PRIMA slide del carosello: una frase brevissima e provocatoria che ferma lo scroll. Sfondo pieno o gradient, testo gigante centrato (220px+ in portrait), eyebrow piccola opzionale ("LEGGI FINO ALLA FINE"), badge "1/N" e indicatore "swipe →" pulsante in basso.
- Campi: `eyebrow?`, `hook` (5-90 char), `subhook?`, `swipeLabel?`
- Uso tipico: "Il 90% sbaglia questo." / "Smetti di fare X."

### 2. `problemSolution` — Problema → Soluzione (categoria `data`)
Due blocchi verticali ad alto contrasto: in alto "IL PROBLEMA" (sfondo desaturato, icona ⚠) con descrizione del pain, in basso "LA SOLUZIONE" (sfondo accent, icona ✦) con la promessa. Freccia ↓ tra i due.
- Campi: `eyebrow`, `problem: { label, text }`, `solution: { label, text }`
- Conversione: classico framework PAS (Problem-Agitate-Solve) compresso in 1 slide

### 3. `mistakes` — Errori da evitare (categoria `data`)
Lista numerata di 3-5 errori tipici, ognuno con icona ❌ rossa, titolo errore, breve spiegazione. Title come "I 5 errori che ti costano clienti."
- Campi: `eyebrow`, `title`, `mistakes: [{ title, why }]` (3-5 items)
- Hook nativo per "salva questo post per non sbagliare"

### 4. `framework` — Framework / Acronimo (categoria `data`)
Acronimo verticale (es. "AIDA", "SCAR") con ogni lettera grande a sx (in card) + nome esteso e descrizione a dx. 3-6 lettere.
- Campi: `eyebrow`, `title`, `acronym` (string, mostrato come header), `letters: [{ letter, name, desc }]`
- Posizionamento: contenuti educational/B2B, "salva e usa nel tuo lavoro"

### 5. `socialProof` — Risultati clienti / Numeri (categoria `data`)
3 metriche orizzontali grandi (es. "+340% MRR" / "12 settimane" / "0 ads spent"), titolo cliente in alto, breve case study sotto, foto/logo opzionale.
- Campi: `eyebrow`, `clientName`, `tagline`, `metrics: [{ value, unit?, label }]` (3 items fissi), `summary?`, `logoUrl?`
- Conversione: prova sociale numerica, killer per servizi B2B

### 6. `offer` — Offerta / Pricing (categoria `ref`)
Card centrale con: badge "OFFERTA LIMITATA" opzionale, nome prodotto, prezzo grande con prezzo barrato + nuovo prezzo, lista 3-5 inclusi (✓), CTA grande in basso, urgency text micro.
- Campi: `badge?`, `productName`, `priceOld?`, `priceNew`, `currency?`, `includes: string[]` (3-5), `ctaLabel`, `urgency?`
- Conversione: slide vendita diretta, perfect-fit con `cta` come slide successiva

### 7. `objection` — Obiezione → Risposta (categoria `text`)
Stile chat / fumetto: bubble grigia "Ma..." con l'obiezione tipica del cliente, sotto bubble accent con la risposta che scioglie il dubbio.
- Campi: `eyebrow?`, `objection`, `answer`, `signOff?` (es. "P.S. provalo gratis")
- Uso tipico: serie di 3-5 slide consecutive ognuna con un'obiezione diversa

### 8. `tipPack` — Pacchetto di consigli salvabili (categoria `data`)
3-6 mini-card numerate con icona, titolo brevissimo (3-5 parole) e descrizione 1 riga. Layout grid compatto. Title del tipo "5 modi per X in 30 secondi."
- Campi: `eyebrow`, `title`, `tips: [{ icon?, title, text }]` (3-6), `saveLabel?` (default "SALVA QUESTO POST")
- Conversione: ottimizzato per save/share, l'algoritmo preferisce questo formato

## Modifiche tecniche

### `src/lib/templates.ts`
- Estendo `TemplateId` con: `"hook" | "problemSolution" | "mistakes" | "framework" | "socialProof" | "offer" | "objection" | "tipPack"`
- 8 nuove interfacce data nell'union `AnyTemplateData`
- Aggiungo `TEMPLATE_META` (label/desc italiani, marketing-oriented)
- Estendo `TEMPLATE_ORDER` con i nuovi ID
- `makeDefaultData()` con contenuti default realistici in italiano (esempi marketing/AI per coerenza con i default attuali)
- Estendo `getStylableFields()` per esporre i campi testuali principali

### `src/lib/store.ts`
- Aggiorno `DEFAULT_TEMPLATES_PER_CATEGORY`:
  - `text`: append `hook`, `objection`
  - `data`: append `problemSolution`, `mistakes`, `framework`, `socialProof`, `tipPack`
  - `ref`: append `offer`
- `mergePickerState` già gestisce l'append per utenti con stato persistito → zero migrazione

### `src/components/slides/SlideRenderer.tsx`
- 8 nuovi case nello `switch(slide.template)` di `renderBody()`
- Ogni componente usa `fieldStyle()` per gli override e `<HL/>` per gli highlights
- Pattern coerente con i template esistenti (no novità API)

### `src/components/slides/slide-styles.css`
- Nuove classi `.tpl-hook`, `.tpl-problemSolution`, `.tpl-mistakes`, `.tpl-framework`, `.tpl-socialProof`, `.tpl-offer`, `.tpl-objection`, `.tpl-tipPack`
- Override per i 4 formati (`.fmt-portrait`, `.fmt-square`, `.fmt-story`, `.fmt-landscape`)
- Tipografia coerente con il sistema esistente; uso CSS vars già definite (`--cyan`, `--text`, `--bg`, ecc.)
- Effetti speciali piccoli: `tpl-hook` ha pulse sottile sull'indicatore swipe; `tpl-offer` ha border accent + shadow; `tpl-objection` ha bubble con tail SVG

### `src/lib/validation.ts`
- Nuovi case in `validateSlideData()`:
  - `hook`: `hook` 5-90 char (required)
  - `problemSolution`: required `problem.text`, `solution.text`
  - `mistakes`: `title` required, `mistakes` 3-5 items, ogni item ha `title` required
  - `framework`: `title` required, `acronym` required, `letters` 3-6, ogni `letter` 1-3 char
  - `socialProof`: `clientName` required, `metrics` esattamente 3, ogni metric ha `value` e `label`
  - `offer`: `productName`, `priceNew`, `ctaLabel` required, `includes` 3-5
  - `objection`: `objection` e `answer` required (max 200 char ognuno)
  - `tipPack`: `title` required, `tips` 3-6, ogni tip ha `title` required
- Aggiorno `LIMITS` con le nuove soglie

### `src/components/SlideEditorForm.tsx`
- 8 nuovi editor: `HookEditor`, `ProblemSolutionEditor`, `MistakesEditor`, `FrameworkEditor`, `SocialProofEditor`, `OfferEditor`, `ObjectionEditor`, `TipPackEditor`
- Riusano i pattern `Field`, `ArrayField`, `ItemCounter` esistenti
- `FontSizeSlider` integrato sui campi testuali principali (hook, headline, prezzo, ecc.)

## Coerenza visiva e funzionale

Tutti gli 8 template:
- Riusano CSS variables esistenti (`--cyan`, `--cyan-2`, `--text`, `--bg`, `--radius`, `--font-heading`, `--font-body`)
- Rispettano effetti brand attuali (gradient, shadow, border, corner, divider, grain)
- Supportano gli highlight `==testo==` / `{hl}testo{/hl}` nei campi testuali principali
- Funzionano con i 4 formati esistenti
- Si integrano nel `NewSlideDialog` automaticamente via store (zero modifiche al picker)
- Sono compatibili con multi-lingua (il wrapper `__i18n` è agnostico al template)
- Esportabili PNG/JPG senza modifiche a `lib/export.ts`

## File toccati

**Modificati:**
- `src/lib/templates.ts` — types, meta, order, default data, stylable fields
- `src/lib/store.ts` — `DEFAULT_TEMPLATES_PER_CATEGORY` con i nuovi ID
- `src/lib/validation.ts` — regole per gli 8 nuovi template
- `src/components/slides/SlideRenderer.tsx` — 8 nuovi componenti di rendering
- `src/components/slides/slide-styles.css` — classi `.tpl-*` + override per formato
- `src/components/SlideEditorForm.tsx` — 8 nuovi editor

**Non toccati:**
- `NewSlideDialog.tsx`, `SlidesSidebar.tsx` — picker dinamico
- `FontSizeSlider.tsx`, `TextStylePopover.tsx` — riutilizzati
- `ExportButton.tsx`, `lib/export.ts` — agnostici al template

## Logica marketing dietro la scelta

I template sono scelti per coprire il **funnel completo di un carosello che vende**:
1. **Hook** (slide 1) → ferma lo scroll
2. **Problem/Solution** o **Mistakes** (slide 2-3) → agita il pain
3. **Framework** o **TipPack** (slide 4-5) → costruisce autorità con valore
4. **SocialProof** (slide 6-7) → prova che funziona
5. **Objection** (slide 8) → scioglie i dubbi
6. **Offer** + `cta` esistente (slide 9-10) → chiude

Ogni utente può comporre carousel ottimizzati per conversion senza dover disegnare layout custom.

## Fuori scope

- **Animazioni** tra slide (resta export statico)
- **Template video / GIF** (carousel statico per export PNG/JPG)
- **AI auto-fill** dei contenuti dei nuovi template (utente compila a mano)
- **Migrazione automatica** di slide esistenti verso i nuovi template
- **Preset di carosello completo** ("Carosello sales 10 slide pre-fatto"): l'utente assembla manualmente
- **A/B test integrato** o tracking analitico delle conversioni (fuori scope app editor)

