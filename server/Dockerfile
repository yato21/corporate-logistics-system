FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Создаем директорию для загрузок если её нет
RUN mkdir -p uploads

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"] 