// Omnichat — Landing Page composition

const { useState: useStateLP, useEffect: useEffectLP } = React;

function pick(field, tone) {
  if (field && typeof field === 'object') return field[tone] || field.friendly;
  return field;
}

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav() {
  const C = window.LP_COPY;
  return (
    <nav className="lp-nav">
      <div className="lp-container lp-nav-inner">
        <a className="lp-nav-logo" href="#">
          <img src="assets/logo-wordmark.svg" alt="Omnichat" />
        </a>
        <div className="lp-nav-links">
          {C.nav.links.map(l => (
            <a key={l} className="lp-nav-link" href={'#' + l.toLowerCase()}>{l}</a>
          ))}
        </div>
        <div className="lp-nav-cta">
          <a className="btn btn-ghost" href="#signin">{C.nav.signIn}</a>
          <a className="btn btn-primary" href="#contact">{C.nav.cta}</a>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero({ tone }) {
  const C = window.LP_COPY.hero;
  const [l1, l2] = pick(C.headline, tone);
  return (
    <header className="lp-hero">
      <div className="lp-container lp-hero-grid">
        <div>
          <span className="lp-eyebrow">
            <span className="dot" />
            {C.eyebrow}
          </span>
          <h1 className="lp-h1">
            {l1}<br/>
            <em>{l2}</em>
          </h1>
          <p className="lp-sub">{pick(C.sub, tone)}</p>
          <div className="lp-hero-cta">
            <a className="btn btn-primary btn-lg" href="#contact">
              {C.primaryCta}
              <Mso name="arrow_forward" size={18} />
            </a>
            <a className="btn btn-outline btn-lg" href="#demo">
              <Mso name="play_arrow" size={18} fill={1} />
              {C.secondaryCta}
            </a>
          </div>
          <div className="lp-hero-meta">
            <span className="lp-hero-meta-item">
              <Mso name="check_circle" size={16} fill={1} /> {C.metaLeft}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1' }} />
            <span className="lp-hero-meta-item">
              <Mso name="check_circle" size={16} fill={1} /> {C.metaRight}
            </span>
          </div>
        </div>

        <div>
          <div style={{
            background: 'white',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 32px 64px -24px rgba(67,56,202,0.28), 0 12px 24px -12px rgba(0,0,0,0.06)',
          }}>
            <InboxMock />
          </div>
        </div>
      </div>

      <div className="lp-container">
        <div className="lp-logos">
          <div className="lp-logos-label">Trusted by support teams at</div>
          <div className="lp-logos-row">
            <FakeLogo name="Northwind" mark="N" />
            <FakeLogo name="Acumen" mark="A" />
            <FakeLogo name="Lumen.io" mark="L" />
            <FakeLogo name="Riverstone" mark="R" />
            <FakeLogo name="Beacon" mark="B" />
            <FakeLogo name="Halcyon" mark="H" />
          </div>
        </div>
      </div>
    </header>
  );
}

function FakeLogo({ name, mark }) {
  return (
    <span className="logo-mark">
      <span className="swatch" style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-secondary)', color: 'white',
        fontSize: 11, fontWeight: 700, opacity: 1,
      }}>{mark}</span>
      <span>{name}</span>
    </span>
  );
}

// ── Features ───────────────────────────────────────────────────────────────
function Features({ tone }) {
  const C = window.LP_COPY.features;
  return (
    <section className="lp-section" id="product">
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-kicker">{C.kicker}</div>
          <h2 className="lp-h2">{pick(C.title, tone)}</h2>
          <p className="lp-lede">{pick(C.lede, tone)}</p>
        </div>
        <div className="lp-features-grid">
          {C.items.map((f, i) => (
            <div key={i} className={`lp-feature tone-${i+1}`}>
              <div className="lp-feature-icon">
                <Mso name={f.icon} size={22} fill={1} />
              </div>
              <h3>{pick(f.title, tone)}</h3>
              <p>{pick(f.body, tone)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Demo ───────────────────────────────────────────────────────────────────
function Demo({ tone }) {
  const C = window.LP_COPY.demo;
  return (
    <section className="lp-section lp-section-alt" id="demo">
      <div className="lp-container">
        <div className="lp-section-head centered">
          <div className="lp-kicker">{C.kicker}</div>
          <h2 className="lp-h2">{pick(C.title, tone)}</h2>
          <p className="lp-lede">{pick(C.lede, tone)}</p>
        </div>
        <div className="lp-demo-wrap">
          <div className="lp-demo-frame">
            <DashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Channels ───────────────────────────────────────────────────────────────
function Channels({ tone }) {
  const C = window.LP_COPY.channels;
  return (
    <section className="lp-section" id="channels">
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-kicker">{C.kicker}</div>
          <h2 className="lp-h2">{pick(C.title, tone)}</h2>
          <p className="lp-lede">{pick(C.lede, tone)}</p>
        </div>
        <div className="lp-channels-grid">
          {C.items.map(c => (
            <div key={c.key} className="lp-channel-card">
              <div className="lp-channel-icon" style={{ background: c.bg, color: c.color }}>
                <Mso name={c.icon} size={20} fill={1} />
              </div>
              <div className="lp-channel-name">{c.name}</div>
              <div className="lp-channel-meta">Native integration</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ───────────────────────────────────────────────────────────
function HowItWorks({ tone }) {
  const C = window.LP_COPY.how;
  const [active, setActive] = useStateLP(0);
  return (
    <section className="lp-section lp-section-alt" id="how">
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-kicker">{C.kicker}</div>
          <h2 className="lp-h2">{pick(C.title, tone)}</h2>
          <p className="lp-lede">{pick(C.lede, tone)}</p>
        </div>
        <div className="lp-steps">
          <div className="lp-step-list">
            {C.steps.map((s, i) => (
              <div key={i} className={'lp-step' + (i === active ? ' active' : '')} onClick={() => setActive(i)}>
                <div className="lp-step-num">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h3>{pick(s.title, tone)}</h3>
                  <p>{pick(s.body, tone)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-step-visual">
            <StepVisual which={active} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────
function FAQ({ tone }) {
  const C = window.LP_COPY.faq;
  const [open, setOpen] = useStateLP(0);
  return (
    <section className="lp-section" id="faq">
      <div className="lp-container">
        <div className="lp-section-head centered">
          <div className="lp-kicker">{C.kicker}</div>
          <h2 className="lp-h2">{pick(C.title, tone)}</h2>
        </div>
        <div className="lp-faq-wrap">
          <div className="lp-faq">
            {C.items.map((it, i) => (
              <div key={i} className={'lp-faq-item' + (open === i ? ' open' : '')}>
                <button className="lp-faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                  <span>{it.q}</span>
                  <Mso name="add" size={22} />
                </button>
                <div className="lp-faq-a">
                  <div>
                    <p>{pick(it.a, tone)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────────────────
function FinalCTA({ tone }) {
  const C = window.LP_COPY.final;
  return (
    <section id="contact">
      <div className="lp-container">
        <div className="lp-final">
          <div className="lp-final-body">
            <h2>{pick(C.title, tone)}</h2>
            <p>{pick(C.body, tone)}</p>
          </div>
          <div className="lp-final-cta">
            <a className="btn btn-on-brand btn-lg" href="#">
              {C.primary}
              <Mso name="arrow_forward" size={18} />
            </a>
            <a className="btn btn-on-brand-ghost btn-lg" href="#">
              {C.secondary}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  const C = window.LP_COPY.footer;
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <img src="assets/logo-wordmark.svg" alt="Omnichat" />
            <p>{C.blurb}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <SocialIcon name="alternate_email" />
              <SocialIcon name="rss_feed" />
              <SocialIcon name="code" />
            </div>
          </div>
          {C.cols.map(col => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.items.map(it => <li key={it}><a href="#">{it}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="lp-footer-bottom">
          <span>{C.bottom}</span>
          <div className="links">
            {C.legal.map(l => <a key={l} href="#">{l}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }) {
  return (
    <a href="#" style={{
      width: 32, height: 32, borderRadius: 8,
      background: 'white', border: '1px solid var(--color-outline-variant)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--color-secondary)',
    }}>
      <Mso name={name} size={16} />
    </a>
  );
}

// ── App root ───────────────────────────────────────────────────────────────
function App() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "tone": "friendly"
  }/*EDITMODE-END*/;
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const tone = t.tone;
  return (
    <div className="lp-page">
      <Nav />
      <Hero tone={tone} />
      <Features tone={tone} />
      <Demo tone={tone} />
      <Channels tone={tone} />
      <HowItWorks tone={tone} />
      <FAQ tone={tone} />
      <FinalCTA tone={tone} />
      <Footer />
      <window.TweaksPanel>
        <window.TweakSection label="Copy tone">
          <window.TweakRadio
            label="Tone"
            value={tone}
            onChange={(v) => setTweak('tone', v)}
            options={[
              { value: 'friendly',  label: 'Friendly' },
              { value: 'direct',    label: 'Direct' },
              { value: 'technical', label: 'Technical' },
            ]}
          />
          <div style={{
            padding: '10px 12px', background: 'rgba(124,77,255,0.06)',
            border: '0.5px solid rgba(124,77,255,0.18)', borderRadius: 8,
            color: 'rgba(41,38,27,0.72)', lineHeight: 1.45, fontSize: 11,
          }}>
            {tone === 'friendly'  && 'Warmer copy, longer sentences. Reads like a teammate.'}
            {tone === 'direct'    && 'Short, benefit-led, no fluff. For busy buyers.'}
            {tone === 'technical' && 'API-aware language for engineering and ops readers.'}
          </div>
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
