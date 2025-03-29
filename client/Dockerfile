# Этап сборки
FROM node:16-alpine as build

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

# Этап запуска - используем nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем собранные файлы из этапа сборки
COPY --from=build /app/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"] 