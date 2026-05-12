# Landing Page Design

_Started 2026-05-03 14:19 UTC_

---

## User

Com base neste desing systema preciso criar uma landing page para este projeto

## Assistant

_[tool: questions_v2]_

## User

Questions answered:
- product: Omnichat (suporte multicanal — WhatsApp, Telegram, Email, SMS)
- audience: Mix de todos
- goal: Falar com vendas
- sections: Hero com visual do produto, Features (3-6 cards), Demo interativa / screenshot grande, Integrações (canais), Como funciona (passo-a-passo), FAQ, CTA final, Footer completo
- hero_style: Clássico: título + subtítulo + CTA + screenshot do produto à direita
- visual_density: Minimalista (muito espaço, flat, igual ao app)
- screenshots: Sim, desenhe mocks do produto (kanban, chat, dashboard)
- variations: Uma versão sólida
- tweaks: Tom da copy (técnico / amigável / direto)
- language: Inglês

## Assistant

_[tool: update_todos]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: run_script]_

_[tool: read_file]_

_[tool: copy_files]_

_[tool: copy_starter_component]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Now write the index.html that ties everything together.

_[tool: write_file]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Landing page is live at `index.html`.

**What's there**
- Sticky nav with the Omnichat wordmark, links and the "Talk to sales" CTA
- Hero with an inbox mock on the right (real conversation list + chat + composer with AI-draft chip)
- Trusted-by logo strip
- Six features in a flat 3×2 grid (per-card icon tones from the channel palette)
- Demo section with a full Dashboard mock (KPIs, weekly bar chart, channel donut)
- Channels grid (WhatsApp, Telegram, Email, SMS, Web chat)
- How it works — click each step to swap the right-hand visual (channels list / team & SLAs / AI draft + quick replies)
- Six-item accordion FAQ
- Final CTA on the brand gradient panel (the one place gradient is allowed)
- Full four-column footer

**Tweak**
- Open the Tweaks panel → **Copy tone** → Friendly / Direct / Technical. It rewrites the hero, features, section heads, how-it-works, FAQ answers and final CTA copy — the persisted default is `friendly` (saved in the `EDITMODE` block).

