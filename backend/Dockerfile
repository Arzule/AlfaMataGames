FROM node:20-alpine

WORKDIR /app

# Instala solo dependencias de producción usando el lockfile.
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el código de la aplicación.
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

# Ejecuta como usuario sin privilegios incluido en la imagen.
USER node

CMD ["node", "src/server.js"]
