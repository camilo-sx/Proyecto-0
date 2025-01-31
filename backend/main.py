# main.py

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from datetime import timedelta
from sqlalchemy.orm import Session
from backend import crud, models, schemas, auth
from backend.database import SessionLocal, engine, get_db
import os


app = FastAPI()

models.Base.metadata.create_all(bind=engine)

# Montar la carpeta frontend como estática
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# **Montar la carpeta static para imágenes**
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Redirigir la ruta raíz a index.html
@app.get("/")
def read_root():
    return RedirectResponse(url="/frontend/index.html")


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, nombre_usuario=user.nombre_usuario)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)


@app.post("/users/{user_id}/tasks/", response_model=schemas.Task)
def create_task_for_user(
    user_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db)
):
    return crud.create_user_task(db=db, task=task, user_id=user_id)

@app.delete("/users/{username}")
def delete_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.nombre_usuario == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

@app.get("/users/{user_id}/tasks/", response_model=list[schemas.Task])
def read_tasks(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tasks = crud.get_tasks(db, user_id=user_id, skip=skip, limit=limit)
    return tasks

@app.post("/users/{user_id}/upload-profile-image/")
async def upload_profile_image(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # **Asegurar que la carpeta 'images' exista**
    images_dir = os.path.join("backend", "static", "images")
    os.makedirs(images_dir, exist_ok=True)
    
    # **Guardar la imagen en la carpeta 'images'**
    file_location = os.path.join(images_dir, file.filename)
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    
    # **Asignar la ruta pública de la imagen**
    user.imagen_perfil = f"/static/images/{file.filename}"
    db.commit()
    return {"filename": file.filename}
    

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": user.nombre_usuario}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/tasks/", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate,  # ✅ Debe venir en el `body`
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user),
):
    print(f"✅ REQUEST RECIBIDO: {task.model_dump()}")  # 🚨 LOG para depuración
    print(f"✅ Usuario autenticado: {current_user.nombre_usuario} (ID: {current_user.id})")
    return crud.create_user_task(db=db, task=task, user_id=current_user.id)



@app.get("/tasks/", response_model=list[schemas.Task])
def read_tasks(db: Session = Depends(get_db), current_user: schemas.User = Depends(auth.get_current_user)):
    return crud.get_tasks(db, user_id=current_user.id)

@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, updated_task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.id_usuario == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.texto_tarea = updated_task.texto_tarea
    task.id_categoria = updated_task.id_categoria
    db.commit()
    return task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.id_usuario == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}

@app.post("/categorias/", response_model=schemas.Categoria)
def create_category(
    cat: schemas.CategoriaCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user),  # si requieres autenticación
):
    # Si quieres chequear nombre duplicado:
    # ya_existe = db.query(models.Categoria).filter_by(nombre=cat.nombre).first()
    # if ya_existe:
    #     raise HTTPException(status_code=400, detail="La categoría ya existe")

    return crud.create_category(db, cat)

@app.get("/categorias/", response_model=list[schemas.Categoria])
def get_all_categories(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user),
):
    return crud.get_categories(db)

@app.delete("/categorias/{cat_id}")
def delete_a_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user),
):
    deleted = crud.delete_category(db, cat_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"message": "Categoría eliminada"}

@app.put("/categorias/{cat_id}", response_model=schemas.Categoria)
def update_a_category(
    cat_id: int,
    cat_data: schemas.CategoriaCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user),
):
    updated_cat = crud.update_category(db, cat_id, cat_data)
    if not updated_cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return updated_cat