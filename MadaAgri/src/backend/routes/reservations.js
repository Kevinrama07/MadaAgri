const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/reservationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/cart', authMiddleware, ReservationController.addToCart);
router.get('/cart', authMiddleware, ReservationController.getCart);
router.patch('/cart/:cartItemId', authMiddleware, ReservationController.updateCartItem);
router.delete('/cart/:cartItemId', authMiddleware, ReservationController.removeFromCart);
router.post('/', authMiddleware, ReservationController.createReservation);
router.get('/', authMiddleware, ReservationController.getMyReservations);
router.get('/received', authMiddleware, ReservationController.getReceivedReservations);
router.patch('/:id/confirm', authMiddleware, ReservationController.confirmReservation);
router.patch('/:id/cancel', authMiddleware, ReservationController.cancelReservation);

module.exports = router;
