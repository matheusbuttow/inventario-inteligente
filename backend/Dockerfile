# Imagem do back-end (Express). Usada pelo serviço "backend" do docker-compose.yml.
FROM node:24-alpine

WORKDIR /app

# Instala dependências primeiro para aproveitar o cache de camadas do Docker
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
