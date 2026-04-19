# Checklist de Déploiement Production - MadaAgri Backend

## 1. Configuration et Sécurité

### Avant le déploiement
- [ ] Créer un fichier `.env` production avec tous les secrets
- [ ] **JWT_SECRET** : Générer une chaîne aléatoire forte (32+ caractères)
  ```bash
  openssl rand -base64 32
  ```
- [ ] **DB_PASSWORD** : Utiliser un mot de passe fort
- [ ] **CLOUDINARY_API_SECRET** : Vérifier que c'est la clé secrète, pas publique
- [ ] Ne JAMAIS committer le fichier `.env` (vérifier `.gitignore`)
- [ ] NEVER partager les secrets dans les logs

### Configuration Node.js
- [ ] NODE_ENV=production
- [ ] PORT configuré correctement (généralement 3000-8000)
- [ ] HOST=0.0.0.0 (pour accepter les requêtes de partout)

## 2. Base de Données

### Préparation
- [ ] MySQL/MariaDB installé et en fonctionnement
- [ ] Base de données créée (`DB_NAME`)
- [ ] Utilisateur BD avec permissions correctes (PAS root)
- [ ] `init.sql` appliqué

### Connection Pooling
- [ ] Vérifier les paramètres:
  - connectionLimit: 10
  - queueLimit: 0
  - waitForConnections: true
- [ ] Tester avec charge pour vérifier les limites

### Backups
- [ ] Backups automatiques configurés
- [ ] Stratégie de rétention définie (7-30 jours)
- [ ] Tester la restauration d'une sauvegarde

### Monitoring BD
- [ ] Vérifier l'espace disque BD
- [ ] Alertes configurées pour connections échouées
- [ ] Query logs activés pour du debugging

## 3. Sécurité API

### Headers de Sécurité
- [ ] Helmet activé (défaut: oui)
- [ ] Content-Security-Policy correctement configurée
- [ ] HSTS (HTTP Strict Transport Security) activé

### CORS
- [ ] CORS_ORIGIN configuré aux domaines autorisés UNIQUEMENT
  ```
  CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
  ```
- [ ] Tester que les origines non autorisées sont bloquées

### Rate Limiting
- [ ] Vérifier les seuils de rate limit
- [ ] Configurer des limites différentes par type de requête
- [ ] Monitorer les IPs qui dépassent les limites

### JWT
- [ ] JWT_SECRET est fort et aléatoire
- [ ] Durée d'expiration appropriée (7d par défaut)
- [ ] Implémenter les refresh tokens (TODO futur)

## 4. HTTPS et Certificats

### SSL/TLS
- [ ] Certificat SSL obtenu (Let's Encrypt gratuit)
- [ ] Certificat valide et configuré
- [ ] Redirection HTTP → HTTPS
- [ ] Vérifier la validité du certificat régulièrement

### Reverse Proxy (Nginx recommandé)
- [ ] Nginx ou Apache configuré
- [ ] Compression gzip activée
- [ ] Cache headers configurés
- [ ] Proxy vers le serveur Node (port interne)

Exemple Nginx config:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 5. Déploiement et Processus

### Process Manager
- [ ] PM2 ou systemd configuré pour redémarrer Node
- [ ] Logs configurés pour PM2
- [ ] Restart automatique en cas de crash
- [ ] Démarrage au boot du serveur

Example PM2 config:
```bash
pm2 start src/backend/server.js --name "madaagri-api" --env production
pm2 save
```

### Déploiement Continu
- [ ] CI/CD pipeline configuré (GitHub Actions, GitLab CI, etc.)
- [ ] Tests automatiques avant déploiement
- [ ] Building et linting réussissent
- [ ] Déploiement rollback plan en cas de souci

## 6. Logging et Monitoring

### Winston Logging
- [ ] LOG_LEVEL=info ou warn en production
- [ ] Logs stockés dans un endroit sécurisé (`src/backend/logs/`)
- [ ] Rotation de logs configurée (5 fichiers max, 5MB chacun)
- [ ] Alertes pour les erreurs critiques

### Monitoring Applicatif
- [ ] Outil de monitoring en place (NewRelic, DataDog, etc.)
- [ ] Alertes configurées:
  - [ ] Erreurs (error rate > 1% pendant 5 minutes)
  - [ ] Performance (response time > 1000ms)
  - [ ] Disponibilité (uptime < 99%)

### Health Check
- [ ] Endpoint `/api/health` testé régulièrement
- [ ] Load balancer configuré avec health checks

## 7. Performance

### Optimisations
- [ ] Compression gzip activée (Nginx)
- [ ] Connection pooling MySQL (10 par défaut)
- [ ] Rate limiting en place
- [ ] Pagination implémentée pour toutes les listes

### Caching
- [ ] Redis configuré pour le caching (optionnel mais recommandé)
- [ ] Cache des tokens JWT ?
- [ ] Cache-Control headers correctement définis

### CDN
- [ ] CloudFlare ou autre CDN en front
- [ ] Assets statiques servis via CDN
- [ ] Cloudinary used pour images

## 8. Dépendances et Versions

### Node et NPM
- [ ] Node version >= 16.0.0
- [ ] NPM version >= 8.0.0
- [ ] `npm audit fix` pour les vulnerabilités

### Dépendances Applicatives
- [ ] Toutes les dépendances installées
- [ ] Vérifier la licence des packages
- [ ] Pas de dépendances critiquement vuln
- [ ] npm audit clean

## 9. Données Sensibles

### Variables d'Environnement
- [ ] Password hashing OK (bcrypt, 10 rounds)
- [ ] JWT tokens ne contiennent pas de données sensibles
- [ ] Tokens expirés supprimés (TODO)
- [ ] Pas de hardcoding d'APIs keys

### Bases de Données
- [ ] Données sensibles chiffrées (mots de passe BC hasés)
- [ ] Accès BD restreint à app server
- [ ] Pas d'accès direct BD de l'internet
- [ ] SQL injection protection (parameterized queries)

## 10. Tests et QA

### Avant Production
- [ ] Tous les tests passent (`npm test`)
- [ ] Linting OK (`npm run lint`)
- [ ] Tests d'intégration effectués
- [ ] Load testing pour estimer les limites
- [ ] Tests de sécurité OK

### Smoke Tests en Production
- [ ] Authentification fonctionne
- [ ] Publications peuvent être créées/lues
- [ ] Upload de fichiers OK
- [ ] Database queries rapides
- [ ] No error rate anormale

## 11. Incident Response

### Plan de Secours
- [ ] Procédure de rollback documentée
- [ ] Contacts d'escalade définis
- [ ] Logs centralisés pour du debugging rapide
- [ ] Status page pour communiquer les incidents

### Procédure de Redémarrage
```bash
pm2 restart madaagri-api
# Ou avec systemd
systemctl restart madaagri
```

## 12. Documentation

- [ ] Architecture documentée
- [ ] Endpoints API documentés (Swagger/OpenAPI)
- [ ] Procédures d'exploitation documentées
- [ ] Contacts et escalades documentés
- [ ] Secrets management documenté

## 13. Post-Déploiement

### Validation
- [ ] API répond correctement
- [ ] Base de données accesible
- [ ] Cloudinary fonctionne
- [ ] Logs générés correctement
- [ ] Monitoring affiche des données

### Monitoring Initial
- [ ] Observer pendant 24-48h
- [ ] Vérifier la charge/traffic patterns
- [ ] Ajuster rate limits si nécessaire
- [ ] Vérifier aucun memory leak

## 14. Maintenance Régulière

### Quotidien
- [ ] Vérifier les logs pour erreurs
- [ ] Vérifier l'uptime, pas d'alertes

### Hebdomadaire
- [ ] npm audit pour vulnérabilités
- [ ] Vérifier les backups
- [ ] Monitoring health report

### Mensuel
- [ ] Mettre à jour les dépendances (if secure)
- [ ] Nettoyer les anciens logs
- [ ] Vérifier les capacités BD

### Annuellement
- [ ] Renouveler les certificats SSL
- [ ] Audit de sécurité
- [ ] Plan de disaster recovery

## Ressources Utiles

- [Node.js Production Checklist](https://nodejs.org/en/docs/guides/nodejs-performance/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Date du dernier déploiement:** _______________  
**Déployé par:** _______________  
**Version:** _______________  

Imprimer et conserver à côté du poste de travail.
