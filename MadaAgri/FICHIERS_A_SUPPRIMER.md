# Liste des Fichiers à Supprimer - MadaAgri

## 🗑️ SUPPRESSION IMMÉDIATE RECOMMANDÉE

### Doublons de Pages Principales (4 fichiers + 4 CSS)
```
src/frontend/src/pages/Landing/Landing.jsx
src/frontend/src/pages/Landing/Landing.module.css
src/frontend/src/pages/Marketplace/Marketplace.jsx
src/frontend/src/pages/Marketplace/Marketplace.module.css
src/frontend/src/pages/Dashboard/Dashboard.jsx
src/frontend/src/pages/Dashboard/Dashboard.module.css
src/frontend/src/pages/ProductDetail/ProductDetail.jsx
src/frontend/src/pages/ProductDetail/ProductDetail.module.css
```

### Ancien Système de Routing (1 fichier)
```
src/frontend/src/AppRoutes.jsx
```

### Composants Landing Non Utilisés (12 fichiers)
```
src/frontend/src/pages/Landing/CTASection.jsx
src/frontend/src/pages/Landing/CTASection.module.css
src/frontend/src/pages/Landing/FeaturesSection.jsx
src/frontend/src/pages/Landing/FeaturesSection.module.css
src/frontend/src/pages/Landing/HeroSection.jsx
src/frontend/src/pages/Landing/HeroSection.module.css
src/frontend/src/pages/Landing/ModernFooter.jsx
src/frontend/src/pages/Landing/ModernFooter.module.css
src/frontend/src/pages/Landing/StatsSection.jsx
src/frontend/src/pages/Landing/StatsSection.module.css
src/frontend/src/pages/Landing/ValueProps.jsx
src/frontend/src/pages/Landing/ValueProps.module.css
```

### Composants Marketplace Non Utilisés (8 fichiers)
```
src/frontend/src/pages/Marketplace/Cart.jsx
src/frontend/src/pages/Marketplace/Cart.module.css
src/frontend/src/pages/Marketplace/ModalDetailsProduct.jsx
src/frontend/src/pages/Marketplace/ModalDetailsProduct.module.css
src/frontend/src/pages/Marketplace/Orders.jsx
src/frontend/src/pages/Marketplace/Orders.module.css
src/frontend/src/pages/Marketplace/ReceivedOrders.jsx
src/frontend/src/pages/Marketplace/ReceivedOrders.module.css
```

### Composants Dashboard Non Utilisés (12 fichiers)
```
src/frontend/src/pages/Composants/ImageUploader.jsx
src/frontend/src/pages/Composants/LeftSidebar.jsx
src/frontend/src/pages/Composants/RightSidebar.jsx
src/frontend/src/pages/Composants/SuggestionCard.jsx
src/frontend/src/pages/Composants/TableauDeBord.jsx
src/frontend/src/pages/Composants/WeatherWidget.jsx
src/frontend/src/pages/Composants/Dashboard/pages/ProductsPage.jsx
src/frontend/src/pages/Composants/Dashboard/pages/ProfilePage.jsx
src/frontend/src/pages/Composants/Dashboard/pages/SettingsPage.jsx
src/frontend/src/pages/Composants/Dashboard/pages/MarketplacePage.jsx
src/frontend/src/pages/Composants/Dashboard/pages/UserProfilePage.jsx
```

### Pages Cultures Non Utilisées (6 fichiers)
```
src/frontend/src/pages/Cultures/AICropAnalysis.jsx
src/frontend/src/pages/Cultures/AICropAnalysis.module.css
src/frontend/src/pages/Cultures/AnalyseCulture.jsx
src/frontend/src/pages/Cultures/AnalyseCulture.module.css
src/frontend/src/pages/Cultures/ParcelMap.jsx
src/frontend/src/pages/Cultures/ParcelMap.module.css
```

### Pages Carte Non Utilisées (2 fichiers)
```
src/frontend/src/pages/Carte/OptimisationItineraire.jsx
src/frontend/src/pages/Carte/OptimisationItineraire.module.css
```

### Pages Messages Non Utilisées (7 fichiers)
```
src/frontend/src/pages/Messages/ChatHeader.jsx
src/frontend/src/pages/Messages/ChatInput.jsx
src/frontend/src/pages/Messages/ChatSidebar.jsx
src/frontend/src/pages/Messages/MessageBubble.jsx
src/frontend/src/pages/Messages/MessageList.jsx
src/frontend/src/pages/Messages/Messagerie.jsx
src/frontend/src/pages/Messages/MessagerieStyles.module.css
```

### Pages Meteo Non Utilisées (4 fichiers)
```
src/frontend/src/pages/Meteo/Meteo.jsx
src/frontend/src/pages/Meteo/Meteo.module.css
src/frontend/src/pages/Meteo/MeteoWeather.jsx
src/frontend/src/pages/Meteo/MeteoWeather.module.css
```

### Pages Notifications Non Utilisées (2 fichiers)
```
src/frontend/src/pages/Notifications/NotificationsPage.jsx
src/frontend/src/pages/Notifications/NotificationsPage.module.css
```

### Pages Publications Non Utilisées (10 fichiers)
```
src/frontend/src/pages/Publications/CreatePost.jsx
src/frontend/src/pages/Publications/CreatePost.module.css
src/frontend/src/pages/Publications/FormulairePublication.jsx
src/frontend/src/pages/Publications/FormulairePublication.module.css
src/frontend/src/pages/Publications/HomeFeed.jsx
src/frontend/src/pages/Publications/PostCard.jsx
src/frontend/src/pages/Publications/PostCard.module.css
src/frontend/src/pages/Publications/SocialFeed.jsx
src/frontend/src/pages/Publications/SocialFeed.module.css
```

### Pages Utilisateurs Non Utilisées (6 fichiers)
```
src/frontend/src/pages/Utilisateurs/InvitationsCollaborateurs.jsx
src/frontend/src/pages/Utilisateurs/InvitationsCollaborateurs.module.css
src/frontend/src/pages/Utilisateurs/ProfilePage.jsx
src/frontend/src/pages/Utilisateurs/ProfilePage.module.css
src/frontend/src/pages/Utilisateurs/UserProfile.jsx
src/frontend/src/pages/Utilisateurs/UserProfile.module.css
```

---

## 📊 TOTAL À SUPPRIMER

- **Fichiers JSX**: 46 fichiers
- **Fichiers CSS**: 23 fichiers
- **Total**: **69 fichiers**

---

## 🔧 COMMANDES DE SUPPRESSION

### Windows (PowerShell)
```powershell
# Naviguer vers le dossier frontend
cd "c:\Mes_fichiers\DEV\Projet transversal\MadaAgri\src\frontend\src"

# Supprimer AppRoutes.jsx
Remove-Item "AppRoutes.jsx"

# Supprimer les doublons principaux
Remove-Item "pages\Landing\Landing.jsx"
Remove-Item "pages\Landing\Landing.module.css"
Remove-Item "pages\Marketplace\Marketplace.jsx"
Remove-Item "pages\Marketplace\Marketplace.module.css"
Remove-Item "pages\Dashboard\Dashboard.jsx"
Remove-Item "pages\Dashboard\Dashboard.module.css"
Remove-Item "pages\ProductDetail\ProductDetail.jsx"
Remove-Item "pages\ProductDetail\ProductDetail.module.css"

# Supprimer les dossiers entiers non utilisés
Remove-Item -Recurse "pages\Carte"
Remove-Item -Recurse "pages\Cultures"
Remove-Item -Recurse "pages\Messages"
Remove-Item -Recurse "pages\Meteo"
Remove-Item -Recurse "pages\Notifications"
Remove-Item -Recurse "pages\Publications"
Remove-Item -Recurse "pages\Utilisateurs"

# Supprimer les composants Landing non utilisés
Remove-Item "pages\Landing\CTASection.jsx"
Remove-Item "pages\Landing\CTASection.module.css"
Remove-Item "pages\Landing\FeaturesSection.jsx"
Remove-Item "pages\Landing\FeaturesSection.module.css"
Remove-Item "pages\Landing\HeroSection.jsx"
Remove-Item "pages\Landing\HeroSection.module.css"
Remove-Item "pages\Landing\ModernFooter.jsx"
Remove-Item "pages\Landing\ModernFooter.module.css"
Remove-Item "pages\Landing\StatsSection.jsx"
Remove-Item "pages\Landing\StatsSection.module.css"
Remove-Item "pages\Landing\ValueProps.jsx"
Remove-Item "pages\Landing\ValueProps.module.css"

# Supprimer les composants Marketplace non utilisés
Remove-Item "pages\Marketplace\Cart.jsx"
Remove-Item "pages\Marketplace\Cart.module.css"
Remove-Item "pages\Marketplace\ModalDetailsProduct.jsx"
Remove-Item "pages\Marketplace\ModalDetailsProduct.module.css"
Remove-Item "pages\Marketplace\Orders.jsx"
Remove-Item "pages\Marketplace\Orders.module.css"
Remove-Item "pages\Marketplace\ReceivedOrders.jsx"
Remove-Item "pages\Marketplace\ReceivedOrders.module.css"

# Supprimer les composants Dashboard non utilisés
Remove-Item "pages\Composants\ImageUploader.jsx"
Remove-Item "pages\Composants\LeftSidebar.jsx"
Remove-Item "pages\Composants\RightSidebar.jsx"
Remove-Item "pages\Composants\SuggestionCard.jsx"
Remove-Item "pages\Composants\TableauDeBord.jsx"
Remove-Item "pages\Composants\WeatherWidget.jsx"
Remove-Item "pages\Composants\Dashboard\pages\ProductsPage.jsx"
Remove-Item "pages\Composants\Dashboard\pages\ProfilePage.jsx"
Remove-Item "pages\Composants\Dashboard\pages\SettingsPage.jsx"
Remove-Item "pages\Composants\Dashboard\pages\MarketplacePage.jsx"
Remove-Item "pages\Composants\Dashboard\pages\UserProfilePage.jsx"
```

### Linux/Mac (Bash)
```bash
# Naviguer vers le dossier frontend
cd "c:/Mes_fichiers/DEV/Projet transversal/MadaAgri/src/frontend/src"

# Supprimer AppRoutes.jsx
rm AppRoutes.jsx

# Supprimer les doublons principaux
rm pages/Landing/Landing.jsx pages/Landing/Landing.module.css
rm pages/Marketplace/Marketplace.jsx pages/Marketplace/Marketplace.module.css
rm pages/Dashboard/Dashboard.jsx pages/Dashboard/Dashboard.module.css
rm pages/ProductDetail/ProductDetail.jsx pages/ProductDetail/ProductDetail.module.css

# Supprimer les dossiers entiers non utilisés
rm -rf pages/Carte
rm -rf pages/Cultures
rm -rf pages/Messages
rm -rf pages/Meteo
rm -rf pages/Notifications
rm -rf pages/Publications
rm -rf pages/Utilisateurs

# Supprimer les composants Landing non utilisés
rm pages/Landing/CTASection.* pages/Landing/FeaturesSection.*
rm pages/Landing/HeroSection.* pages/Landing/ModernFooter.*
rm pages/Landing/StatsSection.* pages/Landing/ValueProps.*

# Supprimer les composants Marketplace non utilisés
rm pages/Marketplace/Cart.* pages/Marketplace/ModalDetailsProduct.*
rm pages/Marketplace/Orders.* pages/Marketplace/ReceivedOrders.*

# Supprimer les composants Dashboard non utilisés
rm pages/Composants/ImageUploader.jsx pages/Composants/LeftSidebar.jsx
rm pages/Composants/RightSidebar.jsx pages/Composants/SuggestionCard.jsx
rm pages/Composants/TableauDeBord.jsx pages/Composants/WeatherWidget.jsx
rm pages/Composants/Dashboard/pages/ProductsPage.jsx
rm pages/Composants/Dashboard/pages/ProfilePage.jsx
rm pages/Composants/Dashboard/pages/SettingsPage.jsx
rm pages/Composants/Dashboard/pages/MarketplacePage.jsx
rm pages/Composants/Dashboard/pages/UserProfilePage.jsx
```

---

## ⚠️ AVERTISSEMENT

Avant de supprimer ces fichiers:
1. ✅ Faire un commit Git de l'état actuel
2. ✅ Créer une branche de nettoyage: `git checkout -b cleanup/unused-pages`
3. ✅ Vérifier que l'application fonctionne après chaque suppression
4. ✅ Tester toutes les routes principales
5. ✅ Vérifier qu'aucun import caché n'utilise ces fichiers

---

## 📝 NOTES

- Ces fichiers ont été identifiés comme non utilisés basé sur l'analyse des routes actives
- Certains peuvent contenir du code réutilisable à extraire avant suppression
- Les dossiers entiers (Carte, Cultures, Messages, etc.) peuvent être archivés au lieu d'être supprimés
