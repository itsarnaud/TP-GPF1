import { GrandstandSchema } from '../schemas/grandstand.schema.js';
import { prisma } from '../lib/prisma.js';

export const create = async (req, res) => {
  try {
    const parsed = GrandstandSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten((issue) => issue.message),
      });
    }

    await prisma.grandstand.create({ data: req.body });
    return res.status(201).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, error: 'internal error' });
  }
};
