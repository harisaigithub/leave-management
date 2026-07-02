FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Seed is idempotent (skips if data already exists) so it's safe to run on every boot.
CMD ["sh", "-c", "node src/db/seed.js && node src/server.js"]
