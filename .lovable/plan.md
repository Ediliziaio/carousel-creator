

# Lightbox immagini + validazioni avanzate dei campi

## 1. Lightbox per anteprime immagini (gallery + testimonial + altri)

**Nuovo componente `src/components/ImageLightbox.tsx`:**
- Wrappa `Dialog` di shadcn → overlay scuro full-screen, immagine centrata `max-h-[90vh] max-w-[90vw]` con `object-contain`
- Bottone close (X) in alto a destra, ben dimensionato (44×44 touch target) per mobile
- Chiusura via: click sull'overlay, ESC, swipe-down su mobile (gesture nativa Radix)
- Optional caption sotto l'immagine
- Gestione `open/onOpenChange` controllata dal componente padre

**Modifiche a `src/components/ImageUploadField.tsx`:**
- Nuova prop opzionale `clickToZoom?: boolean` (default `true`)
- Quando `value` esiste, l'`<img>` della preview diventa cliccabile (cursor-zoom-in) e apre il lightbox
- Stato locale `[lightboxOpen, setLightboxOpen]` nel componente
- Funziona sia per `variant="default"` (preview rettangolare) sia per `variant="avatar"` (preview circolare)
- I bottoni Sostituisci/Rimuovi restano fuori dall'area cliccabile dello zoom (no conflitti)

**Effetto pratico:** ogni anteprima caricata in gallery, imageQuote, feature, testimonial, cover, split, center diventa zoomabile con un click — utilità immediata per verificare la qualità dell'immagine prima dell'export.

## 2. Duplica slide (già esistente)

Il pulsante "Duplica" è **già presente** nell'header di `src/routes/index.tsx` (icona `Copy`), e duplica template + dati + format + textOverrides via `duplicateSlide(activeSlide.id)`. **Nessuna modifica necessaria** — confermo che la funzionalità c'è già e funziona.

Aggiungo solo una piccola UX nicety: dopo `duplicateSlide` mostro un `toast.success("Slide duplicata")` per feedback immediato.

## 3. Validazioni avanzate con messaggi chiari

**Espansione di `src/lib/validation.ts`** — aggiungo regole granulari per i template critici:

### Gallery
- Title: required (già presente)
- **Almeno 2 immagini** caricate (oggi: 1) → "Galleria: aggiungi almeno 2 immagini per renderla efficace"
- **Massimo 6 immagini** → "Galleria: massimo 6 immagini supportate (hai N)"
- Caption opzionale ma se presente → max 80 caratteri → "Didascalia immagine N: massimo 80 caratteri"

### ChartBar / ChartDonut / ChartLine
- Title required (già presente)
- **ChartBar/Donut: minimo 2 voci, massimo 8** → "Grafico: servono almeno 2 voci (hai N)" / "Grafico: massimo 8 voci (hai N)"
- **ChartLine: minimo 3 punti, massimo 24** → "Trend: servono almeno 3 punti per disegnare una curva"
- **Ogni `value` deve essere un numero finito ≥ 0** → "Voce N: il valore deve essere un numero positivo"
- **ChartLine: `xLabels.length === values.length`** → "Etichette X (N) e valori (M) devono avere la stessa lunghezza"
- **ChartBar/Donut: ogni `label` non vuota** → "Voce N: etichetta obbligatoria"
- **Donut: somma segmenti > 0** → "Donut: la somma dei segmenti deve essere maggiore di zero"
- **Color picker** se presente: deve matchare `^#[0-9a-fA-F]{6}$` → "Voce N: colore deve essere hex valido (es. #FF0000)"

### ImageQuote / Testimonial / Feature
- Quote required (già presente) + **min 10 caratteri, max 280** → "Citazione: min 10, max 280 caratteri (hai N)"
- Author required + max 60 caratteri
- **ImageQuote**: imageUrl raccomandato (warning, non error) → "Suggerimento: aggiungi una foto per maggiore impatto" (mostrato in azzurro, non rosso)
- **Testimonial.rating**: se presente, deve essere intero 1-5 → "Rating: valore tra 1 e 5"
- **Feature**: bullets required + min 2, max 5 → "Aggiungi almeno 2 bullet point (hai N)"
- **Bullet.title** required se la bullet esiste

### URL immagini (validazione formato)
- Per tutti i campi `imageUrl`/`avatarUrl`/`images[].url`: validazione che il valore sia o `data:image/...` (upload locale) o `https?://...` valido → "URL immagine non valido"
- Caso pratico: previene URL incompleti tipo `htt://...` o stringhe random incollate manualmente nel JSON editor

**Nuovo tipo "warning"** (non blocca export, mostra in azzurro):
```ts
export interface FieldError {
  field: string;
  message: string;
  severity?: "error" | "warning"; // nuovo, default "error"
}
```
- `validateAllSlides` continua a filtrare solo errors per il batch validator; warnings sono cosmetici per guidare l'utente.

### UI in `SlideEditorForm.tsx`
- `Field` component già supporta `error` prop. Estendo con `warning?: string` opzionale → renderizza in azzurro con icona `Info` invece di `AlertCircle` rosso.
- I limiti min/max items su array (gallery, bullets, chart items) → mostro un counter sotto il label tipo `"3/6 immagini"` (verde se in range, rosso se fuori, grigio se neutro). Helper inline `<ItemCounter current={n} min={2} max={6} />`.
- Disabilito i bottoni "Aggiungi" in `ArrayField` quando si raggiunge il `max` (passo nuova prop `maxItems` opzionale).

**Tooltip esplicativi** sui label dei campi numerici dei chart: piccola icona `?` (HelpCircle) accanto al label "Valore" → tooltip "Numero positivo. Es. 42 o 3.5"

## 4. Sicurezza degli input (allineata a best practice)

Aggiungo un livello leggero di sanitizzazione per gli URL immagine in `validation.ts`:
- Reject `javascript:`, `vbscript:`, `data:text/html`, `data:application/...` → solo `data:image/(png|jpeg|jpg|webp|gif|svg+xml)` o `https?://` accettati
- Messaggio: "URL immagine non sicuro: usa solo immagini PNG/JPG/WEBP"

Questo previene XSS via JSON import malevolo (l'editor JSON accetta paste arbitrari).

## File toccati

**Nuovi:**
- `src/components/ImageLightbox.tsx` — dialog full-screen per zoom immagini

**Modificati:**
- `src/components/ImageUploadField.tsx` — img cliccabile + integrazione lightbox (entrambe le varianti)
- `src/lib/validation.ts` — regole granulari per gallery/chart/feature/testimonial, severity warning, URL sanitization, helper `isValidImageUrl()`
- `src/components/SlideEditorForm.tsx` — `Field` con prop `warning`, `ArrayField` con `maxItems` per disabilitare add, `ItemCounter` inline per gallery/chart/feature, tooltip su valori numerici chart
- `src/routes/index.tsx` — toast.success dopo duplicazione

**Non toccati:**
- `templates.ts` — nessuna modifica al modello dati
- `store.ts` — duplicateSlide già OK
- `SlideRenderer.tsx` — il rendering non cambia

## Fuori scope
- **Crop / editing immagini** dentro il lightbox (resta solo zoom)
- **Carousel multi-immagine** nel lightbox (un'immagine alla volta — niente swipe tra le immagini della gallery)
- **Validazione live durante la digitazione** carattere per carattere (resta debounced 400ms come tutto il resto)
- **Server-side validation** (l'app è 100% client-side, nessun backend a cui validare)
- **Auto-fix dei valori** (es. clamp automatico di rating > 5 a 5) — l'errore viene mostrato e l'utente correggge manualmente

