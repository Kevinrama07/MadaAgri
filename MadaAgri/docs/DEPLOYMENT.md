# Guide de Déploiement - MadaAgri

## 📋 Prérequis

### Serveur
- Ubuntu 20.04+ ou Debian 11+
- Node.js 16+ et npm 8+
- MySQL 8.0+
- Nginx
- SSL Certificate (Let's Encrypt)
- Minimum 2GB RAM, 20GB Storage

### Services Externes
- Compte Cloudinary (upload images)
- Domaine configuré avec DNS

---

## 🔧 Configuration Initiale

### 1. Préparer le Serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Installer Nginx
sudo apt install -y nginx

# Installer PM2 (process manager)
sudo npm install -g pm2
```

### 2. Configurer MySQL

```bash
# Se connecter à MySQL
sudo mysql -u root -p

# Créer la base de données et l'utilisateur
CREATE DATABASE madaagri CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'madaagri_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON madaagri.* TO 'madaagri_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importer le schéma
mysql -u madaagri_user -p madaagri < src/backend/database/madaagri.sql
```

### 3. Cloner le Projet

```bash
# Créer le répertoire
sudo mkdir -p /var/www/madaagri
sudo chown -R $USER:$USER /var/www/madaagri

# Cloner le repo
cd /var/www/madaagri
git clone https://github.com/votre-org/madaagri.git .
```

---

## 🔐 Configuration Backend

### 1. Variables d'Environnement

```bash
cd /var/www/madaagri/src/backend

# Créer le fichier .env
cat > .env << 'EOF'
NODE_ENV=production

# Server
PORT=4000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=madaagri_user
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=madaagri

# JWT
JWT_SECRET=GENERATE_STRONG_SECRET_HERE_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CORS_ORIGIN=https://madaagri.mg,https://www.madaagri.mg

# Logging
LOG_LEVEL=info
EOF

# Sécuriser le fichier
chmod 600 .env
```

### 2. Installer et Démarrer

```bash
# Installer les dépendances
npm ci --production

# Démarrer avec PM2
pm2 start server.js --name madaagri-backend
pm2 save
pm2 startup
```

---

## 🌐 Configuration Frontend

### 1. Variables d'Environnement

```bash
cd /var/www/madaagri/src/frontend

# Créer le fichier .env
cat > .env << 'EOF'
VITE_API_URL=https://api.madaagri.mg/api
VITE_WS_URL=wss://api.madaagri.mg
EOF
```

### 2. Build et Déploiement

```bash
# Installer les dépendances
npm ci

# Build pour production
npm run build

# Les fichiers sont dans dist/
```

---

## 🔒 Configuration Nginx

### 1. Backend (API)

```bash
sudo nano /etc/nginx/sites-available/madaagri-api
```

```nginx
server {
    listen 80;
    server_name api.madaagri.mg;
    
    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.madaagri.mg;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.madaagri.mg/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.madaagri.mg/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

### 2. Frontend

```bash
sudo nano /etc/nginx/sites-available/madaagri-frontend
```

```nginx
server {
    listen 80;
    server_name madaagri.mg www.madaagri.mg;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name madaagri.mg www.madaagri.mg;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/madaagri.mg/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/madaagri.mg/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/madaagri/src/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### 3. Activer les Sites

```bash
# Créer les liens symboliques
sudo ln -s /etc/nginx/sites-available/madaagri-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/madaagri-frontend /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 🔐 SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir les certificats
sudo certbot --nginx -d madaagri.mg -d www.madaagri.mg
sudo certbot --nginx -d api.madaagri.mg

# Renouvellement automatique (déjà configuré)
sudo certbot renew --dry-run
```

---

## 🔥 Firewall

```bash
# Installer UFW
sudo apt install -y ufw

# Configurer les règles
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Activer le firewall
sudo ufw enable
```

---

## 📊 Monitoring avec PM2

```bash
# Voir les logs
pm2 logs madaagri-backend

# Monitoring en temps réel
pm2 monit

# Redémarrer l'application
pm2 restart madaagri-backend

# Voir le statut
pm2 status
```

---

## 🔄 Mise à Jour

### Script de Déploiement

```bash
# Créer le script
nano /var/www/madaagri/deploy.sh
```

```bash
#!/bin/bash
set -e

echo "🚀 Déploiement MadaAgri..."

# Backend
cd /var/www/madaagri/src/backend
git pull origin main
npm ci --production
pm2 restart madaagri-backend

# Frontend
cd /var/www/madaagri/src/frontend
git pull origin main
npm ci
npm run build

echo "✅ Déploiement terminé!"
```

```bash
# Rendre exécutable
chmod +x /var/www/madaagri/deploy.sh

# Utiliser
./deploy.sh
```

---

## 💾 Backup Automatique

```bash
# Créer le script de backup
sudo nano /usr/local/bin/backup-madaagri.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/madaagri"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MySQL
mysqldump -u madaagri_user -p'PASSWORD' madaagri | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup fichiers
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/madaagri/src/backend/uploads

# Garder seulement les 7 derniers jours
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup terminé: $DATE"
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/backup-madaagri.sh

# Ajouter au cron (tous les jours à 2h)
sudo crontab -e
# Ajouter:
0 2 * * * /usr/local/bin/backup-madaagri.sh >> /var/log/madaagri-backup.log 2>&1
```

---

## 🔍 Monitoring et Logs

### Logs Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Logs Application
```bash
pm2 logs madaagri-backend --lines 100
```

### Monitoring Système
```bash
# Installer htop
sudo apt install -y htop

# Utiliser
htop
```

---

## 🚨 Troubleshooting

### Backend ne démarre pas
```bash
# Vérifier les logs
pm2 logs madaagri-backend

# Vérifier la connexion MySQL
mysql -u madaagri_user -p madaagri

# Vérifier les variables d'environnement
cat /var/www/madaagri/src/backend/.env
```

### Erreurs 502 Bad Gateway
```bash
# Vérifier que le backend tourne
pm2 status

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/error.log

# Redémarrer Nginx
sudo systemctl restart nginx
```

### Base de données lente
```bash
# Optimiser les tables
mysqlcheck -u madaagri_user -p --optimize madaagri

# Vérifier les indexes
mysql -u madaagri_user -p madaagri -e "SHOW INDEX FROM posts;"
```

---

## 📱 Déploiement Mobile

### Android (Google Play)

1. **Build de production**
```bash
cd src/Mobile
eas build --platform android --profile production
```

2. **Soumettre à Google Play Console**
- Créer une application
- Uploader l'APK/AAB
- Remplir les informations
- Soumettre pour review

### iOS (App Store)

1. **Build de production**
```bash
eas build --platform ios --profile production
```

2. **Soumettre à App Store Connect**
- Créer une application
- Uploader via Transporter
- Remplir les informations
- Soumettre pour review

---

## ✅ Checklist Pré-Production

- [ ] Variables d'environnement configurées
- [ ] Secrets JWT changés
- [ ] Base de données sécurisée
- [ ] SSL configuré
- [ ] Firewall activé
- [ ] Backups automatiques configurés
- [ ] Monitoring en place
- [ ] Tests de charge effectués
- [ ] Documentation à jour
- [ ] Plan de rollback préparé

---

## 📞 Support

En cas de problème, contacter l'équipe DevOps:
- Email: devops@madaagri.mg
- Slack: #madaagri-support
