FROM node:18-alpine

# Создаем пользователя appuser с ID 1000
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser

WORKDIR /app

# Копируем файлы package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем остальные файлы проекта
COPY --chown=appuser:appgroup . .

# Создаем директорию uploads и устанавливаем права
RUN mkdir -p uploads && chown -R appuser:appgroup uploads

# Переключаемся на пользователя appuser
USER appuser

EXPOSE 5000

CMD ["npm", "start"] 