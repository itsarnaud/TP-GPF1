import express from 'express';
const router = express.Router();

import grandstand from './grandstand.js';
import session from './session.js';

router.use('/grandstands', grandstand);
router.use('/sessions', session);

router.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
