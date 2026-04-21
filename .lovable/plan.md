
# Tre fix per migliorare validazione & UX

## 1. Errore runtime `onExportSingle is not defined`
È un residuo del bundle precedente — nessun file sorgente attuale lo referenzia (verificato con search). Per forzare un re-bundle pulito tocco un file di routing (rigenerazione del route tree) e correggo un dettaglio di tipo che potrebbe contribuire: `exportRefs` è tipizzato come `MutableRefObject` mentre `useRef<Map<...>>(new Map())` produce `RefObject` in React 19. Allineo la prop a `RefObject<Map<string, HTMLDivElement>>` in `ExportButton.tsx` per togliere ogni warning TS.

## 2. Pulizia compilazione `SlideEditorForm.tsx`
- Rimuovo l'import inutilizzato `useMemo` (lo lascio se serve, ma `errors` può essere ricalcolato; uso `useMemo` correttamente — già fatto, ma rimuovo eventuali import non usati come `Plus` che non viene più impiegato in alcuni rami).
- Garantisco che ogni sotto-editor (Split/Grid/BigNum/Center/Timeline/Compare/Vocab/QA/Checklist/Stat) accetti `errFor: ErrFor` e che TypeScript non si lamenti dei branch dello `switch`.
- Aggiungo `data-field={path}` su ogni `<Input>`/`<Textarea>` corrispondente a un campo validato. Serve al focus automatico (punto 3).

## 3. "Vai alla prima slide invalida" → focus + scroll sul campo
Flusso completo:

a) Estendo `validateAllSlides` per includere, oltre al `field` path, una nuova proprietà `firstField: string` (path del primo campo da fixare).

b) `ExportButton.onConfirmDialog` (ramo non-force):
   1. `setActive(first.slideId)` (già fatto)
   2. dispatch di un `CustomEvent("slide:focus-field", { detail: { slideId, field } })` sul `window`.

c) Nel pannello editor (`SlideEditorForm`) aggiungo un `useEffect` che ascolta `slide:focus-field` e quando `slideId` matcha:
   - cerca nel proprio container un elemento con `[data-field="<path>"]`
   - chiama `.scrollIntoView({ behavior: "smooth", block: "center" })`
   - chiama `.focus()` con un piccolo delay (50ms) per dare tempo al tab "Form" di montare.
   - aggiunge un anello rosso pulsante (`animate-pulse ring-2 ring-destructive`) per 1.5s.

d) Se l'utente è nel tab "JSON", forzo lo switch al tab "Form" prima del focus. Per farlo trasformo il `Tabs` in `routes/index.tsx` da `defaultValue` a controlled (`value`/`onValueChange`) e ascolto lo stesso evento per resettare a `"form"`.

## 4. Messaggi validazione con label esatte
Ridisegno `src/lib/validation.ts`:

- Definisco una mappa `FIELD_LABELS: Record<TemplateId, Record<string, string>>` con label leggibili (es. `split.title` → "Titolo", `timeline.items` → "Step", `qa.answer` → "Paragrafi risposta").
- Ogni messaggio usa il pattern: `"<Label>: <ragione>"` — esempi:
  - `"Titolo: campo obbligatorio"`
  - `"Step 2 — Titolo: campo obbligatorio"` (per array indicizzati)
  - `"Cella 3 — Titolo riquadro: campo obbligatorio"`
  - `"Colonna 'Dopo' — Voce 1: campo obbligatorio"`
  - `"Risposta — Paragrafo 1: campo obbligatorio"`
- Per gli array, se manca *l'intero* array: `"Step: aggiungi almeno una voce"`. Se mancano dei campi *dentro* un item, si segnala l'item specifico con il suo indice 1-based.
- Aggiorno il dialog di `ExportButton` per mostrare le label così come escono da `validation.ts` (già fa `e.message`), e aggiungo l'indicazione del **template label** (già presente) + il **conteggio errori** ("3 campi da completare").

## File toccati
- `src/lib/validation.ts` — riscrittura messaggi + `firstField` nel risultato
- `src/components/SlideEditorForm.tsx` — `data-field` su tutti gli input, listener `slide:focus-field`, pulizia import
- `src/components/ExportButton.tsx` — dispatch evento custom dopo `setActive`, fix tipo `RefObject`, label "Vai alla prima slide invalida" → "Vai al primo campo da completare"
- `src/routes/index.tsx` — `Tabs` controlled, listener evento per forzare tab "form"

## Fuori scope
- Nessuna modifica a `store.ts` (l'evento è effimero, non va in store)
- Nessun cambiamento al rendering delle slide o all'export logic
