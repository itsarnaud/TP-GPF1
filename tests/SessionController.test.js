import request from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';

const validBody = {
  day: 'SATURDAY',
  date: '2026-07-18T14:00:00.000Z',
  type: 'RACE',
};

describe('POST /sessions', () => {
  afterEach(async () => {
    await prisma.session.deleteMany();
  });

  describe('201 – création réussie', () => {
    it('applique le multiplicateur par défaut quand absent (RACE → 1.8)', async () => {
      const res = await request(app).post('/sessions').send(validBody);

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(Number(res.body.data.priceMultiplier)).to.equal(1.8);
    });

    it('applique le multiplicateur par défaut PRACTICE → 0.5', async () => {
      const res = await request(app)
        .post('/sessions')
        .send({ ...validBody, type: 'PRACTICE' });

      expect(res.status).to.equal(201);
      expect(Number(res.body.data.priceMultiplier)).to.equal(0.5);
    });

    it('applique le multiplicateur par défaut QUALIFYING → 1.0', async () => {
      const res = await request(app)
        .post('/sessions')
        .send({ ...validBody, type: 'QUALIFYING' });

      expect(res.status).to.equal(201);
      expect(Number(res.body.data.priceMultiplier)).to.equal(1.0);
    });

    it('applique le multiplicateur par défaut SPRINT → 1.2', async () => {
      const res = await request(app)
        .post('/sessions')
        .send({ ...validBody, type: 'SPRINT' });

      expect(res.status).to.equal(201);
      expect(Number(res.body.data.priceMultiplier)).to.equal(1.2);
    });

    it('utilise le multiplicateur fourni explicitement', async () => {
      const res = await request(app)
        .post('/sessions')
        .send({ ...validBody, priceMultiplier: 2.5 });

      expect(res.status).to.equal(201);
      expect(Number(res.body.data.priceMultiplier)).to.equal(2.5);
    });

    it('crée bien la session en base', async () => {
      await request(app).post('/sessions').send(validBody);

      const session = await prisma.session.findFirst({
        where: { type: 'RACE' },
      });
      expect(session).to.not.be.null;
      expect(session.day).to.equal('SATURDAY');
    });
  });

  describe('400 – validation Zod', () => {
    it('retourne 400 si le jour est absent', async () => {
      const { day, ...body } = validBody;
      const res = await request(app).post('/sessions').send(body);

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('day');
    });

    it('retourne 400 si le type est invalide', async () => {
      const res = await request(app)
        .post('/sessions')
        .send({ ...validBody, type: 'UNKNOWN' });

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('type');
    });

    it('retourne 400 si la date est invalide', async () => {
      const res = await request(app)
        .post('/sessions')
        .send({ ...validBody, date: 'pas-une-date' });

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('date');
    });

    it('retourne 400 si le multiplicateur est nul (règle: > 0)', async () => {
      const res = await request(app)
        .post('/sessions')
        .send({ ...validBody, priceMultiplier: 0 });

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('priceMultiplier');
    });

    it('retourne 400 si le multiplicateur est négatif (règle: > 0)', async () => {
      const res = await request(app)
        .post('/sessions')
        .send({ ...validBody, priceMultiplier: -1 });

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('priceMultiplier');
    });
  });
});
