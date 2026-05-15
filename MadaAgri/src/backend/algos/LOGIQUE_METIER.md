# Logique Métier - Système de Collaboration et Suivi

## Vue d'ensemble

Ce document décrit la logique métier du système de collaboration et de suivi entre utilisateurs dans MadaAgri.

## Acteurs

- **Utilisateur A** : L'utilisateur qui initie une action
- **Utilisateur B** : L'utilisateur cible de l'action

## Scénarios

### 1. Système d'Invitation de Collaboration

#### 1.1 Envoi d'invitation
**Action** : A clique sur le bouton "Ajouter" pour inviter B

**Processus** :
1. A envoie une invitation de collaboration à B
2. L'invitation est créée avec le statut `pending`
3. B reçoit une notification de type `COLLAB_REQUEST`

**Fichier** : `collaborationController.js` → `sendCollaborationInvitation()`

#### 1.2 Acceptation d'invitation
**Action** : B accepte l'invitation de A

**Processus** :
1. Le statut de l'invitation passe à `accepted`
2. Les suivis mutuels sont créés automatiquement (A suit B et B suit A)
3. A et B deviennent collaborateurs
4. A reçoit une notification de type `COLLAB_ACCEPTED`

**Algorithme** : `collaborationAlgo.js` → `processInvitationAcceptance()`

#### 1.3 Refus d'invitation
**Action** : B refuse l'invitation de A

**Processus** :
1. Le statut de l'invitation passe à `rejected`
2. A reçoit une notification de type `COLLAB_REJECTED`
3. Aucune collaboration n'est créée

**Algorithme** : `collaborationAlgo.js` → `processInvitationRejection()`

---

### 2. Système de Suivi (Follow)

#### 2.1 Suivi simple
**Action** : A suit B (mais B ne suit pas encore A)

**Processus** :
1. Un enregistrement de suivi est créé dans la table `follows`
2. A devient "abonné" de B
3. B reçoit une notification de type `FOLLOW`
4. A et B ne sont PAS encore collaborateurs

**Algorithme** : `followAlgo.js` → `processFollow()`

#### 2.2 Suivi mutuel → Collaboration automatique
**Action** : A suit B, puis B suit A en retour (ou vice-versa)

**Processus** :
1. Le deuxième suivi est créé
2. Le système détecte le suivi mutuel
3. Une collaboration automatique est créée avec le statut `accepted`
4. Le message de la collaboration est : "Collaboration automatique via suivi mutuel"
5. A et B reçoivent tous les deux une notification de type `COLLAB_AUTO`
6. A et B deviennent collaborateurs automatiquement

**Algorithme** : `followAlgo.js` → `processFollow()` avec détection de suivi mutuel

#### 2.3 Arrêt du suivi
**Action** : A arrête de suivre B

**Processus** :
1. Le suivi de A vers B est supprimé
2. Si la collaboration était automatique (via suivi mutuel), elle est également supprimée
3. Si la collaboration était via invitation acceptée, elle reste intacte

**Algorithme** : `followAlgo.js` → `processUnfollow()`

---

## Règles Métier

### Règle 1 : Invitation vs Suivi
- **Invitation** : Nécessite une acceptation explicite pour devenir collaborateurs
- **Suivi mutuel** : Crée automatiquement une collaboration sans acceptation

### Règle 2 : Priorité des collaborations
- Une collaboration via invitation acceptée est permanente
- Une collaboration automatique (suivi mutuel) est supprimée si l'un des utilisateurs arrête de suivre l'autre

### Règle 3 : Notifications
- `COLLAB_REQUEST` : B reçoit une invitation de A
- `COLLAB_ACCEPTED` : A reçoit une notification que B a accepté
- `COLLAB_REJECTED` : A reçoit une notification que B a refusé
- `COLLAB_AUTO` : A et B reçoivent une notification de collaboration automatique
- `FOLLOW` : B reçoit une notification que A le suit

### Règle 4 : Prévention des doublons
- Un utilisateur ne peut pas envoyer plusieurs invitations en attente à la même personne
- Un utilisateur ne peut pas suivre deux fois la même personne
- Une collaboration acceptée ne peut pas être recréée

---

## Diagramme de flux

```
SCÉNARIO 1 : Invitation
A clique "Ajouter" → B reçoit invitation → B accepte → Collaborateurs + Suivis mutuels
                                        → B refuse → A reçoit notification de refus

SCÉNARIO 2 : Suivi simple
A suit B → B reçoit notification → Pas encore collaborateurs

SCÉNARIO 3 : Suivi mutuel
A suit B → B reçoit notification
B suit A → Détection suivi mutuel → Collaboration automatique → A et B collaborateurs
```

---

## Tables de base de données

### Table `collaborations`
- `sender_id` : Utilisateur qui envoie l'invitation
- `receiver_id` : Utilisateur qui reçoit l'invitation
- `status` : `pending`, `accepted`, `rejected`, `cancelled`
- `message` : Message personnalisé ou "Collaboration automatique via suivi mutuel"

### Table `follows`
- `follower_id` : Utilisateur qui suit
- `following_id` : Utilisateur suivi

### Table `notifications`
- `user_id` : Destinataire de la notification
- `type` : Type de notification
- `actor_id` : Utilisateur qui a déclenché la notification

---

## Algorithmes implémentés

### 1. `collaborationAlgo.js`
- `checkRelationshipState()` : Vérifie l'état de la relation entre deux utilisateurs
- `processInvitationAcceptance()` : Traite l'acceptation d'une invitation
- `processInvitationRejection()` : Traite le refus d'une invitation
- `createAcceptedCollaboration()` : Crée une collaboration acceptée
- `createMutualFollows()` : Crée les suivis mutuels
- `sendNotification()` : Envoie une notification

### 2. `followAlgo.js`
- `processFollow()` : Traite le suivi avec détection de suivi mutuel
- `processUnfollow()` : Traite l'arrêt du suivi
- `getRelationshipStatus()` : Obtient le statut complet de la relation
- `followExists()` : Vérifie si un suivi existe
- `collaborationExists()` : Vérifie si une collaboration existe
- `createAutoCollaboration()` : Crée une collaboration automatique

---

## Tests recommandés

1. **Test d'invitation** : A invite B, B accepte → Vérifier collaboration + suivis mutuels
2. **Test de refus** : A invite B, B refuse → Vérifier notification de refus
3. **Test de suivi simple** : A suit B → Vérifier pas de collaboration
4. **Test de suivi mutuel** : A suit B, B suit A → Vérifier collaboration automatique
5. **Test d'arrêt de suivi** : A suit B, B suit A (collab auto), A arrête de suivre → Vérifier suppression de la collaboration
6. **Test de priorité** : A invite B, B accepte, A arrête de suivre → Vérifier que la collaboration reste

---

## Auteur
Système MadaAgri - Gestion des collaborations et suivis
