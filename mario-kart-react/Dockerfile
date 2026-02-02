FROM node:20-alpine

WORKDIR /app

# Copiamo i file di configurazione
COPY package.json package-lock.json ./

# Installiamo le dipendenze NEL container
RUN npm install

RUN npm install -g vite

RUN npm install socket.io-client

# per il routing delle degli'indirizzi
RUN npm install react-router-dom

# Copiamo il resto del codice
COPY . .

# Espone la porta
EXPOSE 5173

# Avvia il server in modalità host
CMD ["npm", "run", "dev", "--", "--host"]