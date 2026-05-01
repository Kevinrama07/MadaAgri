const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const logger = require('../utils/logger');
const { ApiError } = require('../errors/ApiError');
const ProductController = require('./productController');

class ReservationController {
  static async addToCart(req, res, next) {
    try {
      const { product_id, quantity } = req.body;
      const user_id = req.user.id;

      // Validation
      if (!product_id || quantity < 1) {
        throw new ApiError('Données invalides', 400);
      }

      // Vérifier que le produit existe et est disponible
      const [products] = await db.query(
        'SELECT * FROM products WHERE id = ? AND is_available = TRUE AND quantity >= ?',
        [product_id, quantity]
      );

      if (products.length === 0) {
        throw new ApiError('Produit indisponible ou stock insuffisant', 404);
      }

      // Vérifier que l'utilisateur n'est pas l'agriculteur
      if (products[0].farmer_id === user_id) {
        throw new ApiError('Vous ne pouvez pas commander votre propre produit', 400);
      }

      const cartItemId = uuidv4();

      // Insérer ou update le panier
      const query = `
        INSERT INTO cart_items (id, user_id, product_id, quantity)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + ?
      `;

      await db.query(query, [cartItemId, user_id, product_id, quantity, quantity]);

      logger.info(`Produit ${product_id} ajouté au panier de ${user_id} (quantité: ${quantity})`);

      res.status(201).json({
        success: true,
        message: 'Produit ajouté au panier'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCart(req, res, next) {
    try {
      const user_id = req.user.id;

      const query = `
        SELECT 
          ci.id,
          ci.product_id,
          ci.quantity,
          p.title,
          p.image_url,
          p.price,
          p.farmer_id,
          u.display_name as farmer_name,
          (ci.quantity * p.price) as subtotal
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN users u ON p.farmer_id = u.id
        WHERE ci.user_id = ?
        ORDER BY ci.created_at DESC
      `;

      const [cartItems] = await db.query(query, [user_id]);

      const total = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

      res.json({
        success: true,
        data: cartItems,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCartItem(req, res, next) {
    try {
      const { cartItemId } = req.params;
      const { quantity } = req.body;
      const user_id = req.user.id;

      if (quantity < 1) {
        throw new ApiError('Quantité invalide', 400);
      }

      // Vérifier l'ownership
      const [cartItems] = await db.query(
        'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
        [cartItemId, user_id]
      );

      if (cartItems.length === 0) {
        throw new ApiError('Élément du panier non trouvé', 404);
      }

      // Vérifier le stock disponible
      const [products] = await db.query(
        'SELECT * FROM products WHERE id = ? AND quantity >= ?',
        [cartItems[0].product_id, quantity]
      );

      if (products.length === 0) {
        throw new ApiError('Stock insuffisant', 400);
      }

      await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartItemId]);

      logger.info(`Élément du panier ${cartItemId} mis à jour (quantité: ${quantity})`);

      res.json({
        success: true,
        message: 'Panier mis à jour'
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeFromCart(req, res, next) {
    try {
      const { cartItemId } = req.params;
      const user_id = req.user.id;

      // Vérifier l'ownership
      const [cartItems] = await db.query(
        'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
        [cartItemId, user_id]
      );

      if (cartItems.length === 0) {
        throw new ApiError('Élément du panier non trouvé', 404);
      }

      await db.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);

      logger.info(`Élément du panier ${cartItemId} supprimé par ${user_id}`);

      res.json({
        success: true,
        message: 'Élément supprimé du panier'
      });
    } catch (error) {
      next(error);
    }
  }

  static async createReservation(req, res, next) {
    try {
      const client_id = req.user.id;
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError('Veuillez sélectionner des articles', 400);
      }

      const reservations = [];
      let totalPrice = 0;

      // Créer une réservation pour chaque produit
      for (const item of items) {
        // item.id est le product_id du frontend
        const product_id = item.id || item.product_id;
        const { quantity } = item;

        if (!product_id || quantity < 1) {
          throw new ApiError('Données d\'article invalides', 400);
        }

        // Vérifier que le produit existe et a assez de stock
        const [products] = await db.query(
          'SELECT * FROM products WHERE id = ? AND is_available = TRUE AND quantity >= ?',
          [product_id, quantity]
        );

        if (products.length === 0) {
          throw new ApiError('Produit indisponible ou stock insuffisant', 404);
        }

        const product = products[0];

        // Vérifier que l'utilisateur n'est pas l'agriculteur
        if (product.farmer_id === client_id) {
          throw new ApiError('Vous ne pouvez pas commander votre propre produit', 400);
        }

        const reservationId = uuidv4();
        const totalAmount = product.price * quantity;

        // Insérer la réservation
        const query = `
          INSERT INTO reservations 
          (id, product_id, client_id, farmer_id, quantity, unit_price, status)
          VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `;

        await db.query(query, [
          reservationId,
          product_id,
          client_id,
          product.farmer_id,
          quantity,
          product.price
        ]);

        // ⚠️ IMPORTANT: Le stock n'est PAS décrémenté ici
        // Le stock sera décrémenté seulement quand l'agriculteur confirme la réservation
        // Cela permet à l'agriculteur d'accepter ou refuser avant que le stock soit affecté

        reservations.push({
          id: reservationId,
          product_id,
          quantity,
          price: totalAmount
        });

        totalPrice += totalAmount;
      }

      logger.info(`Réservations créées: ${reservations.map(r => r.id).join(', ')} pour le client ${client_id}`);

      res.status(201).json({
        success: true,
        message: 'Réservations créées avec succès',
        data: {
          reservations,
          totalPrice
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyReservations(req, res, next) {
    try {
      const client_id = req.user.id;
      const { status = 'all' } = req.query;

      let query = `
        SELECT 
          r.*,
          p.title,
          p.image_url,
          u.display_name as farmer_name,
          u.profile_image_url as farmer_image
        FROM reservations r
        JOIN products p ON r.product_id = p.id
        JOIN users u ON r.farmer_id = u.id
        WHERE r.client_id = ?
      `;

      const params = [client_id];

      if (status !== 'all') {
        query += ' AND r.status = ?';
        params.push(status);
      }

      query += ' ORDER BY r.created_at DESC';

      const [reservations] = await db.query(query, params);

      res.json({
        success: true,
        data: reservations
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReceivedReservations(req, res, next) {
    try {
      const farmer_id = req.user.id;
      const { status = 'all' } = req.query;

      if (req.user.role !== 'farmer') {
        throw new ApiError('Seuls les agriculteurs peuvent accéder à cette ressource', 403);
      }

      let query = `
        SELECT 
          r.*,
          p.title,
          p.image_url,
          u.display_name as client_name,
          u.profile_image_url as client_image
        FROM reservations r
        JOIN products p ON r.product_id = p.id
        JOIN users u ON r.client_id = u.id
        WHERE r.farmer_id = ?
      `;

      const params = [farmer_id];

      if (status !== 'all') {
        query += ' AND r.status = ?';
        params.push(status);
      }

      query += ' ORDER BY r.created_at DESC';

      const [reservations] = await db.query(query, params);

      res.json({
        success: true,
        data: reservations
      });
    } catch (error) {
      next(error);
    }
  }

  static async confirmReservation(req, res, next) {
    try {
      const { id } = req.params;
      const farmer_id = req.user.id;

      // Vérifier la propriété
      const [reservations] = await db.query(
        'SELECT * FROM reservations WHERE id = ? AND farmer_id = ?',
        [id, farmer_id]
      );

      if (reservations.length === 0) {
        throw new ApiError('Réservation non trouvée ou non autorisée', 404);
      }

      const reservation = reservations[0];

      // Vérifier que la réservation est en attente
      if (reservation.status !== 'pending') {
        throw new ApiError('Seules les réservations en attente peuvent être confirmées', 400);
      }

      // Vérifier que le stock est toujours disponible
      const [products] = await db.query(
        'SELECT * FROM products WHERE id = ? AND quantity >= ?',
        [reservation.product_id, reservation.quantity]
      );

      if (products.length === 0) {
        throw new ApiError('Stock insuffisant pour confirmer cette réservation', 400);
      }

      // Décrémenter le stock LORS DE LA CONFIRMATION
      await db.query(
        'UPDATE products SET quantity = quantity - ? WHERE id = ?',
        [reservation.quantity, reservation.product_id]
      );

      // Auto-désactiver si quantité = 0
      await ProductController.autoDisableIfZeroStock(reservation.product_id);

      // Mettre à jour le statut de la réservation
      await db.query(
        'UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['confirmed', id]
      );

      logger.info(`Réservation ${id} confirmée par agriculteur ${farmer_id} - Stock décrémenté de ${reservation.quantity}`);

      res.json({
        success: true,
        message: 'Réservation confirmée et stock décrémenté',
        data: {
          reservation_id: id,
          quantity_confirmed: reservation.quantity,
          status: 'confirmed'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelReservation(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      // Récupérer la réservation
      const [reservations] = await db.query('SELECT * FROM reservations WHERE id = ?', [id]);

      if (reservations.length === 0) {
        throw new ApiError('Réservation non trouvée', 404);
      }

      const reservation = reservations[0];

      // Vérifier les permissions (client ou agriculteur)
      if (reservation.client_id !== user_id && reservation.farmer_id !== user_id) {
        throw new ApiError('Non autorisé', 403);
      }

      // Déterminer qui annule et le raison
      const cancelledBy = reservation.farmer_id === user_id ? 'farmer' : 'client';
      const cancelReason = cancelledBy === 'farmer' ? 'refusée par l\'agriculteur' : 'annulée par le client';

      // Si la réservation est CONFIRMÉE, restaurer le stock
      if (reservation.status === 'confirmed') {
        await db.query(
          'UPDATE products SET quantity = quantity + ? WHERE id = ?',
          [reservation.quantity, reservation.product_id]
        );

        // Réactiver le produit
        await db.query('UPDATE products SET is_available = TRUE WHERE id = ?', [reservation.product_id]);

        logger.info(`Stock restauré pour ${reservation.product_id}: +${reservation.quantity} unités (réservation ${cancelReason})`);
      }
      // Si la réservation est PENDING, le stock n'a jamais été décrémenté, donc rien à restaurer

      // Annuler la réservation
      await db.query('UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        'cancelled',
        id
      ]);

      logger.info(`Réservation ${id} annulée/refusée (${cancelReason}) par ${user_id}`);

      res.json({
        success: true,
        message: `Réservation ${cancelReason}`,
        data: {
          reservation_id: id,
          status: 'cancelled',
          cancelled_by: cancelledBy,
          stock_restored: reservation.status === 'confirmed' ? reservation.quantity : 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReservationController;
