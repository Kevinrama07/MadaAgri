# Algorithmes - MadaAgri

Ce dossier contient tous les algorithmes utilisés dans le backend de MadaAgri.

## 📁 Structure

```
algos/
├── collaborationAlgo.js    # Gestion des invitations et collaborations
├── followAlgo.js            # Gestion des suivis et collaborations automatiques
├── dijkstra.js              # Algorithme de Dijkstra (optimisation de routes)
├── graph.js                 # Structure de données graphe
├── heap.js                  # Structure de données tas (heap)
├── kmp.js                   # Algorithme KMP (recherche de motifs)
├── knn.js                   # Algorithme K-NN (recommandations)
├── LOGIQUE_METIER.md        # Documentation de la logique métier
├── DIAGRAMMES.md            # Diagrammes visuels de la logique
├── algos.test.js            # Tests unitaires
└── README.md                # Ce fichier
```

## 🆕 Nouveaux Algorithmes

### 1. CollaborationAlgorithm (`collaborationAlgo.js`)

Gère la logique métier des invitations de collaboration entre utilisateurs.

**Méthodes principales :**

- `checkRelationshipState(userA, userB)` : Vérifie l'état complet de la relation
- `processInvitationAcceptance(invitationId, acceptorId)` : Traite l'acceptation d'une invitation
- `processInvitationRejection(invitationId, rejectorId)` : Traite le refus d'une invitation
- `createAcceptedCollaboration(userA, userB, reason)` : Crée une collaboration acceptée
- `createMutualFollows(userA, userB)` : Crée les suivis mutuels
- `sendNotification(userId, type, actorId, entityType, entityId, content)` : Envoie une notification

**Utilisation :**

```javascript
const CollaborationAlgorithm = require('./algos/collaborationAlgo');

// Accepter une invitation
const result = await CollaborationAlgorithm.processInvitationAcceptance(invitationId, userId);

// Refuser une invitation
await CollaborationAlgorithm.processInvitationRejection(invitationId, userId);
```

### 2. FollowAlgorithm (`followAlgo.js`)

Gère la logique métier des suivis avec détection automatique de collaboration mutuelle.

**Méthodes principales :**

- `processFollow(followerId, followingId)` : Traite le suivi avec détection de suivi mutuel
- `processUnfollow(followerId, followingId)` : Traite l'arrêt du suivi
- `getRelationshipStatus(currentUserId, targetUserId)` : Obtient le statut complet de la relation
- `followExists(followerId, followingId)` : Vérifie si un suivi existe
- `collaborationExists(userA, userB)` : Vérifie si une collaboration existe
- `createAutoCollaboration(userA, userB)` : Crée une collaboration automatique

**Utilisation :**

```javascript
const FollowAlgorithm = require('./algos/followAlgo');

// Suivre un utilisateur
const result = await FollowAlgorithm.processFollow(followerId, followingId);
if (result.isNowCollaborator) {
  console.log('Vous êtes maintenant collaborateurs !');
}

// Arrêter de suivre
await FollowAlgorithm.processUnfollow(followerId, followingId);

// Obtenir le statut de relation
const status = await FollowAlgorithm.getRelationshipStatus(userId, targetUserId);
```

## 📊 Algorithmes Existants

### 3. Dijkstra (`dijkstra.js`)

Algorithme de recherche du plus court chemin dans un graphe pondéré.

**Utilisation :** Optimisation des routes de livraison.

### 4. Graph (`graph.js`)

Structure de données pour représenter un graphe.

**Utilisation :** Représentation des routes et distances entre points.

### 5. Heap (`heap.js`)

Structure de données tas (min-heap ou max-heap).

**Utilisation :** Optimisation des algorithmes de recherche.

### 6. KMP (`kmp.js`)

Algorithme de Knuth-Morris-Pratt pour la recherche de motifs dans une chaîne.

**Utilisation :** Recherche rapide de texte dans les publications et messages.

### 7. KNN (`knn.js`)

Algorithme K-Nearest Neighbors pour les recommandations.

**Utilisation :** Système de recommandation de produits et utilisateurs.

## 🎯 Logique Métier - Collaboration et Suivi

### Scénario 1 : Invitation de Collaboration

1. **A envoie une invitation à B**
   - Invitation créée avec status `pending`
   - B reçoit une notification `COLLAB_REQUEST`

2. **B accepte l'invitation**
   - Status passe à `accepted`
   - Suivis mutuels créés automatiquement
   - A reçoit une notification `COLLAB_ACCEPTED`
   - A et B deviennent collaborateurs

3. **B refuse l'invitation**
   - Status passe à `rejected`
   - A reçoit une notification `COLLAB_REJECTED`
   - Aucune collaboration créée

### Scénario 2 : Suivi Simple

1. **A suit B** (B ne suit pas A)
   - Enregistrement créé dans `follows`
   - B reçoit une notification `FOLLOW`
   - A et B ne sont PAS collaborateurs

### Scénario 3 : Suivi Mutuel → Collaboration Automatique

1. **A suit B**
   - Suivi créé
   - B reçoit notification `FOLLOW`

2. **B suit A en retour**
   - Suivi mutuel détecté
   - Collaboration automatique créée avec status `accepted`
   - A et B reçoivent notification `COLLAB_AUTO`
   - A et B deviennent collaborateurs automatiquement

### Scénario 4 : Arrêt du Suivi

1. **A arrête de suivre B**
   - Suivi supprimé
   - Si collaboration automatique → supprimée aussi
   - Si collaboration via invitation → reste intacte

## 📋 Règles Métier

| Règle | Description |
|-------|-------------|
| **Invitation** | Nécessite une acceptation explicite pour devenir collaborateurs |
| **Suivi mutuel** | Crée automatiquement une collaboration sans acceptation |
| **Priorité** | Collaboration via invitation > Collaboration automatique |
| **Prévention** | Pas de doublons (invitations, suivis, collaborations) |
| **Auto-relation** | Impossible de s'inviter ou se suivre soi-même |

## 🔔 Types de Notifications

| Type | Destinataire | Message |
|------|--------------|---------|
| `COLLAB_REQUEST` | B | "A vous a envoyé une invitation de collaboration" |
| `COLLAB_ACCEPTED` | A | "B a accepté votre invitation de collaboration" |
| `COLLAB_REJECTED` | A | "B a refusé votre invitation de collaboration" |
| `COLLAB_AUTO` | A et B | "Vous êtes maintenant collaborateurs via suivi mutuel" |
| `FOLLOW` | B | "A a commencé à vous suivre" |

## 🧪 Tests

Pour exécuter les tests unitaires :

```bash
npm test algos.test.js
```

Les tests couvrent :
- ✅ Envoi et réception d'invitations
- ✅ Acceptation et refus d'invitations
- ✅ Suivi simple d'utilisateurs
- ✅ Suivi mutuel et collaboration automatique
- ✅ Arrêt du suivi et suppression de collaboration
- ✅ Statut de relation entre utilisateurs
- ✅ Règles métier et validations

## 📖 Documentation Complète

Pour plus de détails, consultez :

- **[LOGIQUE_METIER.md](./LOGIQUE_METIER.md)** : Documentation complète de la logique métier
- **[DIAGRAMMES.md](./DIAGRAMMES.md)** : Diagrammes visuels et flux de données

## 🔧 Intégration dans les Contrôleurs

Les algorithmes sont utilisés dans :

- `controllers/collaborationController.js` : Utilise `CollaborationAlgorithm`
- `controllers/followController.js` : Utilise `FollowAlgorithm`

## 🚀 Avantages de cette Architecture

1. **Séparation des responsabilités** : La logique métier est isolée des contrôleurs
2. **Réutilisabilité** : Les algorithmes peuvent être utilisés dans différents contextes
3. **Testabilité** : Facile de tester la logique métier indépendamment
4. **Maintenabilité** : Modifications centralisées dans les algorithmes
5. **Clarté** : Code plus lisible et compréhensible

## 📝 Notes de Développement

- Les algorithmes utilisent des transactions pour garantir la cohérence des données
- Les notifications sont envoyées de manière asynchrone
- Les erreurs sont gérées avec des messages explicites
- La base de données est interrogée de manière optimisée

## 🤝 Contribution

Pour ajouter un nouvel algorithme :

1. Créer un fichier `nomAlgo.js` dans ce dossier
2. Documenter les méthodes et leur utilisation
3. Ajouter des tests dans `algos.test.js`
4. Mettre à jour ce README

---

**Auteur** : Équipe MadaAgri  
**Dernière mise à jour** : 2024
