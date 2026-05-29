# tp-gpf1

API REST Express + Prisma pour la gestion de tribunes, sessions et spectateurs.

## Prérequis

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) (OrbStack ou Docker Desktop)
- `sonar-scanner` installé globalement pour l'analyse SonarQube (optionnel)

---

## Installation

```bash
npm install
```

> Husky s'installe automatiquement via le script `prepare`.

---

## Variables d'environnement

Créer un fichier `.env` à la racine :

```env
DATABASE_URL="postgresql://user:password@localhost:5434/prisma_db"
```

Un fichier `.env.test` est déjà présent pour la base de test (port 5435) — ne pas le committer.

---

## Base de données

### Démarrer les conteneurs

```bash
# Base de développement (port 5434)
docker compose up db-prisma -d

# Base de test (port 5435)
docker compose up db-test -d

# Les deux en même temps
docker compose up db-prisma db-test -d
```

### Appliquer les migrations

```bash
# Développement
npx prisma migrate deploy

# Régénérer le client Prisma après modification du schema
npx prisma generate
```

---

## Lancer le projet

```bash
# Développement (rechargement automatique)
npm run dev

# Production
npm start
```

L'API écoute sur `http://localhost:3000` par défaut.

### Vérifier que l'API répond

```bash
curl http://localhost:3000/healthz
```

---

## Tests

La base de test doit être démarrée avant de lancer les tests.

```bash
# Démarrer la base de test (à faire une seule fois)
npm run test:db

# Lancer les tests (migrations + couverture automatiques)
npm test

# Mode watch pendant le développement
npm run test:watch
```

Le rapport de couverture est généré dans `coverage/lcov.info` après chaque `npm test`.

---

## Qualité du code

### Lint & formatage

```bash
# Vérifier le code
npm run lint

# Formater le code
npm run format
```

### Hooks Git (Husky)

Chaque commit déclenche automatiquement :

| Hook         | Action                                       |
| ------------ | -------------------------------------------- |
| `pre-commit` | `format` → `lint` → `test`                   |
| `commit-msg` | Validation du message (Conventional Commits) |

### Format des messages de commit

Le projet suit la convention [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<scope>): <description>

feat(grandstand): add list endpoint with category filter
fix(session): correct default multiplier for SPRINT
test(spectator): add email uniqueness test
docs: update README
```

Types autorisés : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

---

## SonarQube

### Démarrer SonarQube

```bash
docker compose up sonarqube -d
```

L'interface est disponible sur `http://localhost:9000` (admin / admin au premier lancement).

### Lancer une analyse

Toujours générer la couverture avant d'analyser :

```bash
npm test && sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=<votre_token> \
  -Dsonar.projectKey=tp-gpf1
```

> Le rapport de couverture (`coverage/lcov.info`) est automatiquement lu par SonarQube grâce à `sonar-project.properties`.

---

## Structure du projet

```
├── controllers/        # Logique métier des routes
├── routes/             # Définition des endpoints Express
├── schemas/            # Schémas de validation Zod
├── lib/                # Client Prisma partagé
├── prisma/
│   ├── schema.prisma   # Modèles de données
│   └── migrations/     # Historique des migrations SQL
├── tests/              # Tests Mocha + Supertest
├── .env                # Variables d'environnement (non commité)
├── .env.test           # Variables pour les tests (non commité)
└── sonar-project.properties
```

## Endpoints disponibles

| Méthode | Route          | Description                               |
| ------- | -------------- | ----------------------------------------- |
| `GET`   | `/healthz`     | Santé de l'API                            |
| `POST`  | `/grandstands` | Créer une tribune                         |
| `GET`   | `/grandstands` | Lister les tribunes (filtre `?category=`) |
| `POST`  | `/sessions`    | Créer une session                         |
| `POST`  | `/spectators`  | Inscrire un spectateur                    |
| `GET`   | `/spectators`  | Lister les spectateurs                    |
