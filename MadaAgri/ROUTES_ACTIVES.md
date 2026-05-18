# Routes Actives - MadaAgri

## 🗺️ SYSTÈME DE ROUTING ACTIF

**Fichier principal**: `src/frontend/src/router/routes.jsx`  
**Utilisé dans**: `src/frontend/src/App.jsx`

---

## 📍 ROUTES PUBLIQUES (Sans authentification)

| Route | Composant | Fichier | Description |
|-------|-----------|---------|-------------|
| `/` | LandingPage | `pages/Landing/LandingPage.jsx` | Page d'accueil publique |
| `/login` | FormulaireAuth | `pages/Connection/FormulaireAuth.jsx` | Page de connexion/inscription |

---

## 🔐 ROUTES DASHBOARD (Avec authentification)

**Layout**: `DashboardLayout` (inclut Navbar)  
**Base URL**: `/dashboard`

### Routes Principales

| Route | Composant Wrapper | Page Réelle | Description |
|-------|-------------------|-------------|-------------|
| `/dashboard` | FeedPageWrapper | FeedPage | Fil d'actualité social |
| `/dashboard/post` | PublicationPageWrapper | PublicationPage | Créer une publication |
| `/dashboard/network` | NetworkPageWrapper | NetworkPage | Réseau et connexions |
| `/dashboard/messages` | MessagesPageWrapper | MessagesPage | Messagerie |
| `/dashboard/stats` | DashboardPageWrapper | DashboardPage | Statistiques et analytics |

### Routes Produits

| Route | Composant Wrapper | Page Réelle | Description |
|-------|-------------------|-------------|-------------|
| `/dashboard/products` | ProductsPageWrapper | ListeProduits | Liste des produits de l'utilisateur |
| `/dashboard/create` | CreateProductPageWrapper | CreateProductPage | Créer un nouveau produit |
| `/dashboard/product-management` | ProductManagementPageWrapper | ProductManagementPage | Gestion avancée des produits |

### Routes Commandes

| Route | Composant Wrapper | Page Réelle | Description |
|-------|-------------------|-------------|-------------|
| `/dashboard/orders` | OrdersPageWrapper | OrdersPage | Commandes passées |
| `/dashboard/received-orders` | ReceivedOrdersPageWrapper | ReceivedOrdersPage | Commandes reçues |

### Routes Agriculture

| Route | Composant Wrapper | Page Réelle | Description |
|-------|-------------------|-------------|-------------|
| `/dashboard/analysis` | AgriculturePageWrapper | AgriculturePage | Analyse des cultures |
| `/dashboard/routes` | RoutesPageWrapper | RoutesPage | Optimisation d'itinéraires |
| `/dashboard/meteo` | MeteoPageWrapper | MeteoPage | Météo agricole |

---

## 🛒 ROUTES MARKETPLACE (Avec authentification)

**Layout**: `DashboardLayout` (inclut Navbar)  
**Base URL**: `/marketplace`

| Route | Composant | Fichier | Description |
|-------|-----------|---------|-------------|
| `/marketplace` | MarketplacePage | `pages/Marketplace/MarketplacePage.jsx` | Liste des produits du marketplace |
| `/marketplace/:id` | ProductDetailPage | `pages/ProductDetail/ProductDetailPage.jsx` | Détails d'un produit |

---

## 👤 ROUTES PROFIL & PARAMÈTRES (Avec authentification)

**Layout**: `DashboardLayout` (inclut Navbar)

| Route | Composant | Fichier | Description |
|-------|-----------|---------|-------------|
| `/profile` | ProfilePage | `pages/Profile/ProfilePage.jsx` | Profil de l'utilisateur connecté |
| `/profile/:id` | ProfilePage | `pages/Profile/ProfilePage.jsx` | Profil d'un autre utilisateur |
| `/settings` | SettingsPage | `pages/Settings/SettingsPage.jsx` | Paramètres du compte |

---

## 🔄 ARCHITECTURE DES WRAPPERS

Les wrappers servent d'intermédiaire entre les routes et les pages réelles:

```
Route → Wrapper → Page Réelle
```

### Exemple: FeedPageWrapper
```jsx
// pages/Dashboard/FeedPageWrapper.jsx
import { FeedPage } from '../Composants/Dashboard/pages';

export default function FeedPageWrapper() {
  const navigate = useNavigate();
  
  const handleUserProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return <FeedPage onUserProfileClick={handleUserProfileClick} />;
}
```

**Avantages**:
- Séparation des préoccupations (routing vs logique métier)
- Injection de dépendances (navigation, callbacks)
- Réutilisabilité des pages

---

## 🛡️ PROTECTION DES ROUTES

### DashboardLayout
Toutes les routes sous `/dashboard`, `/marketplace`, `/profile`, `/settings` sont protégées par `DashboardLayout`:

```jsx
// layouts/DashboardLayout.jsx
export default function DashboardLayout() {
  const { user, loading } = useAuth();
  
  if (loading) return <PageLoadingFallback />;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
```

**Comportement**:
- ✅ Utilisateur connecté → Affiche la page
- ❌ Utilisateur non connecté → Redirige vers `/login`
- ⏳ Chargement → Affiche un loader

---

## 📦 STRUCTURE DES PAGES

### Pages Wrapper (Dashboard)
```
src/frontend/src/pages/Dashboard/
├── FeedPageWrapper.jsx
├── PublicationPageWrapper.jsx
├── NetworkPageWrapper.jsx
├── MessagesPageWrapper.jsx
├── DashboardPageWrapper.jsx
├── ProductsPageWrapper.jsx
├── CreateProductPageWrapper.jsx
├── OrdersPageWrapper.jsx
├── ReceivedOrdersPageWrapper.jsx
├── ProductManagementPageWrapper.jsx
├── AgriculturePageWrapper.jsx
├── RoutesPageWrapper.jsx
└── MeteoPageWrapper.jsx
```

### Pages Réelles (Composants)
```
src/frontend/src/pages/Composants/Dashboard/pages/
├── FeedPage.jsx
├── PublicationPage.jsx
├── NetworkPage.jsx
├── MessagesPage.jsx
├── OrdersPage.jsx
├── ReceivedOrdersPage.jsx
├── ProductManagementPage.jsx
├── AgriculturePage.jsx
├── RoutesPage.jsx
├── MeteoPage.jsx
└── index.js (exports)
```

### Pages Standalone
```
src/frontend/src/pages/
├── Landing/LandingPage.jsx
├── Connection/FormulaireAuth.jsx
├── Marketplace/MarketplacePage.jsx
├── ProductDetail/ProductDetailPage.jsx
├── Profile/ProfilePage.jsx
├── Settings/SettingsPage.jsx
├── CreateProduct/CreateProductPage.jsx
├── Dashboard/DashboardPage.jsx
└── Produits/ListeProduits.jsx
```

---

## 🚫 ROUTES NON IMPLÉMENTÉES

Ces fonctionnalités n'ont pas de routes actives:

| Fonctionnalité | Fichiers Existants | Status |
|----------------|-------------------|--------|
| Notifications | `pages/Notifications/NotificationsPage.jsx` | ❌ Pas de route |
| Collaborations | `pages/Utilisateurs/InvitationsCollaborateurs.jsx` | ❌ Pas de route |
| Analyse IA Cultures | `pages/Cultures/AICropAnalysis.jsx` | ❌ Pas de route |
| Carte Parcelles | `pages/Cultures/ParcelMap.jsx` | ❌ Pas de route |
| Optimisation Itinéraire | `pages/Carte/OptimisationItineraire.jsx` | ❌ Pas de route |

---

## 🔧 AJOUTER UNE NOUVELLE ROUTE

### 1. Route Simple (sans wrapper)
```jsx
// Dans router/routes.jsx
const NewPage = lazy(() => import('../pages/NewFeature/NewPage'));

// Ajouter dans les routes
{
  path: '/new-feature',
  element: <DashboardLayout />,
  children: [
    { path: '', element: withSuspense(NewPage) }
  ]
}
```

### 2. Route avec Wrapper
```jsx
// 1. Créer le wrapper
// pages/Dashboard/NewFeaturePageWrapper.jsx
import { NewFeaturePage } from '../Composants/Dashboard/pages';

export default function NewFeaturePageWrapper() {
  return <NewFeaturePage />;
}

// 2. Ajouter dans routes.jsx
const NewFeaturePageWrapper = lazy(() => import('../pages/Dashboard/NewFeaturePageWrapper'));

// 3. Ajouter la route
{
  path: '/dashboard',
  element: <DashboardLayout />,
  children: [
    { path: 'new-feature', element: withSuspense(NewFeaturePageWrapper) }
  ]
}
```

---

## 📊 STATISTIQUES

- **Routes publiques**: 2
- **Routes dashboard**: 13
- **Routes marketplace**: 2
- **Routes profil/settings**: 3
- **Total routes actives**: 20

- **Wrappers utilisés**: 13
- **Pages réelles**: 33
- **Layouts**: 1 (DashboardLayout)

---

## 🔍 NAVIGATION DANS L'APP

### Flux Utilisateur Non Connecté
```
/ (Landing) → /login → /dashboard (après connexion)
```

### Flux Utilisateur Connecté
```
/dashboard (Feed)
├── /dashboard/post (Créer publication)
├── /dashboard/network (Réseau)
├── /dashboard/messages (Messages)
├── /dashboard/stats (Statistiques)
├── /dashboard/products (Mes produits)
├── /dashboard/create (Créer produit)
├── /dashboard/orders (Mes commandes)
├── /dashboard/received-orders (Commandes reçues)
├── /dashboard/product-management (Gestion produits)
├── /dashboard/analysis (Analyse cultures)
├── /dashboard/routes (Optimisation routes)
└── /dashboard/meteo (Météo)

/marketplace
├── /marketplace (Liste produits)
└── /marketplace/:id (Détail produit)

/profile
├── /profile (Mon profil)
└── /profile/:id (Profil utilisateur)

/settings (Paramètres)
```

---

## ✅ VALIDATION

Pour vérifier qu'une route fonctionne:
1. Démarrer l'app: `npm run dev`
2. Naviguer vers la route
3. Vérifier que la page s'affiche
4. Vérifier la console pour les erreurs

Pour tester l'authentification:
1. Aller sur une route protégée sans être connecté
2. Vérifier la redirection vers `/login`
3. Se connecter
4. Vérifier la redirection vers la page demandée
