import pg from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg }     from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
