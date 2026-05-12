// Omnichat — Product mocks rendered with React for the landing page

const { useState } = React;

// ── shared tokens for compactness ──────────────────────────────────────────
const M = {
  outline: '#E9ECEF',
  outline2: '#F1F3F5',
  bg: '#f8fafc',
  white: '#ffffff',
  surfaceSel: '#eef2ff',
  surfaceHover: '#e8ecf8',
  text: '#1d1a24',
  textVar: '#494455',
  secondary: '#575f67',
  outlineText: '#7a7487',
  primary: '#4338ca',
  primary2: '#4f46e5',
  accent: '#7C4DFF',
  accentFix: '#c7d2fe',
  accentLight: '#e0e7ff',
};

const CHANNEL = {
  WHATSAPP: { name: 'WhatsApp', bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#25D366', icon: 'chat' },
  TELEGRAM: { name: 'Telegram', bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd', dot: '#0088CC', icon: 'send' },
  EMAIL:    { name: 'Email',    bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', dot: '#F97316', icon: 'mail' },
  SMS:      { name: 'SMS',      bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', dot: '#8B5CF6', icon: 'sms' },
};

const TAG = {
  BILLING:  { name: 'Billing',  bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  SUPPORT:  { name: 'Support',  bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  SALES:    { name: 'Sales',    bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  FEEDBACK: { name: 'Feedback', bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
};

function Mso({ name, size = 18, fill = 0, color, style }) {
  return (
    <span
      className={'mso' + (fill ? ' mso-fill' : '')}
      style={{ fontSize: size, color, ...style }}
    >{name}</span>
  );
}

function ChannelChip({ kind, compact }) {
  const c = CHANNEL[kind];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 100, padding: compact ? '1px 7px' : '2px 8px',
      fontSize: compact ? 10 : 11, fontWeight: 600, lineHeight: 1.4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot }} />
      {c.name}
    </span>
  );
}

function TagChip({ kind }) {
  const t = TAG[kind];
  if (!t) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: t.bg, color: t.text, border: `1px solid ${t.border}`,
      borderRadius: 100, padding: '1px 7px',
      fontSize: 10, fontWeight: 600, lineHeight: 1.5,
    }}>{t.name}</span>
  );
}

function Avatar({ name, color = '#7C4DFF', size = 36 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: 'white',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.36, flexShrink: 0,
      letterSpacing: '-0.01em',
    }}>{initials}</div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SideNav — 64px icon column
// ────────────────────────────────────────────────────────────────────────────
function SideNav({ active = 'chat_bubble' }) {
  const items = [
    { i: 'dashboard',    k: 'dashboard' },
    { i: 'chat_bubble',  k: 'chat_bubble' },
    { i: 'view_kanban',  k: 'view_kanban' },
    { i: 'group',        k: 'group' },
    { i: 'analytics',    k: 'analytics' },
    { i: 'settings',     k: 'settings' },
  ];
  return (
    <div style={{
      width: 64, background: 'white',
      borderRight: `1px solid ${M.outline}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 14, gap: 4, flexShrink: 0,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: '#0F172A',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 10, position: 'relative',
      }}>
        <svg viewBox="0 0 40 40" width="22" height="22">
          <path d="M 20 8 A 12 12 0 0 1 31.2 25.2" fill="none" stroke="#3B82F6" strokeWidth="4.5" strokeLinecap="round"/>
          <path d="M 31.2 25.2 A 12 12 0 0 1 8.8 25.2" fill="none" stroke="#10B981" strokeWidth="4.5" strokeLinecap="round"/>
          <path d="M 8.8 25.2 A 12 12 0 0 1 20 8"     fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" opacity="0.85"/>
        </svg>
      </div>
      {items.map(it => {
        const on = it.k === active;
        return (
          <div key={it.k} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            {on && <div style={{ position: 'absolute', left: 0, top: 8, width: 3, height: 24, background: M.primary2, borderRadius: '0 4px 4px 0' }} />}
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: on ? M.surfaceSel : 'transparent',
              color: on ? M.primary : M.outlineText,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mso name={it.i} size={22} fill={on ? 1 : 0} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inbox (chat) mock — used in hero. Two columns: list + chat.
// ────────────────────────────────────────────────────────────────────────────
function InboxMock() {
  const conversations = [
    { id: '1', name: 'Rafael Oliveira',  ch: 'WHATSAPP', tag: 'BILLING',  time: '14:32', msg: "Hi, I need help with my order #4821…", unread: true,  sla: true,  active: true, color: '#7C4DFF' },
    { id: '2', name: 'Ana Lima',         ch: 'TELEGRAM', tag: 'SUPPORT',  time: '14:08', msg: "Ainda não recebi o reembolso, podem verificar?", unread: true,  sla: false, color: '#0088CC' },
    { id: '3', name: 'Carlos Mendez',    ch: 'EMAIL',    tag: 'FEEDBACK', time: '11:55', msg: "Thanks for the help, much appreciated!", unread: false, sla: false, color: '#F97316' },
    { id: '4', name: 'Sofia Carvalho',   ch: 'SMS',      tag: 'SALES',    time: 'Yest.', msg: "What are the pricing options for Enterprise?", unread: true,  sla: false, color: '#8B5CF6' },
    { id: '5', name: 'Marco Reyes',      ch: 'TELEGRAM', tag: null,       time: '09:12', msg: "Got it, thanks!", unread: false, sla: false, color: '#10B981' },
  ];

  return (
    <div style={{
      display: 'flex', height: 540,
      background: M.white,
      fontSize: 13, color: M.text,
    }}>
      <SideNav active="chat_bubble" />

      {/* Conversation list */}
      <div style={{
        width: 280, borderRight: `1px solid ${M.outline}`,
        background: M.white, display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${M.outline}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Inbox</div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: M.primary,
              background: M.accentLight, padding: '2px 8px', borderRadius: 100,
            }}>12</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f8fafc', border: `1px solid ${M.outline}`,
            borderRadius: 10, padding: '7px 10px',
          }}>
            <Mso name="search" size={16} color={M.outlineText} />
            <span style={{ fontSize: 12, color: M.outlineText }}>Search conversations…</span>
          </div>
        </div>

        {/* Channel chips row */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: `1px solid ${M.outline}`, overflow: 'hidden' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:600, background: M.surfaceSel, color: M.primary, border: `1px solid ${M.accentFix}` }}>All</span>
          <ChannelChip kind="WHATSAPP" compact />
          <ChannelChip kind="TELEGRAM" compact />
          <ChannelChip kind="EMAIL" compact />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {conversations.map(c => (
            <div key={c.id} style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${M.outline2}`,
              background: c.active ? M.surfaceSel : 'transparent',
              borderLeft: c.active ? `3px solid ${M.accent}` : '3px solid transparent',
              paddingLeft: c.active ? 13 : 16,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar name={c.name} color={c.color} size={36} />
                <span style={{
                  position: 'absolute', bottom: -1, right: -1,
                  width: 14, height: 14, borderRadius: '50%',
                  background: CHANNEL[c.ch].dot, border: '2px solid white',
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: c.unread ? 600 : 500, color: M.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: c.sla ? '#ba1a1a' : M.secondary, fontWeight: c.sla ? 700 : 500, flexShrink: 0 }}>{c.time}</span>
                </div>
                <div style={{
                  fontSize: 12, color: c.unread ? M.textVar : M.secondary,
                  fontWeight: c.unread ? 500 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginTop: 2,
                }}>{c.msg}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
                  {c.tag && <TagChip kind={c.tag} />}
                  {c.sla && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#ba1a1a' }}>
                      <Mso name="warning" size={11} /> SLA
                    </span>
                  )}
                  {c.unread && !c.tag && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: M.white }}>
        {/* Chat header */}
        <div style={{
          height: 64, padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${M.outline}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name="Rafael Oliveira" color="#7C4DFF" size={36} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Rafael Oliveira</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <ChannelChip kind="WHATSAPP" compact />
                <span style={{ fontSize: 11, color: M.secondary }}>+55 11 9 9421-8833</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#ba1a1a',
              background: '#ffdad6', padding: '4px 10px', borderRadius: 100,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <Mso name="timer" size={13} /> SLA: 12m left
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, display:'inline-flex', alignItems:'center', justifyContent:'center', color: M.secondary }}>
              <Mso name="more_horiz" size={20} />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: M.bg, overflow: 'hidden' }}>
          <Bubble inbound time="14:10">Hi, I need help with my order #4821. It's been 5 days and still no tracking update.</Bubble>
          <Bubble time="14:14">Hello Rafael! Let me look into that right away. Can you confirm your email so I can pull up the order?</Bubble>
          <Bubble inbound time="14:15">Sure, it's rafael.oliveira@email.com</Bubble>
          <Bubble time="14:19" assist>
            Thank you! I can see order #4821 was dispatched on Apr 28th via Correios — tracking <strong>BR4821XO</strong>. I'm escalating to the shipping team.
          </Bubble>
          <Bubble inbound time="14:32">Thanks! When can I expect an update?</Bubble>
        </div>

        {/* Composer */}
        <div style={{ padding: 16, borderTop: `1px solid ${M.outline}`, background: M.white }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: M.bg, border: `1px solid ${M.outline}`,
            borderRadius: 12, padding: '10px 12px',
          }}>
            <Mso name="mood" size={20} color={M.outlineText} />
            <Mso name="attach_file" size={20} color={M.outlineText} />
            <span style={{ flex: 1, fontSize: 13, color: M.outlineText }}>Type a message or <span style={{ color: M.primary, fontWeight: 600 }}>/</span> for quick replies…</span>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: M.accentLight, color: M.primary, fontSize: 11, fontWeight: 600,
              padding: '4px 9px', borderRadius: 100,
            }}>
              <Mso name="auto_awesome" size={13} /> AI draft
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: M.accent,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <Mso name="send" size={18} fill={1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ inbound, children, time, assist }) {
  return (
    <div style={{ display: 'flex', justifyContent: inbound ? 'flex-start' : 'flex-end' }}>
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: inbound ? 'flex-start' : 'flex-end' }}>
        {assist && (
          <div style={{
            fontSize: 10, fontWeight: 600, color: '#7C4DFF', marginBottom: 4,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Mso name="auto_awesome" size={11} /> AI-assisted draft
          </div>
        )}
        <div style={{
          background: inbound ? M.white : M.primary2,
          color: inbound ? M.text : 'white',
          border: inbound ? `1px solid ${M.outline}` : 'none',
          padding: '10px 14px',
          borderRadius: inbound ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
          fontSize: 13, lineHeight: 1.45,
          boxShadow: inbound ? 'none' : '0 4px 12px -4px rgba(79,70,229,0.35)',
        }}>{children}</div>
        <div style={{ fontSize: 10, color: M.secondary, marginTop: 4 }}>{time}{!inbound && ' · Sent'}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Dashboard mock — KPI cards + bar chart + channel donut
// ────────────────────────────────────────────────────────────────────────────
function DashboardMock() {
  const kpis = [
    { label: 'Open conversations', value: '247', delta: '+12.4%', up: true,  icon: 'forum',           bg: '#f5f3ff', fg: '#7C4DFF' },
    { label: 'Avg. response time', value: '1m 42s', delta: '-18%', up: true,  icon: 'timer',           bg: '#f0fdf4', fg: '#10B981' },
    { label: 'AI-assisted',        value: '68%',  delta: '+9.2%',  up: true,  icon: 'auto_awesome',    bg: '#eef2ff', fg: '#4f46e5' },
    { label: 'SLA at risk',        value: '3',    delta: '-2',     up: true,  icon: 'warning',         bg: '#fef2f2', fg: '#EF4444' },
  ];

  const bars = [42, 58, 71, 55, 88, 64, 52]; // weekly volume
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxBar = Math.max(...bars);

  const channels = [
    { name: 'WhatsApp', value: 42, color: '#25D366' },
    { name: 'Telegram', value: 24, color: '#0088CC' },
    { name: 'Email',    value: 22, color: '#F97316' },
    { name: 'SMS',      value: 12, color: '#8B5CF6' },
  ];

  return (
    <div style={{ display: 'flex', background: M.bg, fontSize: 13, color: M.text }}>
      <SideNav active="dashboard" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          height: 64, padding: '0 24px',
          background: 'white', borderBottom: `1px solid ${M.outline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Dashboard</div>
            <div style={{ fontSize: 11, color: M.secondary }}>Overview · Last 7 days</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: M.secondary, background: M.bg, border: `1px solid ${M.outline}`, padding: '4px 10px', borderRadius: 100 }}>Last 7 days</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: M.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: M.secondary }}>
              <Mso name="download" size={18} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {kpis.map(k => (
              <div key={k.label} style={{
                background: 'white', border: `1px solid ${M.outline}`, borderRadius: 14,
                padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: k.bg, color: k.fg,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Mso name={k.icon} size={20} fill={1} />
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: k.up ? '#15803d' : '#ba1a1a',
                    background: k.up ? '#f0fdf4' : '#ffdad6',
                    padding: '2px 7px', borderRadius: 100,
                  }}>{k.delta}</span>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: M.text }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: M.secondary, marginTop: 2 }}>{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            {/* Bar chart */}
            <div style={{ background: 'white', border: `1px solid ${M.outline}`, borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Conversation volume</div>
                  <div style={{ fontSize: 11, color: M.secondary, marginTop: 2 }}>Daily inbound, all channels</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Legend dot="#4f46e5" label="Inbound" />
                  <Legend dot="#c7d2fe" label="Resolved" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 140, paddingTop: 4 }}>
                {bars.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130, width: '100%', justifyContent: 'center' }}>
                      <div style={{ width: '36%', height: `${(v / maxBar) * 100}%`, background: M.primary2, borderRadius: '4px 4px 0 0' }} />
                      <div style={{ width: '36%', height: `${(v / maxBar) * 78}%`, background: M.accentFix, borderRadius: '4px 4px 0 0' }} />
                    </div>
                    <span style={{ fontSize: 10, color: M.secondary, fontWeight: 500 }}>{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel donut */}
            <div style={{ background: 'white', border: `1px solid ${M.outline}`, borderRadius: 14, padding: 18 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Channel mix</div>
                <div style={{ fontSize: 11, color: M.secondary, marginTop: 2 }}>Share of conversations</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Donut segments={channels} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {channels.map(c => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                      <span style={{ color: M.textVar, flex: 1 }}>{c.name}</span>
                      <span style={{ color: M.text, fontWeight: 600 }}>{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ dot, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: M.secondary }}>
      <span style={{ width: 8, height: 8, background: dot, borderRadius: 2 }} />
      {label}
    </span>
  );
}

function Donut({ segments, size = 96 }) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  const r = 40, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F1F3F5" strokeWidth="14" />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const dash = `${len} ${c - len}`;
        const el = (
          <circle key={i}
            cx="50" cy="50" r={r}
            fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
      <text x="50" y="48" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1d1a24" letterSpacing="-0.02em">2,481</text>
      <text x="50" y="62" textAnchor="middle" fontSize="8" fill="#575f67">conversations</text>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Small visuals for "How it works" steps
// ────────────────────────────────────────────────────────────────────────────
function StepVisual({ which }) {
  if (which === 0) return <StepConnect />;
  if (which === 1) return <StepTeam />;
  return <StepReply />;
}

function StepConnect() {
  const channels = [
    { name: 'WhatsApp', icon: 'chat',     ch: 'WHATSAPP', status: 'Connected', meta: '+55 11 4002-8922' },
    { name: 'Telegram', icon: 'send',     ch: 'TELEGRAM', status: 'Connected', meta: '@acme_support_bot' },
    { name: 'Email',    icon: 'mail',     ch: 'EMAIL',    status: 'Connected', meta: 'support@acme.co' },
    { name: 'SMS',      icon: 'sms',      ch: 'SMS',      status: 'Connecting…', meta: '+1 (415) 555-0188' },
  ];
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: M.secondary }}>Channels</div>
      {channels.map(c => {
        const meta = CHANNEL[c.ch];
        const connected = c.status === 'Connected';
        return (
          <div key={c.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: 'white',
            border: `1px solid ${M.outline}`, borderRadius: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: meta.bg, color: meta.dot,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mso name={c.icon} size={20} fill={1} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: M.secondary, marginTop: 1 }}>{c.meta}</div>
            </div>
            {connected ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 9px', borderRadius: 100 }}>
                <Mso name="check_circle" size={13} fill={1} /> Connected
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 9px', borderRadius: 100 }}>
                <Mso name="progress_activity" size={13} /> Connecting…
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepTeam() {
  const team = [
    { name: 'Aline Martins',  role: 'Admin',      queue: 'All channels', color: '#7C4DFF' },
    { name: 'Bruno Costa',    role: 'Supervisor', queue: 'WhatsApp, Email', color: '#0088CC' },
    { name: 'Carla Nogueira', role: 'Agent',      queue: 'WhatsApp', color: '#F97316' },
    { name: 'Daniel Park',    role: 'Agent',      queue: 'Email, SMS', color: '#10B981' },
  ];
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: M.secondary }}>Team</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: M.primary, background: M.accentLight, padding: '3px 9px', borderRadius: 100 }}>
          <Mso name="person_add" size={13} /> Invite
        </span>
      </div>
      <div style={{ background: 'white', border: `1px solid ${M.outline}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 1fr', gap: 12, padding: '10px 16px', background: '#f8fafc', borderBottom: `1px solid ${M.outline}`, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: M.secondary }}>
          <span>User</span><span>Role</span><span>Queue</span>
        </div>
        {team.map((t, i) => (
          <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 1fr', gap: 12, padding: '14px 16px', borderBottom: i < team.length - 1 ? `1px solid ${M.outline2}` : 'none', alignItems: 'center', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={t.name} color={t.color} size={28} />
              <span style={{ fontWeight: 500 }}>{t.name}</span>
            </div>
            <RolePill role={t.role} />
            <span style={{ fontSize: 12, color: M.textVar }}>{t.queue}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: 'white', border: `1px solid ${M.outline}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: M.secondary, marginBottom: 6 }}>SLA · WhatsApp</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>First reply in 5m</div>
        </div>
        <div style={{ flex: 1, background: 'white', border: `1px solid ${M.outline}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: M.secondary, marginBottom: 6 }}>SLA · Email</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Resolved in 4h</div>
        </div>
      </div>
    </div>
  );
}

function RolePill({ role }) {
  const map = {
    Admin:      { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
    Supervisor: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    Agent:      { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  };
  const c = map[role];
  return <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: '2px 9px', borderRadius: 100 }}>{role}</span>;
}

function StepReply() {
  const quick = [
    { trig: '/refund',   text: 'Hi {{name}}, your refund of {{amount}} has been issued…' },
    { trig: '/shipping', text: "Your order is on its way! Tracking: {{tracking}}" },
    { trig: '/closed',   text: "Thanks for reaching out — closing this for now…" },
    { trig: '/cs',       text: "Can you confirm your account email so we can pull up the issue?" },
  ];
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* AI suggestion card */}
      <div style={{
        background: 'white', border: `1px solid ${M.accentFix}`, borderRadius: 12,
        padding: 16, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Mso name="auto_awesome" size={14} color={M.accent} fill={1} />
          <span style={{ fontSize: 11, fontWeight: 700, color: M.accent, letterSpacing: '0.04em', textTransform: 'uppercase' }}>AI draft</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: M.secondary }}>Based on past 4 replies</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: M.text }}>
          Thanks for the patience, Rafael. I've just confirmed with the shipping team — your order is in transit and should arrive by <strong>Friday</strong>. I'll keep an eye on it and reach back out if anything changes.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button style={{ background: M.accent, color: 'white', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8 }}>Use draft</button>
          <button style={{ background: M.bg, color: M.text, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: `1px solid ${M.outline}` }}>Rewrite tone</button>
          <button style={{ background: 'transparent', color: M.secondary, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8 }}>Dismiss</button>
        </div>
      </div>

      {/* Quick replies */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: M.secondary }}>Quick replies</div>
          <span style={{ fontSize: 11, color: M.secondary }}>Type <span style={{ color: M.primary, fontWeight: 700 }}>/</span> in the composer</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quick.map(q => (
            <div key={q.trig} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'white', border: `1px solid ${M.outline}`, borderRadius: 10,
              padding: '10px 14px',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: M.primary,
                background: M.accentLight, padding: '3px 9px', borderRadius: 6,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{q.trig}</span>
              <span style={{ fontSize: 13, color: M.textVar, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Expose to global so landing.jsx can use them
Object.assign(window, { InboxMock, DashboardMock, StepVisual, Mso, ChannelChip, Avatar });
