# BMAD Kickoff: Omnichat

## 1. Visão Geral (Overview)
**O que é o projeto?**
O Omnichat é uma plataforma de comunicação multi-canal unificada projetada para consolidar mensagens de diversas origens (WhatsApp, Telegram, E-mail e SMS) em uma única interface inteligente. O sistema resolve a fragmentação de canais de suporte, permitindo que equipes gerenciem todas as interações de um único lugar.

O valor principal está na orquestração de agentes de IA via LangGraph, que classificam mensagens automaticamente, sugerem respostas contextuais e automatizam fluxos de trabalho, aumentando a eficiência operacional e a velocidade de resposta das empresas. 

## 2. Público-Alvo (Target Audience)
**Quem vai usar o sistema?**
- Equipes de Suporte ao Cliente e Customer Experience.
- Desenvolvedores e Engenheiros de IA (que desejam uma base para orquestração de agentes).
- Empresas que necessitam de comunicação unificada com auditoria e controle de acesso (RBAC).

## 3. Tech Stack & Infraestrutura (SSOT Técnico)
**Quais tecnologias formarão a base do sistema?**
- **Frontend / UI:** Next.js 14+, Tailwind CSS (v4), Lucide React, Framer Motion para animações premium.
- **Backend / Lógica Complexa:** Python com FastAPI para a API e LangGraph para orquestração de agentes de IA.
- **Banco de Dados:** Supabase (PostgreSQL) com suporte a Realtime para atualizações em tempo real.
- **Infraestrutura / Deploy:** Docker para o backend e Vercel para o frontend. Armazenamento de mídias no Supabase Storage.
- **Integrações Externas (APIs):** Supabase Auth (Autenticação), WhatsApp Business API, Telegram Bot API, IMAP/SMTP (E-mail), Twilio (SMS), e OpenRouter/OpenAI para os modelos de linguagem.

## 4. Escopo do MVP (Minimum Viable Product)
**Quais são as features estritamente necessárias para a versão 1.0?**
1. **Inbox Unificada**: Interface de chat em tempo real com suporte a múltiplos canais.
2. **Suporte Multi-mídia**: Envio e recebimento de Imagens, Documentos, Emojis e Áudios (com gravação nativa).
3. **Gestão de Acesso (RBAC)**: Controle granular de permissões para Admin, Manager e Default User.
4. **Menu de Configuração & Branding**: Customização de logo, cores do sistema e seleção global de modelos de IA.
5. **Dashboard de Métricas**: Painéis básicos com volume de mensagens, taxa de resolução e performance por canal.

## 5. Fora do Escopo (Out of Scope)
**O que NÃO vamos construir agora?**
- Aplicativo mobile nativo (o foco inicial é Web Responsivo).
- Sistema complexo de afiliados ou faturamento recorrente interno (Billing será externo ou manual nesta fase).
- Treinamento de modelos LLM próprios (utilizaremos modelos via API).

## 6. Regras de Negócio & Restrições (Constraints)
- **Segurança de Dados**: Toda a comunicação entre o frontend e os modelos de IA deve passar obrigatoriamente pelo backend para proteção de API Keys e auditoria.
- **Auditoria**: Ações sensíveis (deleção de mensagens, alteração de permissões) devem gerar registros no log de auditoria.
- **Consistência Visual**: O sistema deve seguir uma estética premium (Rich Aesthetics) com suporte a temas e customização de cores via dashboard administrativo.
- <!-- TODO: Definir limites específicos de armazenamento por cliente ou plano se houver necessidade futura. -->

## 7. Squad BMAD (Perfis de IA)
**Quais agentes do BMAD v6 atuarão primariamente neste projeto?**
- `[x]` PMO (Para quebrar o escopo em tarefas e gerenciar o PRD_IMPLEMENTATION.md)
- `[x]` Software Architect (Para desenhar a estrutura de dados no Supabase e orquestração LangGraph)
- `[x]` Frontend Specialist (Foco em Next.js, Tailwind v4 e UX premium)
- `[x]` Backend Specialist (FastAPI, Integrações de Canais e Segurança)
- `[ ]` QA (Para testes de carga nos WebSockets e validação de segurança RBAC)