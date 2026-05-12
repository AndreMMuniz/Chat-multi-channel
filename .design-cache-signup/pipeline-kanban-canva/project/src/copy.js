// Omnichat — Landing copy variants by tone
// Tones: friendly | direct | technical

window.LP_COPY = {
  nav: {
    links: ['Product', 'Channels', 'Pricing', 'Customers', 'Docs'],
    signIn: 'Sign in',
    cta: 'Talk to sales',
  },

  hero: {
    eyebrow: 'Multi-channel customer support',
    headline: {
      friendly: ['Every customer conversation,', 'in one calm inbox.'],
      direct:   ['One inbox.', 'Every channel. Faster replies.'],
      technical:['Unified multi-channel support', 'with AI on every conversation.'],
    },
    sub: {
      friendly:  'WhatsApp, Telegram, Email and SMS — handled by your team in a single workspace, with AI ready when you need it.',
      direct:    'Centralize WhatsApp, Telegram, Email and SMS. Reply faster with quick replies, AI assist and SLA-aware routing.',
      technical: 'WebSocket-powered inbox for WhatsApp, Telegram, Email and SMS. Role-based access, queue routing, AI drafts and a typed REST API.',
    },
    primaryCta: 'Talk to sales',
    secondaryCta: 'See a live demo',
    metaLeft: 'No credit card needed',
    metaRight: '14-day trial on all plans',
  },

  logos: 'Trusted by support teams at',

  features: {
    kicker: 'Why teams switch to Omnichat',
    title: {
      friendly:  'A workspace built around your customer — not your tools.',
      direct:    'Everything support teams need in one workspace.',
      technical: 'Inbox, automation and analytics — wired into your stack.',
    },
    lede: {
      friendly:  "Stop juggling tabs. Omnichat brings every conversation, customer detail and team action into a single, focused interface.",
      direct:    'Cut response times. Centralize channels, route by SLA and use AI to draft replies in seconds.',
      technical: 'Real-time WebSocket messaging, granular RBAC, AI drafting, and an open API for orchestrating your existing stack.',
    },
    items: [
      {
        icon: 'forum',
        title: {
          friendly:  'One inbox for every channel',
          direct:    'Unified inbox',
          technical: 'Channel-agnostic inbox',
        },
        body: {
          friendly:  'WhatsApp, Telegram, Email and SMS land in the same place. Switch context once a day, not once a minute.',
          direct:    'Merge WhatsApp, Telegram, Email and SMS conversations into a single, searchable thread per customer.',
          technical: 'Single conversation model across providers. Normalized message events streamed over WebSocket; sender identity reconciled per customer.',
        },
      },
      {
        icon: 'auto_awesome',
        title: {
          friendly:  'AI that drafts, never decides',
          direct:    'AI assist',
          technical: 'AI assist API',
        },
        body: {
          friendly:  'Get summaries, suggested replies and tone rewrites — your agent always has the last word.',
          direct:    'Summarize threads, draft replies and rewrite tone in one click. Agents stay in control.',
          technical: 'LLM-backed summarization, reply drafting and tone rewrites. Configurable model + provider per workspace.',
        },
      },
      {
        icon: 'quick_phrases',
        title: {
          friendly:  'Quick replies, at your fingertips',
          direct:    'Quick replies',
          technical: 'Shortcut macros',
        },
        body: {
          friendly:  "Type /refund or /shipping and the right answer is already there. Your team's voice, ready to send.",
          direct:    'Turn /shortcuts into ready-to-send messages. Share across the team, version per channel.',
          technical: 'Trigger-based macros (/shortcut) with channel-specific variants and Jinja-style placeholders.',
        },
      },
      {
        icon: 'group',
        title: {
          friendly:  'Roles that fit your team',
          direct:    'Role-based access',
          technical: 'Granular RBAC',
        },
        body: {
          friendly:  'Admins, agents, supervisors — everyone sees what they need and nothing they don\'t.',
          direct:    'Granular roles and permissions per workspace, channel and queue.',
          technical: 'Per-resource ACLs with role inheritance. Audit log streams to your SIEM.',
        },
      },
      {
        icon: 'timer',
        title: {
          friendly:  'Stay ahead of SLAs',
          direct:    'SLA-aware queues',
          technical: 'SLA-aware routing',
        },
        body: {
          friendly:  'A clear, calm signal when a conversation is at risk — before it ever turns into a complaint.',
          direct:    'Track first response and resolution SLAs per channel. Reassign before they breach.',
          technical: 'Configurable SLA policies per channel/tag. Breach events emitted via webhook.',
        },
      },
      {
        icon: 'monitoring',
        title: {
          friendly:  'Numbers that tell the whole story',
          direct:    'Real-time analytics',
          technical: 'Streaming analytics',
        },
        body: {
          friendly:  'Volume, response time, agent load — at a glance, on a dashboard everyone understands.',
          direct:    'Live KPIs for volume, response time, channel mix and agent performance.',
          technical: 'Pre-aggregated metrics over the last 24h / 7d / 30d, exposed as JSON for your BI tool.',
        },
      },
    ],
  },

  demo: {
    kicker: 'See it in action',
    title: {
      friendly:  'A workspace your team will actually enjoy opening.',
      direct:    'Built for the way support teams really work.',
      technical: 'Designed around the agent\'s real workflow.',
    },
    lede: {
      friendly:  "Conversations on the left, the customer in front, every tool one keystroke away. We've spent two years making it disappear.",
      direct:    'Conversation list, chat, customer context — three columns, zero context switching.',
      technical: 'Three-column shell: virtualized conversation list, message stream, and contact panel. Keyboard-first navigation.',
    },
  },

  channels: {
    kicker: 'Channels',
    title: {
      friendly:  'Meet your customers where they already are.',
      direct:    'Every major channel, ready out of the box.',
      technical: 'Native providers for the channels that matter.',
    },
    lede: {
      friendly:  "Plug in the channels you already use. Add new ones when you're ready — no migration weekends.",
      direct:    'One-click setup for the channels you already use. Provider-managed, end-to-end.',
      technical: 'Native integrations with Meta Cloud API, Telegram Bot API, IMAP/SMTP and a Twilio-compatible SMS provider.',
    },
    items: [
      { key: 'WHATSAPP', name: 'WhatsApp',  icon: 'chat',     bg: 'var(--color-channel-whatsapp-bg)', color: 'var(--color-channel-whatsapp)' },
      { key: 'TELEGRAM', name: 'Telegram',  icon: 'send',     bg: 'var(--color-channel-telegram-bg)', color: 'var(--color-channel-telegram)' },
      { key: 'EMAIL',    name: 'Email',     icon: 'mail',     bg: 'var(--color-channel-email-bg)',    color: 'var(--color-channel-email)' },
      { key: 'SMS',      name: 'SMS',       icon: 'sms',      bg: 'var(--color-channel-sms-bg)',      color: 'var(--color-channel-sms)' },
      { key: 'WEB',      name: 'Web chat',  icon: 'language', bg: 'var(--color-channel-web-bg)',      color: 'var(--color-channel-web)' },
    ],
  },

  how: {
    kicker: 'How it works',
    title: {
      friendly:  'From scattered to centralized in an afternoon.',
      direct:    'Up and running in less than a day.',
      technical: 'Provision, connect, integrate — under a day.',
    },
    lede: {
      friendly:  "No migration weekends, no consultants. Connect, invite, reply.",
      direct:    'Three steps. No professional services required.',
      technical: 'Three steps. CLI and API available for everything in the UI.',
    },
    steps: [
      {
        title: {
          friendly:  'Connect your channels',
          direct:    'Connect channels',
          technical: 'Provision channel providers',
        },
        body: {
          friendly:  "Bring your WhatsApp number, Telegram bot, support inbox and SMS line. We've built the integrations so you don't have to.",
          direct:    'Authorize your WhatsApp, Telegram, Email and SMS accounts in minutes — no engineering required.',
          technical: 'OAuth and credentials-based provisioning for Meta Cloud API, Telegram Bot API, IMAP/SMTP and Twilio.',
        },
      },
      {
        title: {
          friendly:  'Invite your team, set the rules',
          direct:    'Invite team & set rules',
          technical: 'Configure roles & SLAs',
        },
        body: {
          friendly:  'Roles, queues and SLAs that match the way your team already works — set them once, change them whenever.',
          direct:    'Define roles, queues, tags and SLAs. Auto-assign or let agents claim.',
          technical: 'YAML- or UI-driven config for RBAC, queue routing, SLA policies and tags. Versioned per workspace.',
        },
      },
      {
        title: {
          friendly:  'Reply, with AI in the wings',
          direct:    'Reply with AI assist',
          technical: 'Reply via API or UI',
        },
        body: {
          friendly:  'Type, click a quick reply, or ask the AI for a draft. Send across any channel from the same composer.',
          direct:    'Send via the composer or our REST API. Quick replies and AI drafts on every message.',
          technical: 'Send via UI composer or POST /v1/messages. Quick-reply and AI-draft helpers included.',
        },
      },
    ],
  },

  faq: {
    kicker: 'FAQ',
    title: {
      friendly:  'Questions you might be thinking right now.',
      direct:    'Frequently asked questions.',
      technical: 'Common technical questions.',
    },
    items: [
      {
        q: 'Which channels do you support today?',
        a: {
          friendly:  "WhatsApp, Telegram, Email and SMS are native — and a web chat widget is included. We're adding Instagram and Messenger next.",
          direct:    'WhatsApp, Telegram, Email, SMS and a hosted web chat widget. Instagram and Messenger are next.',
          technical: 'Native providers: Meta WhatsApp Cloud API, Telegram Bot API, IMAP/SMTP and Twilio-compatible SMS. Web chat widget bundled. Instagram/Messenger on the roadmap.',
        },
      },
      {
        q: 'Is there a free trial?',
        a: {
          friendly:  'Yes — 14 days, every feature, no credit card. Bring your channels, invite your team, and see how it feels.',
          direct:    '14 days, all features, no credit card. Cancel anytime.',
          technical: '14-day trial on all plans. No card required. Trial workspaces are fully isolated and can be promoted to paid in place.',
        },
      },
      {
        q: 'How does AI assist actually work?',
        a: {
          friendly:  'Omnichat suggests summaries, replies and tone rewrites — but your agent always reviews and sends. The AI is a co-pilot, never an autopilot.',
          direct:    'Suggestions only. AI drafts replies, summarizes threads and rewrites tone. Agents review and send.',
          technical: 'LLM-backed helpers for summarization, draft generation and tone rewrites. Configurable model and provider per workspace. No auto-send.',
        },
      },
      {
        q: 'Can we self-host Omnichat?',
        a: {
          friendly:  "Yes — we offer a self-hosted Enterprise plan with the same product, on your infrastructure.",
          direct:    'Yes, on the Enterprise plan. Docker / Kubernetes deploys, runs on your infrastructure.',
          technical: 'Self-hosted Enterprise tier ships as Docker / Helm charts. Postgres + Redis required. Same image as our managed cloud.',
        },
      },
      {
        q: 'What about data privacy and compliance?',
        a: {
          friendly:  "Your customers' conversations are yours. We're SOC 2 Type II and GDPR ready, with EU and US data regions.",
          direct:    'SOC 2 Type II, GDPR ready, EU and US data regions, encryption in transit and at rest.',
          technical: 'SOC 2 Type II audited. GDPR compliant. AES-256 at rest, TLS 1.2+ in transit. EU (Frankfurt) and US (Virginia) regions.',
        },
      },
      {
        q: 'How does pricing work?',
        a: {
          friendly:  "Per agent, per month. No setup fees, no per-channel surcharges. Talk to sales for volume discounts.",
          direct:    'Per agent, per month. Annual discount available. Enterprise = custom.',
          technical: 'Per-seat monthly billing. Annual term unlocks 20% discount. Enterprise quoted on agent count, message volume and deployment model.',
        },
      },
    ],
  },

  final: {
    title: {
      friendly:  'Ready to give your team one calm inbox?',
      direct:    'Centralize your conversations today.',
      technical: 'Deploy Omnichat for your team.',
    },
    body: {
      friendly:  'Talk to us about your stack, your team and your channels. We\'ll show you exactly what your inbox would look like in Omnichat.',
      direct:    "Book a 30-minute demo. We'll show you Omnichat on your channels, with your data.",
      technical: '30-minute architecture review with a solutions engineer. Bring your channels, queues and SLAs.',
    },
    primary: 'Talk to sales',
    secondary: 'Read the docs',
  },

  footer: {
    blurb: 'A multi-channel customer support platform — WhatsApp, Telegram, Email and SMS, with AI on every conversation.',
    cols: [
      { title: 'Product', items: ['Inbox', 'AI assist', 'Quick replies', 'Roles & access', 'Analytics', 'Changelog'] },
      { title: 'Channels', items: ['WhatsApp', 'Telegram', 'Email', 'SMS', 'Web chat'] },
      { title: 'Company', items: ['About', 'Customers', 'Pricing', 'Careers', 'Contact'] },
      { title: 'Resources', items: ['Docs', 'API reference', 'Status', 'Security', 'Blog'] },
    ],
    bottom: '© 2026 Omnichat. All rights reserved.',
    legal: ['Privacy', 'Terms', 'DPA', 'Security'],
  },
};
