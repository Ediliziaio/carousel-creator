

# Nuovi template "wow": media accattivanti + grafici evoluti

Aggiungo **8 nuovi template** (4 media + 4 grafici/data viz) progettati per essere visivamente forti, scroll-stopping e immediatamente utili in caroselli social/sales.

## A. 4 nuovi template MEDIA (categoria `media`)

### 1. `mediaHero` — Hero immagine fullbleed con titolo overlay
Foto a tutto schermo con gradient overlay (dark→trasparente) e titolo XXL in basso + eyebrow + CTA mini. Stile "rivista".
- Campi: `imageUrl`, `eyebrow`, `title`, `subtitle?`, `ctaLabel?`, `overlayIntensity?` ("soft" | "strong")

### 2. `polaroidStack` — Stack di 3 polaroid ruotate
3 immagini in cornice bianca con leggera rotazione (-6°, +2°, +5°) e caption sotto ciascuna. Effetto "moodboard creativa".
- Campi: `eyebrow`, `title`, `polaroids[]` (`url`, `caption`, `date?`) (max 3)

### 3. `splitDuo` — Split immagine + immagine con label centrale
Due immagini affiancate 50/50 con label diagonale al centro ("VS", "→", "PRIMA / DOPO"). Versione visual del `compare`.
- Campi: `eyebrow`, `leftImage` (`url`, `label`), `rightImage` (`url`, `label`), `centerBadge` ("VS"), `caption?`

### 4. `magazineCover` — Copertina magazine editoriale
Layout tipo Vogue/Wired: foto centrale grande, masthead in alto (brand name XXL), 3-4 "cover lines" come strilli laterali, numero/data in basso.
- Campi: `masthead`, `issueLabel` ("N° 12 · Nov 2024"), `imageUrl`, `mainHeadline`, `coverLines[]` (max 4, ciascuno `text` + `pageRef?`)

## B. 4 nuovi template GRAFICI/DATA VIZ (categoria `data`)

### 1. `chartArea` — Grafico ad area gradient
Curva area con gradient verticale, gridlines sottili, valore picco evidenziato con tooltip ancorato. Più "morbido" del `chartLine`.
- Campi: `eyebrow`, `title`, `xLabels[]`, `values[]`, `unit?`, `peakLabel?`, `trend?` ("up" | "down")

### 2. `chartCompareBar` — Barre raggruppate "noi vs loro"
Barre orizzontali raggruppate a 2 serie (es. "Brand A" vs "Brand B") con etichette categoria a sinistra, valori a destra, colori contrastanti. Killer per posizionamento competitivo.
- Campi: `eyebrow`, `title`, `seriesA` (`label`, `color?`), `seriesB` (`label`, `color?`), `rows[]` (`label`, `valueA`, `valueB`), `unit?`

### 3. `kpiGrid` — Dashboard 4 KPI con sparkline
Griglia 2x2 con 4 KPI: ogni cella ha label + valore grande + delta % colorata (verde ↑ / rosso ↓) + mini-sparkline. Stile "dashboard fintech".
- Campi: `eyebrow`, `title`, `kpis[]` (4 obbligatori) (`label`, `value`, `unit?`, `delta`, `trend` ("up"|"down"|"flat"), `spark[]` (5-7 numeri))

### 4. `funnelChart` — Funnel di conversione a trapezi
Trapezi decrescenti impilati verticalmente (es. Visite → Lead → Cliente) con valore + % conversione step-by-step. Perfetto per case study.
- Campi: `eyebrow`, `title`, `stages[]` (3-5) (`label`, `value`, `conversionPercent?`), `summary?`

## C. Stile visivo (non un editor banale)

I nuovi template usano **CSS dedicato** con queste tecniche:
- Gradient overlay e mask CSS per `mediaHero` / `magazineCover`
- `transform: rotate()` randomizzato per `polaroidStack` con shadow filtrato
- `clip-path: polygon()` per i trapezi del `funnelChart`
- SVG inline (no Recharts dependency) per `chartArea`, `chartCompareBar`, sparkline `kpiGrid` — evita costo runtime e mantiene crisp export PNG
- Tutti rispettano le brand vars `--accent`, `--accent-2`, `--bg`, `--text` e le classi `mkt-grad-*`/`mkt-badge-*` esistenti

## File toccati

**Modificati:**
- `src/lib/templates.ts` — 8 nuovi `TemplateId`, 8 interface dati, default in `makeDefaultData`, voci `TEMPLATE_META`, `TEMPLATE_ORDER`, `getStylableFields`
- `src/components/slides/SlideRenderer.tsx` — 8 nuovi componenti renderer + case nel router `renderBody`; SVG inline per i 4 chart
- `src/components/slides/slide-styles.css` — classi `.tpl-mediaHero`, `.tpl-polaroidStack`, `.tpl-splitDuo`, `.tpl-magazineCover`, `.tpl-chartArea`, `.tpl-chartCompareBar`, `.tpl-kpiGrid`, `.tpl-funnelChart`
- `src/components/SlideEditorForm.tsx` — 8 nuovi editor (`MediaHeroEditor`, `PolaroidStackEditor`, `SplitDuoEditor`, `MagazineCoverEditor`, `ChartAreaEditor`, `ChartCompareBarEditor`, `KpiGridEditor`, `FunnelChartEditor`) con riuso di `ImageUploadField` e `ArrayField`
- `src/lib/validation.ts` — 8 case validazione (es. `mediaHero.imageUrl/title`, `polaroidStack.polaroids≥1`, `chartCompareBar.rows≥2`, `kpiGrid.kpis=4`, `funnelChart.stages≥2`)
- `src/lib/store.ts` — aggiungo i nuovi id in `DEFAULT_TEMPLATES_PER_CATEGORY`:
  - `media`: + `mediaHero`, `polaroidStack`, `splitDuo`, `magazineCover`
  - `data`: + `chartArea`, `chartCompareBar`, `kpiGrid`, `funnelChart`

**Non toccati:**
- `src/components/CarouselPresetDialog.tsx`, `src/components/NewSlideDialog.tsx` — auto-mostrano i nuovi template via store
- `src/lib/carouselPresets.ts` — i preset esistenti continuano a funzionare; i nuovi template restano disponibili a piacere

## Esperienza finale

1. "Nuova slide" → categoria **Media** ora propone 8 template (4 esistenti + 4 nuovi visualmente forti)
2. Categoria **Grafici/Dati** ora propone anche `chartArea`, `chartCompareBar`, `kpiGrid`, `funnelChart` per casi d'uso reali (trend, confronto competitivo, dashboard, conversion funnel)
3. Tutti i nuovi template sono editabili dal form, validati, esportabili in PNG, e rispettano brand colors + marketing styles

## Fuori scope

- Animazioni di ingresso (export statico)
- Upload multiplo drag-and-drop su `polaroidStack` (un'immagine alla volta)
- Editor visuale chart con drag dei punti (compilazione numeri da form)
- Migrazione automatica di `gallery`/`chartLine` esistenti verso i nuovi template
- Preset carosello che usano i nuovi template (l'utente li compone manualmente)

