import express from 'express';
const router = express.Router();

import * as SpectatorController from '../controllers/SpectatorController.js';

router.post('/', SpectatorController.create);
router.get('/', SpectatorController.list);

export default router;
