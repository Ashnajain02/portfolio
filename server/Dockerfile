FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npx tsc

# Remove dev dependencies after build
RUN npm prune --omit=dev

EXPOSE 3001

CMD ["node", "dist/index.js"]
