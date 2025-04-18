import { getDatabase } from "../db/init.js";
import { saveWinner } from "../db/winnerRepo.js";
import { getCustomerSocket } from "../models/socket.js";

export const evaluateWinner = (results) => {
  const valid = results.filter((u) => !u.disqualified);
  if (valid.length === 0) {
    console.log("우승자 없음 (모두 실격)");
    return;
  }

  valid.sort((a, b) => {
    if (b.clickCount !== a.clickCount) return b.clickCount - a.clickCount;
    return a.lastClick - b.lastClick;
  });

  const winner = valid[0];
  console.log("우승자:", winner.email, `(${winner.clickCount}회 클릭)`);

  const db = getDatabase();
  const stmt = db.prepare("SELECT id FROM Customers WHERE email = ?");
  const row = stmt.get(winner.email);

  if (!row) {
    console.error(`[saveWinner] 실패: ${winner.email}는 DB에 없음`);
    return;
  }

  saveWinner({
    id: row.id,
    clickCount: winner.clickCount,
    lastClick: winner.lastClick,
  });
};
