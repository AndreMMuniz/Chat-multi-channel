# OmniCRM Signup Refactor

_Started 2026-05-12 19:11 UTC_

---

## User

agora vamos refatorar o nossa pagina de signup seguindo o desig systema criado aqui, é imporatnte vc saber que o software esta em ingles, e que o nome é omnicrm.chat

## Assistant

_[tool: list_files]_

_[tool: view_image]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: write_file]_

Vou criar a página de Signup seguindo o mesmo padrão visual do Login.html — mesmo design system Omnichat, mesma estrutura de dois painéis e tweaks — mas em inglês e adaptada para fluxo de cadastro/workspace onboarding.

_[tool: done]_

_[tool: fork_verifier_agent]_

Refatorei a Signup.html seguindo o design system Omnichat — toda em inglês e com `omnicrm.chat` como marca.

**O que mudei:**
- **Painel da marca esquerdo (default: Onboarding):** timeline de 4 passos ("Request access → Verify email → Workspace review → Start using") com o atual destacado, headline + badge "Now accepting new workspaces" e rodapé de trust (SOC 2, GDPR/LGPD, 99.98% uptime).
- **Formulário:** Full name, Work email, Workspace name (com hint), Password com **medidor de força em 4 segmentos + checklist** (length / case / number / symbol), Confirm password com validação inline de mismatch, checkbox de termos, e SSO Google/Microsoft no topo.
- **Tela de sucesso:** após submit, aparece confirmação "Request received" com email do usuário, instrução para checar inbox e CTA "Go to sign in" linkando para `Login.html`.
- **Tokens do design system:** `#7C4DFF` accent, gradient `#4A1DB5 → #632ce5 → #7C4DFF`, `Inter`, `Material Symbols Outlined`, raios 12px/14px, `border #E9ECEF`, focus ring `7C4DFF/15`.

**Tweaks (canto inferior direito):**
- Painel da marca: **Onboarding** (default) / **Preview** (mocks flutuantes de Inbox + AI + Pipeline) / **Testimonial**
- Tom da marca: Purple / Indigo / Ocean
- Toggle de social signup
- Toggle de "workspace name"

Próximos passos sugeridos: posso traduzir o `Login.html` para inglês também (hoje está em PT-BR) para o par ficar consistente — quer que eu faça?

