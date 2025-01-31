import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import SessionLocal, engine
import backend.models as models

db = SessionLocal()
models.Base.metadata.create_all(bind=engine)
client = TestClient(app)

TEST_USERNAME = "testuser"
TEST_PASSWORD = "securepassword"
TOKEN = None
USER_ID = None
TASK_ID = None
CAT_ID = None

def test_create_user():
    global USER_ID
    client.delete(f"/users/{TEST_USERNAME}")  # borra si existe
    response = client.post(
        "/users/",
        json={"nombre_usuario": TEST_USERNAME, "contrasenia": TEST_PASSWORD},
    )
    assert response.status_code == 200
    USER_ID = response.json()["id"]

def test_login():
    global TOKEN
    response = client.post(
        "/token",
        data={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    TOKEN = response.json().get("access_token")
    assert TOKEN is not None

def test_create_category():
    """
    Creamos la categoría "General" antes de intentar crear tareas que la usen.
    """
    global CAT_ID
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = client.post(
        "/categorias/",
        headers=headers,
        json={"nombre": "General", "descripcion": "Categoría por defecto"},
    )
    assert response.status_code == 200
    CAT_ID = response.json()["id"]
    print(">>> Creada categoría con id =", CAT_ID)

def test_create_task():
    global TASK_ID
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = client.post(
        "/tasks/",
        headers=headers,
        json={
            "texto_tarea": "Comprar pan",
            "id_categoria": CAT_ID,  # <--- Ahora referenciamos la categoría creada
        },
    )
    assert response.status_code == 200
    TASK_ID = response.json()["id"]

def test_update_task():
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = client.put(
        f"/tasks/{TASK_ID}",
        headers=headers,
        json={
            "texto_tarea": "Comprar pan y leche",
            "id_categoria": CAT_ID,
            "estado": "Finalizada"
        },
    )
    assert response.status_code == 200

def test_delete_task():
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = client.delete(f"/tasks/{TASK_ID}", headers=headers)
    assert response.status_code == 200

def test_list_categories():
    """
    Se verifica que la categoría "General" aparezca en la lista de categorías.
    """
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = client.get("/categorias/", headers=headers)
    assert response.status_code == 200
    cats = response.json()
    assert any(cat["id"] == CAT_ID for cat in cats), "No se encontró la categoría esperada"

def test_delete_category():
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = client.delete(f"/categorias/{CAT_ID}", headers=headers)
    assert response.status_code == 200
    # Confirmar que se borró
    response = client.get("/categorias/", headers=headers)
    cats = response.json()
    assert not any(cat["id"] == CAT_ID for cat in cats), "La categoría no se borró correctamente"
