FROM node:18-alpine as build

# Создаем пользователя appuser с ID 1000
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser

WORKDIR /app

# Копируем файлы package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем остальные файлы проекта
COPY --chown=appuser:appgroup . .

# Собираем приложение
USER appuser
RUN npm run build

# Финальный этап
FROM nginx:alpine

# Копируем собранные файлы с правильными правами
COPY --from=build --chown=nginx:nginx /app/build /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"] 