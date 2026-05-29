import request from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
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

describe('GET /grandstand', () => {
  before(async () => {
    await prisma.grandstand.deleteMany();
    await prisma.grandstand.createMany({
      data: [
        { name: 'Tribune A', location: 'Nord',  category: 'GOLD',   capacity: 100, basePrice: 50, isCovered: true  },
        { name: 'Tribune B', location: 'Sud',   category: 'SILVER', capacity: 200, basePrice: 30, isCovered: false },
        { name: 'Tribune C', location: 'Est',   category: 'GOLD',   capacity: 150, basePrice: 55, isCovered: true  },
        { name: 'Tribune D', location: 'Ouest', category: 'BRONZE', capacity: 300, basePrice: 10, isCovered: false },
      ],
    });
  });

  after(async () => {
    await prisma.grandstand.deleteMany();
  });

  describe('200 – liste complète', () => {
    it('retourne toutes les tribunes sans filtre', async () => {
      const res = await request(app).get('/grandstand');

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.grandstands).to.have.length(4);
    });
  });

  describe('200 – filtre par catégorie', () => {
    it('retourne uniquement les tribunes GOLD', async () => {
      const res = await request(app).get('/grandstand?category=GOLD');

      expect(res.status).to.equal(200);
      expect(res.body.grandstands).to.have.length(2);
      expect(res.body.grandstands.every((g) => g.category === 'GOLD')).to.be.true;
    });

    it('retourne une liste vide si aucune tribune ne correspond', async () => {
      const res = await request(app).get('/grandstand?category=PLATINUM');

      expect(res.status).to.equal(200);
      expect(res.body.grandstands).to.have.length(0);
    });
  });

  describe('400 – filtre invalide', () => {
    it('retourne 400 si la catégorie est inconnue', async () => {
      const res = await request(app).get('/grandstand?category=DIAMOND');

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.errors.fieldErrors).to.have.property('category');
    });
  });
});
