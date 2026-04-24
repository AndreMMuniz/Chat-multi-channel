from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from supabase import create_client, Client
from app.core.config import settings

# 1. SQLAlchemy Setup for direct Postgres connection
# Fix connection string for SQLAlchemy if it uses postgres:// instead of postgresql://
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if db_url:
    engine = create_engine(db_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    engine = None
    SessionLocal = None

Base = declarative_base()

# Dependency for FastAPI
def get_db():
    if not SessionLocal:
        raise RuntimeError("Database URL is not configured.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 2. Supabase Client Setup for Supabase specific features (Auth, Storage, Realtime)
supabase_client: Client | None = None
if settings.SUPABASE_URL and settings.supabase_key:
    supabase_client = create_client(settings.SUPABASE_URL, settings.supabase_key)

def get_supabase() -> Client:
    if not supabase_client:
        raise RuntimeError("Supabase URL or Key is not configured.")
    return supabase_client
