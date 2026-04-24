# Chat Multi-Channel (High-Code)

This project is a high-code implementation of a multi-channel chat system, designed to replace and expand upon the original Bubble template.

## Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Shadcn UI.
- **Backend**: Python 3.11, FastAPI, LangGraph for AI Agent orchestration.
- **Channels**: Telegram, WhatsApp, Email, SMS.

## Structure
- `/frontend`: Next.js application.
- `/backend`: FastAPI service with LangGraph agents.
- `/docs`: Documentation including the PRD and Implementation Plan.

## Getting Started

### Backend
1. Go to `backend/`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (or `.\venv\Scripts\Activate.ps1` on Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and fill in your keys.
6. Run: `python main.py`

### Frontend
1. Go to `frontend/`
2. Install dependencies: `npm install`
3. Run: `npm run dev`

## Documentation
Check the [PRD and Implementation Plan](docs/PRD_IMPLEMENTATION.md) for detailed requirements and phase-by-phase development steps.
