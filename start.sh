echo "🏎️  Avvio Mario Kart React..."

# Controlla se Docker è attivo
if ! docker info > /dev/null 2>&1 && ! sudo docker info > /dev/null 2>&1; then
    echo "❌ Errore: Docker non sembra avviato."
    exit 1
fi

# Prova a lanciare docker-compose. Se fallisce per permessi, usa sudo.
if docker-compose up --build; then
    : # Successo, non fare nulla
else
    echo "🔒 Permessi insufficienti, riprovo con sudo..."
    sudo docker-compose up --build
fi

# mkdir -p certs
# cd certs
# openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
# cd ..