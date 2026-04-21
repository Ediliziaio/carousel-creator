
# Tre miglioramenti all'export e al form

## 1. Export PNG con fallback (no più crash da file-saver)

Nuovo modulo `src/lib/download.ts` con funzione `saveBlob(blob, filename)` che prova in ordine:
1. **`file-saver`** (via dynamic import, così se il pacchetto rompe il modulo non crasha l'app)
2. **Fallback nativo**: crea un `<a download>`, lo clicca e revoca l'`objectURL`
3. **Ultimo fallback**: apre il blob in una nuova tab con un toast che dice "Tasto destro → Salva immagine come..."

`src/lib/export.ts` viene aggiornato per usare `saveBlob` invece di importare `saveAs` direttamente. Risultato: anche se il bundler ha problemi con `file-saver`, l'export funziona e l'utente vede sempre un messaggio chiaro invece della pagina bianca.

Tutti gli errori di export vengono mostrati con `toast.error(...)` già presente, ma in più aggiungo un **banner inline** sotto la toolbar (componente `ExportErrorBanner`) che resta visibile finché non viene chiuso, con il messaggio completo dell'errore (utile se l'utente lo perde nel toast).

## 2. Bottone export unificato con menu Single PNG / ZIP

I due bottoni separati attuali ("PNG slide" + "ZIP (N)") vengono uniti in un unico bottone **"Export"** con `DropdownMenu` (shadcn, già installato) che apre due voci:

- **PNG — slide corrente** (`slide-NN.png`) — disabilitato se nessuna slide attiva
- **ZIP — tutte le slide (N)** (`titolo-carosello.zip`) — disabilitato se 0 slide

Lo stato `exporting` resta uno solo e mostra lo spinner sul bottone principale durante l'operazione. Più pulito visivamente e fa esattamente quello che hai chiesto: scelta esplicita al momento del click.

## 3. Validazione dei campi obbligatori prima dell'export

Nuovo file `src/lib/validation.ts` con:

```text
validateSlide(slide) → { valid: boolean; errors: { field: string; message: string }[] }
validateAllSlides(slides) → { slideId, slideIndex, errors[] }[]
```

**Regole obbligatorie per template** (in italiano, mostrate all'utente):
- **split**: `title` non vuoto
- **grid2x2**: `title` non vuoto + tutte e 4 le celle con `title` non vuoto
- **bignum**: `number` + `title` non vuoti
- **center**: `title` non vuoto
- **timeline**: `title` non vuoto + almeno 1 step con `title`
- **compare**: `title` + `before.title` + `after.title` non vuoti + almeno 1 voce per lato
- **vocab**: `word` + `def` non vuoti
- **qa**: `question` + almeno 1 paragrafo di risposta non vuoto
- **checklist**: `title` + almeno 1 voce con `title`
- **stat**: `value` + `label` non vuoti

**Dove appare la validazione:**

a) **Nel form (live)**: ogni campo obbligatorio mancante mostra un bordo rosso + messaggio sotto ("Campo obbligatorio"). Componente `Field` esteso con prop `error?: string`. La sidebar mostra un puntino rosso vicino alle slide invalide.

b) **All'export**: prima di lanciare PNG o ZIP, `validateAllSlides()` viene eseguita. Se ci sono errori:
- L'export viene **bloccato**
- Si apre un `AlertDialog` con la lista delle slide invalide e i campi mancanti (es. *"Slide 03 (Timeline): Titolo mancante, almeno uno step richiesto"*)
- Due bottoni: "Vai alla prima slide invalida" (seleziona quella slide e chiude) o "Annulla"

c) **Override per emergenza**: nel dialog c'è una checkbox "Esporta comunque" che permette di bypassare la validazione (utile se vuoi un mockup veloce).

## File toccati

- `src/lib/download.ts` *(nuovo)* — fallback chain per il salvataggio blob
- `src/lib/export.ts` — usa `saveBlob`, rimuove import diretto di `file-saver`
- `src/lib/validation.ts` *(nuovo)* — regole + funzioni di validazione per i 10 template
- `src/components/ExportButton.tsx` *(nuovo)* — bottone unificato con dropdown + dialog di validazione
- `src/components/ExportErrorBanner.tsx` *(nuovo)* — banner persistente per errori export
- `src/components/SlideEditorForm.tsx` — `Field` con prop `error`, integrazione validazione live
- `src/components/SlidesSidebar.tsx` — puntino rosso sulle slide invalide
- `src/routes/index.tsx` — sostituisce i due bottoni export con `ExportButton`, monta `ExportErrorBanner`
- `src/lib/store.ts` — nessuna modifica strutturale (la validazione è derivata, non in store)

## Fuori scope
- Validazione del JSON nel tab "JSON" (il parsing JSON ha già il suo error handling)
- Validazione su lunghezza testi / overflow visivo (richiederebbe misurare il rendering)
