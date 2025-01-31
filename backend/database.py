# database.py

import time
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración para PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@db:5432/todo_db"
#SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost:5432/todo_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Hacer reintentos de conexión para evitar errores al iniciar
for _ in range(5):
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        break
    except Exception as e:
        print(f"Error al conectar con la base de datos: {e}")
        time.sleep(5)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()