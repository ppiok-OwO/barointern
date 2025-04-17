import net from "node:net";
import { customers } from "./init/init.js";
import {
  isCustomerGiveUp,
  isSlidingWindowViolated,
} from "./utils/validator.js";
import { getDatabase } from "./db/init.js";
import {
  registerCustomerSocket,
  removeCustomerSocket,
} from "./models/socket.js";

process.on("message", (msg) => {
  if (msg.type === "EVENT_START") {
    customers.eventStart();
  } else if (msg.type === "EVENT_END") {
    customers.eventEnd();

    const all = customers.getCustomers();
    const summary = [];

    for (const [email, user] of all.entries()) {
      summary.push({
        email,
        clickCount: user.lastClicks.length,
        lastClick: Math.max(...user.lastClicks, 0),
        disqualified: user.disqualified,
      });
    }

    process.send?.({
      type: "EVENT_RESULT",
      from: process.pid,
      data: summary,
    });
  }
});

const server = net.createServer((socket) => {
  const customerList = customers.getCustomers();
  let email = null;
  let interval = null;

  process.on("message", (msg) => {
    if (msg.type === "EVENT_END" && interval) {
      clearInterval(interval);
      interval = null;
    }
  });

  socket.on("data", (data) => {
    const msg = data.toString().trim();
    const db = getDatabase();

    if (!email) {
      email = msg;
      registerCustomerSocket(email, socket);
      if (!customerList.has(email)) customers.addCustomer(email);
      console.log(`[TCP] ${email} 접속`);

      // interval 생성은 최초 email 등록 시 한 번만
      interval = setInterval(() => {
        const customer = customerList.get(email);
        if (!customer || customer.disqualified) return;
        if (!customers.eventActive) return;

        if (isCustomerGiveUp(customer.lastActive)) {
          customer.disqualified = true;
          console.log(`[DISQUALIFIED] ${email} - 무응답`);

          const stmt = db.prepare(
            "UPDATE Customers SET retryable = 0 WHERE email = ?"
          );
          stmt.run(email);

          socket.end();
          clearInterval(interval);
        }
      }, 1000);

      return;
    }

    if (!customers.eventActive) return;
    const customer = customerList.get(email);
    if (customer.disqualified) return;

    const now = Date.now();
    customer.lastClicks.push(now);
    customer.lastActive = now;

    if (isSlidingWindowViolated(customer.lastClicks)) {
      customer.disqualified = true;
      console.log(`[DISQUALIFIED] ${email} - 클릭 과다`);

      const stmt = db.prepare(
        "UPDATE Customers SET retryable = 0 WHERE email = ?"
      );
      stmt.run(email);

      socket.end();
    }
  });

  socket.on("end", () => {
    console.log(`[TCP] ${email} 연결 종료`);
    removeCustomerSocket(email);
    if (interval) clearInterval(interval);
  });
});

server.listen(5000, () => {
  console.log("[WORKER] TCP 서버 리스닝 중");
});
