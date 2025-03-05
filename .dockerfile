FROM node:18-alpine

WORKDIR /app

# Nejprve zkopírujte package.json
COPY package*.json ./

# Instalace závislostí
RUN npm ci

# Zkopírujte zbytek souborů
COPY . .

# Build React aplikace
RUN npm run build

# Spuštění serveru
CMD ["npm", "start"]