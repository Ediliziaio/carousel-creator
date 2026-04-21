

# Slider inline per dimensione font su ogni campo testo

## Obiettivo

Aggiungere accanto ad ogni campo testo dell'editor (eyebrow, title, paragrafi, lista, ecc.) un **mini-slider sempre visibile** per regolare al volo la dimensione del font, senza dover aprire il popover "T". Il popover completo (font, peso, colore, allineamento) resta disponibile per le personalizzazioni avanzate.

## 1. Nuovo componente `FontSizeSlider`

Creo `src/components/FontSizeSlider.tsx`:

- Riusa il componente shadcn `Slider` (già nel progetto)
- Larghezza compatta (~80–100px), altezza 6px, tooltip con valore in px
- Range: **16px → 240px**, step 2px (stessi limiti di `TextStylePopover`)
- Default: legge `overrides[fieldPath].fontSize` se presente, altrimenti mostra un placeholder visivo "auto" e parte dal valore di default del template (64px come fallback)
- Al primo trascinamento, salva il `fontSize` nell'override del campo via `setTextOverride(slideId, fieldPath, { ...current, fontSize: value })`
- Pulsante reset miniatura (icona `RotateCcw` 12px) accanto, visibile solo quando un override `fontSize` è attivo → chiama una versione "clear single key" coerente con quella già usata in `TextStylePopover`
- Etichetta numerica `64px` accanto allo slider, tabular-nums, color `text-muted-foreground`

Props:
```ts
interface FontSizeSliderProps {
  slideId: string;
  fieldPath: string;
  value?: TextStyle;       // override corrente per quel field
  defaultSize?: number;    // dimensione di default del template (per ripristino visivo)
}
```

## 2. Integrazione nel componente `Field`

In `src/components/SlideEditorForm.tsx`, modifico il componente `Field` (righe 191–227):

- Sposto la riga "label + bottone T" in modo che diventi: `[LABEL] [slider compatto + valore] [pulsante T]`
- Su mobile (`<sm`): il slider va a capo sotto la label per non rompere il layout (`flex-wrap`)
- Slider visibile **solo se** `slideId && fieldPath` (stessa condizione del popover esistente)

Layout proposto:
```
EYEBROW              ━━○━━━━ 32px  ↺  T
[ Input ]
```

## 3. Slider anche su campi array (paragrafi, lista, bullet, cells…)

I campi dentro `ArrayField` (paragrafi, lista, bullets, cells di grid2x2, items di chart, ecc.) oggi hanno il `TextStylePopover` inline (es. riga 261, 276). Aggiungo `FontSizeSlider` accanto al popover, stesso fieldPath.

Per non appesantire visivamente le righe di array, su questi item uso una **versione ultra-compatta**: solo lo slider 60px senza valore numerico (il valore appare nel tooltip al passaggio del mouse / focus).

## 4. Coerenza con `TextStylePopover`

Il popover esistente legge/scrive lo stesso `overrides[fieldPath].fontSize`, quindi:
- Trascinare lo slider inline aggiorna in tempo reale anche il valore mostrato nel popover (quando aperto)
- Cambiare il valore dal popover aggiorna lo slider inline
- Il pulsante "Reset" del popover azzera anche lo slider

Nessuna modifica a `TextStylePopover.tsx`, `templates.ts` o `store.ts` — il modello dati `TextStyle.fontSize` è già supportato end-to-end (rendering, export PNG, history undo/redo).

## 5. Default size sensati per template

Per non far partire tutti gli slider da 64px (che è solo il fallback generico), aggiungo un piccolo helper in `FontSizeSlider`:

```ts
const FIELD_DEFAULTS: Record<string, number> = {
  eyebrow: 22, title: 88, subtitle: 44,
  paragraphs: 32, list: 32, quote: 56,
  author: 28, value: 180, label: 28,
  // fallback: 64
};
```
Match esatto sul fieldPath o sul prefisso prima del `.` per gli array (`paragraphs.0` → `paragraphs`).

Questo serve solo per la **posizione di partenza visiva** del thumb quando non c'è ancora un override — il valore reale renderizzato sulla slide non cambia (resta governato dal CSS del template finché l'utente non interagisce).

## File toccati

**Nuovi:**
- `src/components/FontSizeSlider.tsx` — slider compatto + label valore + reset

**Modificati:**
- `src/components/SlideEditorForm.tsx` — integrazione `FontSizeSlider` nel componente `Field` e accanto a tutti i `TextStylePopover` inline degli array (split paragraphs/list, grid cells, timeline items, vocab items, qa items, checklist items, gallery captions, chart items labels, feature bullets)

**Non toccati:**
- `TextStylePopover.tsx` — lavora sullo stesso campo `fontSize`, sincronizzazione automatica
- `templates.ts`, `store.ts`, `slide-styles.css`, `SlideRenderer.tsx` — modello e rendering già supportano `fontSize` per-field

## Fuori scope

- **Slider inline anche per peso/spaziatura/colore**: restano nel popover (slider per ognuno renderebbe il form illeggibile)
- **Slider con doppio handle** per range min/max responsivo per formato (story/landscape): l'override è unico per slide
- **Drag con keyboard shortcut globale** (es. Cmd+↑ per ingrandire il campo focused): possibile in iterazione successiva
- **Sincronizzazione stile tra slide diverse** (es. "applica questa size a tutti i titoli"): fuori scope, resta per-slide

