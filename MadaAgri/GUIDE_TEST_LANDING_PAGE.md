# 🧪 Guide de Test - Landing Page MadaAgri

## ✅ Checklist de Validation

### 1️⃣ Hero Section
Au chargement de la page, vérifier:
- [ ] Titre "Connectez les agriculteurs de Madagascar" **visible et reste affiché**
- [ ] Sous-titre "Partagez vos cultures..." **visible et reste affiché**
- [ ] Bouton "S'inscrire gratuitement" **visible et reste affiché**
- [ ] Bouton "Se connecter" **visible et reste affiché**
- [ ] Indicateur scroll en bas animé

**Résultat Attendu**: Les textes et boutons apparaissent progressivement et **RESTENT VISIBLES** (ne disparaissent pas après quelques secondes)

---

### 2️⃣ Feed Preview (Aperçu du réseau)
En scrollant vers le bas:
- [ ] Titre "Aperçu du réseau" apparaît
- [ ] 3 cartes de publication apparaissent avec animation
- [ ] Chaque carte affiche:
  - [ ] Avatar + nom auteur
  - [ ] Région
  - [ ] Image
  - [ ] Boutons (like, comment, share)
  - [ ] Statistiques (likes, commentaires)
  - [ ] Timestamp

**Résultat Attendu**: Les cartes restent visibles après l'animation

---

### 3️⃣ Fonctionnalités (4 Blocs)
- [ ] "Partage Agricole" avec icône 🌾
- [ ] "Collaboration" avec icône 🤝
- [ ] "Suivi des Cultures" avec icône 📊
- [ ] "Réseau Local" avec icône 🌍
- [ ] Hover effect sur les cartes (élévation)

**Résultat Attendu**: Tous les blocs s'affichent et restent visibles

---

### 4️⃣ Communauté (6 Profils)
- [ ] Section "Notre Communauté" visible
- [ ] 6 avatars en grille apparaissent
- [ ] Chaque profil affiche:
  - [ ] Avatar
  - [ ] Nom
  - [ ] Culture (ex: Riz, Tomates, Maïs)
  - [ ] Région

**Résultat Attendu**: Tous les profils restent affichés

---

### 5️⃣ Statistiques (Chiffres Clés)
- [ ] Titre "Chiffres clés" visible
- [ ] 4 cartes de statistiques avec compteurs:
  - [ ] 10000+ Agriculteurs (👨‍🌾)
  - [ ] 5000+ Publications (📸)
  - [ ] 22 Régions (🗺️)
  - [ ] 100000+ Interactions (💬)
- [ ] Les nombres sont **animés** (compteur qui monte)

**Résultat Attendu**: Les stats s'animent et restent visibles

---

### 6️⃣ Call-to-Action (CTA)
- [ ] Titre "Prêt à rejoindre la communauté?" visible
- [ ] Sous-titre visible
- [ ] Bouton "S'inscrire gratuitement" visible et clickable
- [ ] Bouton "Ou connectez-vous" visible et clickable
- [ ] Note "Pas de carte bancaire requise..." visible

**Résultat Attendu**: Tous les éléments CTA restent visibles

---

### 7️⃣ Footer
- [ ] Logo "MadaAgri" visible
- [ ] Section "Ressources" avec liens
- [ ] Section "Entreprise" avec liens
- [ ] Section "Légal" avec liens
- [ ] Icônes réseaux sociaux
- [ ] Copyright text

**Résultat Attendu**: Footer complet et fonctionnel

---

## 🔄 Tests Interactifs

### Boutons
```
Action: Cliquer sur "S'inscrire gratuitement"
Résultat Attendu: Page change vers formulaire d'inscription
```

```
Action: Cliquer sur "Se connecter"
Résultat Attendu: Page change vers formulaire de connexion
```

### Hover Effects
```
Action: Survoler une carte de fonctionnalité
Résultat Attendu: Carte s'élève légèrement (translateY: -8px)
```

```
Action: Survoler une publication
Résultat Attendu: Bordure s'illumine, ombre augmente
```

---

## 📱 Tests Responsive

### Desktop (1200px+)
- [ ] Page affichée correctement
- [ ] Grilles à plusieurs colonnes
- [ ] Spacing approprié

### Tablet (768px - 1199px)
- [ ] Page responsive
- [ ] Grilles adaptées
- [ ] Textes lisibles

### Mobile (480px - 767px)
- [ ] Page complètement responsive
- [ ] Boutons assez grands (min 44px)
- [ ] Textes lisibles

### Small Mobile (< 480px)
- [ ] Page fonctionnelle
- [ ] No layout breaks
- [ ] Textes lisibles

---

## 🌐 Tests Navigation Scroll

- [ ] Scroll fluide
- [ ] Animations déclenchées au bon moment
- [ ] Pas de lag ou freeze
- [ ] Scroll-to-smooth fonctionne

---

## 🎨 Tests Visuels

- [ ] Couleurs cohérentes (vert agricole #2e7d32)
- [ ] Gradients fluides
- [ ] Ombres subtiles
- [ ] Border radius cohérent

---

## ⚡ Tests Performance

### Navigateur DevTools Console
```javascript
// Vérifier pas d'erreurs critiques
console.log('Errors: '); // Doit être vide ou warnings seulement

// Vérifier les animations GSAP
gsap.globalTimeline.getChildren(); // Voir les animations actives
```

---

## 📝 Rapport de Tests

Remplir après avoir testé:

```
Date: ___________
Navigateur: ___________
Device: ___________

✓ Général
  - Page charge sans erreur: [ ]
  - Tous les éléments visibles: [ ]

✓ Hero Section
  - Titre reste visible: [ ]
  - Boutons restent visibles: [ ]
  - Animations fluides: [ ]

✓ Feed Preview
  - Cartes apparaissent: [ ]
  - Images chargent: [ ]
  - Cartes restent visibles: [ ]

✓ Autres Sections
  - Toutes sections visibles: [ ]
  - Animations fluides: [ ]

✓ Interactivité
  - Boutons clickable: [ ]
  - Hover effects: [ ]
  - Navigation fonctionne: [ ]

✓ Responsive
  - Desktop OK: [ ]
  - Tablet OK: [ ]
  - Mobile OK: [ ]

Notes:
_____________________________________________
_____________________________________________
```

---

## 🚀 Commandes pour Tester

### Démarrer le dev server
```bash
cd src/frontend
npm run dev
```

### Ouvrir la page
```
http://localhost:5173
```

### Chrome DevTools
1. Appuyer sur `F12`
2. Aller à l'onglet "Console"
3. Vérifier pas d'erreurs rouges

### Inspecter les Animations
```javascript
// Dans la console:
gsap.globalTimeline.progress(0.5) // Test progression
```

---

## ❌ Dépannage

### Problème: Éléments disparaissent
**Solution**: Vérifier que toutes les animations utilisent `gsap.fromTo()` et non `gsap.from()`

### Problème: Animations lag
**Solution**: Vérifier `force3D: true` sur toutes les animations

### Problème: Images ne chargent pas
**Solution**: Vérifier les URLs Unsplash ou remplacer par vraies images

### Problème: Scroll trigger ne se déclenche pas
**Solution**: Vérifier que `gsap.registerPlugin(ScrollTrigger)` est appelé

---

**Statut**: ✓ PRÊT POUR TEST COMPLET
