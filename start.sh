#!/bin/bash

echo "[LOG START.SH]  Avvio Mario Kart React..."

# Controlla se Docker è attivo
if ! docker info > /dev/null 2>&1 && ! sudo docker info > /dev/null 2>&1; then
    echo "[LOG START.SH] Errore: Docker non sembra avviato."
    exit 1
fi

# ==========================================
# Gestione Certificati SSL
# ==========================================
mkdir -p certs

# Controlla se i file dei certificati mancano
if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
    echo "[LOG START.SH] Certificati non trovati. Generazione in corso..."
    cd certs
    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
    cd ..
    echo "[LOG START.SH] Certificati generati con successo."
else
    echo "[LOG START.SH] Certificati SSL già presenti nella cartella 'certs'."
fi

# Rimuove eventuali ritorni a capo di Windows (CRLF) per evitare errori
sed -i 's/\r$//' start.sh

# ==========================================
# Avvio dei Container
# ==========================================
echo "[LOG START.SH] Pulizia dei vecchi container e volumi..."
docker-compose down -v

echo "[LOG START.SH] Avvio dei container..."
# Prova a lanciare docker-compose. Se fallisce per permessi, usa sudo.
if docker-compose up --build; then
    : # Successo, non fare nulla
else
    echo "[LOG START.SH] Permessi insufficienti, riprovo con sudo..."
    sudo docker-compose up --build
fi

# mkdir -p certs
# cd certs
# openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
# cd ..
# sed -i 's/\r$//' start.sh
