import express from 'express';
const router = express.Router();

router.get('/', function (req, res, next) {
  res.status(200).json({ success: true });
});

export default router;
