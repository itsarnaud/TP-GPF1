# tp-gpf1 - API Réservation Grand Prix F1

API REST (Express + Prisma) pour la gestion de tribunes, de sessions et de spectateurs.

## Guide de démarrage

### Prérequis

- Node.js v20+
- Docker (OrbStack ou Docker Desktop)
- sonar-scanner (optionnel, pour l'analyse SonarQube)

### Installation

```bash
npm install
```

Husky sera installé et configuré automatiquement via le script de préparation.

### Configuration

Créez un fichier `.env` à la racine du projet avec les informations de connexion à la base de données de développement :

```env
DATABASE_URL="postgresql://user:password@localhost:5434/prisma_db"
```

Le fichier `.env.test` est déjà configuré pour pointer vers la base de données de test (port 5435).

### Base de données

Démarrez les conteneurs PostgreSQL (développement et test) via Docker Compose :

```bash
docker compose up db-prisma db-test -d
```

Appliquez les migrations sur la base de développement :

```bash
npx prisma migrate deploy
```

Si vous modifiez le schéma Prisma (`prisma/schema.prisma`), mettez à jour le client :

```bash
npx prisma generate
```

### Lancement

Pour lancer le serveur en mode développement (avec rechargement automatique) :

```bash
npm run dev
```

L'API écoute par défaut sur le port 3000. Vous pouvez vérifier son état via :

```bash
curl http://localhost:3000/healthz
```

Pour lancer le serveur en production :

```bash
npm start
```

### Tests

Assurez-vous que le conteneur `db-test` est démarré. Les scripts de test s'occuperont d'appliquer les migrations sur la base de test et de générer le rapport de couverture.

```bash
# Lancer la suite de tests complète
npm test

# Lancer les tests en mode interactif
npm run test:watch
```

Le rapport de couverture est généré dans `coverage/lcov.info`.

### Outils de qualité

```bash
# Lancer le linter
npm run lint

# Formater le code avec Prettier
npm run format
```

Des hooks Git sont configurés via Husky. Avant chaque commit, le code est formaté, linté et testé. Le message de commit est également validé pour respecter la convention *Conventional Commits*.

---

## Structure du projet

```
├── controllers/        # Logique métier liée aux requêtes HTTP
├── routes/             # Définition des endpoints
├── schemas/            # Schémas de validation (Zod)
├── lib/                # Code partagé (ex: client Prisma)
├── prisma/
│   ├── schema.prisma   # Modélisation de la base de données
│   └── migrations/     # Fichiers de migration SQL
├── services/           # Cœur de la logique métier (fonctions pures)
├── tests/              # Tests unitaires et d'intégration
├── RAPPORT.md          # Rapport d'évaluation final
├── .env                # Variables d'environnement de développement
├── .env.test           # Variables d'environnement de test
└── sonar-project.properties
```

## Endpoints

| Méthode | Endpoint                     | Description                                |
| ------- | ---------------------------- | ------------------------------------------ |
| `GET`   | `/healthz`                   | Vérification de l'état de l'API            |
| `POST`  | `/grandstands`               | Créer une tribune                          |
| `GET`   | `/grandstands`               | Lister les tribunes (filtre `?category=`)  |
| `POST`  | `/sessions`                  | Créer une session                          |
| `POST`  | `/spectators`                | Inscrire un nouveau spectateur             |
| `GET`   | `/spectators`                | Lister tous les spectateurs                |
| `POST`  | `/reservations/quote`        | Simuler le tarif d'une réservation         |
| `POST`  | `/reservations`              | Créer et confirmer une réservation         |
| `POST`  | `/reservations/:id/cancel`   | Annuler une réservation existante          |
