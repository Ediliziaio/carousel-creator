

# 3 nuove utility: guida correzione errori, micro-editor Hook→Offer, preset Offerta rapida

## 1. "Correggi campi mancanti" — flusso guidato campo per campo

Sostituisco il singolo link "Vai al primo errore" con un flusso guidato che porta l'utente attraverso TUTTI i campi mancanti, uno alla volta, senza dover cercare.

### Nuovo componente `src/components/FixIssuesGuide.tsx`
- Toolbar floating in basso al centro del main canvas, visibile solo quando `guideOpen=true`
- Layout compatto: `[← Prec] Errore 3 di 12 · Slide 5 · Titolo mancante [Salta] [Succ →] [×]`
- Passa al campo successivo automaticamente quando l'errore corrente sparisce (l'utente compila → la lista issues si ricomputa → avanza al prossimo)
- Su click "Succ" o auto-advance: setActive(slideId) + dispatch `slide:focus-field`
- Su "×": chiude la guida (setGuideOpen(false))

### Modifiche `src/routes/index.tsx`
- Aggiungo state locale `[guideOpen, setGuideOpen] = useState(false)` e `[guideIndex, setGuideIndex] = useState(0)`
- Sostituisco "Vai al primo errore" con due pulsanti nel banner:
  - "Correggi campi mancanti" → `setGuideOpen(true); setGuideIndex(0); jumpToIssue(0)`
  - "Vai al primo errore" rimane come scorciatoia (no guida)
- Computo lista flat di tutti gli errori: `flatIssues = validationIssues.flatMap(v => v.errors.map(e => ({ slideId: v.slideId, slideIndex: v.slideIndex, templateLabel: v.templateLabel, ...e })))`
- `jumpToIssue(i)` clamp a `[0, flatIssues.length-1]`, setActive + focus-field
- useEffect che, quando `guideOpen` e `flatIssues.length > 0`, mantiene `guideIndex` valido (clamp + se l'errore corrente è risolto → avanza)
- Render `<FixIssuesGuide />` quando `guideOpen && flatIssues.length > 0`; auto-chiude quando `flatIssues.length === 0` con toast "Tutti i campi sono completi ✔"

### Comportamento utente
1. Vedo banner "12 slide hanno campi obbligatori mancanti"
2. Clicco "Correggi campi mancanti" → vado alla slide 1, primo errore, form già focalizzato sul campo
3. Compilo → la guida avanza automaticamente al prossimo errore
4. Posso navigare manualmente con Prec/Succ o saltare con "Salta"
5. Quando finisco tutto: toast di conferma + guida si chiude

## 2. Micro-editor "Hook → Offer" — bulk edit di slide marketing

Editor compatto che permette di modificare in 1 schermata i testi dei template marketing (`hook`, `offer`, `cta`) con selezione per-slide di quali aggiornare.

### Nuovo componente `src/components/HookOfferMicroEditor.tsx`
- Pulsante header outline `Wand2` "Hook → Offer", abilitato se almeno 1 slide tra `hook|offer|cta` esiste
- Sheet laterale (riuso pattern di `QuickOfferEditor`) con tre sezioni a tab:
  - **Hook**: lista delle slide `hook` con checkbox + 2 input compatti per slide (`hook`, `subhook`)
  - **Offer**: lista delle slide `offer` con checkbox + 4 input (`productName`, `priceNew`, `priceOld`, `urgency`)
  - **CTA**: lista delle slide `cta` con checkbox + 1 input (`buttonLabel`) + 1 (`headline`)
- In testa a ogni tab: campo "Applica a tutte le selezionate" che propaga il valore alle slide ticchettate (es. stesso `hook` su 3 slide selezionate)
- Pulsante "Salva modifiche" → singola entry undo

### Nuova azione `src/lib/store.ts`
- `bulkUpdateMarketingSlides(updates: Array<{ slideId: string, patch: Record<string, unknown> }>)`
- Itera, applica patch ai data del active language, una sola entry undo

### Differenza vs QuickOfferEditor
- QuickOfferEditor: 1 valore globale → propagato a TUTTE le slide offer/cta
- HookOfferMicroEditor: valori potenzialmente diversi per slide, selezione granulare, copre anche `hook`

## 3. Preset Offerta rapida — salva/carica set di valori

Aggiungo persistenza dei valori dell'Offerta rapida come preset riutilizzabili.

### Estensione `src/lib/store.ts`
- Nuovo tipo `OfferPreset { id: string; name: string; createdAt: number; ctaLabel?: string; priceNew?: string; priceOld?: string; currency?: string; urgency?: string; }`
- Nuovo state: `offerPresets: OfferPreset[]` (default `[]`)
- Azioni:
  - `saveOfferPreset(name: string, values: Omit<OfferPreset, "id"|"name"|"createdAt">)`
  - `deleteOfferPreset(id: string)`
  - `renameOfferPreset(id: string, name: string)`
- Persisto `offerPresets` nel partialize

### Modifiche `src/components/QuickOfferEditor.tsx`
- In testa al sheet, una `Select` "Carica preset…" che popola tutti i campi quando selezionato
- Sotto i campi, due pulsanti compatti:
  - `Save` "Salva come preset" → apre piccolo prompt inline (Input + Conferma) con nome → chiama `saveOfferPreset`
  - Nella select, ogni opzione ha un mini "×" per eliminare (o gestione separata in popover)
- Toast su salvataggio: "Preset 'Lancio Black Friday' salvato"
- Quando si carica un preset, i campi del form si riempiono ma l'utente deve ancora cliccare "Applica a tutte" (no auto-apply)

### Built-in suggested presets (opzionale, dichiarati nel codice)
Aggiungo 2-3 preset built-in d'esempio (con `builtIn: true`) non eliminabili:
- "Lancio Black Friday" — CTA "ACQUISTA ORA →", prezzo 47/97, valuta €, urgency "Solo per 48h"
- "Early Bird" — CTA "PRENOTA POSTO →", urgency "Sconto del 50% per i primi 20"
- "Standard" — vuoto / valori puliti

I built-in seguono lo stesso pattern di `BUILT_IN_PRESETS` in `presets.ts`.

## File toccati

**Nuovi:**
- `src/components/FixIssuesGuide.tsx`
- `src/components/HookOfferMicroEditor.tsx`
- `src/lib/offerPresets.ts` — definisce `OfferPreset`, `BUILT_IN_OFFER_PRESETS`

**Modificati:**
- `src/routes/index.tsx` — banner con pulsante "Correggi campi mancanti", state della guida, render `<FixIssuesGuide />` e `<HookOfferMicroEditor />` nell'header
- `src/lib/store.ts` — `offerPresets` + 3 azioni, `bulkUpdateMarketingSlides`, persistenza
- `src/components/QuickOfferEditor.tsx` — selettore preset in testa, "Salva preset" inline, gestione delete

**Non toccati:**
- `src/lib/validation.ts`
- `src/components/SlideEditorForm.tsx` — riusa il listener `slide:focus-field` esistente
- `src/components/slides/SlideRenderer.tsx`

## Esperienza utente integrata

- **Errore di validazione**: banner → "Correggi campi mancanti" → tour guidato campo per campo, auto-advance
- **Bulk editing testi marketing**: pulsante "Hook → Offer" → modifico hook + offer + cta selettivamente in 1 schermata
- **Riutilizzo offerte**: salvo "Black Friday" una volta, lo richiamo al prossimo lancio in 2 click

## Fuori scope

- **Bulk editing per altri template** (myth, framework, ecc.) — solo hook/offer/cta in questa iterazione
- **Editor inline visivo** della guida correzione (l'utente compila nella sidebar form esistente)
- **Esportazione/importazione preset offerta** (solo persistenza locale)
- **Animazioni di transizione** tra step della guida
- **Tracking analytics** delle conversioni dei preset

