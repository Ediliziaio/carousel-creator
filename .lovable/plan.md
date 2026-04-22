

# Fix bug HTTPError 500: error boundaries mancanti + UI di recovery

## Diagnosi

Lo screenshot mostra `{"status":500,"unhandled":true,"message":"HTTPError"}` come **JSON grezzo nella pagina**. Questo accade perché:

1. Un errore SSR transient (visto nei worker logs alle 04:47 UTC) è stato emesso senza alcun `errorComponent` nel root → TanStack Start ha serializzato l'errore come JSON e lo ha mostrato all'utente come pagina.
2. Lo stato attuale del server è già OK (build pulita, fetch della home risponde 302 normale), ma la **mancanza di error boundary** lascia l'utente esposto a vedere errori grezzi a ogni futuro hiccup SSR.
3. Il file `src/router.tsx` definisce `defaultErrorComponent`, ma il **root route** non ha `errorComponent` proprio — e per la rotta `/` (con `ssr: false`) non c'è alcuna guardia per errori che avvengano durante l'idratazione client.

## Fix

### 1. `src/routes/__root.tsx` — aggiungo `errorComponent`

Aggiungo `errorComponent` alla `createRootRoute` con UI di recovery che:
- Mostra messaggio user-friendly in italiano ("Si è verificato un errore inatteso")
- Pulsante "Riprova" → `router.invalidate() + reset()`
- Pulsante "Pulisci dati locali e ricarica" → `localStorage.removeItem("carousel-brand-v1")` + `window.location.reload()` (utile se il problema è uno stato persistito incompatibile dopo i nuovi template)
- Mostra `error.message` solo in DEV

### 2. `src/routes/index.tsx` — aggiungo `errorComponent`

Aggiungo `errorComponent` alla rotta `/` con la stessa UI di recovery (variante più mirata: "Errore nell'editor"), così se uno slide persistito ha shape incompatibile dopo l'aggiunta dei 13 nuovi template, l'utente vede un fallback con il pulsante di reset invece del JSON.

### 3. `src/lib/store.ts` — guardia di rehydrate

Nella funzione `merge` del persist, aggiungo un `try/catch` che:
- Se la deserializzazione fallisce o trova `slide.template` non riconosciuto, fa fallback ai default puliti
- Logga un warning e mostra (via toast successivo) un messaggio "Sessione precedente incompatibile, ripartito da zero"

Questo previene il root cause più probabile per il 500 visto: localStorage di una vecchia versione che non ha tutti i nuovi template registrati.

## File toccati

**Modificati:**
- `src/routes/__root.tsx` — aggiungo `errorComponent` con bottone reset localStorage
- `src/routes/index.tsx` — aggiungo `errorComponent` con stessa UX
- `src/lib/store.ts` — `try/catch` nel merge del persist + filtro slide con `template` sconosciuto

**Non toccati:**
- `src/router.tsx` — `defaultErrorComponent` esistente resta come fallback finale
- Altri componenti

## Esperienza utente

1. Se in futuro avviene un errore SSR/client → l'utente vede una schermata pulita con "Riprova" o "Pulisci dati e ricarica" invece del JSON `{"status":500,…}`
2. Per l'errore corrente già in cache: l'utente clicca "Pulisci dati locali e ricarica" → torna allo stato pulito
3. Lo stato persistito incompatibile non causerà più crash silenziosi

## Fuori scope

- Rimozione di `ssr: false` dalla rotta `/` (necessario perché lo store usa `localStorage`)
- Migrazione automatica di slide con template legacy verso i nuovi
- Sentry/error reporting esterno
- Service worker invalidation

