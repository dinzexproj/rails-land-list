# Land/Lots Listing Project

## Structure

- `land-list-be`: Rails API + Postgres (PostGIS)
- `land-list-fe`: React + Redux

## Local development (without Docker)

Run Postgres (with **PostGIS** Extension for the database).

### Backend (`land-list-be`)

```bash
cd land-list-be
cp .env.example .env
# Edit .env: set JWT_SECRET and DB_PASSWORD.
bundle install
bin/rails db:prepare
bin/rails db:seed   # optional: sample users and listings
bin/rails server -b 0.0.0.0 -p 3001
```

API: `http://localhost:3001` (WebSocket URL is derived on the client from `REACT_APP_API_BASE_URL`).

### Frontend (`land-list-fe`)

```bash
cd land-list-fe
cp .env.example .env.local
# Defaults assume API at http://localhost:3001
npm install
npm run start
```

App: `http://localhost:3000`.

### Dev (Docker)

1. Add environment variable for environment to deploy:

```bash
cp .env.dev .env
```

2. Start services:

```bash
docker compose -f docker-compose.dev.yml up --build
```

3. API runs on `http://localhost:3001`
4. Web runs on `http://localhost:3000`

### Database reset and sample data

From the repo root (with Compose running):

```bash
docker compose -f docker-compose.dev.yml exec be bin/rails db:reset
```

This drops the database, runs migrations, and loads `db/seeds.rb` (clears tables, then creates sample users and listings).

**Demo logins** (same password for each): `password123`

| Email             |
|-------------------|
| `demo@example.com`  |
| `alice@example.com` |
| `bob@example.com`   |

To reseed only (dropping the DB):

```bash
docker compose -f docker-compose.dev.yml exec be bin/rails db:seed
```

## Environments

- Dev: `docker-compose.dev.yml`
- UAT: `docker-compose.uat.yml`
- Prod: `docker-compose.prod.yml`

