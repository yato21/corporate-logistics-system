FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Создаем каталог uploads и устанавливаем разрешения
RUN mkdir -p /app/uploads && \
    chmod 777 /app/uploads

EXPOSE 5000

CMD ["npm", "start"] 