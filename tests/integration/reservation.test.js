import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import request from 'supertest';

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
  {
    id: 1,
    day: 'FRIDAY',
    date: new Date('2026-07-04'),
    type: 'RACE',
    priceMultiplier: '1.00',
  },
  {
    id: 2,
    day: 'SATURDAY',
    date: new Date('2026-07-05'),
    type: 'RACE',
    priceMultiplier: '1.00',
  },
  {
    id: 3,
    day: 'SUNDAY',
    date: new Date('2026-07-06'),
    type: 'RACE',
    priceMultiplier: '1.00',
  },
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
    findUnique: sinon.stub(),
    findUniqueOrThrow: sinon.stub(),
  },
  session: { findMany: sinon.stub() },
  spectator: { findUnique: sinon.stub() },
  reservation: {
    aggregate: sinon.stub(),
    create: sinon.stub(),
  },
};

const VALID_BODY = {
  grandstandId: 1,
  sessionIds: [1, 2, 3],
  seatCount: 2,
  spectatorId: 1,
};

let app;

before(async () => {
  app = (
    await esmock('../../app.js', import.meta.url, {}, {
      '../../lib/prisma.js': { prisma: prismaMock },
    })
  ).default;
});

beforeEach(() => {
  prismaMock.grandstand.findUnique.resolves(grandstand);
  prismaMock.grandstand.findUniqueOrThrow.resolves(grandstand);
  prismaMock.session.findMany.resolves(sessions);
  prismaMock.spectator.findUnique.resolves(spectatorAdult);
  prismaMock.reservation.aggregate.resolves({ _sum: { seatCount: 0 } });
  prismaMock.reservation.create.resolves(createdReservation);
});

afterEach(() => sinon.reset());

describe('POST /reservations/quote', () => {
  it('retourne 400 si les champs obligatoires sont absents', async () => {
    const res = await request(app).post('/reservations/quote').send({});
    expect(res.status).to.equal(400);
  });

  it('retourne 200 avec un devis valide', async () => {
    const res = await request(app).post('/reservations/quote').send(VALID_BODY);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('total');
    expect(res.body).to.have.property('subTotal');
    expect(res.body).to.have.property('discountsApplied');
  });
});

describe('POST /reservations', () => {
  it('retourne 400 si les champs obligatoires sont absents', async () => {
    const res = await request(app).post('/reservations').send({});
    expect(res.status).to.equal(400);
  });

  it('retourne 400 si seatCount dépasse 6 (règle 6)', async () => {
    const res = await request(app)
      .post('/reservations')
      .send({ ...VALID_BODY, seatCount: 7 });
    expect(res.status).to.equal(400);
  });

  it('retourne 404 si la tribune est introuvable', async () => {
    prismaMock.grandstand.findUnique.resolves(null);
    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).to.equal(404);
  });

  it('retourne 404 si une session est introuvable', async () => {
    prismaMock.session.findMany.resolves([sessions[0]]);
    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).to.equal(404);
  });

  it('retourne 404 si le spectateur est introuvable', async () => {
    prismaMock.spectator.findUnique.resolves(null);
    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).to.equal(404);
  });

  it('retourne 409 si les places sont insuffisantes (règle 7)', async () => {
    prismaMock.reservation.aggregate.resolves({ _sum: { seatCount: 99 } });
    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).to.equal(409);
  });

  it('happy path : crée une réservation dont le prix correspond au devis', async () => {
    const quoteRes = await request(app)
      .post('/reservations/quote')
      .send(VALID_BODY);
    expect(quoteRes.status).to.equal(200);
    const expectedTotal = quoteRes.body.total;

    const res = await request(app).post('/reservations').send(VALID_BODY);
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('reservation');
    expect(res.body).to.have.property('quote');
    expect(res.body.quote.total).to.be.closeTo(expectedTotal, 0.01);
    expect(Number(res.body.reservation.totalPrice)).to.be.closeTo(
      expectedTotal,
      0.01
    );
  });
});
