import { prisma } from '../lib/prisma.js';
import { computeQuote } from './pricingService.js';
import { calculateRefund } from './refundService.js';

export async function getRemainingSeats(grandstandId, sessionId) {
  const grandstand = await prisma.grandstand.findUniqueOrThrow({
    where: { id: grandstandId },
    select: { capacity: true },
  });

  const aggregate = await prisma.reservation.aggregate({
    where: {
      grandstandId,
      status: 'CONFIRMED',
      sessions: { some: { id: sessionId } },
    },
    _sum: { seatCount: true },
  });

  const bookedSeats = aggregate._sum.seatCount ?? 0;
  return grandstand.capacity - bookedSeats;
}

async function getReservationContext({
  grandstandId,
  sessionIds,
  spectatorId,
}) {
  const [grandstand, sessions, spectator] = await Promise.all([
    prisma.grandstand.findUnique({ where: { id: grandstandId } }),
    prisma.session.findMany({ where: { id: { in: sessionIds } } }),
    prisma.spectator.findUnique({ where: { id: spectatorId } }),
  ]);

  if (!grandstand) {
    const err = new Error('Tribune introuvable');
    err.status = 404;
    throw err;
  }
  if (sessions.length !== sessionIds.length) {
    const err = new Error('Une ou plusieurs sessions sont introuvables');
    err.status = 404;
    throw err;
  }
  if (!spectator) {
    const err = new Error('Spectateur introuvable');
    err.status = 404;
    throw err;
  }

  return { grandstand, sessions, spectator };
}

export async function getQuote({
  grandstandId,
  sessionIds,
  seatCount,
  spectatorId,
}) {
  const { grandstand, sessions, spectator } = await getReservationContext({
    grandstandId,
    sessionIds,
    spectatorId,
  });
  return computeQuote(grandstand, sessions, seatCount, spectator);
}

export async function createReservation({
  grandstandId,
  sessionIds,
  seatCount,
  spectatorId,
}) {
  const { grandstand, sessions, spectator } = await getReservationContext({
    grandstandId,
    sessionIds,
    spectatorId,
  });

  if (seatCount < 1 || seatCount > 6) {
    const err = new Error('Le nombre de places doit être compris entre 1 et 6');
    err.status = 400;
    throw err;
  }

  for (const session of sessions) {
    const remaining = await getRemainingSeats(grandstandId, session.id);
    if (remaining < seatCount) {
      const err = new Error(
        `Places insuffisantes pour la session ${session.id} (${remaining} place(s) restante(s))`
      );
      err.status = 409;
      throw err;
    }
  }

  const quote = computeQuote(grandstand, sessions, seatCount, spectator);

  const reservation = await prisma.reservation.create({
    data: {
      spectatorId,
      grandstandId,
      sessions: { connect: sessionIds.map((id) => ({ id })) },
      seatCount,
      totalPrice: quote.total,
      status: 'CONFIRMED',
    },
    include: {
      grandstand: true,
      spectator: true,
      sessions: true,
    },
  });

  return { reservation, quote };
}

export async function cancelReservation(reservationId) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { sessions: true },
  });

  if (!reservation) {
    const err = new Error('Réservation introuvable');
    err.status = 404;
    throw err;
  }

  if (reservation.status === 'CANCELLED') {
    const err = new Error('La réservation est déjà annulée');
    err.status = 400;
    throw err;
  }

  if (!reservation.sessions || reservation.sessions.length === 0) {
    const err = new Error('Aucune session associée à cette réservation');
    err.status = 400;
    throw err;
  }

  const sortedSessions = [...reservation.sessions].sort(
    (a, b) => a.date - b.date
  );
  const firstSessionDate = sortedSessions[0].date;
  const currentDate = new Date();

  const refund = calculateRefund(
    firstSessionDate,
    currentDate,
    reservation.totalPrice
  );

  const updatedReservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: 'CANCELLED',
      cancellationDate: currentDate,
      refundAmount: refund.amount,
    },
    include: {
      grandstand: true,
      spectator: true,
      sessions: true,
    },
  });

  return { reservation: updatedReservation, refund };
}
