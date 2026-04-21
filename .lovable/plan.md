

# Anteprima immediata immagini + layout responsive editor (gallery/chart/testimonial)

## 1. Anteprima immediata immagini caricate

`ImageUploadField.tsx` già mostra una preview quando `value` è presente, con bottone "Rimuovi". Manca però il bottone **"Sostituisci"** esplicito (oggi per cambiare immagine bisogna prima rimuovere, poi ri-caricare).

**Modifiche a `src/components/ImageUploadField.tsx`:**
- Nel blocco preview (quando `value` esiste), aggiungo un secondo bottone "Sostituisci" che apre il file picker (`inputRef.current?.click()`) senza dover prima rimuovere
- Layout footer preview: due bottoni affiancati (`Sostituisci` + `Rimuovi`), entrambi `size="sm"`, con icone (`RefreshCw` e `X`)
- L'`<input type="file">` resta unico in fondo al componente, riusato sia per upload iniziale che per sostituzione
- Mantengo il drag-and-drop sul box vuoto (già esistente)

**Verifico che ImageUploadField sia usato in tutti i campi rilevanti:**
- Gallery (`images[].url`) — controllerò in `SlideEditorForm.tsx` che ogni item della gallery usi `ImageUploadField` con preview
- ImageQuote (`imageUrl`) — già usa `ImageUploadField`
- Feature (`imageUrl`) — già usa `ImageUploadField`
- Testimonial (`avatarUrl`) — già usa `ImageUploadField`, ma per l'avatar uso una **variante compatta circolare** (preview tonda invece di rettangolare)

**Nuova prop opzionale in `ImageUploadField`:** `variant?: "default" | "avatar"`. Quando `variant="avatar"`, la preview è un cerchio 96×96 con bottoni sotto invece che a fianco.

## 2. Layout responsive editor (gallery, chart, testimonial)

Il problema attuale: i form per gallery (3 immagini affiancate), chart (label + valore + colore in riga) e testimonial (avatar + campi) sono pensati per desktop e su mobile (<640px) generano scroll orizzontale.

**Modifiche a `src/components/SlideEditorForm.tsx`:**

### Gallery editor
- Oggi: probabilmente `grid-cols-3` per gli ImageUploadField della gallery
- Nuovo: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3` — 1 colonna su mobile, 2 su tablet, 3 su desktop
- Ogni cella gallery: ImageUploadField + caption input stack verticale, full-width

### Chart editor (chartBar / chartDonut / chartLine)
- Oggi: probabilmente riga con label + value (+ color picker) in `flex` orizzontale
- Nuovo per ogni item: 
  - Mobile (`<sm`): stack verticale → label full-width, sotto riga con value + color picker affiancati
  - Desktop (`≥sm`): riga unica `flex gap-2` con label `flex-1`, value `w-24`, color picker `w-12`
- Pattern Tailwind: `flex flex-col sm:flex-row gap-2 sm:items-center`
- Per `chartLine` (xLabels + values come due array paralleli): stesso pattern, mobile stack, desktop affiancati

### Testimonial editor
- Oggi: probabilmente avatar e campi testo affiancati
- Nuovo: `flex flex-col sm:flex-row gap-4` — avatar sopra su mobile, a sinistra su desktop
- Quote textarea full-width sempre
- Nome + ruolo + rating: `grid grid-cols-1 sm:grid-cols-2 gap-3`

### Feature editor
- Stesso trattamento: immagine sopra su mobile, lista bullet sotto sempre full-width
- Bullet items: stack verticale con marker + title + text

### Helper: classi consistenti
Definisco mentalmente (no costanti esportate, le classi sono inline):
- Stack responsive: `flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-start`
- Grid items chart: `grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:items-center`
- Grid gallery cells: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`

### Editor container
Aggiungo `overflow-x-hidden` sul wrapper principale del form per blindare contro eventuali leak di larghezza da componenti annidati (`ArrayField`, `Field`).

## File toccati

**Modificati:**
- `src/components/ImageUploadField.tsx` — bottone "Sostituisci" nel preview, prop `variant="avatar"` con preview circolare
- `src/components/SlideEditorForm.tsx` — layout responsive (mobile-first) per gallery, chart (bar/donut/line), testimonial, feature; `overflow-x-hidden` sul wrapper

**Non toccati:**
- `SlideRenderer.tsx`, `slide-styles.css` — il rendering del canvas resta indipendente dall'editor
- `templates.ts`, `store.ts` — nessuna modifica al modello dati
- Tutti gli altri template editor (cover, split, ecc.) — già hanno layout semplici single-column

## Fuori scope
- **Crop / resize delle immagini** prima dell'upload (resta upload nativo, immagine inserita 1:1)
- **Riordino drag-and-drop** delle immagini gallery o degli items chart (resta riordino via bottoni up/down esistenti in `ArrayField`)
- **Lightbox / preview ingrandito** al click sull'anteprima (resta thumbnail inline)
- **Mobile-first redesign dell'intera UI** dell'app (header, sidebar slide, ecc. fuori scope — solo i form editor delle 4 famiglie problematiche)

