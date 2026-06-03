import express from 'express';
import { quote, create } from '../controllers/reservationController.js';

const router = express.Router();

router.get('/', function (req, res) {
  res.status(200).json({ success: true });
});

router.post('/reservations/quote', quote);
router.post('/reservations', create);

export default router;
