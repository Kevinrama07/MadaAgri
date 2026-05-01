const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const logger = require('../utils/logger');
const ApiError = require('../errors/ApiError');

class ProductController {
  static async createProduct(req, res, next) {
    try {
      const { title, description, price, quantity, unit, culture_id, region_id, image_url } = req.body;
      const farmer_id = req.user.id;

      // Validation
      if (!title || price < 0 || quantity < 0) {
        throw new ApiError('Données invalides', 400);
      }

      // Vérifier que l'utilisateur est agriculteur
      if (req.user.role !== 'farmer') {
        throw new ApiError('Seuls les agriculteurs peuvent ajouter des produits', 403);
      }

      const productId = uuidv4();
      const is_available = quantity > 0;

      const query = `
        INSERT INTO products 
        (id, farmer_id, culture_id, title, description, price, quantity, unit, image_url, region_id, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        productId,
        farmer_id,
        culture_id || null,
        title,
        description || null,
        price,
        quantity,
        unit || 'kg',
        image_url || null,
        region_id || null,
        is_available
      ];

      await db.query(query, values);

      logger.info(`Produit créé: ${productId} par agriculteur ${farmer_id}`);

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        data: {
          id: productId,
          title,
          price,
          quantity,
          is_available
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyProducts(req, res, next) {
    try {
      const farmer_id = req.user.id;
      const { status = 'all' } = req.query;

      if (req.user.role !== 'farmer') {
        throw new ApiError('Seuls les agriculteurs peuvent accéder à cette ressource', 403);
      }

      let query = `
        SELECT 
          p.*,
          c.name as culture_name,
          r.name as region_name,
          u.display_name as farmer_name
        FROM products p
        LEFT JOIN cultures c ON p.culture_id = c.id
        LEFT JOIN regions r ON p.region_id = r.id
        LEFT JOIN users u ON p.farmer_id = u.id
        WHERE p.farmer_id = ?
      `;

      const params = [farmer_id];

      // Filtrer par statut
      if (status === 'available') {
        query += ' AND p.is_available = TRUE';
      } else if (status === 'unavailable') {
        query += ' AND p.is_available = FALSE';
      }

      query += ' ORDER BY p.created_at DESC';

      const [products] = await db.query(query, params);

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMarketplaceProducts(req, res, next) {
    try {
      const { 
        search = '', 
        region_id = '', 
        culture_id = '', 
        min_price = 0, 
        max_price = 999999,
        page = 1,
        limit = 20
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          p.*,
          c.name as culture_name,
          r.name as region_name,
          u.display_name as farmer_name,
          u.profile_image_url as farmer_image
        FROM products p
        LEFT JOIN cultures c ON p.culture_id = c.id
        LEFT JOIN regions r ON p.region_id = r.id
        LEFT JOIN users u ON p.farmer_id = u.id
        WHERE p.is_available = TRUE 
          AND p.quantity > 0
          AND p.price BETWEEN ? AND ?
      `;

      const params = [min_price, max_price];

      if (search) {
        query += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      if (region_id) {
        query += ` AND p.region_id = ?`;
        params.push(region_id);
      }

      if (culture_id) {
        query += ` AND p.culture_id = ?`;
        params.push(culture_id);
      }

      query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), offset);

      const [products] = await db.query(query, params);

      // Compter le total pour la pagination
      let countQuery = `
        SELECT COUNT(*) as total FROM products p
        WHERE p.is_available = TRUE AND p.quantity > 0
      `;

      const countParams = [];

      if (search) {
        countQuery += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
      }

      if (region_id) {
        countQuery += ` AND p.region_id = ?`;
        countParams.push(region_id);
      }

      if (culture_id) {
        countQuery += ` AND p.culture_id = ?`;
        countParams.push(culture_id);
      }

      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductDetails(req, res, next) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          p.*,
          c.name as culture_name,
          c.description as culture_description,
          r.name as region_name,
          u.id as farmer_id,
          u.display_name as farmer_name,
          u.profile_image_url as farmer_image,
          u.bio as farmer_bio,
          COALESCE((SELECT COUNT(*) FROM follows WHERE followee_id = u.id), 0) as farmer_followers
        FROM products p
        LEFT JOIN cultures c ON p.culture_id = c.id
        LEFT JOIN regions r ON p.region_id = r.id
        LEFT JOIN users u ON p.farmer_id = u.id
        WHERE p.id = ?
      `;

      const [products] = await db.query(query, [id]);

      if (products.length === 0) {
        throw new ApiError('Produit non trouvé', 404);
      }

      res.json({
        success: true,
        data: products[0]
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const farmer_id = req.user.id;
      const { title, description, price, quantity, unit, culture_id, region_id, image_url } = req.body;

      // Vérifier la propriété du produit
      const [products] = await db.query('SELECT * FROM products WHERE id = ? AND farmer_id = ?', [id, farmer_id]);

      if (products.length === 0) {
        throw new ApiError('Produit non trouvé ou non autorisé', 404);
      }

      // Déterminer la disponibilité (auto-désactivation si quantité = 0)
      const is_available = quantity !== undefined ? quantity > 0 : products[0].is_available;

      const updateQuery = `
        UPDATE products 
        SET 
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          quantity = COALESCE(?, quantity),
          unit = COALESCE(?, unit),
          culture_id = ?,
          region_id = ?,
          image_url = COALESCE(?, image_url),
          is_available = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await db.query(updateQuery, [
        title || null,
        description || null,
        price || null,
        quantity !== undefined ? quantity : null,
        unit || null,
        culture_id || null,
        region_id || null,
        image_url || null,
        is_available,
        id
      ]);

      logger.info(`Produit ${id} mis à jour par ${farmer_id}`);

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const farmer_id = req.user.id;

      // Vérifier la propriété du produit
      const [products] = await db.query('SELECT * FROM products WHERE id = ? AND farmer_id = ?', [id, farmer_id]);

      if (products.length === 0) {
        throw new ApiError('Produit non trouvé ou non autorisé', 404);
      }

      await db.query('DELETE FROM products WHERE id = ?', [id]);

      logger.info(`Produit ${id} supprimé par ${farmer_id}`);

      res.json({
        success: true,
        message: 'Produit supprimé avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleProductAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const farmer_id = req.user.id;

      // Vérifier la propriété du produit
      const [products] = await db.query('SELECT * FROM products WHERE id = ? AND farmer_id = ?', [id, farmer_id]);

      if (products.length === 0) {
        throw new ApiError('Produit non trouvé ou non autorisé', 404);
      }

      const product = products[0];
      const new_availability = !product.is_available;

      await db.query('UPDATE products SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        new_availability,
        id
      ]);

      logger.info(`Disponibilité du produit ${id} toggled à ${new_availability} par ${farmer_id}`);

      res.json({
        success: true,
        message: `Produit ${new_availability ? 'activé' : 'désactivé'}`,
        data: {
          id,
          is_available: new_availability
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async autoDisableIfZeroStock(product_id) {
    try {
      const [products] = await db.query('SELECT quantity FROM products WHERE id = ?', [product_id]);

      if (products.length > 0 && products[0].quantity === 0) {
        await db.query('UPDATE products SET is_available = FALSE WHERE id = ?', [product_id]);
        logger.info(`Produit ${product_id} auto-désactivé (stock = 0)`);
      }
    } catch (error) {
      logger.error(`Erreur lors de l'auto-désactivation du produit ${product_id}:`, error);
    }
  }
}

module.exports = ProductController;
