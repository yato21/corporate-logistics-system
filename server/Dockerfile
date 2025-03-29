# Базовый образ Node.js
FROM node:16-alpine

# Создаем директорию приложения
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Создаем директорию для загрузок
RUN mkdir -p uploads

# Открываем порт, который использует приложение
EXPOSE 5000

# Запускаем приложение
CMD ["npm", "start"] 