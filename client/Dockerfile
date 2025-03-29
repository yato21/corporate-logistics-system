# Этап сборки
FROM node:16-alpine

# Создаем директорию приложения
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Устанавливаем переменные окружения для сборки
ENV REACT_APP_API_URL=http://${DOMAIN}/api
ENV REACT_APP_SOCKET_URL=http://${DOMAIN}

# Собираем приложение
RUN npm run build

# Создаем команду, которая будет держать контейнер активным
CMD ["tail", "-f", "/dev/null"] 