import { getDatabase } from "./init.js";

export function saveWinner({ id, clickCount, lastClick }) {
  console.log("[saveWinner] 시도:", { id, clickCount, lastClick });

  const db = getDatabase();
  const createdAt = new Date().toISOString();

  try {
    console.log("[saveWinner] DB 저장 시도:", id);

    const stmt1 = db.prepare(`
      INSERT INTO EventStatus (customerId, status, clickCount, lastClick, updatedAt)
      VALUES (?, 'WINNER', ?, ?, ?)
    `);
    stmt1.run(id, clickCount, lastClick, createdAt);

    const stmt2 = db.prepare(
      "INSERT INTO Winners (customerId, clickCount, lastClick, createdAt) VALUES (?, ?, ?, ?)"
    );
    stmt2.run(id, clickCount, lastClick, createdAt);

    console.log("[saveWinner] 저장 완료");
  } catch (err) {
    console.error("[saveWinner] 실패:", err);
  }
}
