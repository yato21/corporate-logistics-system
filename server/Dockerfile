FROM node:18-alpine

WORKDIR /app

# Устанавливаем необходимые инструменты для компиляции C++ модулей
RUN apk add --no-cache python3 make g++

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости и пересобираем bcrypt
RUN npm install --omit=dev && \
    npm rebuild bcrypt --build-from-source

# Копируем код приложения
COPY . .

# Создаем директорию для загрузок
RUN mkdir -p uploads

# Открываем порт
EXPOSE 5000

# Создаем скрипт инициализации
RUN echo '#!/bin/sh\nnpm run init-db || true\nexec node server.js' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Команда для запуска приложения через скрипт
CMD ["/app/entrypoint.sh"] 