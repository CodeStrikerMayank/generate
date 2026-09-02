import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
os.makedirs(DATABASE_DIR, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(DATABASE_DIR, 'app.db')}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False
)

# Enable foreign keys and WAL mode for SQLite
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

    # Ensure schema migrations for newly added columns
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE questions ADD COLUMN chapter_id VARCHAR(64)"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE questions ADD COLUMN topic_id VARCHAR(64)"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE assessment_attempts ADD COLUMN test_tier VARCHAR(32) DEFAULT 'SCREENER'"))
            conn.commit()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
