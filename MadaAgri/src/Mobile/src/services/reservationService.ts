import { dataApi } from '../lib/api';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  farmer_id: string;
  farmer_name: string;
  quantity: number;
}

export interface ReservationItem {
  product_id: string;
  quantity: number;
  farmer_id: string;
  price: number;
}

export interface Reservation {
  id: string;
  user_id: string;
  farmer_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'delivered';
  total_price: number;
  created_at: string;
  updated_at: string;
  items: Array<{
    product_id: string;
    product_title: string;
    quantity: number;
    price: number;
  }>;
}

class ReservationService {
  /**
   * Ajouter un produit au panier
   */
  async addToCart(productId: string, quantity: number) {
    try {
      const result = await dataApi.addToCart(productId, quantity);
      return result;
    } catch (error) {
      console.error('[ReservationService] Erreur addToCart:', error);
      throw error;
    }
  }

  /**
   * Créer une réservation à partir du panier
   */
  async createReservation(items: ReservationItem[]) {
    try {
      const result = await dataApi.createReservation(items);
      return result;
    } catch (error) {
      console.error('[ReservationService] Erreur createReservation:', error);
      throw error;
    }
  }

  /**
   * Récupérer mes commandes (en tant qu'acheteur)
   */
  async getMyOrders(): Promise<Reservation[]> {
    try {
      const orders = await dataApi.getMyOrders();
      return orders;
    } catch (error) {
      console.error('[ReservationService] Erreur getMyOrders:', error);
      throw error;
    }
  }

  /**
   * Récupérer les commandes reçues (en tant que vendeur)
   */
  async getReceivedOrders(): Promise<Reservation[]> {
    try {
      const orders = await dataApi.getReceivedOrders();
      return orders;
    } catch (error) {
      console.error('[ReservationService] Erreur getReceivedOrders:', error);
      throw error;
    }
  }

  /**
   * Confirmer une réservation (vendeur)
   */
  async confirmReservation(reservationId: string) {
    try {
      const result = await dataApi.confirmReservation(reservationId);
      return result;
    } catch (error) {
      console.error('[ReservationService] Erreur confirmReservation:', error);
      throw error;
    }
  }

  /**
   * Annuler une réservation
   */
  async cancelReservation(reservationId: string) {
    try {
      const result = await dataApi.cancelReservation(reservationId);
      return result;
    } catch (error) {
      console.error('[ReservationService] Erreur cancelReservation:', error);
      throw error;
    }
  }

  /**
   * Calculer le total du panier
   */
  calculateCartTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  /**
   * Grouper les articles par vendeur
   */
  groupItemsByFarmer(items: CartItem[]): Map<string, CartItem[]> {
    const grouped = new Map<string, CartItem[]>();

    items.forEach((item) => {
      if (!grouped.has(item.farmer_id)) {
        grouped.set(item.farmer_id, []);
      }
      grouped.get(item.farmer_id)!.push(item);
    });

    return grouped;
  }

  /**
   * Préparer les items pour la création de réservation
   */
  prepareReservationItems(items: CartItem[]): ReservationItem[] {
    return items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      farmer_id: item.farmer_id,
      price: item.price,
    }));
  }
}

export const reservationService = new ReservationService();
export default reservationService;
