#!/bin/bash

# Script de Déploiement - MadaAgri
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Déploiement MadaAgri - Environnement: $ENVIRONMENT${NC}"

# Vérifier la branche
CURRENT_BRANCH=$(git branch --show-current)
if [ "$ENVIRONMENT" = "production" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Erreur: Vous devez être sur la branche 'main' pour déployer en production${NC}"
    exit 1
fi

# Pull dernières modifications
echo -e "${YELLOW}📥 Récupération des dernières modifications...${NC}"
git pull origin $CURRENT_BRANCH

# Backend
echo -e "${YELLOW}🔧 Déploiement Backend...${NC}"
cd src/backend

# Installer dépendances
npm ci --production

# Migrations DB (si nécessaire)
if [ -f "migrations/run.js" ]; then
    node migrations/run.js
fi

# Redémarrer avec PM2
pm2 restart madaagri-backend || pm2 start server.js --name madaagri-backend

echo -e "${GREEN}✅ Backend déployé${NC}"

# Frontend
echo -e "${YELLOW}🎨 Déploiement Frontend...${NC}"
cd ../frontend

# Installer dépendances
npm ci

# Build
npm run build

echo -e "${GREEN}✅ Frontend déployé${NC}"

# Health check
echo -e "${YELLOW}🏥 Vérification de santé...${NC}"
sleep 5

if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend opérationnel${NC}"
else
    echo -e "${RED}❌ Backend ne répond pas${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo -e "${GREEN}========================================${NC}"
