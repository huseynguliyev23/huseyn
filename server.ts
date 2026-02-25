import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("arbitrai.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exchange TEXT NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin TEXT NOT NULL,
    exchange_a TEXT NOT NULL,
    exchange_b TEXT NOT NULL,
    profit_percent REAL NOT NULL,
    profit_amount REAL NOT NULL,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/history", (req, res) => {
    const history = db.prepare("SELECT * FROM history ORDER BY timestamp DESC LIMIT 50").all();
    res.json(history);
  });

  app.post("/api/history", (req, res) => {
    const { coin, exchange_a, exchange_b, profit_percent, profit_amount, status } = req.body;
    const info = db.prepare(
      "INSERT INTO history (coin, exchange_a, exchange_b, profit_percent, profit_amount, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(coin, exchange_a, exchange_b, profit_percent, profit_amount, status);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/keys", (req, res) => {
    const keys = db.prepare("SELECT id, exchange, api_key FROM api_keys").all();
    res.json(keys);
  });

  app.post("/api/keys", (req, res) => {
    const { exchange, api_key, api_secret } = req.body;
    db.prepare("INSERT INTO api_keys (exchange, api_key, api_secret) VALUES (?, ?, ?)").run(exchange, api_key, api_secret);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
