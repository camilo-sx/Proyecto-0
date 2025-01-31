# crud.py
from sqlalchemy.orm import Session
from datetime import datetime
from backend import models, schemas
from backend.security import get_password_hash, verify_password

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, nombre_usuario: str):
    return db.query(models.User).filter(models.User.nombre_usuario == nombre_usuario).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.contrasenia)
    db_user = models.User(nombre_usuario=user.nombre_usuario, contrasenia=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, nombre_usuario: str, password: str):
    user = get_user_by_username(db, nombre_usuario)
    if not user or not verify_password(password, user.contrasenia):
        return False
    return user

def get_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Task).filter(models.Task.id_usuario == user_id).offset(skip).limit(limit).all()

def create_user_task(db: Session, task: schemas.TaskCreate, user_id: int):
    db_task = models.Task(
        texto_tarea=task.texto_tarea,
        fecha_creacion=datetime.utcnow(),
        fecha_tentativa_finalizacion=task.fecha_tentativa_finalizacion,
        estado=task.estado,
        id_usuario=user_id,
        id_categoria=task.id_categoria
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def create_category(db: Session, cat: schemas.CategoriaCreate) -> models.Categoria:
    db_cat = models.Categoria(
        nombre=cat.nombre,
        descripcion=cat.descripcion
    )
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

def get_categories(db: Session):
    return db.query(models.Categoria).all()

def get_category(db: Session, cat_id: int):
    return db.query(models.Categoria).filter(models.Categoria.id == cat_id).first()

def delete_category(db: Session, cat_id: int):
    cat = get_category(db, cat_id)
    if cat:
        db.delete(cat)
        db.commit()
        return cat
    return None

def update_category(db: Session, cat_id: int, cat_data: schemas.CategoriaCreate):
    cat = get_category(db, cat_id)
    if not cat:
        return None
    cat.nombre = cat_data.nombre
    cat.descripcion = cat_data.descripcion
    db.commit()
    db.refresh(cat)
    return cat

def update_task(db: Session, task_id: int, updated_task: schemas.TaskCreate, user_id: int):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.id_usuario == user_id).first()
    if not task:
        return None
    task.texto_tarea = updated_task.texto_tarea
    task.id_categoria = updated_task.id_categoria
    task.estado = updated_task.estado
    task.fecha_tentativa_finalizacion = updated_task.fecha_tentativa_finalizacion
    db.commit()
    db.refresh(task)
    return task