import express from 'express';
const router = express.Router();

import * as SessionController from '../controllers/SessionController.js';

router.post('/', SessionController.create);

export default router;
