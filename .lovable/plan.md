

# Personalizzazione testo per-campo + Duplica + Combo preset + DnD nel picker

## 1. Personalizzazione testo per-singolo-campo (stile Canva)

Estensione del modello `Slide` con un campo opzionale `textOverrides`:

```ts
// templates.ts
export interface TextStyle {
  fontFamily?: FontChoice;
  fontSize?: number;        // px @ 1080px width (es. 64, 80, 120)
  fontWeight?: Weight;
  letterSpacing?: number;   // em (-0.05 → 0.2)
  textAlign?: "left" | "center" | "right";
  italic?: boolean;
  uppercase?: boolean;
  underline?: boolean;
  color?: string;           // hex; default = brand.textColor o accent
}

export interface Slide {
  id: string;
  template: TemplateId;
  format: SlideFormat;
  data: SlideDataField;
  textOverrides?: Record<string, TextStyle>; // chiave = field path es. "title", "eyebrow", "cells.0.title"
}
```

**UI — popover "Aa" inline accanto a ogni campo testuale del form** (`SlideEditorForm.tsx`):
- Nuovo componente `<TextStyleButton fieldPath="title" />` reso accanto alla `<Label>` di ogni `Field`
- Click → popover compatto con: select font (riusa `FONT_OPTIONS`), slider `fontSize` (24-200px), select `fontWeight` (400-900), slider `letterSpacing`, toggle italic/uppercase/underline, 3 bottoni align L/C/R, color picker con preset (textColor, accent, accentSecondary, white, black)
- Bottone "Reset" per cancellare l'override (torna ai default brand)
- Indicatore visivo: il bottone "Aa" diventa pieno/colorato quando un override è attivo per quel campo
- Tutti i cambi passano per il debounce esistente (`set()` → 400ms → store)

**Applicazione visiva** — `SlideRenderer.tsx`:
- Helper `getFieldStyle(fieldPath: string): React.CSSProperties` che legge `slide.textOverrides?.[fieldPath]` e lo trasforma in stile inline
- Iniettato sui DOM nodes principali di ogni template: `.title`, `.eyebrow`, `.sub`, e per cells/items con path indicizzato (`cells.0.title`, `items.1.text`)
- Le dimensioni `px` scalano automaticamente perché tutto il `slide-frame` viene scalato in preview/export — i px restano relativi al canvas 1080×W

**Field path registry** in `templates.ts`: helper `getStylableFields(template: TemplateId): { path: string; label: string }[]` che ritorna i campi stilizzabili per ogni template (es. split → title, eyebrow, paragraphs[*], list[*].text). Usato dal form per sapere dove mostrare "Aa".

## 2. Bottone "Duplica slide" prominente

Già esistente nella sidebar (icona piccola). Aggiungo un bottone **principale "Duplica"** nella toolbar dell'editor centrale (`routes/index.tsx`), accanto ad Anteprima/Anteprima ZIP, con icona `Copy` e label visibile. Comportamento: chiama `duplicateSlide(activeId)` → la copia mantiene template, formato, dati, **e gli `textOverrides`** (già coperto da `structuredClone` esistente nello store).

## 3. Preset "combo template + formato" salvabili dal NewSlideDialog

**Nuovo concetto `SlideCombo`** in `templates.ts`:
```ts
export interface SlideCombo {
  id: string;
  name: string;
  template: TemplateId;
  format: SlideFormat;
  createdAt: number;
}
```

**Nuovo store slice** in `lib/store.ts`:
```ts
slideCombos: SlideCombo[]
saveSlideCombo(name, template, format): void
deleteSlideCombo(id): void
```
Persistito via `persist` middleware (insieme a `brand` e `brandPresets`, con migration safety).

**UI in `NewSlideDialog.tsx`** (sidebar a 3 sezioni invece di 2):
- Sopra "Formato": nuova sezione **"I miei combo"**
  - Lista compatta di combo card (nome + mini badge `Split · 4:5`)
  - Click su una card → applica template + formato in un colpo (popola gli stati `template` e `format` del dialog)
  - Bottone X piccolo per eliminare
- Sotto la lista combo: pulsante **"💾 Salva combo corrente"** → mini input inline per nome → `saveSlideCombo(name, template, format)`
- Se non ci sono combo salvati: testo placeholder "Salva le tue combinazioni preferite per riusarle"

## 4. Drag-and-drop nelle categorie e nei template del picker

Persisto un nuovo slice nello store:
```ts
templateCategoryOrder: string[]            // default: ["text","data","ref"]
templatesPerCategory: Record<string, TemplateId[]>  // default: come oggi in CATEGORIES
```
Persistiti anche loro (migration: se mancanti → fallback ai default in `NewSlideDialog`).

**UI in `NewSlideDialog.tsx`**:
- **Tabs delle categorie**: wrappo `<TabsList>` in un `DndContext` orizzontale (riuso `@dnd-kit`). Ogni `TabsTrigger` è un `useSortable` con drag handle implicito (l'intero trigger è draggable con `activationConstraint: distance 8` per non confliggere col click di selezione tab). Il drop riordina `templateCategoryOrder` nello store.
- **Grid dei template dentro la tab attiva**: `DndContext` verticale sulla griglia, ogni `TemplateThumb` è un `useSortable`. Drop riordina `templatesPerCategory[currentCategory]`. Mantengo l'`activationConstraint distance 8` per non rompere il click "seleziona template".
- Indicatore visuale leggero (cursor grab, leggera ombra durante il drag).
- Mantengo il pattern `mounted` flag per evitare hydration mismatch (anche se la route è già `ssr: false`, è gratis come safety).

**Reset opzionale**: piccolo link "Ripristina ordine default" in fondo al dialog per ri-applicare l'ordine standard.

## File toccati

**Nuovi:**
- `src/components/TextStylePopover.tsx` — popover stile testo per-campo (font/size/weight/spacing/align/italic/uppercase/underline/color/reset)

**Modificati:**
- `src/lib/templates.ts` — `TextStyle`, `Slide.textOverrides`, helper `getStylableFields(template)` per registry dei field path
- `src/lib/store.ts` — slice `slideCombos`, `templateCategoryOrder`, `templatesPerCategory` con relative azioni; persist + migration; `duplicateSlide` già OK (clone profondo gestisce `textOverrides`)
- `src/components/SlideEditorForm.tsx` — `<TextStyleButton>` accanto a ogni `<Field>` stilizzabile, gestione override via `set()` per passare nel debounce esistente
- `src/components/slides/SlideRenderer.tsx` — applica `getFieldStyle(path)` come `style` inline ai nodi `.title`, `.eyebrow`, `.sub`, e a item indicizzati di cells/items/paragraphs
- `src/components/NewSlideDialog.tsx` — sezione "I miei combo" in sidebar con save/apply/delete; DnD orizzontale su tab categorie; DnD verticale sui template della categoria attiva; reset ordine default
- `src/routes/index.tsx` — bottone "Duplica" prominente nella toolbar centrale (icona `Copy` + label, accanto ad Anteprima/Anteprima ZIP)

**Non toccati:**
- `src/lib/export.ts` — gli `textOverrides` sono CSS inline → l'export PNG li cattura automaticamente, nessuna modifica
- `src/lib/i18n.ts` — gli override sono per-slide (non per-lingua), invariato
- `src/lib/history.ts` — invariato (le modifiche di override usano `set()` debounced come tutto il resto)
- `src/components/SlidesSidebar.tsx` — mantiene il bottone Duplica esistente come scorciatoia per le slide non attive

## Fuori scope
- **Override per-lingua** (lo stile testo è uniforme tra le lingue di una stessa slide; se serve uno stile diverso, l'utente duplica la slide)
- **Stili "globali" per template** (l'override è per-slide, non per "tutte le slide split")
- **Animazioni / motion design** sul testo (resta export PNG statico)
- **Custom fonts oltre la lista FONT_OPTIONS** (resta solo Google Fonts whitelist esistente)
- **Riordino libero dei campi** dentro un template (i template hanno layout fisso, il DnD è solo sui template/categorie nel picker)

