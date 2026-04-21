

# Debounce uniforme + anteprima export WYSIWYG affidabile

## 1. Debounce 400ms su tutti gli input del form (anche select/upload/switch/array)

**Stato attuale:** `SlideEditorForm` ha già un debounce centralizzato — tutti i campi (Input, Textarea, Switch, ImageUploadField, ArrayField add/remove) passano per `set()` che aggiorna solo `draft` e committa allo store dopo 400ms. ✅

**Gap reale da chiudere:** alcune azioni *non passano* per `set()` e creano snapshot immediati nello store, sporcando l'undo:
- **Cambio lingua** (`setActiveLang`) — ok, ma se c'è un draft pendente sulla lingua precedente viene perso
- **`BrandSettingsDialog`** — ogni `<input type="color">`, ogni toggle, ogni `<select>` di font chiama `setBrand({...})` ad ogni keystroke/click → snapshot per ogni movimento del color picker
- **Logo upload** in BrandDialog — ok come singolo evento

**Modifiche:**

a) **`SlideEditorForm`**: prima di cambiare `activeLang`, flush sincrono del draft pendente (`update(slide.id, draftRef.current)` se diverso). Garantisce che cambiando lingua non si perdano le modifiche in volo.

b) **`BrandSettingsDialog`**: introduco lo stesso pattern draft+debounce 400ms per `setBrand`. Concretamente:
- stato locale `brandDraft` inizializzato dal brand corrente
- ogni controllo (color picker, font select, weight slider, effetti toggles) scrive su `brandDraft` 
- `useEffect` con `setTimeout` 400ms committa `setBrand(brandDraft)` solo se diverso
- al close del dialog → flush sincrono del pending
- risultato: muovere il color picker per 2 secondi crea **1 sola entry undo** invece di 30+

c) **`updateSlide` nello store** → invariato (lo store resta sincrono, il debounce vive nei componenti).

## 2. Anteprima export "what you see is what you get" (1080×1350 con fonts/logo/immagini)

**Problemi attuali in `ExportPreviewDialog` + `export.ts`:**

- `ensureFonts()` carica solo **Figtree + JetBrains Mono hardcoded** — se l'utente ha scelto Inter, Playfair, Space Grotesk dal BrandDialog, queste **non vengono caricate** né per la preview né per la cattura. Il rendering finale usa il fallback `system-ui`.
- La preview (`<SlideRenderer>` scalato) e il nodo di cattura nascosto sono **due DOM separati**: la preview può sembrare ok mentre la cattura ha font diversi se i font non sono pronti.
- Le immagini dataURL sono già inline (no problema CORS) ma il "warm up" double-render in `captureNode` non aspetta esplicitamente il `decode()` delle `<img>`.

**Modifiche:**

a) **Font loader dinamico in `src/lib/export.ts`**:
- nuova funzione `ensureFontsFor(brand: BrandSettings)` che costruisce dinamicamente l'URL Google Fonts in base a `brand.fontHeading` + `brand.fontBody` + i pesi richiesti (`headingWeight`, `bodyWeight`, e i pesi extra usati nel CSS: 400, 600, 700, 800, 900).
- mantiene il `<link>` esistente con id stabile `carousel-google-fonts` ma **lo rimpiazza** se l'href è cambiato dall'ultima volta
- attende `document.fonts.load("700 16px <heading>")` e `document.fonts.load("400 16px <body>")` esplicitamente (più affidabile di `fonts.ready` che a volte risolve subito)
- whitelist di font Google noti; per altri valori, fallback a `system-ui` senza fetch (no errori CORS)

b) **Helper `waitForImages(node)`** in `export.ts`:
- raccoglie tutte le `<img>` dentro il nodo
- per ognuna: `if (!img.complete) await new Promise(r => img.onload = img.onerror = r)`
- poi `await img.decode().catch(() => {})` per garantire pixel pronti
- chiamato prima dei due render in `captureNode`

c) **`captureNode(node, brand)`** — nuova firma:
- accetta `brand` per chiamare `ensureFontsFor(brand)`
- aggiorno tutti i call site (`downloadSinglePng`, `downloadZipFromNodes`, `ExportPreviewDialog`)

d) **`ExportPreviewDialog`** — rendere preview e capture identiche:
- la preview scalata già usa `<SlideRenderer>` reale ✅
- aggiungo `useEffect` che chiama `ensureFontsFor(brand)` all'apertura del dialog → la preview vede subito i font corretti (no flash di fallback)
- aggiungo header banner "✓ Font caricati" / spinner "Caricamento font..." finché `document.fonts.check(...)` non è true per le scelte del brand
- bottone "Scarica" disabilitato finché font + immagini non sono pronti (evita download con render incompleto)

e) **Logo & dataURL immagini**: già inline come `data:` URI, quindi `html-to-image` li serializza correttamente. L'unico fix necessario è il `decode()` esplicito al punto (b) — altrimenti su immagini grandi il primo render può catturare un'immagine non ancora dipinta.

## File toccati

**Modificati:**
- `src/components/SlideEditorForm.tsx` — flush draft prima di `setActiveLang`
- `src/components/BrandSettingsDialog.tsx` — pattern draft+debounce 400ms su tutti i controlli, flush al close
- `src/lib/export.ts` — `ensureFontsFor(brand)` dinamico, `waitForImages(node)`, `captureNode` accetta brand
- `src/components/ExportPreviewDialog.tsx` — chiamata `ensureFontsFor` all'apertura, indicatore stato font/immagini, bottone disabilitato finché non pronto
- `src/components/ExportButton.tsx` — passa `brand` ai call site di `downloadSinglePng` / `downloadZipFromNodes`

**Non toccati:**
- `src/lib/store.ts` — resta sincrono, debounce vive nei componenti
- `src/lib/history.ts` — invariato
- `src/components/slides/SlideRenderer.tsx` — già usa CSS variables corrette

## Fuori scope
- Caricamento font self-hosted / WOFF custom (resta solo Google Fonts)
- Anteprima multi-slide nel dialog (resta solo la slide attiva, come da feature precedente)
- Conversione immagini esterne (URL http) a dataURL — l'app accetta solo upload locali che già diventano dataURL

