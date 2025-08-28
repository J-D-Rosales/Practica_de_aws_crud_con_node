FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
ENV PORT=3000 DB_FILE=/app/data.sqlite
CMD ["node", "server.js"]
