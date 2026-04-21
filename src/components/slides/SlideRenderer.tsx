import "./slide-styles.css";
import {
  type Slide,
  type BrandSettings,
  type SplitData,
  type Grid2x2Data,
  type BigNumData,
  type CenterData,
  type TimelineData,
  type CompareData,
  type VocabData,
  type QAData,
  type ChecklistData,
  type StatData,
  type CoverData,
  type GalleryData,
  type ImageQuoteData,
  type ChartBarData,
  type ChartDonutData,
  type ChartLineData,
  type FeatureData,
  type TestimonialData,
  type MythData,
  type ProcessData,
  type ProsConsData,
  type QuoteBigData,
  type RoadmapData,
  type CtaData,
  type HookData,
  type ProblemSolutionData,
  type MistakesData,
  type FrameworkData,
  type SocialProofData,
  type OfferData,
  type ObjectionData,
  type TipPackData,
  type UrgencyData,
  type BonusStackData,
  type GuaranteeData,
  type FaqData,
  type QuickWinData,
  renderHighlighted,
  textStyleToCss,
  FORMAT_DIMENSIONS,
} from "@/lib/templates";
import { getSlideData } from "@/lib/i18n";
import { validateSlide } from "@/lib/validation";

/** Helper: returns inline style object for a given field path on a slide (or undefined). */
function fieldStyle(slide: Slide, path: string): React.CSSProperties | undefined {
  return textStyleToCss(slide.textOverrides?.[path]);
}

interface SlideRendererProps {
  slide: Slide;
  brand: BrandSettings;
  index: number;
  total: number;
  /** Optional language override; defaults to brand.defaultLanguage. */
  lang?: string;
  /** When true, overlays a clickable badge with the count of validation errors. */
  showValidation?: boolean;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function HL({ text }: { text: string }) {
  return (
    <>
      {renderHighlighted(text).map((p, i) =>
        p.type === "hl" ? <span key={i} className="hl">{p.v}</span> : <span key={i}>{p.v}</span>,
      )}
    </>
  );
}

function buildClassName(slide: Slide, brand: BrandSettings): string {
  const fx = brand.effects;
  const fmt = slide.format ?? "portrait";
  const parts = ["slide-frame", `tpl-${slide.template}`, `fmt-${fmt}`];
  if (fx.bgPattern && fx.bgPattern !== "none") {
    const bgKey = fx.bgPattern === "gradient-mesh" ? "mesh" : fx.bgPattern;
    parts.push(`fx-pattern-${bgKey}`);
  }
  if (fx.accentGlow) parts.push("fx-accent-glow");
  if (fx.textGradient) parts.push("fx-text-gradient");
  if (fx.borderStyle && fx.borderStyle !== "none") parts.push(`fx-border-${fx.borderStyle}`);
  if (fx.shadow && fx.shadow !== "none") parts.push(`fx-shadow-${fx.shadow}`);
  if (fx.cornerStyle) parts.push(`fx-corner-${fx.cornerStyle}`);
  if (fx.titleEffect && fx.titleEffect !== "none") parts.push(`fx-title-${fx.titleEffect}`);
  if (fx.dividerStyle && fx.dividerStyle !== "line") parts.push(`fx-divider-${fx.dividerStyle}`);
  if (fx.iconAccent) parts.push("fx-icon-accent");
  parts.push(`mkt-badge-${fx.marketingBadgeStyle ?? "filled"}`);
  parts.push(`mkt-grad-${fx.marketingGradientIntensity ?? "subtle"}`);
  parts.push(`mkt-ico-${fx.marketingIconSet ?? "emoji"}`);
  return parts.join(" ");
}

export function SlideRenderer({ slide, brand, index, total, lang, showValidation }: SlideRendererProps) {
  const counter = `${pad2(index + 1)} / ${pad2(total)}`;
  const data = getSlideData(slide, lang ?? brand.defaultLanguage, brand.defaultLanguage);
  const fmt = slide.format ?? "portrait";
  const dim = FORMAT_DIMENSIONS[fmt];
  const validation = showValidation
    ? validateSlide(slide, lang ?? brand.defaultLanguage, brand.defaultLanguage)
    : null;
  const errors = validation?.errors.filter((e) => (e.severity ?? "error") === "error") ?? [];

  const radius =
    brand.effects.cornerStyle === "sharp" ? "0px"
    : brand.effects.cornerStyle === "pill" ? "24px"
    : "10px";

  const styleVars: React.CSSProperties = {
    ["--cyan" as string]: brand.accent,
    ["--cyan-2" as string]: brand.accentSecondary,
    ["--text" as string]: brand.textColor,
    ["--bg" as string]: brand.bgColor,
    ["--font-heading" as string]: `'${brand.fontHeading}', system-ui, sans-serif`,
    ["--font-body" as string]: `'${brand.fontBody}', system-ui, sans-serif`,
    ["--w-h" as string]: String(brand.headingWeight),
    ["--w-b" as string]: String(brand.bodyWeight),
    ["--radius" as string]: radius,
    ["--slide-w" as string]: `${dim.w}px`,
    ["--slide-h" as string]: `${dim.h}px`,
  };

  return (
    <div className={buildClassName(slide, brand)} style={styleVars}>
      <div className="fx-bg" />
      <div className="slide-inner">
        <header className="head-row">
          <span className="brand">
            {brand.logoDataUrl && <img src={brand.logoDataUrl} alt="" className="brand-logo" />}
            {brand.brand}
          </span>
          <span className="count">{counter}</span>
        </header>

        <div className="body">{renderBody(slide, data, brand)}</div>

        <footer className="foot-row">
          <span className="handle-inline">{brand.handle}</span>
          <span>{brand.footerCta}</span>
        </footer>
      </div>
      {brand.effects.grain && <div className="fx-grain" />}
      {showValidation && errors.length > 0 && (
        <button
          type="button"
          className="validation-badge"
          title={errors.map((e) => `• ${e.message}`).join("\n")}
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(
              new CustomEvent("slide:focus-field", {
                detail: { slideId: slide.id, field: errors[0].field },
              }),
            );
          }}
        >
          {errors.length} {errors.length === 1 ? "campo mancante" : "campi mancanti"}
        </button>
      )}
    </div>
  );
}

function renderBody(slide: Slide, data: unknown, brand: BrandSettings) {
  switch (slide.template) {
    case "split":       return <Split slide={slide} d={data as SplitData} />;
    case "grid2x2":     return <Grid slide={slide} d={data as Grid2x2Data} />;
    case "bignum":      return <BigNum slide={slide} d={data as BigNumData} />;
    case "center":      return <Center slide={slide} d={data as CenterData} />;
    case "timeline":    return <Timeline slide={slide} d={data as TimelineData} />;
    case "compare":     return <Compare slide={slide} d={data as CompareData} />;
    case "vocab":       return <Vocab slide={slide} d={data as VocabData} />;
    case "qa":          return <QA slide={slide} d={data as QAData} />;
    case "checklist":   return <Checklist slide={slide} d={data as ChecklistData} />;
    case "stat":        return <Stat slide={slide} d={data as StatData} />;
    case "cover":       return <Cover slide={slide} d={data as CoverData} />;
    case "gallery":     return <Gallery slide={slide} d={data as GalleryData} />;
    case "imageQuote":  return <ImageQuote slide={slide} d={data as ImageQuoteData} />;
    case "chartBar":    return <ChartBar slide={slide} d={data as ChartBarData} brand={brand} />;
    case "chartDonut":  return <ChartDonut slide={slide} d={data as ChartDonutData} brand={brand} />;
    case "chartLine":   return <ChartLine slide={slide} d={data as ChartLineData} brand={brand} />;
    case "feature":     return <Feature slide={slide} d={data as FeatureData} />;
    case "testimonial": return <Testimonial slide={slide} d={data as TestimonialData} />;
    case "myth":        return <Myth slide={slide} d={data as MythData} />;
    case "process":     return <Process slide={slide} d={data as ProcessData} />;
    case "prosCons":    return <ProsCons slide={slide} d={data as ProsConsData} />;
    case "quoteBig":    return <QuoteBig slide={slide} d={data as QuoteBigData} />;
    case "roadmap":     return <Roadmap slide={slide} d={data as RoadmapData} />;
    case "cta":         return <Cta slide={slide} d={data as CtaData} />;
    case "hook":        return <Hook slide={slide} d={data as HookData} />;
    case "problemSolution": return <ProblemSolution slide={slide} d={data as ProblemSolutionData} />;
    case "mistakes":    return <Mistakes slide={slide} d={data as MistakesData} />;
    case "framework":   return <Framework slide={slide} d={data as FrameworkData} />;
    case "socialProof": return <SocialProof slide={slide} d={data as SocialProofData} />;
    case "offer":       return <Offer slide={slide} d={data as OfferData} />;
    case "objection":   return <Objection slide={slide} d={data as ObjectionData} />;
    case "tipPack":     return <TipPack slide={slide} d={data as TipPackData} />;
    case "urgency":     return <Urgency slide={slide} d={data as UrgencyData} />;
    case "bonusStack":  return <BonusStack slide={slide} d={data as BonusStackData} />;
    case "guarantee":   return <Guarantee slide={slide} d={data as GuaranteeData} />;
    case "faq":         return <Faq slide={slide} d={data as FaqData} />;
    case "quickWin":    return <QuickWin slide={slide} d={data as QuickWinData} />;
  }
}

function Split({ slide, d }: { slide: Slide; d: SplitData }) {
  return (
    <>
      <div className="col-left">
        {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
        <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
        <div className="underline" />
      </div>
      <div className="col-right">
        {d.imageUrl ? (
          <img src={d.imageUrl} alt="" className="right-image" />
        ) : (
          <>
            {d.paragraphs?.map((p, i) => (
              <p key={i} className="right-para" style={fieldStyle(slide, `paragraphs.${i}`)}>{p}</p>
            ))}
            {d.list && d.list.length > 0 && (
              <ul className="right-list">
                {d.list.map((it, i) => (
                  <li key={i} style={fieldStyle(slide, `list.${i}.text`)}>
                    <b>{it.marker}</b>{it.text}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Grid({ slide, d }: { slide: Slide; d: Grid2x2Data }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="grid-2x2">
        {d.cells.slice(0, 4).map((c, i) => (
          <div key={i} className="grid-cell">
            <div className="num">{c.num}</div>
            <h3 style={fieldStyle(slide, `cells.${i}.title`)}>{c.title}</h3>
            <p style={fieldStyle(slide, `cells.${i}.text`)}>{c.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function BigNum({ slide, d }: { slide: Slide; d: BigNumData }) {
  return (
    <>
      <div className="big-num" style={fieldStyle(slide, "number")}>
        {d.number}
        {d.numberSub && <span className="sub" style={fieldStyle(slide, "numberSub")}>{d.numberSub}</span>}
      </div>
      <div className="right-content">
        <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
        {d.paragraphs.map((p, i) => (
          <p key={i} style={fieldStyle(slide, `paragraphs.${i}`)}>{p}</p>
        ))}
      </div>
    </>
  );
}

function Center({ slide, d }: { slide: Slide; d: CenterData }) {
  return (
    <>
      {d.imageUrl && (
        <div className="center-bg">
          <img src={d.imageUrl} alt="" />
          <div className="veil" />
        </div>
      )}
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="deco" />
      {d.sub && <div className="sub" style={fieldStyle(slide, "sub")}>{d.sub}</div>}
    </>
  );
}

function Timeline({ slide, d }: { slide: Slide; d: TimelineData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="timeline">
        {d.items.map((it, i) => (
          <div key={i} className="tl-item">
            {it.when && <span className="when">{it.when}</span>}
            <h3 style={fieldStyle(slide, `items.${i}.title`)}>{it.title}</h3>
            <p>{it.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function Compare({ slide, d }: { slide: Slide; d: CompareData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="compare">
        <div className="col">
          <div className="tag">{d.before.tag}</div>
          <h3 style={fieldStyle(slide, "before.title")}>{d.before.title}</h3>
          <ul>{d.before.items.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
        <div className="col after">
          <div className="tag">{d.after.tag}</div>
          <h3 style={fieldStyle(slide, "after.title")}>{d.after.title}</h3>
          <ul>{d.after.items.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      </div>
    </>
  );
}

function Vocab({ slide, d }: { slide: Slide; d: VocabData }) {
  return (
    <>
      <div className="cat" style={fieldStyle(slide, "category")}>{d.category}</div>
      <p className="word" style={fieldStyle(slide, "word")}>{d.word}</p>
      <div className="pron">{d.pron}</div>
      <div className="hr" />
      <div className="def-label">{d.defLabel}</div>
      <p className="def" style={fieldStyle(slide, "def")}>{d.def}</p>
      <p className="ex" style={fieldStyle(slide, "example")}>{d.example}</p>
    </>
  );
}

function QA({ slide, d }: { slide: Slide; d: QAData }) {
  return (
    <>
      <div className="q-block">
        <div className="q-label">{d.qLabel}</div>
        <div className="q-text" style={fieldStyle(slide, "question")}>{d.question}</div>
      </div>
      <div className="a-block">
        <div className="a-label">{d.aLabel}</div>
        <div className="a-text">
          {d.answer.map((p, i) => <p key={i} style={fieldStyle(slide, `answer.${i}`)}>{p}</p>)}
        </div>
      </div>
    </>
  );
}

function Checklist({ slide, d }: { slide: Slide; d: ChecklistData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      {d.meta && <div className="list-meta">{d.meta}</div>}
      <ul className="checklist">
        {d.items.map((it, i) => (
          <li key={i}>
            <div className={`check ${it.done ? "on" : ""}`}>{it.done ? "✓" : ""}</div>
            <div>
              <div className={`item-title ${it.done ? "done" : ""}`} style={fieldStyle(slide, `items.${i}.title`)}>{it.title}</div>
              {it.note && <div className="item-note">{it.note}</div>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Stat({ slide, d }: { slide: Slide; d: StatData }) {
  return (
    <>
      {d.label && <div className="stat-label" style={fieldStyle(slide, "label")}>{d.label}</div>}
      <div className="stat" style={fieldStyle(slide, "value")}>
        {d.value}
        {d.unit && <span className="u">{d.unit}</span>}
      </div>
      {d.sub && <p className="stat-sub" style={fieldStyle(slide, "sub")}>{d.sub}</p>}
      {d.note && <div className="stat-note">{d.note}</div>}
    </>
  );
}

function Cover({ slide, d }: { slide: Slide; d: CoverData }) {
  return (
    <>
      <div className={`cover-bg ${d.imageUrl ? "" : "empty"}`}>
        {d.imageUrl && <img src={d.imageUrl} alt="" />}
        {d.imageUrl && <div className="veil" />}
      </div>
      <div className="cover-content">
        {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
        <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
        {d.sub && <div className="sub" style={fieldStyle(slide, "sub")}>{d.sub}</div>}
      </div>
    </>
  );
}

/* ===================== NEW MEDIA / CHART TEMPLATES ===================== */

function Gallery({ slide, d }: { slide: Slide; d: GalleryData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="gallery-grid">
        {d.images.slice(0, 3).map((img, i) => (
          <figure key={i} className="gallery-item">
            <div className="gallery-img">
              {img.url ? <img src={img.url} alt={img.caption ?? ""} /> : <div className="gallery-placeholder">Foto {i + 1}</div>}
            </div>
            {img.caption && (
              <figcaption style={fieldStyle(slide, `images.${i}.caption`)}>{img.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </>
  );
}

function ImageQuote({ slide, d }: { slide: Slide; d: ImageQuoteData }) {
  return (
    <>
      <div className={`iq-bg ${d.imageUrl ? "" : "empty"}`}>
        {d.imageUrl && <img src={d.imageUrl} alt="" />}
        <div className="veil" />
      </div>
      <div className="iq-content">
        <div className="iq-mark">“</div>
        <blockquote className="iq-quote" style={fieldStyle(slide, "quote")}>{d.quote}</blockquote>
        <div className="iq-author" style={fieldStyle(slide, "author")}>
          — {d.author}
          {d.role && <span className="iq-role" style={fieldStyle(slide, "role")}> · {d.role}</span>}
        </div>
      </div>
    </>
  );
}

function ChartBar({ slide, d, brand }: { slide: Slide; d: ChartBarData; brand: BrandSettings }) {
  const max = Math.max(1, ...d.items.map((i) => i.value));
  const colors = [brand.accent, brand.accentSecondary];
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="chart-bar-list">
        {d.items.map((it, i) => {
          const pct = (it.value / max) * 100;
          const color = it.color ?? colors[i % colors.length];
          return (
            <div key={i} className="chart-bar-row">
              <div className="chart-bar-label" style={fieldStyle(slide, `items.${i}.label`)}>{it.label}</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <div className="chart-bar-value">{it.value}{d.unit ?? ""}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ChartDonut({ slide, d, brand }: { slide: Slide; d: ChartDonutData; brand: BrandSettings }) {
  const total = d.segments.reduce((s, x) => s + x.value, 0) || 1;
  const colors = [brand.accent, brand.accentSecondary, "#888", "#444"];
  const r = 70;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="chart-donut-wrap">
        <svg className="chart-donut-svg" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="28" />
          {d.segments.map((seg, i) => {
            const frac = seg.value / total;
            const dash = frac * c;
            const offset = -acc;
            acc += dash;
            const color = seg.color ?? colors[i % colors.length];
            return (
              <circle
                key={i}
                cx="100" cy="100" r={r} fill="none"
                stroke={color} strokeWidth="28"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={offset}
                transform="rotate(-90 100 100)"
              />
            );
          })}
          {d.centerLabel && (
            <text x="100" y="108" textAnchor="middle" fontSize="28" fontWeight="800" fill="currentColor">
              {d.centerLabel}
            </text>
          )}
        </svg>
        <ul className="chart-donut-legend">
          {d.segments.map((seg, i) => {
            const color = seg.color ?? colors[i % colors.length];
            const pct = Math.round((seg.value / total) * 100);
            return (
              <li key={i}>
                <span className="legend-dot" style={{ background: color }} />
                <span className="legend-label" style={fieldStyle(slide, `segments.${i}.label`)}>{seg.label}</span>
                <span className="legend-value">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

function ChartLine({ slide, d, brand }: { slide: Slide; d: ChartLineData; brand: BrandSettings }) {
  const w = 800, h = 320, pad = 40;
  const max = Math.max(1, ...d.values);
  const min = Math.min(0, ...d.values);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(1, d.values.length - 1);
  const points = d.values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return { x, y, v };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="chart-line-wrap">
        <svg className="chart-line-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`lg-${slide.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={brand.accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={brand.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={pad} x2={w - pad} y1={pad + (h - pad * 2) * g} y2={pad + (h - pad * 2) * g}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}
          <path d={`${path} L ${points[points.length - 1].x} ${h - pad} L ${pad} ${h - pad} Z`} fill={`url(#lg-${slide.id})`} />
          <path d={path} fill="none" stroke={brand.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="5" fill={brand.accent} stroke={brand.bgColor} strokeWidth="2" />
          ))}
          {d.xLabels.map((lb, i) => (
            <text key={i} x={pad + i * stepX} y={h - 10} textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.6)">
              {lb}
            </text>
          ))}
        </svg>
      </div>
    </>
  );
}

function Feature({ slide, d }: { slide: Slide; d: FeatureData }) {
  return (
    <>
      <div className="feat-left">
        {d.imageUrl ? (
          <img src={d.imageUrl} alt="" className="feat-image" />
        ) : (
          <div className="feat-image feat-image-empty">Immagine</div>
        )}
      </div>
      <div className="feat-right">
        {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
        <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
        <ul className="feat-bullets">
          {d.bullets.map((b, i) => (
            <li key={i}>
              <span className="feat-marker">{b.marker}</span>
              <div>
                <div className="feat-bullet-title" style={fieldStyle(slide, `bullets.${i}.title`)}>{b.title}</div>
                {b.text && <div className="feat-bullet-text">{b.text}</div>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Testimonial({ slide, d }: { slide: Slide; d: TestimonialData }) {
  return (
    <>
      <div className="testi-avatar">
        {d.avatarUrl ? <img src={d.avatarUrl} alt={d.author} /> : <div className="testi-avatar-empty">{d.author?.[0] ?? "?"}</div>}
      </div>
      {d.rating != null && (
        <div className="testi-rating">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < (d.rating ?? 0) ? "star on" : "star"}>★</span>
          ))}
        </div>
      )}
      <blockquote className="testi-quote" style={fieldStyle(slide, "quote")}>“{d.quote}”</blockquote>
      <div className="testi-author" style={fieldStyle(slide, "author")}>
        {d.author}
        {d.role && <span className="testi-role" style={fieldStyle(slide, "role")}> — {d.role}</span>}
      </div>
    </>
  );
}

/* ===================== NEW TEMPLATES ===================== */

function Myth({ slide, d }: { slide: Slide; d: MythData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="myth-grid">
        <div className="myth-card myth-false">
          <div className="myth-icon">✕</div>
          <div className="myth-label">{d.myth.label}</div>
          <p className="myth-text" style={fieldStyle(slide, "myth.text")}>{d.myth.text}</p>
        </div>
        <div className="myth-card myth-true">
          <div className="myth-icon">✓</div>
          <div className="myth-label">{d.reality.label}</div>
          <p className="myth-text" style={fieldStyle(slide, "reality.text")}>{d.reality.text}</p>
        </div>
      </div>
      {d.source && <div className="myth-source">{d.source}</div>}
    </>
  );
}

function Process({ slide, d }: { slide: Slide; d: ProcessData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <ol className="process-list">
        {d.steps.map((s, i) => (
          <li key={i} className="process-step">
            <div className="process-num">{s.number ?? pad2(i + 1)}</div>
            <div className="process-body">
              <h3 style={fieldStyle(slide, `steps.${i}.title`)}>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function ProsCons({ slide, d }: { slide: Slide; d: ProsConsData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="proscons-grid">
        <div className="proscons-col proscons-pros">
          <div className="proscons-head">{d.prosLabel ?? "PRO"}</div>
          <ul>
            {d.pros.map((p, i) => (
              <li key={i}>
                <span className="proscons-mark">✓</span>
                <span style={fieldStyle(slide, `pros.${i}`)}>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="proscons-col proscons-cons">
          <div className="proscons-head">{d.consLabel ?? "CONTRO"}</div>
          <ul>
            {d.cons.map((c, i) => (
              <li key={i}>
                <span className="proscons-mark">✕</span>
                <span style={fieldStyle(slide, `cons.${i}`)}>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function QuoteBig({ slide, d }: { slide: Slide; d: QuoteBigData }) {
  return (
    <>
      <div className="qb-mark" aria-hidden>"</div>
      <blockquote className="qb-quote" style={fieldStyle(slide, "quote")}>{d.quote}</blockquote>
      <div className="qb-foot">
        {d.avatarUrl && (
          <div className="qb-avatar"><img src={d.avatarUrl} alt={d.author} /></div>
        )}
        <div className="qb-meta">
          <div className="qb-author" style={fieldStyle(slide, "author")}>— {d.author}</div>
          {d.role && <div className="qb-role" style={fieldStyle(slide, "role")}>{d.role}</div>}
        </div>
      </div>
    </>
  );
}

function Roadmap({ slide, d }: { slide: Slide; d: RoadmapData }) {
  const symbol = (s: string) => (s === "done" ? "✓" : s === "progress" ? "●" : "○");
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="roadmap-track">
        {d.milestones.map((m, i) => (
          <div key={i} className={`roadmap-item rm-${m.status}`}>
            <div className="rm-dot">{symbol(m.status)}</div>
            <div className="rm-period">{m.period}</div>
            <h3 style={fieldStyle(slide, `milestones.${i}.title`)}>{m.title}</h3>
            <p>{m.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function Cta({ slide, d }: { slide: Slide; d: CtaData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 className="cta-headline" style={fieldStyle(slide, "headline")}><HL text={d.headline} /></h1>
      {d.subtitle && <p className="cta-sub" style={fieldStyle(slide, "subtitle")}>{d.subtitle}</p>}
      <div className="cta-button" style={fieldStyle(slide, "buttonLabel")}>{d.buttonLabel}</div>
      {d.handle && <div className="cta-handle">{d.handle}</div>}
    </>
  );
}

/* ===================== MARKETING TEMPLATES ===================== */

function Hook({ slide, d }: { slide: Slide; d: HookData }) {
  return (
    <>
      {d.eyebrow && <div className="hook-eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 className="hook-text" style={fieldStyle(slide, "hook")}><HL text={d.hook} /></h1>
      {d.subhook && <p className="hook-sub" style={fieldStyle(slide, "subhook")}>{d.subhook}</p>}
      <div className="hook-swipe">{d.swipeLabel ?? "SCORRI →"}</div>
    </>
  );
}

function ProblemSolution({ slide, d }: { slide: Slide; d: ProblemSolutionData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <div className="ps-stack">
        <div className="ps-card ps-problem">
          <div className="ps-icon">⚠</div>
          <div className="ps-label">{d.problem.label}</div>
          <p className="ps-text" style={fieldStyle(slide, "problem.text")}>{d.problem.text}</p>
        </div>
        <div className="ps-arrow" aria-hidden>↓</div>
        <div className="ps-card ps-solution">
          <div className="ps-icon">✦</div>
          <div className="ps-label">{d.solution.label}</div>
          <p className="ps-text" style={fieldStyle(slide, "solution.text")}>{d.solution.text}</p>
        </div>
      </div>
    </>
  );
}

function Mistakes({ slide, d }: { slide: Slide; d: MistakesData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <ol className="mistakes-list">
        {d.mistakes.map((m, i) => (
          <li key={i} className="mistakes-item">
            <div className="mistakes-num">{pad2(i + 1)}</div>
            <div className="mistakes-body">
              <div className="mistakes-icon">✕</div>
              <h3 style={fieldStyle(slide, `mistakes.${i}.title`)}>{m.title}</h3>
              <p>{m.why}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function Framework({ slide, d }: { slide: Slide; d: FrameworkData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="fw-acronym" style={fieldStyle(slide, "acronym")}>{d.acronym}</div>
      <ul className="fw-list">
        {d.letters.map((l, i) => (
          <li key={i} className="fw-row">
            <div className="fw-letter">{l.letter}</div>
            <div className="fw-body">
              <div className="fw-name" style={fieldStyle(slide, `letters.${i}.name`)}>{l.name}</div>
              <p className="fw-desc">{l.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function SocialProof({ slide, d }: { slide: Slide; d: SocialProofData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <div className="sp-head">
        {d.logoUrl && <img src={d.logoUrl} alt={d.clientName} className="sp-logo" />}
        <div className="sp-client" style={fieldStyle(slide, "clientName")}>{d.clientName}</div>
      </div>
      <h1 className="sp-tagline" style={fieldStyle(slide, "tagline")}><HL text={d.tagline} /></h1>
      <div className="sp-metrics">
        {d.metrics.slice(0, 3).map((m, i) => (
          <div key={i} className="sp-metric">
            <div className="sp-value" style={fieldStyle(slide, `metrics.${i}.value`)}>
              {m.value}{m.unit && <span className="sp-unit">{m.unit}</span>}
            </div>
            <div className="sp-label">{m.label}</div>
          </div>
        ))}
      </div>
      {d.summary && <p className="sp-summary" style={fieldStyle(slide, "summary")}>{d.summary}</p>}
    </>
  );
}

function Offer({ slide, d }: { slide: Slide; d: OfferData }) {
  const cur = d.currency ?? "€";
  return (
    <div className="offer-card">
      {d.badge && <div className="offer-badge">{d.badge}</div>}
      <h2 className="offer-name" style={fieldStyle(slide, "productName")}>{d.productName}</h2>
      <div className="offer-prices">
        {d.priceOld && <span className="offer-old">{cur}{d.priceOld}</span>}
        <span className="offer-new" style={fieldStyle(slide, "priceNew")}>{cur}{d.priceNew}</span>
      </div>
      <ul className="offer-includes">
        {d.includes.map((inc, i) => (
          <li key={i}><span className="offer-check">✓</span>{inc}</li>
        ))}
      </ul>
      <div className="offer-cta" style={fieldStyle(slide, "ctaLabel")}>{d.ctaLabel}</div>
      {d.urgency && <div className="offer-urgency" style={fieldStyle(slide, "urgency")}>{d.urgency}</div>}
    </div>
  );
}

function Objection({ slide, d }: { slide: Slide; d: ObjectionData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <div className="obj-stack">
        <div className="obj-bubble obj-question">
          <span className="obj-tag">CLIENTE</span>
          <p style={fieldStyle(slide, "objection")}>"{d.objection}"</p>
        </div>
        <div className="obj-bubble obj-answer">
          <span className="obj-tag">RISPOSTA</span>
          <p style={fieldStyle(slide, "answer")}>{d.answer}</p>
        </div>
      </div>
      {d.signOff && <div className="obj-signoff" style={fieldStyle(slide, "signOff")}>{d.signOff}</div>}
    </>
  );
}

function TipPack({ slide, d }: { slide: Slide; d: TipPackData }) {
  return (
    <>
      {d.eyebrow && <div className="eyebrow" style={fieldStyle(slide, "eyebrow")}>{d.eyebrow}</div>}
      <h1 style={fieldStyle(slide, "title")}><HL text={d.title} /></h1>
      <div className="tip-grid">
        {d.tips.map((t, i) => (
          <div key={i} className="tip-card">
            <div className="tip-head">
              <span className="tip-num">{pad2(i + 1)}</span>
              {t.icon && <span className="tip-icon">{t.icon}</span>}
            </div>
            <h3 style={fieldStyle(slide, `tips.${i}.title`)}>{t.title}</h3>
            <p>{t.text}</p>
          </div>
        ))}
      </div>
      <div className="tip-save">{d.saveLabel ?? "SALVA QUESTO POST"}</div>
    </>
  );
}
