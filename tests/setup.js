import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../lib/prisma.js';

// Chemin absolu vers le binaire prisma — évite toute dépendance au PATH (S4036)
const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const prismaBin = resolve(projectRoot, 'node_modules', '.bin', 'prisma');

before(() => {
  execFileSync(prismaBin, ['migrate', 'deploy'], { stdio: 'inherit' });
});

after(async () => {
  await prisma.$disconnect();
});
