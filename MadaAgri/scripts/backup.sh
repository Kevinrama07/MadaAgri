#!/bin/bash

# Script de Backup Automatique - MadaAgri
# Usage: ./backup.sh

set -e

BACKUP_DIR="/var/backups/madaagri"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Fichier .env non trouvé"
    exit 1
fi

mkdir -p $BACKUP_DIR

echo "Démarrage du backup..."

# Backup MySQL
MYSQL_BACKUP="$BACKUP_DIR/db_$DATE.sql.gz"
mysqldump --host=$DB_HOST --port=$DB_PORT --user=$DB_USER --password=$DB_PASSWORD --single-transaction $DB_NAME | gzip > $MYSQL_BACKUP

echo "Base de données sauvegardée"

# Backup fichiers
if [ -d "uploads" ]; then
    tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" uploads/
    echo "Fichiers sauvegardés"
fi

# Nettoyage anciens backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup terminé: $DATE"
