

# Input numerico, tooltip live, memoria per tipo, click-reset sul default

## 1. Input numerico accanto allo slider

In `src/components/FontSizeSlider.tsx`, sostituisco lo `<span>` che oggi mostra `64*` con un `<input type="number">` molto compatto (~44px), gestito controlled:

- Range: `min=16 max=240 step=2`
- Mostra il valore corrente (override o default)
- `onChange`: aggiorna il valore con clamp [16, 240], salva l'override via `setTextOverride`
- `onBlur`: se il campo è vuoto o NaN, ripristina al valore corrente senza salvare nulla
- Stile: `h-6 w-12 text-[10px] tabular-nums px-1` — coerente con la densità attuale del form
- In `compact={true}` (usato dentro `ArrayField`), l'input rimane nascosto come oggi (si edita solo via slider/tastiera/popover) per non rompere righe strette
- Asterisco `*` per i default: appare solo come suffisso testuale nel `title` tooltip dell'input quando non c'è override (no più `<span>` separato)

## 2. Tooltip live sul thumb dello slider

Modifico `src/components/ui/slider.tsx` per supportare un tooltip che segue il thumb durante drag/keyboard:

- Aggiungo prop opzionale `showTooltip?: boolean` e `formatTooltip?: (value: number) => string` al `Slider`
- Quando `showTooltip` è true, wrappo `SliderPrimitive.Thumb` con un `<TooltipProvider><Tooltip><TooltipTrigger asChild>...</TooltipTrigger><TooltipContent>{formatTooltip(value)}</TooltipContent></Tooltip></TooltipProvider>`
- Il tooltip resta aperto durante drag tramite stato locale `[isDragging, setIsDragging]` derivato da eventi `onPointerDown`/`onPointerUp` sul Root, e durante focus tramite `:focus-within` (Radix gestisce focus state nativamente)
- Posizione: `side="top"`, `sideOffset={8}`

In `FontSizeSlider.tsx`: passo `showTooltip` e `formatTooltip={(v) => `${v}px`}`. Mantiene retrocompatibilità — gli altri usi del `Slider` nel progetto non sono toccati.

## 3. Memoria dell'ultimo fontSize per tipo di campo

Aggiungo al store `src/lib/store.ts` una nuova mappa persistita:

```ts
lastFontSizeByFieldType: Record<string, number>; // es. { title: 100, paragraphs: 36, eyebrow: 26 }
setLastFontSizeForField: (fieldPath: string, size: number) => void;
```

Logica:
- La chiave è il **tipo di campo** derivato dal fieldPath (radice prima del `.`): `title`, `paragraphs`, `eyebrow`, `list`, `quote`, `value`, ecc. Helper `fieldTypeOf(path)` in `FontSizeSlider.tsx`
- Quando l'utente modifica un fontSize via slider/input/tastiera, `FontSizeSlider` chiama `setLastFontSizeForField(typeKey, value)` dopo `setTextOverride`
- Nuovo helper `getDefaultForField(fieldPath, lastByType)`:
  - Se esiste `lastByType[typeKey]` → restituisce quello
  - Altrimenti restituisce `FIELD_DEFAULTS[typeKey]` (fallback statico attuale)
- `FontSizeSlider` legge `lastFontSizeByFieldType` dallo store e lo usa come `baseDefault` quando non c'è override sul campo corrente
- Persistito tramite `partialize` esistente (aggiungo `lastFontSizeByFieldType: s.lastFontSizeByFieldType`)
- Inizializzato a `{}` nel default state e nel `merge` del persist

Risultato: l'utente imposta `title=100` su una slide → la prossima slide dove appare un campo `title` mostra il thumb a 100 (e l'input a 100), pur restando "non override" finché non interagisce. Per non confondere, in questo caso l'asterisco `*` resta visibile (è ancora un default, anche se "memorizzato"), ma il tooltip dell'input recita "Ultimo valore usato per questo tipo — clicca per applicare".

## 4. Click sul default per applicare/resettare

Riformulo l'interazione sul valore default:
- L'input numerico è **sempre cliccabile/editabile**: già risolve il caso "ripristina al default cliccando" perché basta digitare qualunque valore
- Aggiungo un **pulsante invisibile a contorno** (varianta `ghost` size `xs`) intorno al numero quando NON c'è override:
  - Click sul numero default → applica esplicitamente quel valore come override (`setTextOverride` con `fontSize: baseDefault`)
  - Effetto: l'asterisco sparisce, il valore diventa "personalizzato" anche se uguale al default — utile per "agganciare" il valore prima di esportare e garantire coerenza tra slide
- Il pulsante reset esistente (`RotateCcw`) resta com'è: rimuove la sola chiave `fontSize` dall'override (logica già implementata correttamente)

In `compact` mode (usato negli `ArrayField`), dove l'input è nascosto, aggiungo un mini-bottone reset cliccabile direttamente sull'asterisco dello slider tooltip — ma per semplicità mantengo solo il bottone `RotateCcw` già presente quando override attivo.

## 5. File toccati

**Modificati:**
- `src/components/FontSizeSlider.tsx` — input numerico controlled (nascosto in compact), helper `fieldTypeOf`, lettura `lastFontSizeByFieldType` dallo store, salvataggio dopo ogni cambio, click su default per fissarlo come override, integrazione `showTooltip` sullo Slider
- `src/components/ui/slider.tsx` — supporto opzionale `showTooltip` + `formatTooltip` con tooltip Radix che segue il thumb durante drag/focus (zero impatto sugli altri usi esistenti)
- `src/lib/store.ts` — campo `lastFontSizeByFieldType: Record<string, number>`, action `setLastFontSizeForField`, persist `partialize` + `merge`

**Non toccati:**
- `TextStylePopover.tsx` — continua a leggere/scrivere `fontSize` direttamente, sincronia automatica con slider/input
- `templates.ts`, `SlideRenderer.tsx`, `slide-styles.css` — modello e rendering invariati
- `SlideEditorForm.tsx` — usa `FontSizeSlider` per props, nessun cambio API

## 6. Dettagli UX

- Layout riga (default mode): `[Slider 80px] [Input 44px] [Reset 20px]`
- Layout riga (compact mode): `[Slider 60px] [Reset 20px]` (input nascosto)
- Tooltip live: appare sopra il thumb durante hover, drag, focus tastiera; sparisce dopo 200ms da pointer-up
- Memoria per tipo: solo per la sessione + persist localStorage (zero sync server, zero conflitti tra utenti)
- Asterisco `*`: mostrato come suffisso nel `title` HTML dell'input (es. "32px (default del template)" o "32px (ultimo usato per title)") — non più carattere visibile sullo schermo, evita confusione

## 7. Fuori scope

- **Sliders verticali** o doppio thumb per range responsivi (story/landscape)
- **Memoria condivisa tra progetti** o tra utenti (resta locale al device)
- **Auto-apply della memoria a tutte le slide esistenti** (resta solo per i NUOVI campi rendered, non riscrive override già impostati)
- **Numeric input nei tooltip** (l'input vive solo nel form, non nel tooltip)
- **Animazione del tooltip** durante drag (resta snap istantaneo nativo Radix)

