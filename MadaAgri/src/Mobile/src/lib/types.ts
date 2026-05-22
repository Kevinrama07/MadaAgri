export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'client' | 'farmer';
  profilePicture?: string;
  bio?: string;
  region_id?: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
}

// ============================================================================
// PRODUITS
// ============================================================================

export interface Product {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_image?: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  unit: string;
  image_url?: string;
  region_id: number;
  culture_id: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  farmer_id: string;
  farmer_name: string;
  quantity: number;
}

// ============================================================================
// COMMANDES
// ============================================================================

export interface Reservation {
  id: string;
  user_id: string;
  farmer_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'delivered';
  total_price: number;
  created_at: string;
  updated_at: string;
  items: ReservationItem[];
}

export interface ReservationItem {
  product_id: string;
  product_title: string;
  quantity: number;
  price: number;
}

// ============================================================================
// PUBLICATIONS
// ============================================================================

export interface Post {
  id: string;
  user_id: string;
  author_name: string;
  author_image?: string;
  content: string;
  image_url?: string;
  video_url?: string;
  video_thumbnail?: string;
  video_duration?: number;
  video_views?: number;
  region_id?: number;
  culture_id?: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  liked_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_image?: string;
  content: string;
  likes_count: number;
  replies_count: number;
  liked_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  author_name: string;
  author_image?: string;
  content: string;
  likes_count: number;
  liked_by_me: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MESSAGERIE
// ============================================================================

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_image?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'order' | 'invitation';
  actor_id: string;
  actor_name: string;
  actor_image?: string;
  content: string;
  related_id?: string;
  read: boolean;
  created_at: string;
}

// ============================================================================
// RÉSEAU SOCIAL
// ============================================================================

export interface Suggestion {
  id: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  reason: string;
  followers_count: number;
}

export interface Invitation {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_image?: string;
  recipient_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

// ============================================================================
// ANALYSES
// ============================================================================

export interface RegionCulture {
  culture_id: number;
  culture_name: string;
  region_id: number;
  region_name: string;
  total_production: number;
  average_yield: number;
  farmers_count: number;
}

export interface CultureRecommendation {
  culture_id: number;
  culture_name: string;
  score: number;
  reason: string;
  average_yield: number;
  farmers_count: number;
}

export interface Delivery {
  id: string;
  farmer_id: string;
  product_id: string;
  product_title: string;
  quantity: number;
  destination: string;
  status: 'pending' | 'in_transit' | 'delivered';
  created_at: string;
}

// ============================================================================
// OPTIMISATION
// ============================================================================

export interface Route {
  waypoints: Waypoint[];
  distance: number;
  duration: number;
  optimized: boolean;
}

export interface Waypoint {
  region_id: number;
  region_name: string;
  latitude: number;
  longitude: number;
}

export interface RouteComparison {
  dijkstra: Route;
  nearest_neighbor: Route;
  genetic_algorithm: Route;
  best: 'dijkstra' | 'nearest_neighbor' | 'genetic_algorithm';
}

// ============================================================================
// MÉTADONNÉES
// ============================================================================

export interface Region {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface Culture {
  id: number;
  name: string;
  description?: string;
}

// ============================================================================
// RÉPONSES API
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================================================
// ERREURS
// ============================================================================

export interface ApiError {
  statusCode: number;
  message: string;
  path?: string;
  timestamp?: string;
}

export class UserDeletedError extends Error {
  statusCode = 404;
  constructor(message = 'Votre compte a été supprimé') {
    super(message);
    this.name = 'UserDeletedError';
  }
}

// ============================================================================
// FILTRES ET OPTIONS
// ============================================================================

export interface ProductFilters {
  searchQuery?: string;
  regionId?: number;
  cultureId?: number;
  sortBy?: 'recent' | 'price-asc' | 'price-desc';
  minPrice?: number;
  maxPrice?: number;
}

export interface PostFilters {
  searchQuery?: string;
  sortBy?: 'recent' | 'popular' | 'trending';
  regionId?: number;
  cultureId?: number;
}

export interface SearchOptions {
  query: string;
  type?: 'users' | 'products' | 'posts' | 'all';
  limit?: number;
  offset?: number;
}

// ============================================================================
// ÉTATS
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// NAVIGATION
// ============================================================================

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  Splash: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Marketplace: undefined;
  MarketplaceDetail: { productId: string };
  Cart: undefined;
  Orders: undefined;
  ReceivedOrders: undefined;
  Messages: undefined;
  ChatDetail: { conversationId: string };
  Notifications: undefined;
  Profile: undefined;
  UserProfile: { userId: string };
  CreatePost: undefined;
  PostDetail: { postId: string };
  Optimization: undefined;
  Analysis: undefined;
  Search: undefined;
  Settings: undefined;
  Followers: { userId: string };
  Following: { userId: string };
  Invitations: undefined;
  Suggestions: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

// ============================================================================
// ÉVÉNEMENTS SOCKET.IO
// ============================================================================

export interface SocketEvents {
  'message:send': (data: { recipient_id: string; content: string }) => void;
  'message:new': (message: Message) => void;
  'message:read': (data: { messageId: string }) => void;
  'notification:new': (notification: Notification) => void;
  'user:activity': (activity: UserActivity) => void;
  'user:typing': (data: { recipient_id: string }) => void;
  'user:status': (data: { status: 'online' | 'offline' | 'away' }) => void;
  'post:new': (post: Post) => void;
  'post:liked': (data: { postId: string; userId: string }) => void;
  'post:commented': (data: { postId: string; comment: Comment }) => void;
  'user:followed': (data: { userId: string; followerId: string }) => void;
  'order:status': (data: { orderId: string; status: string }) => void;
}

export interface UserActivity {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
}
