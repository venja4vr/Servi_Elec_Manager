# Imagen base: Python 3.11 slim
FROM python:3.11-slim

# Carpeta de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Puerto del chatbot (interno)
EXPOSE 8001

# Comando de arranque (puerto 8001 para diferenciarse de ms-gestion)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]