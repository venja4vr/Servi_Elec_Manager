# Imagen base: Python 3.11 slim (versión liviana, sin cosas innecesarias)
FROM python:3.11-slim

# Carpeta donde se ubica la app dentro del contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias para psycopg2 (driver de PostgreSQL)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero (para aprovechar la caché de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código del microservicio
COPY . .

# Exponer el puerto interno (informativo, no abre puerto al exterior)
EXPOSE 8000

# Comando para arrancar la app cuando se ejecute el contenedor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]