

# 5 funzionalità: preset carosello completo, editor offerta, brand auto-style, import JSON, validazione bloccante

## 1. Preset carosello completo "Sales Funnel" (8-10 slide pre-fatte)

Aggiungo un sistema di **carousel preset**: assemblaggi pronti di slide multi-template che si inseriscono in 1 click con contenuti realistici da modificare.

### Nuovo file `src/lib/carouselPresets.ts`
- Tipo `CarouselPreset { id, name, description, icon, slides: { template, format, data }[] }`
- Esporto `BUILT_IN_CAROUSEL_PRESETS`:
  - **"Sales Funnel completo"** (10 slide): `hook` → `problemSolution` → `mistakes` → `framework` → `socialProof` → `objection` → `offer` → `cta`
  - **"Educational pack"** (8 slide): `cover` → `hook` → `tipPack` → `process` → `myth` → `framework` → `quoteBig` → `cta`
  - **"Lancio prodotto"** (9 slide): `hook` → `center` → `feature` → `socialProof` → `prosCons` → `offer` → `objection` → `cta`
  - **"Case study"** (8 slide): `cover` → `problemSolution` → `process` → `roadmap` → `socialProof` → `quoteBig` → `cta`
- Ogni preset usa `makeDefaultData()` come base con override mirati (hook diversi per ogni preset, copy coerente con il funnel)

### Modifiche `src/lib/store.ts`
- Aggiungo azione `loadCarouselPreset(presetId: string)`: sostituisce `slides` con quelle del preset, mantiene `brand` corrente, applica auto-styling brand (vedi #3)
- Aggiungo azione `appendCarouselPreset(presetId: string)`: aggiunge le slide del preset alla fine

### Nuovo componente `src/components/CarouselPresetDialog.tsx`
- Dialog accessibile da nuovo pulsante "Caroselli pronti" nell'header (icona `Sparkles`)
- Grid di card preset con anteprima icone delle slide incluse, nome, descrizione, conteggio slide
- 2 azioni per preset: "Sostituisci tutto" (warning se ci sono slide non vuote) o "Aggiungi alla fine"

## 2. Editor rapido CTA / Prezzo / Urgenza (1 schermata, propagazione automatica)

### Nuovo componente `src/components/QuickOfferEditor.tsx`
- Pulsante in header (icona `Zap` + "Offerta rapida"), abilitato solo se esiste almeno una slide `offer` o `cta`
- Sheet (laterale) con 4 campi compatti:
  - **CTA** (testo): propagato a `cta.buttonLabel` + `offer.ctaLabel`
  - **Prezzo nuovo** + **Prezzo barrato**: propagati a tutti gli `offer.priceNew` / `priceOld`
  - **Currency**: propagato a `offer.currency`
  - **Urgenza**: propagato a `offer.urgency` + `offer.badge` (badge derivato da urgency se vuoto)
- Sezione "Anteprima impatto": lista delle slide che verranno modificate (es. "Slide 7 · Offerta", "Slide 9 · CTA")
- Toggle per ogni campo: "Sovrascrivi anche se già personalizzato" (default OFF — modifica solo i valori a default)
- Pulsante "Applica a tutte" → singola azione store

### Modifiche `src/lib/store.ts`
- Nuova azione `propagateOfferFields(patch: { ctaLabel?; priceNew?; priceOld?; currency?; urgency?; badge? }, opts: { overwriteCustom: boolean })`
- Itera tutte le slide `offer`/`cta`, applica i campi rispettando `overwriteCustom` (confronta con i default per decidere "personalizzato")
- Singola entry undo

## 3. Pannello brand auto-style per nuovi template

### Modifiche `src/lib/templates.ts`
- Estendo `BrandEffects` con 3 nuove proprietà opzionali:
  - `marketingBadgeStyle?: "filled" | "outline" | "neon"` (default `"filled"`) — usato dai badge `offer`, `socialProof`
  - `marketingGradientIntensity?: "none" | "subtle" | "bold"` (default `"subtle"`) — controlla i gradient nei nuovi template (`hook`, `cta`, `offer`)
  - `marketingIconSet?: "emoji" | "geometric" | "minimal"` (default `"emoji"`) — sostituisce ❌/✓/⚠ con set coerenti
- Tutti i nuovi template leggono questi valori in `SlideRenderer` via CSS custom props (`--mkt-badge-style`, `--mkt-gradient`, `--mkt-icon`)

### Modifiche `src/components/slides/SlideRenderer.tsx`
- In `wrapStyle()` calcolo i CSS vars da `brand.effects.marketing*` e li passo al wrapper della slide
- I componenti `Hook`, `Offer`, `Cta`, `SocialProof`, `Mistakes`, `ProsCons`, `Myth`, `TipPack` leggono questi vars per badge, gradient, iconografia

### Modifiche `src/components/slides/slide-styles.css`
- Aggiungo varianti `.mkt-badge--filled/outline/neon`, `.mkt-grad--subtle/bold`, `.mkt-ico--emoji/geometric/minimal`
- Le icone "geometric" usano simboli unicode neutri (●○▲▼); "minimal" usa solo punti e linee

### Modifiche `src/components/BrandSettingsDialog.tsx`
- Nel tab "Effetti" aggiungo sezione "Stile marketing" con 3 select per i nuovi campi
- Pulsante "Auto-tune dai colori brand": setta automaticamente `marketingGradientIntensity` (bold se accent saturo, subtle altrimenti) e `marketingBadgeStyle` (neon se `accentGlow=true`, filled altrimenti)

### Modifiche `src/lib/store.ts`
- `mergeBrand` mantiene compatibilità: i valori di default popolano automaticamente brand persistiti

## 4. Import JSON di contenuti per template

### Nuovo file `src/lib/contentImport.ts`
- Funzione `parseContentBundle(json: unknown): { items: { template: TemplateId, data: AnyTemplateData }[], errors: string[] }`
- Formato accettato (documentato in dialog):
  ```json
  [
    { "template": "hook", "data": { "hook": "...", "subhook": "..." } },
    { "template": "offer", "data": { "productName": "...", "priceNew": "..." } }
  ]
  ```
- Validazione schema per template: ogni `data` viene mergiata con `makeDefaultData(template)` per riempire i campi mancanti
- Zero crash su campi sconosciuti (li ignora con warning)

### Nuovo componente `src/components/ContentImportDialog.tsx`
- Pulsante in header "Importa contenuti" (icona `FileInput`)
- Dialog con 3 modalità:
  1. **Upload file `.json`**: drag & drop o file picker
  2. **Incolla JSON**: textarea con esempi cliccabili pre-fatti (Sales, Educational, Lancio)
  3. **CSV semplice** (bonus): formato `template,field,value` riga per riga → trasformato a JSON internamente
- Anteprima parsing: lista delle slide che verranno create con badge "OK" / "warning" per ognuna
- 2 azioni: "Sostituisci tutto" / "Aggiungi alla fine"
- Toast con conteggio slide importate + eventuali warning

### Modifiche `src/lib/store.ts`
- Nuova azione `importContentBundle(items: { template, data }[], mode: "replace" | "append")`
- Genera `Slide[]` con id nuovi, format `portrait` di default

## 5. Validazione bloccante in preview con indicatori per campo

### Modifiche `src/components/slides/SlideRenderer.tsx`
- Nuovo prop opzionale `showValidation?: boolean` (default false)
- Quando true, dopo il render del corpo aggiungo un overlay assoluto:
  - Per ogni `errors` di `validateSlideData`, sovrappongo un badge rosso piccolo in basso a destra della slide con conteggio errori (es. "3 campi mancanti")
  - Click sul badge dispatcha `slide:focus-field` sul primo errore
- Ogni `Field` taggato con attributo `data-field-path={path}` per puntamento futuro

### Modifiche `src/routes/index.tsx`
- Aggiungo toggle `[validationOverlay, setValidationOverlay] = useState(true)` in header (icona `ShieldCheck`)
- Passo `showValidation={validationOverlay}` allo `SlideRenderer` del main canvas (NON ai nodi nascosti di export)
- Banner persistente in cima al main canvas se `validateAllSlides(slides).length > 0`: "X slide hanno campi obbligatori mancanti — Export disabilitato" + link "Vai al primo errore"

### Modifiche `src/components/ExportButton.tsx`
- Aggiungo stato `strictMode: boolean` (persisted in store, default `true`)
- Quando `strictMode=true`:
  - Pulsante Export disabled se `validateAllSlides().length > 0`, tooltip "Completa i campi obbligatori per esportare"
  - Rimuovo opzione "Esporta comunque" dal dialog di validazione (sostituita da "Vai al primo campo")
- Quando `strictMode=false` (impostazione avanzata in BrandSettings → tab "Avanzate"):
  - Comportamento attuale (override possibile)
- Default per nuovi utenti: strict ON

### Modifiche `src/components/SlidesSidebar.tsx`
- Già mostra `invalid` come badge — aggiungo conteggio: "3" anziché solo punto rosso, hover mostra elenco errori

### Modifiche `src/lib/store.ts`
- Persisto `strictExport: boolean` nel partialize (default true)

## File toccati

**Nuovi:**
- `src/lib/carouselPresets.ts`
- `src/lib/contentImport.ts`
- `src/components/CarouselPresetDialog.tsx`
- `src/components/QuickOfferEditor.tsx`
- `src/components/ContentImportDialog.tsx`

**Modificati:**
- `src/lib/store.ts` — `loadCarouselPreset`, `appendCarouselPreset`, `propagateOfferFields`, `importContentBundle`, `strictExport` persisted, `mergeBrand` con marketing fields
- `src/lib/templates.ts` — `BrandEffects` esteso (`marketingBadgeStyle`, `marketingGradientIntensity`, `marketingIconSet`), `DEFAULT_EFFECTS` aggiornato
- `src/components/slides/SlideRenderer.tsx` — CSS vars `--mkt-*`, prop `showValidation` con overlay, `data-field-path` sui campi
- `src/components/slides/slide-styles.css` — varianti `.mkt-badge-*`, `.mkt-grad-*`, `.mkt-ico-*`, stile overlay validazione
- `src/components/BrandSettingsDialog.tsx` — sezione "Stile marketing" + toggle "Strict export" in nuovo tab "Avanzate" + pulsante "Auto-tune"
- `src/components/ExportButton.tsx` — strict mode che disabilita il pulsante
- `src/components/SlidesSidebar.tsx` — conteggio errori sul badge invalid
- `src/routes/index.tsx` — pulsanti header (Caroselli pronti, Offerta rapida, Importa contenuti, toggle Validazione), banner di blocco export

**Non toccati:**
- `src/lib/validation.ts` — già completo, riusato così com'è
- `src/lib/export.ts` — agnostico
- `src/components/SlideEditorForm.tsx` — già mostra errori inline

## Come si integra il flusso utente

1. Utente apre app vuota → click "Caroselli pronti" → sceglie "Sales Funnel" → 10 slide pronte con contenuti default
2. Click "Offerta rapida" → in 30 secondi imposta CTA, prezzo, urgenza una volta sola → propagati a tutte le slide
3. BrandSettings → "Auto-tune" → colori, badge, gradient, icone si allineano al brand
4. Per refresh contenuti: "Importa contenuti" → incolla JSON → tutto sostituito
5. Banner rosso in alto se mancano campi → Export bloccato finché tutto OK → indicatore visivo per slide

## Fuori scope

- Preset carousel **personalizzati salvati dall'utente** (solo built-in in questa iterazione)
- **Editor visuale** del JSON (l'utente edita testo o file)
- **AI generation** dei contenuti dei preset (solo template fissi)
- **Sync cross-device** dei carousel preset
- **Diff visivo** prima/dopo applicazione "Offerta rapida"
- **Export bloccato per warning** (solo errori bloccano; warning restano informativi)
- **Override per-slide** del marketing style (vale a livello brand)

