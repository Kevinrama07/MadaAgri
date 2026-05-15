/**
 * Configuration des onglets du Dashboard
 * Centralize toutes les constantes d'onglets
 */

export const TABS = {
  // Sociaux
  FEED: 'feed',
  POST: 'post',
  NETWORK: 'network',
  SEARCH: 'search',
  
  // Produits
  PRODUCTS: 'products',
  CREATE: 'create',
  PRODUCT_MANAGEMENT: 'product_management',
  
  // Marketplace
  MARKETPLACE: 'marketplace',
  ORDERS: 'orders',
  RECEIVED_ORDERS: 'received_orders',
  
  // Agriculture
  ANALYSIS: 'analysis',
  ROUTES: 'routes',
  METEO_PAGE: 'meteo_page',
  
  // Messages
  MESSAGES: 'messages',
  
  // Anciennes (legacy)
  METEO: 'meteo',
  
  // Profils
  PROFILE: 'profile',
  USER_PROFILE: 'user_profile',
  
  // Système
  SETTINGS: 'settings',
};

export const TAB_GROUPS = {
  MAIN: ['feed', 'post', 'network', 'messages'],
  PRODUCTS: ['products', 'create', 'product_management'],
  MARKETPLACE: ['marketplace', 'orders', 'received_orders'],
  AGRICULTURE: ['analysis', 'routes', 'meteo_page'],
  SYSTEM: ['profile', 'user_profile', 'settings', 'search'],
};

export const TAB_ICONS = {
  [TABS.FEED]: 'FiHome',
  [TABS.POST]: 'FiEdit2',
  [TABS.PRODUCTS]: 'FiGrid',
  [TABS.CREATE]: 'FiPlusCircle',
  [TABS.PRODUCT_MANAGEMENT]: 'FiTool',
  [TABS.MESSAGES]: 'FiMessageCircle',
  [TABS.METEO]: 'FiCloud',
  [TABS.ANALYSIS]: 'FiBarChart2',
  [TABS.ROUTES]: 'FiMap',
  [TABS.NETWORK]: 'FiUsers',
  [TABS.MARKETPLACE]: 'FiShoppingCart',
  [TABS.ORDERS]: 'FiBox',
  [TABS.RECEIVED_ORDERS]: 'FiInbox',
  [TABS.SETTINGS]: 'FiSettings',
  [TABS.PROFILE]: 'FiUser',
  [TABS.SEARCH]: 'FiSearch',
};

export const TAB_LABELS = {
  [TABS.FEED]: 'Accueil',
  [TABS.POST]: 'Ajouter une publication',
  [TABS.PRODUCTS]: 'Liste des produits',
  [TABS.CREATE]: 'Ajouter un produit',
  [TABS.PRODUCT_MANAGEMENT]: 'Gestion des produits',
  [TABS.MESSAGES]: 'Messages',
  [TABS.METEO]: 'Météo',
  [TABS.ANALYSIS]: 'Analyse',
  [TABS.ROUTES]: 'Optimisation des routes',
  [TABS.NETWORK]: 'Invitations collaborateurs',
  [TABS.MARKETPLACE]: 'Marketplace',
  [TABS.ORDERS]: 'Mes commandes',
  [TABS.RECEIVED_ORDERS]: 'Commandes reçues',
  [TABS.SETTINGS]: 'Paramètres',
  [TABS.PROFILE]: 'Mon profil',
  [TABS.SEARCH]: 'Recherche',
  [TABS.USER_PROFILE]: 'Profil utilisateur',
  [TABS.METEO_PAGE]: 'Météo détaillée',
};
