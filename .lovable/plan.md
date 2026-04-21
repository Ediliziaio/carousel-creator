

# Nuovi preset di carosello + nuove tipologie di slide marketing-driven

## A. 6 nuovi preset di carosello (esperto sales/marketing)

Ogni preset è uno **script completo di vendita o engagement** scelto su meccanismi psicologici provati: scarcity, autorità, storytelling, lead generation, contrasto, retention.

### 1. `webinar-funnel` — "Webinar / Lead magnet" (9 slide) 🎁
Funnel per lead magnet gratuito (ebook, webinar, freebie):
`hook` (curiosity gap) → `bignum` (statistica shock) → `problemSolution` → `tipPack` (3 quick wins teaser) → `socialProof` → `framework` (sneak peek metodo) → `objection` ("è davvero gratis?") → `offer` (lead magnet, prezzo €0) → `cta` ("Scarica ora")

### 2. `before-after-story` — "Trasformazione cliente" (8 slide) ✨
Storytelling classico "from-to" con cliente reale:
`cover` ("La storia di Mario") → `hook` (situazione iniziale) → `compare` (prima/dopo) → `process` (cosa abbiamo fatto) → `chartLine` (crescita risultati) → `testimonial` → `socialProof` (metriche) → `cta` ("Vuoi essere il prossimo?")

### 3. `myth-busting` — "Sfata 5 miti" (10 slide) 🧨
Format virale alta-saving rate:
`hook` ("5 bugie che ti hanno detto su X") → `myth` × 5 (uno per ogni mito) → `framework` (la verità in 1 acronimo) → `quoteBig` (frase memorabile) → `cta` (newsletter / link bio)

### 4. `flash-sale` — "Flash sale 24h" (7 slide) 🔥
Urgenza massima, decisione rapida:
`hook` ("URGENTE: 24h") → `bignum` (sconto %) → `feature` (cosa includi) → `prosCons` (con/senza prodotto) → `socialProof` (chi l'ha già preso) → `offer` (urgency forte) → `cta` ("Compra entro mezzanotte")

### 5. `authority-builder` — "Pillar di autorità" (8 slide) 👑
Costruzione di autorità senza vendere:
`cover` (titolo da expert) → `bignum` (anni esperienza / clienti) → `framework` (il tuo metodo proprietario) → `process` → `mistakes` (errori da evitare) → `quoteBig` (frase d'autore) → `tipPack` (3 takeaway) → `cta` (segui per altro)

### 6. `objection-crusher` — "Smonta le obiezioni" (9 slide) 🛡️
Per audience tiepida che non converte:
`hook` ("Perché non hai ancora comprato?") → `objection` × 5 (le 5 obiezioni più comuni) → `socialProof` → `offer` → `cta` ("Ora non hai più scuse")

## B. 5 nuove tipologie di slide marketing

Aggiungo template che coprono gap importanti per chi vende sui social.

### 1. `urgency` — Countdown / Scarcity
Slide con countdown grande, posti rimasti, deadline. Layout: timer XL al centro + claim sopra + CTA mini in basso.
- Campi: `headline`, `deadline` (es. "23:47:12"), `unitsLeft` (es. "Solo 7 posti"), `ctaLabel`

### 2. `bonusStack` — "Cosa ricevi" con prezzo cumulativo
Lista bonus con valore monetario per ognuno, totale enorme barrato + prezzo finale (classico tecnica VSL).
- Campi: `eyebrow`, `title`, `bonuses[]` (`name`, `description`, `value`), `totalValue`, `yourPrice`, `ctaLabel`

### 3. `guarantee` — Garanzia / "Risk reversal"
Sigillo grafico + promessa anti-rischio (rimborso, zero rischio).
- Campi: `badge` ("100% SODDISFATTI"), `headline`, `body`, `terms` (sotto), `seal` (icona/emoji)

### 4. `faq` — Domande frequenti accordion
Lista 3-5 Q&A con stile chat / pillole. Risolve obiezioni in batch (più compatto di 5 slide `objection`).
- Campi: `eyebrow`, `title`, `items[]` (`q`, `a`)

### 5. `quickWin` — "Win in 60 secondi"
Slide-azione tipo "Fai questo ORA": istruzione singola con timer mini + screenshot/before-after.
- Campi: `eyebrow` ("PROVA SUBITO"), `instruction` (titolo grande), `steps[]` (3 step max), `expectedResult`, `timeBadge` (es. "60 sec")

## File toccati

**Nuovi:**
- (nessuno — i nuovi template vivono in `templates.ts` e `SlideRenderer.tsx`)

**Modificati:**
- `src/lib/templates.ts` — aggiungo 5 `TemplateId` (`urgency`, `bonusStack`, `guarantee`, `faq`, `quickWin`), interface dati, default in `makeDefaultData`, voci `TEMPLATE_META` + `TEMPLATE_ORDER`, voci in `getStylableFields`
- `src/components/slides/SlideRenderer.tsx` — 5 nuovi componenti template + case nel router `renderBody`
- `src/components/slides/slide-styles.css` — classi `.tpl-urgency`, `.tpl-bonusStack`, `.tpl-guarantee`, `.tpl-faq`, `.tpl-quickWin` (stile coerente con marketing existing: badge, gradient, neon)
- `src/components/SlideEditorForm.tsx` — 5 nuovi editor (`UrgencyEditor`, `BonusStackEditor`, `GuaranteeEditor`, `FaqEditor`, `QuickWinEditor`) + case nel switch
- `src/lib/validation.ts` — 5 nuovi case di validazione (campi obbligatori: `urgency.headline/deadline/ctaLabel`, `bonusStack.title/yourPrice/ctaLabel/bonuses≥1`, `guarantee.headline/body`, `faq.title/items≥2`, `quickWin.instruction/steps≥1`)
- `src/lib/carouselPresets.ts` — aggiungo 6 preset built-in (incluso uso dei nuovi template `urgency`, `bonusStack`, `guarantee`, `faq` in alcuni)

**Non toccati:**
- `src/lib/store.ts` — già pronto (loadCarouselPreset agnostico ai template)
- `src/components/CarouselPresetDialog.tsx` — auto-mostra i nuovi preset
- `src/components/NewSlideDialog.tsx` — auto-mostra i nuovi template (categorizzati come `text`/`media` in base alla natura — assegno `urgency`/`bonusStack`/`guarantee`/`quickWin` a categoria `text`, `faq` a categoria `data`)

## Categorie nei picker

Estendo `templatesPerCategory` (in `store.ts` defaults) per includere i 5 nuovi:
- `text`: `urgency`, `bonusStack`, `guarantee`, `quickWin`
- `data`: `faq`

## Esperienza utente integrata

1. Apre "Caroselli pronti" → ora 10 preset (4 esistenti + 6 nuovi) coprono ogni stadio del funnel
2. "Nuova slide" → 37 template totali (32 + 5 nuovi marketing-killer)
3. I nuovi preset come `flash-sale` o `webinar-funnel` usano automaticamente i nuovi template `urgency` e `bonusStack` per massima coerenza
4. Validazione e blocco export funzionano out-of-the-box anche sui nuovi template
5. Auto-style brand (badge filled/neon, gradient subtle/bold) si applica anche ai nuovi template marketing

## Fuori scope

- Rendering reale del countdown live (è un testo statico, non un timer JS — l'utente lo aggiorna manualmente)
- Animazioni speciali per `urgency` (resta statico per export PNG)
- Localizzazione automatica del copy dei preset (default italiano, l'utente traduce)
- Editor visuale del `bonusStack` con calcolo automatico totale (utente compila i numeri)
- Preset salvati dall'utente (solo built-in)
- Migrazione dei vecchi preset per usare i nuovi template

