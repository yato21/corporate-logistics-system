# Этап сборки
FROM node:alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Аргументы сборки, передаются из docker-compose
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV NODE_ENV=production

RUN npm run build

# Этап продакшн
FROM nginx:alpine

# Копируем статические файлы из этапа сборки
COPY --from=build /app/build /usr/share/nginx/html

# Удаляем стандартный конфиг Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Добавляем собственный конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 