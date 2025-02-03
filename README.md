# All Done! - Gestión de Tareas

Esta aplicación es una SPA (Single Page Application) para gestionar tareas y categorías, utilizando FastAPI en el backend y HTML/CSS/JavaScript en el frontend. El proyecto se despliega en contenedores Docker y utiliza PostgreSQL como base de datos.

## Características

- Registro e inicio de sesión de usuarios con autenticación basada en tokens JWT.
- Gestión de tareas: creación, actualización, eliminación y listado de tareas.
- Gestión de categorías: creación, actualización, eliminación y listado de categorías.
- Subida de imagen de perfil.
- Despliegue con Docker y docker-compose.

## Ejecución en Local

Sigue estos pasos para correr la aplicación en tu entorno local:

1. **Clona el repositorio:**


2. **Ajusta la configuración del Frontend (scripts.js):**

En el archivo frontend/scripts.js descomenta la linea donde se define la URL de la API:

``const API_BASE_URL = "http://localhost:8000";``

Asegúrate de que esta variable esté configurada con http://localhost:8000 para que las peticiones del frontend se realicen al backend local.

3. **Construye y levanta los contenedores:**

Ejecuta en la raíz de proyecto ``docker-compose up -d --build``

4. **Accede a la aplicación:**

Abre tu navegador y navega a http://localhost:8000. Se redirigirá automáticamente a la página principal de la app.

## Comandos Útiles
Ver logs de los contenedores:

```
docker-compose logs -f
```

Detener los contenedores:

```
docker-compose down
```

Reconstruir la imagen:

```
docker-compose up -d --build
```

# Despliegue en AWS

Prueba esta aplicación en vivo: http://44.208.104.201:8000/

## Integrantes

Camilo A. Cáceres Fontecha - 201812935