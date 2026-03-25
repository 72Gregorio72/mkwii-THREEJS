# Usa l'immagine ufficiale leggera di Node.js 20 (Alpine Linux)
FROM node:20-alpine

# Imposta la cartella di lavoro dentro il container
WORKDIR /app

RUN apk add --no-cache openssl

# Copia prima i file di definizione delle dipendenze (per sfruttare la cache di Docker)
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il resto del codice sorgente nel container
COPY . .

RUN npx prisma generate && npx prisma db push

CMD npm run db:init && npm run start 
# Espone la porta 3000 (quella di default di NestJS)
EXPOSE 3000

# Avvia il server in modalità sviluppo (con hot-reload)
CMD ["npm", "run", "start:dev"]