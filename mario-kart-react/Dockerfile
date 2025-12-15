FROM node:20-alpine

WORKDIR /app

# Copiamo i file di configurazione
COPY package.json package-lock.json ./

# Installiamo le dipendenze NEL container
RUN npm install

# Copiamo il resto del codice
COPY . .

# Espone la porta
EXPOSE 5173

# Avvia il server in modalità host
CMD ["npm", "run", "dev", "--", "--host"]