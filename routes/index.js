import express from 'express';
import { quote, create, cancel } from '../controllers/reservationController.js';

const router = express.Router();

import grandstand from './grandstand.js';
import session from './session.js';
import spectator from './spectator.js';

router.use('/grandstands', grandstand);
router.use('/sessions', session);
router.use('/spectators', spectator);

router.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.post('/reservations/quote', quote);
router.post('/reservations', create);
router.post('/reservations/:id/cancel', cancel);

export default router;
