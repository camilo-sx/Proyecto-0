# models.py

from backend.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_usuario = Column(String, unique=True, index=True, nullable=False)
    contrasenia = Column(String, nullable=False)
    imagen_perfil = Column(String, default="/static/images/default_profile.png")

    tareas = relationship("Task", back_populates="owner")

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    descripcion = Column(String, nullable=True)

    tareas = relationship("Task", back_populates="categoria")

class Task(Base):
    __tablename__ = "tareas"

    id = Column(Integer, primary_key=True, index=True)
    texto_tarea = Column(String, index=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_tentativa_finalizacion = Column(DateTime, nullable=True)
    estado = Column(String, default="Sin Empezar")

    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_categoria = Column(Integer, ForeignKey("categorias.id"), nullable=True)

    owner = relationship("User", back_populates="tareas")
    categoria = relationship("Categoria", back_populates="tareas")
