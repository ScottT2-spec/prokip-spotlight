FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# HF Spaces expects port 7860
ENV PORT=7860
EXPOSE 7860

# Create data directory for SQLite (writable)
RUN mkdir -p /data
ENV DB_PATH=/data/prokip.db

CMD ["node", "server.js"]
