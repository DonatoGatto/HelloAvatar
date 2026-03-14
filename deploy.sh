#!/bin/bash
# HelloAvatar - automatinis deploy skriptas
# Paleisk: bash deploy.sh helloavatar.com

set -e

DOMAIN=${1:-helloavatar.com}

echo "🚀 HelloAvatar deploy → $DOMAIN"

# 1. Instaliuojam Docker jei nėra
if ! command -v docker &> /dev/null; then
  echo "📦 Instaliuojamas Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# 2. Instaliuojam Docker Compose jei nėra
if ! command -v docker compose &> /dev/null; then
  echo "📦 Instaliuojamas Docker Compose..."
  apt-get install -y docker-compose-plugin
fi

# 3. Instaliuojam Certbot SSL
if ! command -v certbot &> /dev/null; then
  echo "🔒 Instaliuojamas Certbot..."
  apt-get update -y
  apt-get install -y certbot
fi

# 4. Sukuriam reikalingus aplankus
mkdir -p /var/www/certbot
mkdir -p nginx

# 5. Pakeičiam PLACEHOLDER_DOMAIN į tikrą domeną
sed -i "s/PLACEHOLDER_DOMAIN/$DOMAIN/g" nginx/nginx.conf

# 6. Sukuriam .env jei nėra
if [ ! -f .env.prod ]; then
  echo ""
  echo "⚠️  Reikalingas .env.prod failas!"
  echo "Sukurk failą .env.prod su šiuo turiniu:"
  echo ""
  echo "DOMAIN=$DOMAIN"
  echo "DB_PASSWORD=sukurk-stipru-slaptazodi"
  echo "JWT_SECRET=sukurk-stipru-jwt-slaptazodi"
  echo "HEYGEN_API_KEY=tavo-heygen-key"
  echo "SIMLI_API_KEY=tavo-simli-key"
  echo "SIMLI_FACE_ID=tavo-simli-face-id"
  echo "GROQ_API_KEY=tavo-groq-key"
  echo ""
  echo "Tada paleisk: bash deploy.sh $DOMAIN"
  exit 1
fi

# 7. Gaunam SSL sertifikatą (HTTP-01 challenge)
echo "🔒 Gaunamas SSL sertifikatas..."
# Pirma paleidziam tik nginx su HTTP
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d nginx 2>/dev/null || true
sleep 3
certbot certonly --webroot -w /var/www/certbot \
  -d $DOMAIN -d www.$DOMAIN \
  --non-interactive --agree-tos --email admin@$DOMAIN 2>/dev/null || \
  echo "⚠️  SSL nepavyko - tęsiame be SSL (HTTP)"

# 8. Build ir paleidimas
echo "🔨 Build'inamas projektas..."
docker compose -f docker-compose.prod.yml --env-file .env.prod build

echo "▶️  Paleidžiamas..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo ""
echo "✅ DONE!"
echo "🌍 https://$DOMAIN"
echo "📊 Logai: docker compose -f docker-compose.prod.yml logs -f"
