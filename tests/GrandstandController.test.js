import request from 'supertest';
import app     from '../app.js';
import { expect } from 'chai';
import { prisma } from '../lib/prisma.js';

const validBody = {
  name: 'Tribune Nord',
  location: 'Nord',
  category: 'GOLD',
  capacity: 500,
  basePrice: 49.99,
  isCovered: true,
};

describe('POST /grandstand', () => {
  beforeEach(async () => {
    await prisma.grandstand.deleteMany();
  });

  describe('201 – création réussie', () => {
    it('retourne 201 avec un body valide', async () => {
      const res = await request(app).post('/grandstand').send(validBody);

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
    });

    it('crée bien la tribune en base', async () => {
      await request(app).post('/grandstand').send(validBody);

      const grandstand = await prisma.grandstand.findFirst({
        where: { name: 'Tribune Nord' },
      });
      expect(grandstand).to.not.be.null;
      expect(grandstand.category).to.equal('GOLD');
      expect(grandstand.capacity).to.equal(500);
    });
  });

  describe('400 – validation Zod', () => {
    it('retourne 400 si le nom est absent', async () => {
      const { name, ...body } = validBody;
      const res = await request(app).post('/grandstand').send(body);

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.errors.fieldErrors).to.have.property('name');
    });

    it('retourne 400 si la catégorie est invalide', async () => {
      const res = await request(app)
        .post('/grandstand')
        .send({ ...validBody, category: 'DIAMOND' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.errors.fieldErrors).to.have.property('category');
    });

    it('retourne 400 si la capacité est négative', async () => {
      const res = await request(app)
        .post('/grandstand')
        .send({ ...validBody, capacity: -1 });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.errors.fieldErrors).to.have.property('capacity');
    });

    it('retourne 400 si le body est vide', async () => {
      const res = await request(app).post('/grandstand').send({});

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('ne crée rien en base si la validation échoue', async () => {
      await request(app).post('/grandstand').send({});

      const count = await prisma.grandstand.count();
      expect(count).to.equal(0);
    });
  });
});
