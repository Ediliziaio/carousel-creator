import type { TemplateId, SlideFormat, AnyTemplateData } from "./templates";
import { makeDefaultData } from "./templates";

export interface CarouselPresetSlide {
  template: TemplateId;
  format?: SlideFormat;
  /** Partial overrides merged on top of makeDefaultData(template). */
  overrides?: Partial<AnyTemplateData> & Record<string, unknown>;
}

export interface CarouselPreset {
  id: string;
  name: string;
  description: string;
  /** Emoji icon for the card. */
  icon: string;
  slides: CarouselPresetSlide[];
}

export const BUILT_IN_CAROUSEL_PRESETS: CarouselPreset[] = [
  {
    id: "sales-funnel",
    name: "Sales Funnel completo",
    description:
      "10 slide ad alta conversione: hook → problema → autorità → prova → obiezione → offerta → CTA.",
    icon: "💰",
    slides: [
      {
        template: "hook",
        overrides: {
          eyebrow: "LEGGI FINO ALLA FINE",
          hook: "Stai perdendo clienti senza saperlo.",
          subhook: "E nessuno te lo sta dicendo.",
          swipeLabel: "SCORRI →",
        },
      },
      {
        template: "problemSolution",
        overrides: {
          eyebrow: "Il vero problema",
          problem: {
            label: "IL PROBLEMA",
            text: "I tuoi contenuti girano ma non vendono. Like sì, clienti no.",
          },
          solution: {
            label: "LA SOLUZIONE",
            text: "Un sistema testato che trasforma le visualizzazioni in vendite reali.",
          },
        },
      },
      {
        template: "mistakes",
        overrides: {
          eyebrow: "Errori comuni",
          title: "I 4 errori che ti costano clienti.",
          mistakes: [
            {
              title: "Vendere subito",
              why: "Le persone comprano da chi conoscono. Prima dai valore.",
            },
            {
              title: "Parlare di te",
              why: "Il cliente vuole sentire dei suoi problemi, non dei tuoi servizi.",
            },
            { title: "Niente CTA chiara", why: "Se non dici cosa fare, nessuno farà nulla." },
            {
              title: "Pubblicare a caso",
              why: "Senza calendario coerente l'algoritmo ti penalizza.",
            },
          ],
        },
      },
      {
        template: "framework",
        overrides: {
          eyebrow: "Il metodo",
          title: "Il framework AIDA.",
          acronym: "AIDA",
          letters: [
            { letter: "A", name: "Attention", desc: "Cattura l'attenzione nei primi 3 secondi." },
            { letter: "I", name: "Interest", desc: "Crea curiosità con un dato o una promessa." },
            { letter: "D", name: "Desire", desc: "Mostra il risultato che otterrà." },
            { letter: "A", name: "Action", desc: "Chiudi con una CTA chiara e diretta." },
          ],
        },
      },
      {
        template: "socialProof",
        overrides: {
          eyebrow: "Caso studio",
          clientName: "ACME SRL",
          tagline: "Da 0 a 10k follower in 90 giorni.",
          metrics: [
            { value: "+340", unit: "%", label: "Engagement" },
            { value: "12", unit: "sett", label: "Tempo" },
            { value: "0", unit: "€", label: "Ads spent" },
          ],
          summary: "Sistema di contenuti organici basato su carosello + reel a tema verticale.",
        },
      },
      {
        template: "objection",
        overrides: {
          eyebrow: "Obiezione comune",
          objection: "Ma io non ho tempo di postare ogni giorno…",
          answer:
            "Non serve. 3 caroselli a settimana ben fatti battono 30 post mediocri. Te lo dimostro.",
          signOff: "P.S. Provalo gratis per 14 giorni.",
        },
      },
      {
        template: "offer",
        overrides: {
          badge: "OFFERTA LIMITATA",
          productName: "Carosello Sistema Pro",
          priceOld: "297",
          priceNew: "147",
          currency: "€",
          includes: [
            "30 template editabili",
            "Guida video 2h",
            "Community privata",
            "Aggiornamenti a vita",
          ],
          ctaLabel: "ACQUISTA ORA →",
          urgency: "Solo per i primi 50 — scade in 48h",
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "Inizia oggi",
          headline: "Pronto a vendere davvero?",
          subtitle: "Click sul link in bio e attiva il tuo accesso.",
          buttonLabel: "ACQUISTA ORA →",
        },
      },
    ],
  },
  {
    id: "educational-pack",
    name: "Educational pack",
    description:
      "8 slide didattiche: cover → hook → consigli → processo → mito → framework → quote → CTA.",
    icon: "🎓",
    slides: [
      {
        template: "cover",
        overrides: {
          eyebrow: "GUIDA",
          title: "Tutto quello che ti hanno {hl}sbagliato a dire{/hl}.",
          sub: "Una guida pratica in 8 slide.",
        },
      },
      {
        template: "hook",
        overrides: {
          eyebrow: "ATTENZIONE",
          hook: "Il 73% delle persone sbaglia da qui.",
          subhook: "Vediamo come fare bene.",
          swipeLabel: "SCORRI →",
        },
      },
      {
        template: "tipPack",
        overrides: {
          eyebrow: "Quick wins",
          title: "5 modi per crescere in 30 secondi.",
          tips: [
            { icon: "⚡", title: "Hook potente", text: "Le prime 3 parole decidono se leggono." },
            {
              icon: "🎯",
              title: "1 idea = 1 post",
              text: "Non infilare 10 concetti in una slide.",
            },
            { icon: "💾", title: "Save-bait", text: "Crea contenuti che la gente vuole rivedere." },
            { icon: "🔁", title: "CTA al riuso", text: "Dì sempre cosa fare dopo averlo letto." },
            { icon: "📊", title: "Misura tutto", text: "Replica solo ciò che ha funzionato." },
          ],
          saveLabel: "SALVA QUESTO POST",
        },
      },
      { template: "process" },
      { template: "myth" },
      { template: "framework" },
      { template: "quoteBig" },
      {
        template: "cta",
        overrides: {
          eyebrow: "Continua a imparare",
          headline: "Vuoi la versione completa?",
          subtitle: "Iscriviti alla newsletter, è gratis.",
          buttonLabel: "ISCRIVITI →",
        },
      },
    ],
  },
  {
    id: "product-launch",
    name: "Lancio prodotto",
    description:
      "9 slide per il lancio: hook → claim → feature → prova → pro/contro → offerta → obiezione → CTA.",
    icon: "🚀",
    slides: [
      {
        template: "hook",
        overrides: {
          eyebrow: "NOVITÀ",
          hook: "È arrivato. Finalmente.",
          subhook: "Quello che stavi aspettando.",
          swipeLabel: "SCORRI →",
        },
      },
      {
        template: "center",
        overrides: {
          eyebrow: "PRESENTIAMO",
          title: "Il modo {hl}più semplice{/hl} per X.",
          sub: "Tutto in un'unica soluzione.",
        },
      },
      { template: "feature" },
      { template: "socialProof" },
      { template: "prosCons" },
      { template: "offer" },
      { template: "objection" },
      {
        template: "cta",
        overrides: {
          eyebrow: "Disponibile ora",
          headline: "Prendilo prima che finisca.",
          subtitle: "Spedizione in 24h, soddisfatti o rimborsati.",
          buttonLabel: "COMPRA ORA →",
        },
      },
    ],
  },
  {
    id: "case-study",
    name: "Case study",
    description:
      "8 slide caso studio: cover → problema → processo → roadmap → risultati → quote → CTA.",
    icon: "📈",
    slides: [
      {
        template: "cover",
        overrides: {
          eyebrow: "CASO STUDIO",
          title: "Da 0 a 10k clienti in {hl}90 giorni{/hl}.",
          sub: "Come abbiamo fatto, passo per passo.",
        },
      },
      { template: "problemSolution" },
      { template: "process" },
      { template: "roadmap" },
      { template: "socialProof" },
      { template: "quoteBig" },
      {
        template: "cta",
        overrides: {
          eyebrow: "Anche tu",
          headline: "Vuoi risultati simili?",
          subtitle: "Prenota una call gratuita di 30 minuti.",
          buttonLabel: "PRENOTA →",
        },
      },
    ],
  },
  {
    id: "webinar-funnel",
    name: "Webinar / Lead magnet",
    description:
      "9 slide per lead magnet gratuito: hook → stat shock → problema → quick wins → prova → metodo → obiezione → offerta gratis → CTA.",
    icon: "🎁",
    slides: [
      {
        template: "hook",
        overrides: {
          eyebrow: "GRATIS PER 48H",
          hook: "Quello che nessuno ti dice sul {hl}lead magnet{/hl}.",
          subhook: "E perché il 90% non converte.",
          swipeLabel: "SCORRI →",
        },
      },
      {
        template: "bignum",
        overrides: {
          number: "73",
          numberSub: "PERCENTO",
          title: "delle persone abbandona prima di iscriversi.",
          paragraphs: [
            "Il problema non è il prodotto. È come lo stai presentando.",
            "Vediamo come ribaltare il dato.",
          ],
        },
      },
      {
        template: "problemSolution",
        overrides: {
          eyebrow: "Il vero problema",
          problem: {
            label: "IL PROBLEMA",
            text: "Hai un freebie ma nessuno lo scarica. O lo scarica e poi sparisce.",
          },
          solution: {
            label: "LA SOLUZIONE",
            text: "Un funnel a 3 step che trasforma il download in cliente in 14 giorni.",
          },
        },
      },
      {
        template: "tipPack",
        overrides: {
          eyebrow: "Anteprima del metodo",
          title: "3 quick wins dal sistema completo.",
          tips: [
            {
              icon: "🎯",
              title: "Hook chirurgico",
              text: "1 promessa specifica + 1 dolore specifico = +200% iscritti.",
            },
            {
              icon: "⏱",
              title: "Delivery <60 sec",
              text: "Manda il freebie via mail in <1 minuto, non dopo 1 ora.",
            },
            {
              icon: "🔁",
              title: "Sequence di 5 mail",
              text: "Non basta 1 mail. Servono 5 in 7 giorni per convertire.",
            },
          ],
          saveLabel: "SALVA PER DOPO",
        },
      },
      {
        template: "socialProof",
        overrides: {
          eyebrow: "Risultati reali",
          clientName: "STUDIO ROSSI",
          tagline: "Da 0 a 1.200 lead in 60 giorni.",
          metrics: [
            { value: "1.2k", unit: "lead", label: "Generati" },
            { value: "23", unit: "%", label: "Conversione" },
            { value: "60", unit: "gg", label: "Tempo" },
          ],
          summary: "Sistema lead magnet + sequence email + offerta soft.",
        },
      },
      {
        template: "framework",
        overrides: {
          eyebrow: "Anteprima metodo",
          title: "Il framework {hl}LEAD{/hl}.",
          acronym: "LEAD",
          letters: [
            { letter: "L", name: "Lure", desc: "Crea una promessa irresistibile in 1 frase." },
            { letter: "E", name: "Email", desc: "Sequence di 5 mail in 7 giorni." },
            { letter: "A", name: "Authority", desc: "Mostra prove sociali in ogni step." },
            {
              letter: "D",
              name: "Decision",
              desc: "Offri il prossimo passo chiaro e a basso rischio.",
            },
          ],
        },
      },
      {
        template: "objection",
        overrides: {
          eyebrow: "Lo so cosa pensi",
          objection: "Ma è davvero gratis? Dov'è la fregatura?",
          answer:
            "Zero fregatura. È gratis perché voglio che tu provi il sistema. Se ti piace, parliamo del prossimo step. Altrimenti, tieniti il freebie e basta.",
          signOff: "P.S. Niente carta di credito richiesta.",
        },
      },
      {
        template: "offer",
        overrides: {
          badge: "100% GRATIS",
          productName: "Lead Magnet Blueprint",
          priceOld: "47",
          priceNew: "0",
          currency: "€",
          includes: [
            "PDF 24 pagine con il framework completo",
            "5 template email pronti all'uso",
            "Checklist setup in 60 minuti",
            "Bonus: case study video 30 min",
          ],
          ctaLabel: "SCARICA GRATIS →",
          urgency: "Solo per le prime 100 persone — poi diventa a pagamento",
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "Ultima chance",
          headline: "Pronto a far esplodere i tuoi lead?",
          subtitle: "Click sul link in bio e attiva il download.",
          buttonLabel: "SCARICA ORA →",
        },
      },
    ],
  },
  {
    id: "before-after-story",
    name: "Trasformazione cliente",
    description:
      "8 slide storytelling: cover → hook → prima/dopo → processo → grafico → testimonial → metriche → CTA.",
    icon: "✨",
    slides: [
      {
        template: "cover",
        overrides: {
          eyebrow: "STORIA VERA",
          title: "Da 0 a {hl}10k clienti{/hl} in 90 giorni.",
          sub: "La storia di Mario, raccontata passo per passo.",
        },
      },
      {
        template: "hook",
        overrides: {
          eyebrow: "PUNTO DI PARTENZA",
          hook: "Mario non vendeva da 6 mesi.",
          subhook: "Era pronto a chiudere tutto.",
          swipeLabel: "SCORRI →",
        },
      },
      {
        template: "compare",
        overrides: {
          eyebrow: "Trasformazione",
          title: "Prima e dopo il sistema.",
          before: {
            tag: "PRIMA",
            title: "Stato di crisi",
            items: [
              "0 vendite/mese",
              "200 follower stagnanti",
              "Nessuna strategia",
              "Pronto a mollare",
            ],
          },
          after: {
            tag: "DOPO",
            title: "Business solido",
            items: [
              "10k vendite/mese",
              "12k follower attivi",
              "Funnel automatico",
              "Team di 3 persone",
            ],
          },
        },
      },
      {
        template: "process",
        overrides: {
          eyebrow: "Cosa abbiamo fatto",
          title: "Il piano in 4 mosse.",
          steps: [
            { title: "Audit completo", desc: "1 settimana per capire cosa non funzionava." },
            { title: "Riposizionamento", desc: "Nuovo target, nuova promessa, nuova bio." },
            { title: "Content system", desc: "3 caroselli + 2 reel a settimana, sempre." },
            { title: "Lancio offerta", desc: "Funnel completo: lead magnet → mail → call." },
          ],
        },
      },
      {
        template: "chartLine",
        overrides: {
          eyebrow: "Crescita reale",
          title: "Vendite mensili (90 giorni).",
          xLabels: ["Sett 1", "Sett 3", "Sett 5", "Sett 7", "Sett 9", "Sett 12"],
          values: [0, 200, 800, 2400, 5800, 10200],
          unit: "€",
        },
      },
      {
        template: "testimonial",
        overrides: {
          quote:
            "Pensavo di aver provato di tutto. Mi sbagliavo. Questo sistema mi ha cambiato la vita in 3 mesi.",
          author: "Mario Bianchi",
          role: "Coach business · Milano",
          rating: 5,
        },
      },
      {
        template: "socialProof",
        overrides: {
          eyebrow: "Risultati certificati",
          clientName: "MARIO BIANCHI",
          tagline: "Numeri reali, screenshot reali.",
          metrics: [
            { value: "+10k", unit: "€/m", label: "Vendite" },
            { value: "+11k", unit: "fw", label: "Follower" },
            { value: "90", unit: "gg", label: "Tempo" },
          ],
          summary: "Sistema documentato passo-passo. Replicabile su qualsiasi nicchia B2C.",
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "Vuoi essere il prossimo?",
          headline: "Prenota una call gratuita di 30 min.",
          subtitle: "Vediamo se sei un fit per il sistema.",
          buttonLabel: "PRENOTA CALL →",
        },
      },
    ],
  },
  {
    id: "myth-busting",
    name: "Sfata 5 miti",
    description: "10 slide ad alta saving rate: hook → 5 miti → framework → quote → CTA.",
    icon: "🧨",
    slides: [
      {
        template: "hook",
        overrides: {
          eyebrow: "ATTENZIONE",
          hook: "5 bugie che ti hanno detto sul {hl}marketing{/hl}.",
          subhook: "Spoiler: la #3 ti farà incazzare.",
          swipeLabel: "SCORRI →",
        },
      },
      {
        template: "myth",
        overrides: {
          eyebrow: "Mito #1",
          title: "Più posti, più cresci.",
          myth: { label: "MITO", text: "Devi postare ogni giorno per crescere su Instagram." },
          reality: {
            label: "REALTÀ",
            text: "3 contenuti di qualità a settimana battono 30 post mediocri. L'algoritmo premia l'engagement, non la frequenza.",
          },
        },
      },
      {
        template: "myth",
        overrides: {
          eyebrow: "Mito #2",
          title: "Solo gli hashtag funzionano.",
          myth: { label: "MITO", text: "Servono 30 hashtag per essere scoperti." },
          reality: {
            label: "REALTÀ",
            text: "5-10 hashtag mirati + un buon hook valgono più di 30 hashtag a caso. Il copy fa la differenza.",
          },
        },
      },
      {
        template: "myth",
        overrides: {
          eyebrow: "Mito #3",
          title: "Devi essere un esperto.",
          myth: { label: "MITO", text: "Per fare contenuti devi sapere tutto del tuo settore." },
          reality: {
            label: "REALTÀ",
            text: "Devi saperne più del tuo pubblico. Stop. Documenta il tuo percorso, non insegnare la perfezione.",
          },
        },
      },
      {
        template: "myth",
        overrides: {
          eyebrow: "Mito #4",
          title: "Le ads risolvono tutto.",
          myth: { label: "MITO", text: "Basta sponsorizzare i post per crescere e vendere." },
          reality: {
            label: "REALTÀ",
            text: "Le ads amplificano. Se il contenuto non converte organico, non converte nemmeno con 10k di budget.",
          },
        },
      },
      {
        template: "myth",
        overrides: {
          eyebrow: "Mito #5",
          title: "Il personal brand è morto.",
          myth: { label: "MITO", text: "Ormai tutti hanno un personal brand, non serve più." },
          reality: {
            label: "REALTÀ",
            text: "Le persone comprano da persone. Il personal brand non è morto: è diventato il MINIMO sindacale per essere notati.",
          },
        },
      },
      {
        template: "framework",
        overrides: {
          eyebrow: "La verità in 1 framework",
          title: "Il metodo {hl}TRUE{/hl}.",
          acronym: "TRUE",
          letters: [
            { letter: "T", name: "Target", desc: "Sai esattamente per chi parli." },
            { letter: "R", name: "Real", desc: "Documenti, non insegni perfezione." },
            { letter: "U", name: "Useful", desc: "Ogni post risolve un problema concreto." },
            { letter: "E", name: "Execute", desc: "Pubblichi con coerenza, non con quantità." },
          ],
        },
      },
      {
        template: "quoteBig",
        overrides: {
          quote: "Il marketing non è quello che dici. È quello che gli altri dicono di te.",
          author: "Seth Godin",
          role: "Marketer",
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "Continua a imparare",
          headline: "Vuoi più mito-busting?",
          subtitle: "Iscriviti alla newsletter, 1 mail/sett.",
          buttonLabel: "ISCRIVITI →",
        },
      },
    ],
  },
  {
    id: "flash-sale",
    name: "Flash sale 24h",
    description:
      "8 slide urgenza massima: hook → bignum sconto → feature → pro/contro → prova → urgency → offer → CTA.",
    icon: "🔥",
    slides: [
      {
        template: "hook",
        overrides: {
          eyebrow: "URGENTE — 24H",
          hook: "Sconto del {hl}-50%{/hl} solo oggi.",
          subhook: "Domani il prezzo torna pieno. Niente proroghe.",
          swipeLabel: "SCORRI →",
        },
      },
      {
        template: "bignum",
        overrides: {
          number: "-50",
          numberSub: "PERCENTO",
          title: "su tutto il catalogo. Solo oggi.",
          paragraphs: ["Mai fatto uno sconto così alto.", "Mai più lo rifaremo. Promesso."],
        },
      },
      {
        template: "feature",
        overrides: {
          eyebrow: "Cosa includi",
          title: "Tutto quello che ti serve, scontato.",
          bullets: [
            {
              marker: "01",
              title: "Corso completo 10h",
              text: "Modulo dopo modulo, dal base al PRO.",
            },
            { marker: "02", title: "Workbook + template", text: "Tutto il materiale stampabile." },
            { marker: "03", title: "Community privata", text: "Accesso a vita, no scadenza." },
          ],
        },
      },
      {
        template: "prosCons",
        overrides: {
          eyebrow: "Decisione",
          title: "Con o senza il corso?",
          prosLabel: "CON",
          consLabel: "SENZA",
          pros: [
            "Sistema testato",
            "Risultati in 30 gg",
            "Community + supporto",
            "Aggiornamenti a vita",
          ],
          cons: ["Mesi di tentativi", "Errori da soli", "Tempo sprecato", "Stress da overload"],
        },
      },
      {
        template: "socialProof",
        overrides: {
          eyebrow: "Già 2.300 persone dentro",
          clientName: "COMMUNITY",
          tagline: "Non sei il primo. Non sarai l'ultimo.",
          metrics: [
            { value: "2.3k", unit: "stud", label: "Iscritti" },
            { value: "4.9", unit: "/5", label: "Rating" },
            { value: "94", unit: "%", label: "Soddisfatti" },
          ],
        },
      },
      {
        template: "urgency",
        overrides: {
          eyebrow: "URGENTE",
          headline: "L'offerta scade in…",
          deadline: "23:59:00",
          unitsLeft: "Posti illimitati ma solo per 24h",
          ctaLabel: "ACQUISTA ORA →",
        },
      },
      {
        template: "offer",
        overrides: {
          badge: "FLASH SALE -50%",
          productName: "Sistema Pro 2026",
          priceOld: "297",
          priceNew: "147",
          currency: "€",
          includes: [
            "Corso completo 10 ore",
            "Workbook + template",
            "Community privata a vita",
            "30 giorni soddisfatti o rimborsati",
          ],
          ctaLabel: "COMPRA ORA →",
          urgency: "Offerta valida solo per 24h — poi torna a 297€",
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "Ultima chiamata",
          headline: "Compra entro mezzanotte.",
          subtitle: "Domani il prezzo raddoppia.",
          buttonLabel: "COMPRA ORA →",
        },
      },
    ],
  },
  {
    id: "authority-builder",
    name: "Pillar di autorità",
    description:
      "8 slide per costruire autorità senza vendere: cover → bignum → framework → processo → errori → quote → tip → CTA.",
    icon: "👑",
    slides: [
      {
        template: "cover",
        overrides: {
          eyebrow: "GUIDA COMPLETA",
          title: "Come costruire un'autorità {hl}reale{/hl} nel tuo settore.",
          sub: "Senza vendere nulla, solo dando valore.",
        },
      },
      {
        template: "bignum",
        overrides: {
          number: "12",
          numberSub: "ANNI",
          title: "di esperienza nel settore.",
          paragraphs: [
            "Ho visto trend nascere, esplodere, morire.",
            "Una cosa sola non cambia mai: l'autorità si costruisce, non si compra.",
          ],
        },
      },
      {
        template: "framework",
        overrides: {
          eyebrow: "Il mio metodo",
          title: "Il sistema {hl}TRUST{/hl}.",
          acronym: "TRUST",
          letters: [
            { letter: "T", name: "Teach", desc: "Insegna sempre, vendi raramente." },
            { letter: "R", name: "Real", desc: "Mostra processi, errori, risultati reali." },
            { letter: "U", name: "Unique", desc: "Una voce. Una visione. Niente cloni." },
            { letter: "S", name: "Show up", desc: "Coerenza > virali." },
            { letter: "T", name: "Time", desc: "L'autorità è una maratona, non uno sprint." },
          ],
        },
      },
      {
        template: "process",
        overrides: {
          eyebrow: "Come applicarlo",
          title: "I 4 step pratici.",
          steps: [
            {
              title: "Definisci la tua nicchia",
              desc: "1 problema specifico per 1 audience specifica.",
            },
            { title: "Crea il tuo framework", desc: "Dai un nome al tuo metodo. Lo rende tuo." },
            { title: "Documenta tutto", desc: "Caroselli, podcast, newsletter: scegli 1 canale." },
            {
              title: "Ripeti per 24 mesi",
              desc: "L'autorità non si negozia. Si guadagna nel tempo.",
            },
          ],
        },
      },
      {
        template: "mistakes",
        overrides: {
          eyebrow: "Cosa NON fare",
          title: "I 4 errori che uccidono l'autorità.",
          mistakes: [
            {
              title: "Inseguire i trend",
              why: "L'autorità nasce dalla profondità, non dalla quantità.",
            },
            {
              title: "Copiare gli altri",
              why: "Il mercato si ricorda dell'originale, non delle copie.",
            },
            { title: "Vendere subito", why: "La fiducia si guadagna prima, monetizza dopo." },
            {
              title: "Mollare a 6 mesi",
              why: "Il 90% molla quando mancano 3 mesi al breakthrough.",
            },
          ],
        },
      },
      {
        template: "quoteBig",
        overrides: {
          quote: "L'autorità non si dichiara. Si dimostra, ogni giorno, per anni.",
          author: "Naval Ravikant",
          role: "Investitore",
        },
      },
      {
        template: "tipPack",
        overrides: {
          eyebrow: "Takeaway pratici",
          title: "3 azioni da fare oggi.",
          tips: [
            {
              icon: "📝",
              title: "Scrivi il tuo framework",
              text: "Anche in bozza. Anche brutto. Inizia.",
            },
            {
              icon: "📅",
              title: "Calendario 90 gg",
              text: "Pianifica i prossimi 12 contenuti pillar.",
            },
            {
              icon: "📣",
              title: "Una voce sola",
              text: "Scegli 1 canale principale. Domina lì prima di espanderti.",
            },
          ],
          saveLabel: "SALVA E APPLICA",
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "Continua il viaggio",
          headline: "Seguimi per altre guide come questa.",
          subtitle: "1 carosello a settimana, sempre senza fuffa.",
          buttonLabel: "SEGUI →",
        },
      },
    ],
  },
  {
    id: "objection-crusher",
    name: "Smonta le obiezioni",
    description:
      "9 slide per audience tiepida: hook → 5 obiezioni → garanzia → social proof → offerta → CTA.",
    icon: "🛡️",
    slides: [
      {
        template: "hook",
        overrides: {
          eyebrow: "PARLIAMOCI CHIARO",
          hook: "Perché non hai ancora {hl}comprato{/hl}?",
          subhook: "Vediamo le 5 obiezioni più comuni — e perché non reggono.",
          swipeLabel: "SCORRI →",
        },
      },
      {
        template: "objection",
        overrides: {
          eyebrow: "Obiezione #1",
          objection: "Costa troppo.",
          answer:
            "Costa quanto 3 cene fuori. Ti porta risultati che valgono 100x. Calcola il ROI, non il prezzo.",
        },
      },
      {
        template: "objection",
        overrides: {
          eyebrow: "Obiezione #2",
          objection: "Non ho tempo.",
          answer:
            "Bastano 30 min/giorno per 30 giorni. Se non hai 30 min al giorno, il problema non è il corso.",
        },
      },
      {
        template: "objection",
        overrides: {
          eyebrow: "Obiezione #3",
          objection: "Non so se funziona per me.",
          answer:
            "Ha funzionato per 2.300 persone in 12 settori diversi. Hai 30 giorni per testarlo a rischio zero.",
        },
      },
      {
        template: "objection",
        overrides: {
          eyebrow: "Obiezione #4",
          objection: "Posso trovare le info gratis.",
          answer:
            "Le info sì. Il sistema testato che ti porta dal punto A al punto B in modo lineare, no. Quello costa.",
        },
      },
      {
        template: "objection",
        overrides: {
          eyebrow: "Obiezione #5",
          objection: "Aspetto un momento migliore.",
          answer:
            "Il momento migliore era 6 mesi fa. Il secondo migliore è oggi. Ogni settimana che aspetti, paghi il costo dell'inazione.",
        },
      },
      {
        template: "guarantee",
        overrides: {
          badge: "ZERO RISCHIO",
          seal: "🛡️",
          headline: "30 giorni soddisfatti o rimborsati.",
          body: "Provalo. Applica il sistema. Se entro 30 giorni non vedi risultati o non ti convince, ti rimborso tutto. Senza domande, senza giustificazioni.",
          terms: "Basta una mail a support@. Rimborso entro 48h.",
        },
      },
      {
        template: "offer",
        overrides: {
          badge: "ULTIMA CHANCE",
          productName: "Sistema completo",
          priceOld: "297",
          priceNew: "147",
          currency: "€",
          includes: [
            "Corso completo 10 ore",
            "Workbook + 30 template",
            "Community privata a vita",
            "Garanzia 30 giorni",
          ],
          ctaLabel: "COMPRA ORA →",
          urgency: "Hai zero scuse. Decidi adesso.",
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "Decidi",
          headline: "Ora non hai più scuse.",
          subtitle: "Click sul link in bio. Cambia rotta oggi.",
          buttonLabel: "INIZIA ORA →",
        },
      },
    ],
  },
  /* ===== NUOVI PRESET (usano template moderni: poll/statsPack/teamMember/stepsGallery) ===== */
  {
    id: "results-storytelling",
    name: "Risultati di un cliente",
    icon: "📊",
    description:
      "8 slide per mostrare il caso studio di un cliente: problema, processo, numeri, testimonial, CTA.",
    slides: [
      {
        template: "cover",
        overrides: {
          eyebrow: "CASE STUDY",
          title: "Da 0 a 100K in 6 mesi.\nEcco come.",
          sub: "Il caso reale di un nostro cliente.",
        },
      },
      {
        template: "teamMember",
        overrides: {
          eyebrow: "IL CLIENTE",
          name: "Giulia Bianchi",
          role: "Founder · TechShop",
          bio: "Ha fondato il suo e-commerce nel 2024. Stagnante per 8 mesi a 12K/mese.",
          highlights: ["E-commerce B2C", "Settore tech", "Team di 3"],
        },
      },
      {
        template: "problemSolution",
        overrides: {
          eyebrow: "IL BLOCCO",
          problem: { label: "PROBLEMA", text: "Traffico crescente ma conversioni piatte al 0,8%." },
          solution: { label: "INTUIZIONE", text: "Funnel di sponsor + landing dedicate per audience tiepida." },
        },
      },
      {
        template: "stepsGallery",
        overrides: {
          eyebrow: "IL PROCESSO",
          title: "I 4 step che abbiamo applicato.",
          steps: [
            { number: "01", title: "Audit", desc: "Mappato l'intero funnel in 5 giorni." },
            { number: "02", title: "Setup", desc: "3 audience custom, 2 lookalike, 1 retargeting." },
            { number: "03", title: "Test", desc: "8 creatività testate, 2 vincenti scalate." },
            { number: "04", title: "Scaling", desc: "Budget x4 sui winner, ROAS sopra 3x." },
          ],
        },
      },
      {
        template: "statsPack",
        overrides: {
          eyebrow: "I RISULTATI",
          title: "I numeri parlano da soli.",
          stats: [
            { value: "+733", unit: "%", label: "Fatturato", trend: "up" },
            { value: "3.4", unit: "x", label: "ROAS medio", trend: "up" },
            { value: "1.2", unit: "%", label: "Tasso conversione", trend: "up" },
            { value: "0", label: "Mesi per breakeven", trend: "flat" },
          ],
          source: "Dati interni cliente, 2025",
        },
      },
      {
        template: "testimonial",
        overrides: {
          quote: "Mi hanno fatto crescere più in 6 mesi che nei 2 anni precedenti.",
          author: "Giulia Bianchi",
          role: "Founder TechShop",
          rating: 5,
        },
      },
      {
        template: "checklist",
        overrides: {
          eyebrow: "COSA SERVE PER REPLICARLO",
          title: "Checklist per applicare lo stesso metodo.",
          items: [
            { done: true, title: "Avere un prodotto validato sul mercato" },
            { done: true, title: "Almeno 3K€/mese di budget pubblicitario" },
            { done: true, title: "Capacità di gestire +50 ordini/giorno" },
            { done: true, title: "Disponibilità a iterare velocemente" },
          ],
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "VUOI RISULTATI SIMILI?",
          headline: "Parliamo del tuo caso.",
          subtitle: "Analisi gratuita del tuo funnel attuale.",
          buttonLabel: "PRENOTA UNA CALL →",
        },
      },
    ],
  },
  {
    id: "engagement-poll",
    name: "Sondaggio + opinione",
    icon: "📊",
    description: "5 slide minimaliste per generare engagement: pone domanda, mostra dati, prende posizione.",
    slides: [
      {
        template: "hook",
        overrides: {
          eyebrow: "DOMANDA",
          hook: "Pavimento parquet o gres?",
          subhook: "C'è un vincitore chiaro nei sondaggi del 2025.",
        },
      },
      {
        template: "poll",
        overrides: {
          eyebrow: "IL SONDAGGIO",
          question: "Tu cosa sceglieresti per casa?",
          options: [
            { label: "Parquet (caldo, naturale)", percentage: 64, leading: true },
            { label: "Gres porcellanato (resistente)", percentage: 36 },
          ],
          totalVotes: "2.840 voti",
          source: "Sondaggio Instagram, gen 2026",
        },
      },
      {
        template: "compare",
        overrides: {
          eyebrow: "I FATTI",
          title: "Pro e contro reali (no opinioni).",
          before: {
            title: "PARQUET",
            items: ["Caldo al tatto", "Estetica unica", "Si rovina con acqua", "150-300€/mq"],
          },
          after: {
            title: "GRES",
            items: ["Indistruttibile", "Effetti realistici disponibili", "Freddo al tatto", "30-100€/mq"],
          },
        },
      },
      {
        template: "center",
        overrides: {
          eyebrow: "LA NOSTRA POSIZIONE",
          title: "Non esiste 'meglio'.\nEsiste meglio per te.",
          sub: "Dipende da clima, budget, uso e gusto personale.",
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "DUBBI?",
          headline: "Scrivici la tua situazione.",
          subtitle: "Ti aiutiamo a scegliere senza sbagliare.",
          buttonLabel: "CHIEDI ORA →",
        },
      },
    ],
  },
  {
    id: "service-pricing",
    name: "Listino servizi",
    icon: "💰",
    description: "6 slide per presentare un'offerta a piani (Base/Pro/Premium) con benefici e CTA.",
    slides: [
      {
        template: "cover",
        overrides: {
          eyebrow: "I NOSTRI SERVIZI",
          title: "Soluzioni su misura\nper ogni esigenza.",
          sub: "3 piani per partire, crescere e dominare.",
        },
      },
      {
        template: "problemSolution",
        overrides: {
          eyebrow: "PERCHÉ NOI",
          problem: { label: "PROBLEMA COMUNE", text: "Servizi standardizzati che non parlano alla tua realtà." },
          solution: { label: "LA NOSTRA RISPOSTA", text: "3 livelli costruiti per business in 3 fasi diverse." },
        },
      },
      {
        template: "pricingTable",
        overrides: {
          eyebrow: "PIANI E PREZZI",
          title: "Trova il tuo livello.",
          plans: [
            {
              name: "Base",
              price: "490€",
              priceCaption: "/mese",
              features: ["Setup iniziale", "1 canale", "Report mensile", "Supporto via email"],
              ctaLabel: "Inizia",
            },
            {
              name: "Pro",
              price: "1.290€",
              priceCaption: "/mese",
              badge: "POPOLARE",
              highlighted: true,
              features: [
                "Tutto del piano Base",
                "Fino a 3 canali",
                "Report settimanali",
                "Call mensile dedicata",
              ],
              ctaLabel: "Prova 14 giorni",
            },
            {
              name: "Premium",
              price: "2.990€",
              priceCaption: "/mese",
              features: [
                "Tutto del piano Pro",
                "Canali illimitati",
                "Report on-demand",
                "Account manager dedicato",
              ],
              ctaLabel: "Contattaci",
            },
          ],
          source: "IVA esclusa. Min 3 mesi.",
        },
      },
      {
        template: "checklist",
        overrides: {
          eyebrow: "COSA INCLUDE OGNI PIANO",
          title: "Tutti i piani garantiscono:",
          items: [
            { done: true, title: "Onboarding strutturato in 7 giorni" },
            { done: true, title: "Dashboard analitica accessibile 24/7" },
            { done: true, title: "Garanzia soddisfatti o rimborsati 30 giorni" },
            { done: true, title: "Disdetta in qualsiasi momento" },
          ],
        },
      },
      {
        template: "guarantee",
        overrides: {
          badge: "GARANZIA 30 GG",
          headline: "Soddisfatti o rimborsati.",
          body: "Se entro 30 giorni non vedi risultati misurabili, ti restituiamo l'intero importo. Senza domande.",
          terms: "Si applica al primo mese di servizio.",
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "SCEGLI IL TUO PIANO",
          headline: "Pronto a iniziare?",
          subtitle: "Audit gratuito di 30 minuti per scegliere insieme.",
          buttonLabel: "PRENOTA AUDIT GRATUITO →",
        },
      },
    ],
  },
  {
    id: "founder-story",
    name: "Chi siamo / Founder",
    icon: "👤",
    description: "6 slide per presentare il founder o team con storia, valori e prove.",
    slides: [
      {
        template: "hook",
        overrides: {
          eyebrow: "PIACERE, NOI SIAMO",
          hook: "Costruiamo ciò che vorremmo usare.",
          subhook: "Da 10 anni nel settore. Mai un cliente scontento.",
        },
      },
      {
        template: "teamMember",
        overrides: {
          eyebrow: "IL FOUNDER",
          name: "Florin Andriciuc",
          role: "CEO & Founder",
          bio: "10 anni nell'edilizia digitale. Ha portato 200+ studi tecnici online. Crede che l'AI debba essere uno strumento, non un sostituto.",
          highlights: ["10+ anni", "200+ progetti", "Top voice AI 2025"],
          handle: "@floandriciuc",
        },
      },
      {
        template: "myth",
        overrides: {
          eyebrow: "PERCHÉ ESISTIAMO",
          title: "Sfatiamo un mito.",
          myth: { label: "DICONO CHE", text: "L'edilizia non può essere digitale." },
          reality: { label: "LA REALTÀ", text: "Gli studi che digitalizzano triplicano i contatti in 12 mesi." },
        },
      },
      {
        template: "framework",
        overrides: {
          eyebrow: "IL NOSTRO METODO",
          title: "Il framework AEDIX.",
          acronym: "AEDIX",
          letters: [
            { letter: "A", name: "Analisi", desc: "Studio del posizionamento attuale e gap competitivi." },
            { letter: "E", name: "Esecuzione", desc: "Setup tecnico e creazione asset in 30 giorni." },
            { letter: "D", name: "Distribuzione", desc: "Multicanale: social, SEO, paid." },
            { letter: "I", name: "Iterazione", desc: "Cicli di test settimanali sui dati reali." },
            { letter: "X", name: "X-factor", desc: "L'identità unica che ti distingue dai competitor." },
          ],
        },
      },
      {
        template: "socialProof",
        overrides: {
          eyebrow: "CHI CI HA SCELTO",
          clientName: "200+ studi tecnici",
          tagline: "che hanno raddoppiato i contatti in 12 mesi.",
          summary: "La nostra rete include studi di architettura, ingegneria e geometri da Nord a Sud Italia.",
          metrics: [
            { value: "+200", unit: "%", label: "Lead medi" },
            { value: "12", label: "Mesi al ROI" },
            { value: "94", unit: "%", label: "Retention clienti" },
          ],
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "PARLIAMONE",
          headline: "Vuoi essere il prossimo?",
          subtitle: "Audit gratuito di 30 minuti, senza impegno.",
          buttonLabel: "RICHIEDI AUDIT →",
        },
      },
    ],
  },
  {
    id: "tutorial-howto",
    name: "Tutorial 'Come fare X'",
    icon: "🎓",
    description: "6 slide didattiche con step visivi e checklist finale per insegnare un processo.",
    slides: [
      {
        template: "cover",
        overrides: {
          eyebrow: "GUIDA RAPIDA",
          title: "Come scegliere il pavimento giusto in 4 step.",
          sub: "Senza pentirsene tra 5 anni.",
        },
      },
      {
        template: "hook",
        overrides: {
          eyebrow: "IL PROBLEMA",
          hook: "Il 70% sceglie il pavimento sbagliato.",
          subhook: "E lo capisce solo dopo averlo posato.",
        },
      },
      {
        template: "stepsGallery",
        overrides: {
          eyebrow: "IL METODO",
          title: "I 4 passi da fare prima di acquistare.",
          steps: [
            { number: "01", title: "Definisci il traffico", desc: "Quante persone passano in quella stanza ogni giorno?" },
            { number: "02", title: "Considera il clima", desc: "Pavimento freddo o caldo al tatto è un fattore reale." },
            { number: "03", title: "Calcola il budget reale", desc: "Includendo posa, battiscopa, smaltimento del vecchio." },
            { number: "04", title: "Visita uno showroom", desc: "Le foto online ingannano. Tocca e cammina." },
          ],
        },
      },
      {
        template: "mistakes",
        overrides: {
          eyebrow: "ATTENZIONE",
          title: "I 3 errori da evitare.",
          mistakes: [
            { title: "Scegliere solo dalle foto", why: "Il 60% dei reclami è per 'colore diverso dal vivo'." },
            { title: "Risparmiare sulla posa", why: "Un buon pavimento mal posato dura 3 anni invece di 30." },
            { title: "Saltare il sopralluogo", why: "L'umidità e i livelli del pavimento esistente cambiano tutto." },
          ],
        },
      },
      {
        template: "checklist",
        overrides: {
          eyebrow: "PRIMA DI ACQUISTARE",
          title: "Stampa questa checklist.",
          items: [
            { done: false, title: "Misurato la stanza in 3 punti diversi" },
            { done: false, title: "Calcolato il budget completo (non solo il materiale)" },
            { done: false, title: "Verificato umidità e planarità del fondo" },
            { done: false, title: "Visto il campione fisico, non solo online" },
            { done: false, title: "Confrontato 3 preventivi di posa" },
          ],
        },
      },
      {
        template: "cta",
        overrides: {
          eyebrow: "DUBBI SPECIFICI?",
          headline: "Mandaci la foto della tua stanza.",
          subtitle: "Ti diciamo entro 24h cosa scegliere e perché.",
          buttonLabel: "INVIA FOTO →",
        },
      },
    ],
  },
];

export function getCarouselPreset(id: string): CarouselPreset | undefined {
  return BUILT_IN_CAROUSEL_PRESETS.find((p) => p.id === id);
}

/** Build slide data by merging defaults with preset overrides (deep one-level for nested objects). */
export function buildPresetSlideData(
  template: TemplateId,
  overrides?: Record<string, unknown>,
): AnyTemplateData {
  const base = makeDefaultData(template) as unknown as Record<string, unknown>;
  if (!overrides) return base as unknown as AnyTemplateData;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      base[k] &&
      typeof base[k] === "object" &&
      !Array.isArray(base[k])
    ) {
      out[k] = { ...(base[k] as object), ...(v as object) };
    } else {
      out[k] = v;
    }
  }
  return out as unknown as AnyTemplateData;
}
