import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || './data.sqlite';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize database connection (sqlite wrapper for async/await)
let db;
async function initDb() {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  // Create table if not exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      year INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed one row if empty
  const row = await db.get('SELECT COUNT(*) AS count FROM books;');
  if (row.count === 0) {
    await db.run('INSERT INTO books (title, author, year) VALUES (?, ?, ?);',
      ['Clean Architecture', 'Robert C. Martin', 2017]);
  }
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// CRUD routes
app.get('/api/books', async (_req, res, next) => {
  try {
    const books = await db.all('SELECT * FROM books ORDER BY id;');
    res.json(books);
  } catch (err) { next(err); }
});

app.get('/api/books/:id', async (req, res, next) => {
  try {
    const book = await db.get('SELECT * FROM books WHERE id = ?;', [req.params.id]);
    if (!book) return res.status(404).json({ error: 'Not found' });
    res.json(book);
  } catch (err) { next(err); }
});

app.post('/api/books', async (req, res, next) => {
  try {
    const { title, author, year } = req.body;
    if (!title || !author) return res.status(400).json({ error: 'title and author are required' });
    const result = await db.run('INSERT INTO books (title, author, year) VALUES (?, ?, ?);',
      [title, author, year ?? null]);
    const created = await db.get('SELECT * FROM books WHERE id = ?;', [result.lastID]);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

app.put('/api/books/:id', async (req, res, next) => {
  try {
    const { title, author, year } = req.body;
    const existing = await db.get('SELECT * FROM books WHERE id = ?;', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const newTitle = title ?? existing.title;
    const newAuthor = author ?? existing.author;
    const newYear = typeof year === 'undefined' ? existing.year : year;
    await db.run('UPDATE books SET title = ?, author = ?, year = ? WHERE id = ?;',
      [newTitle, newAuthor, newYear, req.params.id]);
    const updated = await db.get('SELECT * FROM books WHERE id = ?;', [req.params.id]);
    res.json(updated);
  } catch (err) { next(err); }
});

app.delete('/api/books/:id', async (req, res, next) => {
  try {
    const existing = await db.get('SELECT * FROM books WHERE id = ?;', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await db.run('DELETE FROM books WHERE id = ?;', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server only after DB is ready
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`DB file: ${DB_FILE}`);
  });
}).catch((e) => {
  console.error('Failed to init DB:', e);
  process.exit(1);
});
