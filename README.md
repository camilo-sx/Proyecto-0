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

2. **Construye y levanta los contenedores:**

Ejecuta en la raíz de proyecto ``docker-compose up -d --build``

3. **Accede a la aplicación:**

Abre tu navegador y navega a http://localhost:8000. Se redirigirá automáticamente a la página principal de la app.