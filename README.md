# Chat Multi-Channel

Plataforma de atendimento multi-canal que centraliza conversas de WhatsApp, Telegram, E-mail e SMS em uma única interface, com suporte a IA e controle de acesso granular por perfis.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Shadcn UI |
| Backend | Python 3.11, FastAPI, Uvicorn |
| AI / Agentes | LangGraph, LangChain, OpenAI |
| Banco de dados | PostgreSQL via SQLAlchemy + Alembic |
| Auth | Supabase Auth (JWT) |
| Canais | Telegram, WhatsApp (Meta Cloud API), E-mail (IMAP/SMTP), SMS (Twilio) |
| Tempo real | WebSocket nativo (FastAPI) |

## Estrutura do projeto

```
/backend          FastAPI service
  /app
    /api
      /endpoints  auth, chat, users, audit, dashboard, upload, telegram, settings
    /core         database, auth, config, websocket, checkpointer
    /models       modelos SQLAlchemy (User, Conversation, Message, etc.)
    /schemas      schemas Pydantic
    /services     telegram_service, storage_service, audit_service
  main.py
  requirements.txt

/frontend         Next.js application
  /src
    /app          login, dashboard, admin (users, user-types, settings)
    /components   SideNavBar, ClientLayout, AudioMessage
    /lib          api.ts (cliente HTTP)
```

## Funcionalidades implementadas

### Backend
- Autenticação JWT integrada ao Supabase Auth
- RBAC com `UserType` customizável — permissões granulares por papel (ver todas as conversas, deletar mensagens, gerenciar usuários, alterar configurações, ver audit logs, etc.)
- Modelos completos: `User`, `UserType`, `Contact`, `Conversation`, `Message`, `AISuggestion`, `QuickReply`, `GeneralSettings`, `AuditLog`
- API REST em `/api/v1` com os grupos: `auth`, `chat`, `upload`, `telegram`, `admin` (users, audit, dashboard, settings)
- Sugestões de resposta por IA via LangGraph
- Webhook do Telegram
- Upload de arquivos/mídia
- WebSocket para entrega de mensagens em tempo real
- Migrations via Alembic

### Frontend
- Tela de login
- Dashboard de conversas
- Painel admin: gestão de usuários, tipos de usuário (RBAC), configurações gerais da plataforma
- Integração com a API via `lib/api.ts`

### Settings (configurações da plataforma)
- Branding: nome do app, logo, cores (primária, secundária, accent)
- IA: provider e modelo (ex.: OpenRouter + gpt-4o-mini)
- WhatsApp: Phone ID, Account ID, Access Token, Webhook Token
- E-mail: IMAP e SMTP (host, porta, endereço, senha)
- SMS: Twilio Account SID, Auth Token, número

## Primeiros passos

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL (ou projeto Supabase)

### Backend

```bash
cd backend
python -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
cp .env.example .env   # preencha as variáveis
python main.py
```

A API sobe em `http://localhost:8000` e a documentação interativa em `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O app sobe em `http://localhost:3000`.

## Variáveis de ambiente (backend)

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SECRET_KEY=
TELEGRAM_BOT_TOKEN=
```

## Canais suportados

| Canal | Status |
|---|---|
| Telegram | Integrado (webhook) |
| WhatsApp | Configuração via Settings (Meta Cloud API) |
| E-mail | Configuração via Settings (IMAP/SMTP) |
| SMS | Configuração via Settings (Twilio) |
