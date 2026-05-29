import { SessionSchema } from '../schemas/session.schema.js';
import { prisma } from '../lib/prisma.js';

const DEFAULT_MULTIPLIERS = {
  PRACTICE: 0.5,
  QUALIFYING: 1,
  SPRINT: 1.2,
  RACE: 1.8,
};

export const create = async (req, res) => {
  try {
    const parsed = SessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten((issue) => issue.message),
      });
    }

    const { type, priceMultiplier, ...rest } = parsed.data;
    const session = await prisma.session.create({
      data: {
        ...rest,
        type,
        priceMultiplier: priceMultiplier ?? DEFAULT_MULTIPLIERS[type],
      },
    });

    return res.status(201).json({ success: true, data: session });
  } catch {
    return res.status(500).json({ success: false, error: 'internal error' });
  }
};
