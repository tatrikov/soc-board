# Build stage - собираем статику
FROM node:24-alpine AS builder

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка всех зависимостей (включая dev для сборки)
RUN npm ci

# Копирование исходного кода
COPY . .

# Сборка статического приложения
RUN npm run build

# Production stage - копируем статику в nginx
FROM nginx:1.27-alpine

# Копирование собранных статических файлов в nginx
COPY --from=builder /app/out /usr/share/nginx/html

# Копирование кастомной конфигурации nginx (опционально, если нужна)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

