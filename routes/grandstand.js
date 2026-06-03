import express from 'express';
const router = express.Router();

import * as GrandstandController from '../controllers/GrandstandController.js';

router.post('/', GrandstandController.create);
router.get('/', GrandstandController.list);

export default router;
