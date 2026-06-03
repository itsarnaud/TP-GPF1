import { SpectatorSchema } from '../schemas/spectator.schema.js';
import { prisma } from '../lib/prisma.js';

export const create = async (req, res) => {
  try {
    const parsed = SpectatorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten((issue) => issue.message),
      });
    }

    const spectator = await prisma.spectator.create({
      data: {
        ...parsed.data,
        birthDate: new Date(parsed.data.birthDate),
      },
    });
    return res.status(201).json({ success: true, data: spectator });
  } catch (e) {
    if (e?.code === 'P2002') {
      return res
        .status(409)
        .json({ success: false, error: 'email already in use' });
    }
    return res.status(500).json({ success: false, error: 'internal error' });
  }
};

export const list = async (req, res) => {
  try {
    const spectators = await prisma.spectator.findMany({
      orderBy: { id: 'asc' },
    });
    return res.status(200).json({ success: true, data: spectators });
  } catch {
    return res.status(500).json({ success: false, error: 'internal error' });
  }
};
