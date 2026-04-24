from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool
from app.core.config import settings

# LangGraph PostgresSaver needs psycopg ConnectionPool
# The DATABASE_URL must use postgresql:// (or postgres://) format for psycopg

db_url = settings.DATABASE_URL
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Initialize the connection pool
pool = ConnectionPool(conninfo=db_url, max_size=20)

def get_checkpointer():
    """
    Returns a configured PostgresSaver for LangGraph.
    It automatically uses the configured Postgres database.
    """
    checkpointer = PostgresSaver(pool)
    return checkpointer

def setup_checkpointer():
    """
    Creates the required tables for LangGraph checkpoints in Postgres.
    Run this once during setup.
    """
    with pool.connection() as conn:
        conn.autocommit = True
        checkpointer = PostgresSaver(conn)
        checkpointer.setup()
        print("LangGraph checkpointer tables created successfully!")

