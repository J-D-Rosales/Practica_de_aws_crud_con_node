# Node.js + SQLite3 REST API (Books)

Simple REST API using Express and SQLite3. Endpoints under `/api/books` with full CRUD and `/health`.

## Requirements
- Node.js 18+ (recommended to install with nvm)
- SQLite (no server needed)

## Setup
```bash
npm install
cp .env.example .env   # optional, defaults will work
npm start
```

The server listens on `http://0.0.0.0:3000` by default.

## Endpoints

- `GET /health`
- `GET /api/books`
- `GET /api/books/:id`
- `POST /api/books` (JSON body: `{ "title": "...", "author": "...", "year": 2020 }`)
- `PUT /api/books/:id` (same body as POST; fields optional for partial updates)
- `DELETE /api/books/:id`

## cURL quick test

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/books
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Refactoring","author":"Martin Fowler","year":2018}'
```
