# schemas.py

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    nombre_usuario: str

class UserCreate(UserBase):
    contrasenia: str

class User(UserBase):
    id: int
    imagen_perfil: str
    model_config = ConfigDict(from_attributes=True)

class CategoriaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoriaCreate(CategoriaBase):
    pass

class Categoria(CategoriaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class TaskBase(BaseModel):
    texto_tarea: str
    id_categoria: Optional[int] = None

class TaskCreate(TaskBase):
    texto_tarea: str
    id_categoria: Optional[int] = None
    fecha_tentativa_finalizacion: Optional[datetime] = None
    estado: Optional[str] = "Sin Empezar"
    

class Task(TaskBase):
    id: int
    fecha_creacion: datetime
    fecha_tentativa_finalizacion: Optional[datetime] = None
    estado: str
    id_usuario: int
    model_config = ConfigDict(from_attributes=True)
    
