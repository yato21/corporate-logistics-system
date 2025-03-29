FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Создаем директорию для загрузок
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"] 