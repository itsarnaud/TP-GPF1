import { getQuote, createReservation } from '../services/reservationService.js';

export async function quote(req, res, next) {
  try {
    const { grandstandId, sessionIds, seatCount, spectatorId } = req.body;

    if (!grandstandId || !Array.isArray(sessionIds) || sessionIds.length === 0 || !seatCount || !spectatorId) {
      return res.status(400).json({ error: 'Les champs grandstandId, sessionIds, seatCount et spectatorId sont obligatoires' });
    }

    const result = await getQuote({
      grandstandId: Number(grandstandId),
      sessionIds: sessionIds.map(Number),
      seatCount: Number(seatCount),
      spectatorId: Number(spectatorId),
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { grandstandId, sessionIds, seatCount, spectatorId } = req.body;

    if (!grandstandId || !Array.isArray(sessionIds) || sessionIds.length === 0 || !seatCount || !spectatorId) {
      return res.status(400).json({ error: 'Les champs grandstandId, sessionIds, seatCount et spectatorId sont obligatoires' });
    }

    const { reservation, quote: priceQuote } = await createReservation({
      grandstandId: Number(grandstandId),
      sessionIds: sessionIds.map(Number),
      seatCount: Number(seatCount),
      spectatorId: Number(spectatorId),
    });

    return res.status(201).json({ reservation, quote: priceQuote });
  } catch (err) {
    next(err);
  }
}
