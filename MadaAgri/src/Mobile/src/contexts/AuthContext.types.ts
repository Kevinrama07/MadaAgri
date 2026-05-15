// User interface
export interface User {
  id: string;
  email: string;
  name?: string;
  display_name?: string;
  profile_picture?: string;
  phone?: string;
  location?: string;
  region_name?: string;
  bio?: string;
  verified?: boolean;
  role?: 'farmer' | 'client' | 'admin';
  followers?: number;
  followers_count?: number;
  following?: number;
  following_count?: number;
  posts?: number;
  posts_count?: number;
  [key: string]: any;
}

// Auth context interface
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name: string, role: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}
