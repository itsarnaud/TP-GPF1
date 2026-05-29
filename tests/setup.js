import { execSync } from 'node:child_process';
import { prisma } from '../lib/prisma.js';

before(() => {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
});

after(async () => {
  await prisma.$disconnect();
});
