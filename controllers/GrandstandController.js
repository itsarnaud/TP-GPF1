import { GrandstandSchema, GrandstandQuerySchema } from '../schemas/grandstand.schema.js';
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

export const list = async (req, res) => {
  try {
    const parsed = GrandstandQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten((issue) => issue.message),
      });
    }

    const { category } = parsed.data;
    const grandstands = await prisma.grandstand.findMany({
      where: category ? { category } : undefined,
      orderBy: { id: 'asc' },
    });

    return res.status(200).json({ success: true, grandstands });
  } catch {
    return res.status(500).json({ success: false, error: 'internal error' });
  }
};
