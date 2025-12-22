# Docker Production Setup

## Требования

- Docker 20.10+
- Docker Compose 2.0+

## Быстрый старт

1. Соберите и запустите все сервисы:
```bash
docker-compose up -d --build
```

2. Приложение будет доступно по адресу: `http://localhost`

## Структура

- **socboard-backend** - Flask API сервер (порт 5000, внутренний)
- **socboard-nginx** - Nginx сервер, отдающий статический фронтенд и проксирующий API (порт 80)

## Команды

### Запуск
```bash
docker-compose up -d
```

### Остановка
```bash
docker-compose down
```

### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f socboard-backend
docker-compose logs -f socboard-nginx
```

### Пересборка после изменений
```bash
docker-compose up -d --build
```

### Очистка
```bash
# Остановка и удаление контейнеров
docker-compose down

# Удаление контейнеров, сетей и volumes
docker-compose down -v

# Удаление образов
docker-compose down --rmi all
```

## Health Checks

Все сервисы имеют health checks:
- Backend: `http://localhost/tasks/1` (через nginx) или внутренний `http://socboard-backend:5000/health`
- Nginx: `http://localhost/health`

## Переменные окружения

Для настройки можно создать файл `.env` в корне проекта:

```env
# Backend
FLASK_ENV=production

# Frontend
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost/tasks
```

## Production рекомендации

1. Используйте внешний volume для логов
2. Настройте SSL/TLS через Nginx
3. Используйте secrets для чувствительных данных
4. Настройте мониторинг и алертинг
5. Регулярно обновляйте базовые образы

