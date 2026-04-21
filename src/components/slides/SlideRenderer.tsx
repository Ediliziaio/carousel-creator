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
  renderHighlighted,
  textStyleToCss,
  FORMAT_DIMENSIONS,
} from "@/lib/templates";
import { getSlideData } from "@/lib/i18n";

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
  return parts.join(" ");
}

export function SlideRenderer({ slide, brand, index, total, lang }: SlideRendererProps) {
  const counter = `${pad2(index + 1)} / ${pad2(total)}`;
  const data = getSlideData(slide, lang ?? brand.defaultLanguage, brand.defaultLanguage);
  const fmt = slide.format ?? "portrait";
  const dim = FORMAT_DIMENSIONS[fmt];

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
