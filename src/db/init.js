import { DatabaseSync } from "node:sqlite";

let dbInstance = null;

function initializeDatabase() {
  const db = new DatabaseSync("./data/database.db");

  db.exec(`
    CREATE TABLE IF NOT EXISTS Customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      address TEXT NOT NULL,
      retryable INTEGER NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS EventStatus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      clickCount INTEGER DEFAULT 0,
      lastClick INTEGER,
      updatedAt DATETIME,
      FOREIGN KEY (customerId) REFERENCES Customers(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId TEXT NOT NULL,
      clickCount INTEGER NOT NULL,
      lastClick INTEGER NOT NULL,
      createdAt DATETIME NOT NULL
    );
  `);

  dbInstance = db;
  return db;
}

export function getDatabase() {
  if (dbInstance) return dbInstance;
  return initializeDatabase();
}
