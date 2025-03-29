FROM node:18-alpine

WORKDIR /app

# Устанавливаем необходимые инструменты для компиляции C++ модулей
RUN apk add --no-cache python3 make g++

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости и пересобираем нативные модули
RUN npm ci --production
RUN npm rebuild bcrypt --build-from-source

# Копируем код приложения
COPY . .

# Создаем директорию для загрузок
RUN mkdir -p uploads

# Открываем порт
EXPOSE 5000

# Запускаем сервер
CMD ["node", "server.js"] 