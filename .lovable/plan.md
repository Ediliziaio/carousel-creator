

# Editor caroselli — feature pack avanzato

Sei feature da aggiungere per portare l'editor a un livello pro: branding completo, drag-and-drop, undo/redo, multilingua, anteprima export e effetti speciali sulle slide.

## 1. Branding esteso (colori, font, logo, "grassetti")

Estendo `BrandSettings` in `src/lib/templates.ts` con nuovi campi:
- `accent` (già presente) → colore principale
- **`accentSecondary`** → secondo colore per gradienti / highlight alternativi
- **`textColor`** + **`bgColor`** → personalizza foreground/background base della slide
- **`headingWeight`** (`600 | 700 | 800 | 900`) e **`bodyWeight`** (`400 | 500 | 600`) → controllo del "grassetto"
- **`fontHeading`** e **`fontBody`** scelti da una lista curata (Figtree, Inter, Space Grotesk, Playfair, JetBrains Mono…) — caricati on-demand da Google Fonts
- **`logoDataUrl`** → logo aziendale caricato dall'utente (mostrato nell'header al posto del solo testo brand)

Tutti questi valori vengono iniettati come **CSS variables** sul `slide-frame` (`--cyan`, `--cyan-2`, `--text`, `--bg`, `--font-heading`, `--font-body`, `--w-h`, `--w-b`) e `slide-styles.css` viene aggiornato per usarle ovunque (titoli usano `font-family: var(--font-heading); font-weight: var(--w-h)`).

`BrandSettingsDialog.tsx` viene esteso con sezioni: **Colori**, **Tipografia**, **Logo** (upload con preview, drag-and-drop file, conversione a dataURL), **Reset al default**.

## 2. Upload immagini nelle slide

Aggiungo a 3 template che hanno senso visivamente:
- **`split`** → campo opzionale `imageUrl` (a destra al posto della lista, se presente)
- **`center`** → background image opzionale con overlay scuro
- **`cover`** *(nuovo template)* → slide copertina con immagine fullscreen + titolo

Componente riutilizzabile **`ImageUploadField`** in `src/components/ImageUploadField.tsx`:
- accetta drag-and-drop o click-to-upload
- valida tipo (PNG/JPG/WEBP) e size (max 5MB)
- converte in dataURL (no upload server, coerente con "usa-e-getta")
- mostra preview + bottone "Rimuovi"
- l'export PNG include automaticamente le immagini (html-to-image le serializza già)

## 3. Effetti speciali sulle slide

Aggiungo a `BrandSettings` un campo **`effects`** con questi toggle/scelte:
- **`bgPattern`**: `none | dots | grid | noise | gradient-mesh` — pattern di sfondo SVG/CSS
- **`accentGlow`**: boolean — aggiunge `box-shadow: 0 0 40px var(--cyan)` a numeri grandi e elementi accent
- **`textGradient`**: boolean — titoli renderizzati con `background-clip: text` su gradiente accent → accentSecondary
- **`grain`**: boolean — overlay rumore tipo film
- **`borderStyle`**: `none | thin | thick | dashed | glow` — bordo della slide

Tutti gli effetti applicati via classi `fx-{name}` su `slide-frame`, definite in `slide-styles.css`. Sezione "Effetti" nel dialog Brand.

## 4. Riordino drag-and-drop nella sidebar

Sostituisco i bottoni ↑/↓ in `SlidesSidebar.tsx` con vero drag-and-drop usando **`@dnd-kit/core`** + **`@dnd-kit/sortable`** (libreria già usata in molti progetti shadcn, leggera, accessibile).

Ogni miniatura diventa un `SortableItem` con handle "::" a sinistra. `onDragEnd` chiama `reorderSlides(from, to)` già presente nello store. Mantengo i bottoni duplica/elimina, rimuovo solo le frecce.

## 5. Undo / Redo nello store

Estendo `src/lib/store.ts` con history stack:
- aggiungo `past: CarouselSnapshot[]`, `future: CarouselSnapshot[]`
- ogni mutazione (`updateSlide`, `addSlide`, `removeSlide`, `duplicateSlide`, `reorderSlides`, `setBrand`, `loadJSON`) salva snapshot precedente in `past` e svuota `future`
- nuove azioni `undo()` e `redo()` che spostano snapshot tra past/present/future
- limite history a 50 step per non gonfiare RAM
- snapshot include `{ brand, slides }` (no `activeId`, evita "rumore")

In toolbar (`src/routes/index.tsx`) aggiungo bottoni **Undo** (⌘Z) e **Redo** (⌘⇧Z) con `lucide-react` Undo2/Redo2. Hook `useEffect` registra shortcut da tastiera. Bottoni disabilitati quando past/future vuoti.

Per evitare snapshot per ogni keystroke nel form, applico **debounce 400ms** sugli `updateSlide` consecutivi sulla stessa slide (debounce nel componente `SlideEditorForm`, non nello store — lo store resta sincrono).

## 6. Multilingua per slide + export per lingua

Estendo lo schema slide per supportare contenuti localizzati:
- nuovo campo `BrandSettings.languages: string[]` (default `["it"]`, l'utente può aggiungere `en`, `es`, `fr`…)
- nuovo campo `BrandSettings.defaultLanguage: string`
- in ogni `Slide` la `data` diventa: o un singolo oggetto (legacy/single-lang), o `{ __i18n: true, byLang: Record<string, TemplateData> }`
- helper `getSlideData(slide, lang)` che ritorna i dati per la lingua richiesta, con fallback alla `defaultLanguage`

UI:
- nel dialog Brand sezione **"Lingue"**: lista chips, aggiungi/rimuovi
- in `SlideEditorForm.tsx` uno **switcher di lingua** in cima al form quando ci sono >1 lingue: tab `IT | EN | ES`. Modificando i campi si scrive solo nella lingua attiva
- il rendering della preview usa la lingua attualmente selezionata nello switcher
- nel dropdown **Export** compare un sottomenu per scegliere la lingua quando ce ne sono multiple. ZIP per multilingua può essere `carosello-it.zip` / `carosello-en.zip` separati, o un singolo ZIP con cartelle per lingua (scelta nel dialog export)

Migrazione dati esistenti: la prima volta che l'utente aggiunge una seconda lingua, la slide viene convertita da formato single al formato `__i18n` con la lingua corrente come chiave iniziale.

## 7. Anteprima di esportazione per singola slide

Nuovo bottone **"Anteprima export"** accanto a "Export" in toolbar (icona `Eye`). Apre un `Dialog` (shadcn) che mostra:
- preview della slide attiva renderizzata a **dimensione reale** (1080×1350) ma scalata per stare nel viewport del dialog
- info sopra: nome file (`{slug}-slide-NN.png`), risoluzione, lingua selezionata, brand applicato
- check di validazione inline (warning se ci sono errori, con possibilità di andare al campo)
- bottoni **"Scarica questa PNG"** (esporta solo la slide vista) e **"Annulla"**

Il render preview usa lo stesso identico DOM che verrà catturato dall'export (componente `SlideRenderer` con il `slide-frame` reale), garantendo che "what you see is what you get".

Componente nuovo: `src/components/ExportPreviewDialog.tsx`.

## File toccati

**Nuovi:**
- `src/components/ImageUploadField.tsx`
- `src/components/ExportPreviewDialog.tsx`
- `src/lib/i18n.ts` *(helper getSlideData / migrate / getLangs)*
- `src/lib/history.ts` *(snapshot/undo/redo logic estratta dallo store)*

**Modificati:**
- `src/lib/templates.ts` — estensione `BrandSettings` (effects, fonts, logo, languages, secondary color, weights), nuovo template `cover`, campo `imageUrl` opzionale per `split` e `center`
- `src/lib/store.ts` — past/future history, undo/redo, lang attiva, integrazione i18n
- `src/components/slides/slide-styles.css` — variabili CSS aggiuntive, classi `.fx-*` per effetti, supporto `--font-heading/body` e pesi
- `src/components/slides/SlideRenderer.tsx` — applica effetti, logo nell'header, gestione `imageUrl`, nuovo template `cover`
- `src/components/BrandSettingsDialog.tsx` — sezioni Colori/Tipografia/Logo/Effetti/Lingue
- `src/components/SlidesSidebar.tsx` — drag-and-drop con @dnd-kit
- `src/components/SlideEditorForm.tsx` — language switcher, integrazione `ImageUploadField`, debounce updateSlide
- `src/components/ExportButton.tsx` — sottomenu per lingua quando multilingua
- `src/lib/export.ts` — funzione `exportForLanguage(lang)`, supporto cartelle nello ZIP per export multilingua
- `src/lib/validation.ts` — valida la lingua attiva (o tutte, opzionale)
- `src/routes/index.tsx` — bottoni Undo/Redo + shortcut, bottone Anteprima export, language picker globale

## Dipendenze da aggiungere
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## Fuori scope
- Sincronizzazione cloud / persistenza dei contenuti (resta usa-e-getta, ma export/import JSON copre il backup)
- Traduzione automatica AI tra lingue (l'utente compila ogni lingua a mano)
- Editor visuale di posizionamento immagini (le immagini occupano slot fissi nei template)
- Storico undo persistente tra reload (resta in memoria)

