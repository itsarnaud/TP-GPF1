import request from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';

const validBody = {
  name: 'Alice Dupont',
  email: 'alice@example.com',
  birthDate: '1995-06-15',
  loyaltyProgram: 'NONE',
};

describe('POST /spectators', () => {
  beforeEach(async () => {
    await prisma.spectator.deleteMany();
  });

  describe('201 – inscription réussie', () => {
    it('retourne 201 avec un body valide', async () => {
      const res = await request(app).post('/spectators').send(validBody);

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.data.email).to.equal('alice@example.com');
    });

    it('crée bien le spectateur en base', async () => {
      await request(app).post('/spectators').send(validBody);

      const spectator = await prisma.spectator.findUnique({
        where: { email: 'alice@example.com' },
      });
      expect(spectator).to.not.be.null;
      expect(spectator.name).to.equal('Alice Dupont');
      expect(spectator.loyaltyProgram).to.equal('NONE');
    });

    it('accepte tous les programmes de fidélité', async () => {
      for (const [i, loyaltyProgram] of ['NONE', 'SILVER', 'GOLD'].entries()) {
        const res = await request(app)
          .post('/spectators')
          .send({
            ...validBody,
            email: `user${i}@example.com`,
            loyaltyProgram,
          });

        expect(res.status).to.equal(201);
        expect(res.body.data.loyaltyProgram).to.equal(loyaltyProgram);
      }
    });
  });

  describe('409 – email déjà utilisé', () => {
    it("retourne 409 si l'email existe déjà", async () => {
      await request(app).post('/spectators').send(validBody);
      const res = await request(app).post('/spectators').send(validBody);

      expect(res.status).to.equal(409);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('email already in use');
    });
  });

  describe('400 – validation Zod', () => {
    it('retourne 400 si le nom est absent', async () => {
      const { name, ...body } = validBody;
      const res = await request(app).post('/spectators').send(body);

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('name');
    });

    it("retourne 400 si l'email est invalide", async () => {
      const res = await request(app)
        .post('/spectators')
        .send({ ...validBody, email: 'pas-un-email' });

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('email');
    });

    it('retourne 400 si la date de naissance est dans le futur', async () => {
      const res = await request(app)
        .post('/spectators')
        .send({ ...validBody, birthDate: '2099-01-01' });

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('birthDate');
    });

    it("retourne 400 si la date de naissance n'est pas une date valide", async () => {
      const res = await request(app)
        .post('/spectators')
        .send({ ...validBody, birthDate: 'pas-une-date' });

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('birthDate');
    });

    it('retourne 400 si le programme de fidélité est invalide', async () => {
      const res = await request(app)
        .post('/spectators')
        .send({ ...validBody, loyaltyProgram: 'DIAMOND' });

      expect(res.status).to.equal(400);
      expect(res.body.errors.fieldErrors).to.have.property('loyaltyProgram');
    });
  });
});

describe('GET /spectators', () => {
  before(async () => {
    await prisma.spectator.deleteMany();
    await prisma.spectator.createMany({
      data: [
        {
          name: 'Alice',
          email: 'alice@example.com',
          birthDate: new Date('1990-01-01'),
          loyaltyProgram: 'GOLD',
        },
        {
          name: 'Bob',
          email: 'bob@example.com',
          birthDate: new Date('1985-05-20'),
          loyaltyProgram: 'NONE',
        },
      ],
    });
  });

  after(async () => {
    await prisma.spectator.deleteMany();
  });

  it('retourne la liste de tous les spectateurs', async () => {
    const res = await request(app).get('/spectators');

    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.data).to.have.length(2);
  });

  it('retourne les bons champs pour chaque spectateur', async () => {
    const res = await request(app).get('/spectators');
    const alice = res.body.data.find((s) => s.email === 'alice@example.com');

    expect(alice).to.exist;
    expect(alice.name).to.equal('Alice');
    expect(alice.loyaltyProgram).to.equal('GOLD');
  });
});
