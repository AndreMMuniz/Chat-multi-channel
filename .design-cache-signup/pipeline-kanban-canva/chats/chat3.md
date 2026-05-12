# Refatoração Tela Login

_Started 2026-05-12 18:56 UTC_

---

## User

Seguindo nosso deing system e tudas as outras telas que fizemos até aqui, vamos refatorar nossa tela de login

## Assistant

_[tool: list_files]_

_[tool: list_files]_

_[tool: view_image]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: update_todos]_

Vou refatorar a tela de login seguindo o design system Omnichat e o estilo das outras telas (Pipeline e Chat). Os principais pontos que vou melhorar:

- Lado esquerdo com gradiente da marca, mas com **mais densidade visual** — preview do produto, prova social, ritmo entre elementos
- Lado direito com **estrutura mais clara** (card, SSO, "lembrar-me") em vez de um form solto no branco
- Copy em **pt-BR** (consistente com Pipeline e Chat)
- Tweaks para alternar entre variantes

_[tool: read_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: list_files]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: run_script]_

Let me inline the JSX directly in the HTML like the other screens do — that matches the pattern in Pipeline Kanban.html and avoids the loader issue:

_[tool: delete_file]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Refatorei a tela de login (`Login.html`) seguindo o design system Omnichat e o estilo das outras telas:

**Painel da marca (esquerdo)** — três variantes via Tweaks:
- **Preview** (padrão): cards flutuantes com mock do inbox, sugestão da IA e mini-pipeline — mostra o produto em ação
- **Minimal**: headline + lista de features
- **Depoimento**: quote + stats (4.8M+ mensagens, 99,98% uptime, +1.200 times)

**Formulário (direito)**:
- Login social (Google / Microsoft) com divisor "ou continue com e-mail"
- Campos com ícone, focus ring roxo e estado de erro
- Toggle de senha (visibility/visibility_off)
- "Lembrar de mim por 30 dias", "Esqueceu a senha?"
- Botão CTA com estado loading
- Atalho "Falar com o suporte" no topo e seletor de idioma no rodapé

**Tweaks expostos**: variante do painel da marca, tom (Roxo / Índigo / Oceano), exibir SSO, exibir "Lembrar de mim".

Copy em pt-BR para alinhar com Pipeline Kanban e Chat Messages.

