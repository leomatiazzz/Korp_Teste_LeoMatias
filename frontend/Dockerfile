# Multi-stage Dockerfile para o Frontend Angular

# Estágio 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código-fonte e compilar
COPY . .
RUN npm run build -- --configuration production

# Estágio 2: Servidor Web Nginx
FROM nginx:alpine AS final

# Remover configuração padrão e copiar nginx.conf customizado
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar bundle gerado no build do Angular para o diretório do Nginx
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
