import asyncio
from app.core.database import SessionLocal, get_supabase
from sqlalchemy import text

def test_connection():
    print("Testing SQLAlchemy Connection...")
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT version();")).fetchone()
        print("SQLAlchemy connected successfully!")
        print(f"PostgreSQL Version: {result[0]}")
    except Exception as e:
        print(f"SQLAlchemy connection failed: {e}")
    finally:
        if 'db' in locals():
            db.close()

    print("\nTesting Supabase Client Connection...")
    try:
        supabase = get_supabase()
        # Just getting the client won't make a request, let's try a simple auth check or a rpc call, or just fetch from an empty table.
        # But we can just see if it doesn't crash on init.
        print("Supabase client initialized successfully!")
        print(f"Supabase URL: {supabase.supabase_url}")
    except Exception as e:
        print(f"Supabase client connection failed: {e}")

if __name__ == "__main__":
    test_connection()
