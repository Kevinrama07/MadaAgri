# Diagrammes de la Logique Métier

## 1. Flux d'Invitation de Collaboration

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INVITATION DE COLLABORATION                       │
└─────────────────────────────────────────────────────────────────────┘

Utilisateur A                                          Utilisateur B
     │                                                       │
     │  1. Clique "Ajouter"                                 │
     ├──────────────────────────────────────────────────────>│
     │                                                       │
     │  2. Invitation créée (status: pending)               │
     │                                                       │
     │  3. Notification COLLAB_REQUEST ──────────────────>  │
     │                                                       │
     │                                                       │
     │                    ┌──────────────┐                  │
     │                    │  B décide    │                  │
     │                    └──────┬───────┘                  │
     │                           │                          │
     │              ┌────────────┴────────────┐             │
     │              │                         │             │
     │         ACCEPTE                    REFUSE            │
     │              │                         │             │
     │              ▼                         ▼             │
     │  ┌─────────────────────┐   ┌─────────────────────┐  │
     │  │ Status: accepted    │   │ Status: rejected    │  │
     │  │ Suivis mutuels créés│   │ Aucune collab       │  │
     │  │ A et B collaborateurs│   │                     │  │
     │  └─────────────────────┘   └─────────────────────┘  │
     │              │                         │             │
     │<─────────────┘                         └────────────>│
     │  Notification                          Notification  │
     │  COLLAB_ACCEPTED                       COLLAB_REJECTED
     │                                                       │
```

## 2. Flux de Suivi Simple

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUIVI SIMPLE                                 │
└─────────────────────────────────────────────────────────────────────┘

Utilisateur A                                          Utilisateur B
     │                                                       │
     │  1. Clique "Suivre"                                  │
     ├──────────────────────────────────────────────────────>│
     │                                                       │
     │  2. Enregistrement créé dans table "follows"         │
     │     (follower_id: A, following_id: B)                │
     │                                                       │
     │  3. Vérification suivi mutuel                        │
     │     ┌─────────────────────────┐                      │
     │     │ B suit-il déjà A ?      │                      │
     │     └──────────┬──────────────┘                      │
     │                │                                      │
     │         ┌──────┴──────┐                              │
     │         │             │                              │
     │        NON          OUI                              │
     │         │             │                              │
     │         ▼             ▼                              │
     │  ┌──────────┐  ┌─────────────────────┐              │
     │  │ Simple   │  │ Collaboration       │              │
     │  │ suivi    │  │ automatique créée   │              │
     │  └──────────┘  └─────────────────────┘              │
     │         │             │                              │
     │         │             ├──────────────────────────────>│
     │         │             │  Notification COLLAB_AUTO    │
     │         │             │                              │
     │         ├─────────────────────────────────────────────>│
     │         │  Notification FOLLOW                       │
     │         │                                            │
```

## 3. Flux de Suivi Mutuel → Collaboration Automatique

```
┌─────────────────────────────────────────────────────────────────────┐
│              SUIVI MUTUEL → COLLABORATION AUTOMATIQUE               │
└─────────────────────────────────────────────────────────────────────┘

État initial : A suit B

Utilisateur B                                          Utilisateur A
     │                                                       │
     │  1. Clique "Suivre" (A)                              │
     ├──────────────────────────────────────────────────────>│
     │                                                       │
     │  2. Détection du suivi mutuel                        │
     │     ┌─────────────────────────────────┐              │
     │     │ A suit B : ✓                    │              │
     │     │ B suit A : ✓ (nouveau)          │              │
     │     │ → SUIVI MUTUEL DÉTECTÉ          │              │
     │     └─────────────────────────────────┘              │
     │                                                       │
     │  3. Création automatique de la collaboration         │
     │     ┌─────────────────────────────────┐              │
     │     │ Table: collaborations           │              │
     │     │ Status: accepted                │              │
     │     │ Message: "Collaboration         │              │
     │     │  automatique via suivi mutuel"  │              │
     │     └─────────────────────────────────┘              │
     │                                                       │
     │<──────────────────────────────────────────────────────┤
     │  4. Notification COLLAB_AUTO                         │
     │                                                       │
     │  5. Notification COLLAB_AUTO ────────────────────────>│
     │                                                       │
     │                                                       │
     │  ✓ A et B sont maintenant COLLABORATEURS             │
     │                                                       │
```

## 4. Matrice des États de Relation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MATRICE DES ÉTATS                                 │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬─────────────────────┐
│  A suit B    │  B suit A    │ Invitation   │      Résultat       │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│     NON      │     NON      │     NON      │ Aucune relation     │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│     OUI      │     NON      │     NON      │ A abonné de B       │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│     NON      │     OUI      │     NON      │ B abonné de A       │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│     OUI      │     OUI      │     NON      │ COLLABORATEURS      │
│              │              │              │ (automatique)       │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│     NON      │     NON      │   PENDING    │ Invitation en       │
│              │              │              │ attente             │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│     OUI      │     OUI      │   ACCEPTED   │ COLLABORATEURS      │
│              │              │              │ (via invitation)    │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│     NON      │     NON      │   REJECTED   │ Invitation refusée  │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
```

## 5. Algorithme de Décision - Suivi

```
┌─────────────────────────────────────────────────────────────────────┐
│              ALGORITHME DE DÉCISION - SUIVI                          │
└─────────────────────────────────────────────────────────────────────┘

                    A clique "Suivre B"
                            │
                            ▼
                    ┌───────────────┐
                    │ A == B ?      │
                    └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    │               │
                   OUI             NON
                    │               │
                    ▼               ▼
            ┌──────────────┐  ┌──────────────┐
            │ ERREUR       │  │ A suit déjà  │
            │ "Impossible" │  │ B ?          │
            └──────────────┘  └──────┬───────┘
                                     │
                             ┌───────┴───────┐
                             │               │
                            OUI             NON
                             │               │
                             ▼               ▼
                     ┌──────────────┐  ┌──────────────┐
                     │ ERREUR       │  │ Créer suivi  │
                     │ "Déjà suivi" │  │ A → B        │
                     └──────────────┘  └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ B suit A ?   │
                                       └──────┬───────┘
                                              │
                                      ┌───────┴───────┐
                                      │               │
                                     OUI             NON
                                      │               │
                                      ▼               ▼
                              ┌──────────────┐  ┌──────────────┐
                              │ Collab existe│  │ Notification │
                              │ déjà ?       │  │ FOLLOW       │
                              └──────┬───────┘  └──────────────┘
                                     │
                             ┌───────┴───────┐
                             │               │
                            OUI             NON
                             │               │
                             ▼               ▼
                     ┌──────────────┐  ┌──────────────┐
                     │ Rien faire   │  │ Créer collab │
                     │              │  │ automatique  │
                     └──────────────┘  └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ Notifications│
                                       │ COLLAB_AUTO  │
                                       │ pour A et B  │
                                       └──────────────┘
```

## 6. Types de Notifications

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TYPES DE NOTIFICATIONS                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┬─────────────────────────────────────────────────┐
│  Type            │  Description                                     │
├──────────────────┼─────────────────────────────────────────────────┤
│ COLLAB_REQUEST   │ B reçoit : "A vous a envoyé une invitation      │
│                  │             de collaboration"                    │
├──────────────────┼─────────────────────────────────────────────────┤
│ COLLAB_ACCEPTED  │ A reçoit : "B a accepté votre invitation        │
│                  │             de collaboration"                    │
├──────────────────┼─────────────────────────────────────────────────┤
│ COLLAB_REJECTED  │ A reçoit : "B a refusé votre invitation         │
│                  │             de collaboration"                    │
├──────────────────┼─────────────────────────────────────────────────┤
│ COLLAB_AUTO      │ A et B reçoivent : "Vous êtes maintenant        │
│                  │                     collaborateurs via suivi     │
│                  │                     mutuel"                      │
├──────────────────┼─────────────────────────────────────────────────┤
│ FOLLOW           │ B reçoit : "A a commencé à vous suivre"         │
└──────────────────┴─────────────────────────────────────────────────┘
```

## 7. Résumé des Règles

```
╔═════════════════════════════════════════════════════════════════════╗
║                         RÈGLES MÉTIER                               ║
╚═════════════════════════════════════════════════════════════════════╝

1. INVITATION
   ✓ Nécessite une acceptation explicite
   ✓ Crée automatiquement les suivis mutuels si acceptée
   ✓ Envoie des notifications à chaque étape

2. SUIVI SIMPLE
   ✓ A suit B → A devient abonné de B
   ✓ Pas de collaboration automatique
   ✓ Notification FOLLOW envoyée à B

3. SUIVI MUTUEL
   ✓ A suit B ET B suit A → Collaboration automatique
   ✓ Pas besoin d'acceptation
   ✓ Notifications COLLAB_AUTO pour les deux

4. ARRÊT DU SUIVI
   ✓ Supprime le suivi
   ✓ Supprime la collaboration SI automatique
   ✓ Garde la collaboration SI via invitation

5. PRÉVENTION
   ✓ Pas de double invitation en attente
   ✓ Pas de double suivi
   ✓ Pas de suivi de soi-même
   ✓ Pas d'invitation à soi-même
```
