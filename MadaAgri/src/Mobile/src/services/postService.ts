import { dataApi } from '../lib/api';

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
  replies?: CommentReply[];
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

class PostService {
  /**
   * Récupérer les publications du feed
   */
  async fetchPosts(options: { q?: string; sort?: string } = {}): Promise<Post[]> {
    try {
      const posts = await dataApi.fetchPosts(options);
      return posts;
    } catch (error) {
      console.error('[PostService] Erreur fetchPosts:', error);
      throw error;
    }
  }

  /**
   * Récupérer les publications d'un utilisateur
   */
  async fetchUserPosts(userId: string): Promise<Post[]> {
    try {
      const posts = await dataApi.fetchUserPosts(userId);
      return posts;
    } catch (error) {
      console.error('[PostService] Erreur fetchUserPosts:', error);
      throw error;
    }
  }

  /**
   * Créer une publication
   */
  async createPost(post: {
    content: string;
    image_url?: string;
    video_url?: string;
    video_thumbnail?: string;
    video_duration?: number;
    region_id?: number;
    culture_id?: number;
  }): Promise<Post> {
    try {
      const newPost = await dataApi.createPost(post);
      return newPost;
    } catch (error) {
      console.error('[PostService] Erreur createPost:', error);
      throw error;
    }
  }

  /**
   * Liker une publication
   */
  async likePost(postId: string) {
    try {
      const result = await dataApi.likePost(postId);
      return result;
    } catch (error) {
      console.error('[PostService] Erreur likePost:', error);
      throw error;
    }
  }

  /**
   * Retirer un like d'une publication
   */
  async unlikePost(postId: string) {
    try {
      const result = await dataApi.unlikePost(postId);
      return result;
    } catch (error) {
      console.error('[PostService] Erreur unlikePost:', error);
      throw error;
    }
  }

  /**
   * Compter une vue vidéo
   */
  async trackVideoView(postId: string) {
    try {
      const result = await dataApi.trackVideoView(postId);
      return result;
    } catch (error) {
      console.error('[PostService] Erreur trackVideoView:', error);
      throw error;
    }
  }

  /**
   * Récupérer les commentaires d'une publication
   */
  async fetchPostComments(postId: string): Promise<Comment[]> {
    try {
      const comments = await dataApi.fetchPostComments(postId);
      return comments;
    } catch (error) {
      console.error('[PostService] Erreur fetchPostComments:', error);
      throw error;
    }
  }

  /**
   * Créer un commentaire sur une publication
   */
  async createPostComment(postId: string, content: string): Promise<Comment> {
    try {
      const comment = await dataApi.createPostComment(postId, content);
      return comment;
    } catch (error) {
      console.error('[PostService] Erreur createPostComment:', error);
      throw error;
    }
  }

  /**
   * Créer une réponse à un commentaire
   */
  async createCommentReply(commentId: string, content: string): Promise<CommentReply> {
    try {
      const reply = await dataApi.createPostCommentComment(commentId, content);
      return reply;
    } catch (error) {
      console.error('[PostService] Erreur createCommentReply:', error);
      throw error;
    }
  }

  /**
   * Récupérer les réponses d'un commentaire
   */
  async fetchCommentReplies(commentId: string): Promise<CommentReply[]> {
    try {
      const replies = await dataApi.fetchCommentReplies(commentId);
      return replies;
    } catch (error) {
      console.error('[PostService] Erreur fetchCommentReplies:', error);
      throw error;
    }
  }

  /**
   * Formater la date de création
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR');
  }
}

export const postService = new PostService();
export default postService;
