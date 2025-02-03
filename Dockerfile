# Usar una imagen base de Python
FROM python:3.9-slim

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de requisitos e instalarlos
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --upgrade pip && pip install --no-cache-dir -r backend/requirements.txt

# Copiar el resto de los archivos de la aplicación
COPY backend/ ./backend
COPY frontend/ ./frontend

# Asegurar que el PYTHONPATH incluya el directorio backend
ENV PYTHONPATH=/app/backend

# Exponer el puerto en el que correrá FastAPI
EXPOSE 8000

# Comando para ejecutar la aplicación en producción
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
