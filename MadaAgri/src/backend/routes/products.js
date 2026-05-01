const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const ReservationController = require('../controllers/reservationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, ProductController.createProduct);
router.get('/my', authMiddleware, ProductController.getMyProducts);
router.put('/:id', authMiddleware, ProductController.updateProduct);
router.delete('/:id', authMiddleware, ProductController.deleteProduct);
router.patch('/:id/toggle', authMiddleware, ProductController.toggleProductAvailability);
router.get('/', ProductController.getMarketplaceProducts);
router.get('/marketplace/all', ProductController.getMarketplaceProducts);
router.get('/:id', ProductController.getProductDetails);
router.post('/cart', authMiddleware, ReservationController.addToCart);
router.get('/cart', authMiddleware, ReservationController.getCart);
router.patch('/cart/:cartItemId', authMiddleware, ReservationController.updateCartItem);
router.delete('/cart/:cartItemId', authMiddleware, ReservationController.removeFromCart);
router.post('/reservations', authMiddleware, ReservationController.createReservation);
router.get('/reservations/my', authMiddleware, ReservationController.getMyReservations);
router.get('/reservations/received', authMiddleware, ReservationController.getReceivedReservations);
router.patch('/reservations/:id/confirm', authMiddleware, ReservationController.confirmReservation);
router.patch('/reservations/:id/cancel', authMiddleware, ReservationController.cancelReservation);

module.exports = router;
