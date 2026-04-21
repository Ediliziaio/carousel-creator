

# Wiring UI: validazione bloccante, header tools, marketing styles

## 1. Header con i 4 nuovi tool (`src/routes/index.tsx`)

Aggiungo nella header, prima di `BrandSettings`, 4 controlli:

- **`<CarouselPresetDialog />`** — pulsante outline `Sparkles` "Caroselli pronti"
- **`<QuickOfferEditor />`** — pulsante outline `Zap` "Offerta rapida" (auto-disabled internamente se mancano slide `offer`/`cta`)
- **`<ContentImportDialog />`** — pulsante outline `FileInput` "Importa contenuti"
- **Toggle validazione overlay** — `Button variant="ghost" size="icon"` con `ShieldCheck`/`ShieldOff`, legge/scrive `validationOverlay` dallo store; tooltip "Mostra/Nascondi indicatori validazione"

Uso `useMemo(() => validateAllSlides(slides, activeLang, brand.defaultLanguage), [slides, activeLang, brand.defaultLanguage])` per avere le issues globali una sola volta.

Sopra il main canvas (sotto l'export error banner), aggiungo un **banner rosso bloccante** quando `strictExport && validationIssues.length > 0`:
- Testo: "X slide hanno campi obbligatori mancanti — Export disabilitato"
- Link "Vai al primo errore" → `setActive(firstIssue.slideId)` + `dispatchEvent("slide:focus-field", { slideId, field: firstIssue.firstField })`
- Componente inline (non nuovo file) con stesso stile di `ExportErrorBanner` ma colore destructive
- Quando `strictExport=false`, banner solo informativo (giallo) senza messaggio "disabilitato"

## 2. Overlay validazione in preview (`src/components/slides/SlideRenderer.tsx`)

Nuovo prop opzionale `showValidation?: boolean` (default `false`).

Quando `true`:
- Calcolo `validateSlide(slide, lang ?? brand.defaultLanguage, brand.defaultLanguage)` dentro il renderer
- Se ci sono errori (severity `error`), aggiungo un overlay assoluto in alto a destra dentro `<div className="slide-frame">`:
  ```
  <button className="validation-badge" onClick={...}>
    {errors.length} {errors.length === 1 ? "campo mancante" : "campi mancanti"}
  </button>
  ```
- Click → `dispatchEvent("slide:focus-field", { slideId: slide.id, field: errors[0].field })` + `useCarousel.setState({ activeId: slide.id })` (via prop callback opzionale, no — uso direttamente lo store con import dinamico per evitare ciclo: in realtà semplifico facendo dispatch dell'evento e lasciando che il form lo gestisca; per `setActive` uso `window.dispatchEvent("slide:focus-field")` che già porta il tab al form)
- Tooltip native con elenco errori

In `slide-styles.css` aggiungo:
```css
.validation-badge {
  position: absolute; top: 12px; right: 12px;
  z-index: 50; padding: 6px 10px;
  background: rgb(239 68 68 / .95); color: white;
  border-radius: 6px; font-size: 11px; font-weight: 600;
  cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.4);
  font-family: system-ui, sans-serif;
}
.validation-badge:hover { background: rgb(220 38 38); }
```

Passo `showValidation={validationOverlay}` solo allo `SlideRenderer` del **main canvas** (NON ai nodi nascosti di export, NON alla mini-preview della sidebar).

## 3. Marketing styles → CSS vars (`src/components/slides/SlideRenderer.tsx`)

In `styleVars` aggiungo:
```typescript
["--mkt-badge" as string]: brand.effects.marketingBadgeStyle ?? "filled",
["--mkt-grad" as string]: brand.effects.marketingGradientIntensity ?? "subtle",
["--mkt-ico" as string]: brand.effects.marketingIconSet ?? "emoji",
```

In `buildClassName` aggiungo:
```typescript
parts.push(`mkt-badge-${fx.marketingBadgeStyle ?? "filled"}`);
parts.push(`mkt-grad-${fx.marketingGradientIntensity ?? "subtle"}`);
parts.push(`mkt-ico-${fx.marketingIconSet ?? "emoji"}`);
```

In `slide-styles.css` aggiungo regole:
- `.mkt-badge-filled .tpl-offer .badge` (default attuale)
- `.mkt-badge-outline .tpl-offer .badge { background: transparent; border: 2px solid var(--cyan); color: var(--cyan); }`
- `.mkt-badge-neon .tpl-offer .badge { box-shadow: 0 0 20px var(--cyan); ... }`
- `.mkt-grad-none .tpl-hook, .mkt-grad-none .tpl-cta { background: var(--bg) !important; }`
- `.mkt-grad-bold .tpl-hook { background: linear-gradient(135deg, var(--cyan) 0%, var(--cyan-2) 100%); }`
- `.mkt-ico-geometric .tpl-mistakes .ico::before { content: "▲"; }`, `.mkt-ico-minimal { content: "—"; }`

Le regole sono permissive: i template marketing che non hanno ancora `.badge`/`.ico` semplicemente ignorano le classi senza rompersi.

## 4. BrandSettings: sezione "Stile marketing" + tab "Avanzate" (`src/components/BrandSettingsDialog.tsx`)

### Tab "Effetti" — nuova `Section` "Stile marketing"
Sotto la section "Titoli & decori", aggiungo:
```tsx
<Section title="Stile marketing">
  <SelectRow label="Badge marketing" value={b.effects.marketingBadgeStyle ?? "filled"} 
    options={[{value:"filled",label:"Pieno"},{value:"outline",label:"Contorno"},{value:"neon",label:"Neon"}]}
    onChange={(v) => setEffect("marketingBadgeStyle", v as MarketingBadgeStyle)} />
  <SelectRow label="Intensità gradiente" value={b.effects.marketingGradientIntensity ?? "subtle"} ... />
  <SelectRow label="Set icone" value={b.effects.marketingIconSet ?? "emoji"} ... />
  <Button variant="outline" size="sm" onClick={onAutoTune}>
    <Wand2 className="mr-1 h-3 w-3" /> Auto-tune dai colori brand
  </Button>
</Section>
```

`onAutoTune()`: imposta `marketingGradientIntensity = b.effects.accentGlow ? "bold" : "subtle"` e `marketingBadgeStyle = b.effects.accentGlow ? "neon" : "filled"`, mostra toast.

### Nuovo tab "Avanzate"
Estendo `TabsList` da 6 a 7 colonne, aggiungo `<TabsTrigger value="advanced">Avanzate</TabsTrigger>`.

```tsx
<TabsContent value="advanced" className="m-0 space-y-4">
  <ToggleRow label="Strict export" 
    desc="Blocca l'esportazione PNG/ZIP finché tutte le slide hanno i campi obbligatori compilati." 
    checked={strictExport} onChange={setStrictExport} />
  <ToggleRow label="Mostra indicatori validazione in preview"
    desc="Sovrappone un badge rosso sulle slide con errori."
    checked={validationOverlay} onChange={setValidationOverlay} />
</TabsContent>
```

Letto/scritto direttamente da store, non passa da `brandDraft` (sono settings UI, non brand).

## 5. ExportButton bloccante (`src/components/ExportButton.tsx`)

- Leggo `strictExport = useCarousel((s) => s.strictExport)`
- Calcolo `hasErrors = useMemo(() => validateAllSlides(slides, defaultLang, defaultLang).length > 0, [slides, defaultLang])`
- Pulsante trigger: `disabled={isBusy || slides.length === 0 || (strictExport && hasErrors)}`
- Aggiungo `title` dinamico: `strictExport && hasErrors ? "Completa i campi obbligatori per esportare" : ...`
- Nel dialog di validazione, quando `strictExport=true`:
  - Nascondo la checkbox "Esporta comunque"
  - Pulsante azione mostra solo "Vai al primo campo da completare"
  - `setForceExport(false)` forzato

Mantengo la logica attuale (`forceExport`) per `strictExport=false`.

## 6. Sidebar: conteggio errori per slide (`src/components/SlidesSidebar.tsx`)

Modifico `SlideRow`:
- Calcolo `validation = validateSlide(sl, lang, defLang)` (già fa `validateSlide` per `invalid`, sostituisco per riusare i conteggi)
- `errorCount = validation.errors.filter(e => (e.severity ?? "error") === "error").length`
- Sostituisco il puntino con un mini-badge rosso quando `errorCount > 0`:
  ```tsx
  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground" 
        title={validation.errors.map(e => e.message).join("\n")}>
    {errorCount}
  </span>
  ```

In `SlidesSidebar` (top, sopra la lista), aggiungo banner condizionale visibile solo se `strictExport && totalIssues > 0`:
```tsx
{strictExport && totalIssues > 0 && (
  <button onClick={goToFirstError} 
    className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive hover:bg-destructive/20">
    {totalIssues} slide con errori — vai al primo
  </button>
)}
```

`goToFirstError` → `setActive(firstIssue.slideId)` + dispatch `slide:focus-field`.

## File toccati

**Modificati:**
- `src/routes/index.tsx` — header con 4 nuovi controlli, banner blocco export, calcolo `validationIssues`
- `src/components/slides/SlideRenderer.tsx` — prop `showValidation`, overlay badge, CSS vars `--mkt-*`, classi `mkt-*`
- `src/components/slides/slide-styles.css` — `.validation-badge`, `.mkt-badge-*`, `.mkt-grad-*`, `.mkt-ico-*`
- `src/components/BrandSettingsDialog.tsx` — Section "Stile marketing" + tab "Avanzate"
- `src/components/ExportButton.tsx` — `strictExport` blocca pulsante, dialog adattato
- `src/components/SlidesSidebar.tsx` — conteggio errori + banner "vai al primo errore"

**Non toccati:**
- `src/lib/store.ts` — già pronto (`strictExport`, `validationOverlay`, `setStrictExport`, `setValidationOverlay`)
- `src/lib/templates.ts` — `BrandEffects` già esteso
- `src/lib/validation.ts` — già completo
- `src/components/SlideEditorForm.tsx` — `data-field` già presente sui campi

## Comportamento finale

1. Header: 4 nuovi pulsanti tutti funzionanti, toggle scudo per overlay
2. Preview: badge rosso "3 campi mancanti" su slide invalide → click porta al campo
3. Sidebar: ogni slide mostra numero errori + banner riassuntivo cliccabile in cima
4. Export: pulsante grigio quando ci sono errori in strict mode, tooltip esplicativo
5. BrandSettings → Effetti → "Stile marketing" + Auto-tune; tab Avanzate per strict/overlay

## Fuori scope

- Animazione del badge di validazione
- Focus visivo del singolo campo invalido nel renderer (esiste già a livello di form)
- Persistenza per-slide del toggle overlay
- Esportazione di un report di validazione

