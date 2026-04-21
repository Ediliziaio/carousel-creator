

# Tre feature: Effetti dinamici + Preset brand + Persistenza + Anteprima multi-slide

## 1. Effetti grafici "stile Canva/Figma" (animazioni & sfondi avanzati)

Estendo `BrandEffects` in `src/lib/templates.ts` con nuove opzioni che vanno oltre i colori statici:

**Nuovi sfondi dinamici** (rispetto a quelli attuali `none|dots|grid|noise|gradient-mesh`):
- `gradient-radial` — gradiente radiale soft accent → bgColor
- `gradient-conic` — sfumatura conica multicolore (accent + secondary)
- `blob` — 2/3 macchie sfocate organiche (CSS `filter: blur(80px)`) per look "glassmorphism"
- `stripes` — strisce diagonali sottili
- `waves` — onde SVG inline animate (statiche al momento dell'export)

**Nuovi effetti sui contenuti:**
- `effects.shadow`: `none | soft | hard | colored` — ombre sui blocchi card (grid2x2, compare cells)
- `effects.cornerStyle`: `sharp | rounded | pill` — controlla il border-radius globale via `--radius`
- `effects.titleEffect`: `none | outline | shadow-3d | underline-accent | highlight-block` — effetti sui titoli H1
- `effects.dividerStyle`: `line | dots | wave | gradient` — stile delle separazioni nei template
- `effects.iconAccent`: boolean — colora di accent gli elementi numerici/decorativi (01, 02, marker)

Tutto applicato come classi `.fx-bg-blob`, `.fx-shadow-soft`, `.fx-corner-pill`, `.fx-title-outline` ecc. in `slide-styles.css`. Nessuna animazione runtime (l'export è statico), ma look "design pro".

Il dialog Brand → tab "Effetti" viene riorganizzato in **3 sezioni collassabili**: Sfondo · Forme & ombre · Titoli & decori. Ogni effetto ha un mini-thumbnail visuale (24×24) con preview live del look invece del solo dropdown testuale.

## 2. Preset di brand salvati ("temi")

Nuovo concetto: un **preset** è uno snapshot di `{ accent, accentSecondary, textColor, bgColor, fontHeading, fontBody, headingWeight, bodyWeight, effects }` (no logo, no testi/lingue — solo "look").

**Nuovo store slice** `brandPresets` in `src/lib/store.ts`:
```ts
brandPresets: BrandPreset[]
saveBrandPreset(name: string): void  // snapshot del brand corrente
applyBrandPreset(id: string): void   // applica solo i campi visivi
deleteBrandPreset(id: string): void
renameBrandPreset(id: string, name: string): void
```

`BrandPreset = { id, name, createdAt, theme: PresetTheme }` definito in `src/lib/templates.ts`.

**Preset built-in** (5, sempre disponibili, non eliminabili): "Cyberpunk Cyan", "Editorial Mono", "Sunset Magazine", "Brutalist Black/White", "Pastel Soft" — ognuno con combo colori + font + effetti coerenti.

**UI nuova tab "Preset"** in `BrandSettingsDialog.tsx`:
- Griglia di card 2-col, ognuna mostra mini-preview (rettangolo con i 4 colori + font name)
- Hover → bottone "Applica"; sui custom anche "Rinomina" / "Elimina"
- Bottone "💾 Salva preset corrente" in cima → input per nome → snapshot
- Apply preset = patch del brand (tramite stesso debounce esistente, una sola entry undo)

I preset custom vengono persistiti insieme al resto del brand (vedi punto 3).

## 3. Persistenza automatica del brand su localStorage

Aggiungo middleware `persist` di Zustand a `src/lib/store.ts`:

```ts
persist(
  (set, get) => ({ ... }),
  {
    name: "carousel-brand-v1",
    partialize: (s) => ({ brand: s.brand, brandPresets: s.brandPresets }),
    version: 1,
  }
)
```

**Solo brand + preset** vengono persistiti (no slides, no past/future, no activeId — restano per-sessione/usa-e-getta come da requisito esistente).

**Migrazione/safety:**
- `version: 1` con `migrate(persistedState, version)` che mergia con `DEFAULT_BRAND` per gestire campi nuovi (es. quando aggiungo `effects.shadow` in punto 1, i brand vecchi su disco non lo avranno → fallback al default)
- gestione SSR: `skipHydration: true` + chiamata `useCarousel.persist.rehydrate()` in un `useEffect` lato client in `__root.tsx`, per evitare mismatch idratazione TanStack Start
- toast informativo al primo load se è stato ripristinato un brand salvato: "Brand ripristinato da sessione precedente" con bottone "Reset"

**Hard reset disponibile** in BrandDialog (oltre al reset valori grafici esistente): "Cancella brand salvato" che chiama `useCarousel.persist.clearStorage()` + `setBrand(DEFAULT_BRAND)`.

## 4. Anteprima export multi-slide con thumbnail e ordine

Nuovo componente `src/components/ExportBatchPreviewDialog.tsx` aperto da un nuovo bottone **"Anteprima ZIP"** accanto a "Anteprima" in toolbar (icona `LayoutGrid`).

**Layout del dialog:**
- Header: titolo "Anteprima export ZIP — N slide · Lingua X"
- Selettore lingua (se multilang) e selettore "include in ZIP" (default: tutte)
- **Grid di thumbnail** — ogni slide renderizzata a `1080×1350` ma scalata a ~200×250px:
  - Numero badge `01`, `02`... in alto a sx (mostra l'ordine finale)
  - Checkbox in alto a dx per **escludere** dalla selezione (slide deselezionate appaiono opache + barrate, e vengono saltate nello ZIP)
  - Banner rosso sopra se la slide ha errori di validazione
  - Click sulla card → apre la stessa slide nella `ExportPreviewDialog` esistente (preview singola dettagliata)
- **Drag-and-drop riordino** all'interno del dialog (riusa `@dnd-kit` già installato): ogni reorder chiama `reorderSlides(from, to)` dello store → riflesso immediato anche in sidebar
- Indicatore stato fonts/immagini ("✓ Asset pronti / ⏳ Caricamento") riusando `ensureFontsFor` + check già presenti in `ExportPreviewDialog`
- Footer: 
  - Conteggio "X di Y slide selezionate · ~Z MB stimati"
  - Bottone **"Scarica ZIP"** (disabilitato finché asset non pronti o 0 slide selezionate)
  - Bottone "Annulla"

**Logica di export "selettiva":**
- Modifico `downloadZipFromNodes` in `src/lib/export.ts` per accettare opzionalmente una lista di indici da includere (default: tutti). I nomi file usano l'indice **1-based originale** delle slide (slide-03.png anche se è la prima inclusa) per mantenere coerenza con la sidebar — opzione "Rinumera consecutivamente" come checkbox nel dialog.
- Aggiunta opzione "Una cartella per lingua" se multilang: lo ZIP include tutte le lingue selezionate in sottocartelle `it/slide-01.png`, `en/slide-01.png`. Selettore lingua diventa multi-select.

## File toccati

**Nuovi:**
- `src/components/ExportBatchPreviewDialog.tsx` — anteprima multi-slide con DnD + checkbox + export selettivo
- `src/components/PresetCard.tsx` — card riusabile per preset (mini-preview colori+font)
- `src/lib/presets.ts` — definizione `BrandPreset`, lista built-in, helper apply/migrate

**Modificati:**
- `src/lib/templates.ts` — estensione `BrandEffects` (shadow, cornerStyle, titleEffect, dividerStyle, iconAccent + nuovi `BgPattern`)
- `src/lib/store.ts` — middleware `persist` + slice `brandPresets` con relative azioni
- `src/components/slides/slide-styles.css` — classi per nuovi pattern (`fx-bg-blob`, `fx-bg-conic`, `fx-bg-stripes`, `fx-bg-waves`, `fx-bg-radial`), `fx-shadow-*`, `fx-corner-*`, `fx-title-*`, `fx-divider-*`, `fx-icon-accent` + variabile `--radius`
- `src/components/slides/SlideRenderer.tsx` — applica le nuove classi `fx-*` alla `slide-frame`
- `src/components/BrandSettingsDialog.tsx` — nuova tab "Preset", riorganizzazione tab "Effetti" in sezioni con thumbnails, bottone "Cancella brand salvato"
- `src/components/ExportButton.tsx` — bottone/modalità per aprire l'anteprima ZIP, supporto opzioni `selectedIds` / `langs[]` / `renumber`
- `src/lib/export.ts` — `downloadZipFromNodes(nodes, baseName, brand, opts?)` con `{ filenameStrategy: "original" | "consecutive", folderPerLang?: { [lang]: HTMLDivElement[] } }`
- `src/routes/__root.tsx` — `useCarousel.persist.rehydrate()` lato client + toast "Brand ripristinato"
- `src/routes/index.tsx` — nuovo bottone "Anteprima ZIP" in toolbar

**Non toccati:**
- `src/lib/history.ts` — invariato (preset apply usa lo stesso meccanismo di setBrand → entry undo unica)
- `src/components/SlideEditorForm.tsx` — invariato
- Logica i18n — invariata

## Fuori scope
- **Animazioni runtime** (l'export resta PNG statico, no GIF/MP4). Gli "effetti" sono visivi statici stile Figma, non motion design.
- **Cloud sync dei preset** (resta solo localStorage). Esportabili tramite Export JSON come backup.
- **Editor visuale** dei preset (si modifica il brand corrente e lo si "salva come preset", non si edita un preset direttamente — più semplice e meno error-prone).
- **Persistenza delle slide** (resta usa-e-getta, coerente con il pattern attuale).
- **Anteprima animata della ZIP** (no carousel auto-play nel dialog: è una grid statica per scegliere e riordinare).

