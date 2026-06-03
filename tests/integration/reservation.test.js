import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../lib/prismaClient.js', () => {
  const grandstand = {
    id: 1,
    name: 'Tribune Nord',
    location: 'North',
    category: 'GOLD',
    capacity: 100,
    basePrice: '100.00',
    isCovered: true,
  };

  const sessions = [
    { id: 1, day: 'FRIDAY', date: new Date('2026-07-04'), type: 'RACE', priceMultiplier: '1.00' },
    { id: 2, day: 'SATURDAY', date: new Date('2026-07-05'), type: 'RACE', priceMultiplier: '1.00' },
    { id: 3, day: 'SUNDAY', date: new Date('2026-07-06'), type: 'RACE', priceMultiplier: '1.00' },
  ];

  const spectatorAdult = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    birthDate: new Date('1990-01-01'),
    loyaltyProgram: 'NONE',
  };

  const createdReservation = {
    id: 42,
    spectatorId: 1,
    grandstandId: 1,
    seatCount: 2,
    totalPrice: '480.00',
    status: 'CONFIRMED',
    reservationDate: new Date(),
    cancellationDate: null,
    refundAmount: null,
    grandstand,
    spectator: spectatorAdult,
    sessions,
  };

  const prismaMock = {
    grandstand: {
      findUnique: vi.fn().mockResolvedValue(grandstand),
      findUniqueOrThrow: vi.fn().mockResolvedValue(grandstand),
    },
    session: {
      findMany: vi.fn().mockResolvedValue(sessions),
    },
    spectator: {
      findUnique: vi.fn().mockResolvedValue(spectatorAdult),
    },
    reservation: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { seatCount: 0 } }),
      create: vi.fn().mockResolvedValue(createdReservation),
    },
  };

  return { default: prismaMock };
});

import app from '../../app.js';

const VALID_BODY = {
  grandstandId: 1,
  sessionIds: [1, 2, 3],
  seatCount: 2,
  spectatorId: 1,
};

describe('POST /reservations/quote', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/reservations/quote').send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 with a valid quote on happy path', async () => {
    const res = await request(app).post('/reservations/quote').send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('subTotal');
    expect(res.body).toHaveProperty('discountsApplied');
  });
});

describe('POST /reservations', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/reservations').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when seatCount exceeds 6 (rule 6)', async () => {
    const res = await request(app)
      .post('/reservations')
      .send({ ...VALID_BODY, seatCount: 7 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when grandstand does not exist', async () => {
    const { default: prisma } = await import('../../lib/prismaClient.js');
    prisma.grandstand.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).toBe(404);
  });

  it('returns 404 when one or more sessions do not exist', async () => {
    const { default: prisma } = await import('../../lib/prismaClient.js');
    prisma.session.findMany.mockResolvedValueOnce([
      { id: 1, day: 'FRIDAY', priceMultiplier: '1.00' },
    ]);

    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).toBe(404);
  });

  it('returns 404 when spectator does not exist', async () => {
    const { default: prisma } = await import('../../lib/prismaClient.js');
    prisma.spectator.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).toBe(404);
  });

  it('returns 409 when not enough seats available (rule 7)', async () => {
    const { default: prisma } = await import('../../lib/prismaClient.js');
    prisma.reservation.aggregate.mockResolvedValueOnce({ _sum: { seatCount: 99 } });

    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).toBe(409);
  });

  it('happy path: creates reservation with totalPrice matching the quote', async () => {
    const quoteRes = await request(app).post('/reservations/quote').send(VALID_BODY);
    expect(quoteRes.status).toBe(200);
    const expectedTotal = quoteRes.body.total;

    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('reservation');
    expect(res.body).toHaveProperty('quote');
    expect(res.body.quote.total).toBeCloseTo(expectedTotal, 2);
    expect(Number(res.body.reservation.totalPrice)).toBeCloseTo(expectedTotal, 2);
  });
});
