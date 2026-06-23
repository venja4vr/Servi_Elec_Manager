# ===== ETAPA 1: BUILD =====
# Construye los archivos estáticos del frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json y package-lock.json primero (caché)
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir la app para producción (genera la carpeta dist/)
RUN npm run build

# ===== ETAPA 2: SERVIR =====
# Usa Nginx para servir los archivos estáticos generados
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa anterior al directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx (para soporte de React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto donde Nginx servirá los archivos
EXPOSE 80

# Arrancar Nginx
CMD ["nginx", "-g", "daemon off;"]