
# Carousel Generator — 10 template stile dark/ciano

Strumento web per creare caroselli Instagram (1080×1350) basati sui 10 layout del tuo HTML, con esportazione PNG.

## Cosa potrai fare
1. **Scegliere uno dei 10 template** per ogni slide del carosello
2. **Compilare i contenuti** tramite form guidato (campi diversi per ogni template)
3. **Vedere l'anteprima live** identica all'HTML caricato (formato 1080×1350 scalato)
4. **Riordinare/duplicare/eliminare** le slide
5. **Personalizzare brand**: handle (@edoardo_barravecchia → tuo), colore accent (ciano default + magenta + custom hex), titolo carosello, font opzionali
6. **Switch form ↔ JSON**: editor visuale con tab che mostra/permette di modificare il JSON sottostante (importa/esporta `.json`)
7. **Esportare in PNG 1080×1350** — singola slide o ZIP con tutte le slide numerate (`slide-01.png`, `slide-02.png`...)

## I 10 template supportati
1. **Split 50/50** — titolo a sx, paragrafo + lista a dx
2. **Griglia 2×2** — titolo + 4 riquadri numerati
3. **Numero gigante** — cifra enorme a sx, titolo+testo a dx
4. **Frase centrale** — eyebrow + claim grande centrato + sub
5. **Timeline verticale** — titolo + step con pallini ciano
6. **Prima / Dopo** — due colonne a confronto (la "dopo" evidenziata in ciano)
7. **Scheda definizione** — parola chiave stile vocabolario + categoria + pronuncia + significato
8. **Quote / citazione** (dedotto dal pattern) — citazione + autore
9. **Lista numerata grande** — titolo + elementi numerati
10. **Cover / Outro** — slide iniziale brand o finale CTA

> Per ogni slide: header (brand + counter "01/10") e footer (handle + numerazione) automatici, gestiti dal sistema.

## Struttura UI

**Layout a 3 colonne:**
- **Sinistra — Sidebar slide**: lista miniature drag-to-reorder, pulsante "+ aggiungi slide" che apre picker dei 10 template, duplica/elimina
- **Centro — Anteprima**: rendering 1:1 del template attivo, scalato per stare nel viewport, con sfondo dark che ricorda Instagram
- **Destra — Pannello editor**: due tab → **Form** (campi specifici per il template selezionato: title, eyebrow, items[], etc.) e **JSON** (textarea sincronizzata)

**Toolbar in alto:**
- Titolo carosello (editable inline)
- Impostazioni brand (modal): handle, colore accent, eventuale font
- Import JSON / Export JSON
- **Export PNG (slide corrente)** / **Export ZIP (tutto il carosello)**

## Come funziona l'export
Le slide vengono renderizzate in un container nascosto a dimensione reale 1080×1350 (no scaling), catturate con `html-to-image` (più affidabile di html2canvas con font web), e impacchettate in uno ZIP via `jszip`. Font Figtree + JetBrains Mono caricati e attesi prima dell'export per evitare fallback.

## Stack
- TanStack Start (route singola `/`, niente backend serve)
- Tailwind v4 + design system esistente per la **UI dell'app**
- CSS custom isolato per il rendering delle slide (replica fedele del tuo HTML, variabili CSS per accent color)
- `html-to-image` + `jszip` + `file-saver` per l'export
- Stato gestito in memoria React (zustand) — niente persistenza, usa-e-getta come richiesto

## Fuori scope (per restare snelli)
- Nessun salvataggio cloud / account
- Nessun upload immagini nelle slide (i template sono solo testo + grafica generativa)
- Nessuna generazione AI dei contenuti
