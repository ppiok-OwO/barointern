import http from "http";
import net from "net";
import assert from "assert";

const email = `test_${Date.now()}@test.com`;
const address = "서울시 OO구";

function signup() {
  return new Promise((resolve, reject) => {
    const body = `email=${email}&address=${address}`;
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/signup",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        assert.strictEqual(res.statusCode, 201);
        resolve();
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function login() {
  return new Promise((resolve, reject) => {
    const body = `email=${email}`;
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/login",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        assert.strictEqual(res.statusCode, 200);
        resolve();
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function tcpConnectAndClick({
  clickCount = 200,
  interval = 300,
  waitAfter = 2000,
}) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let winnerEmail = null;

    socket.connect(5000, "localhost", () => {
      socket.write(email + "\n");
      let count = 0;
      const timer = setInterval(() => {
        if (++count > clickCount) {
          clearInterval(timer);
          setTimeout(() => {
            resolve(winnerEmail);
            socket.end();
          }, waitAfter);
        } else {
          socket.write("click\n");
        }
      }, interval);
    });

    let resolved = false;
    socket.on("data", (data) => {
      const msg = data.toString().trim();
      if (msg.startsWith("WINNER:")) {
        winnerEmail = msg.split(":")[1];
        if (!resolved) {
          resolved = true;
          socket.end();
          resolve(winnerEmail);
        }
      }
    });

    socket.on("error", reject);
  });
}

(async () => {
  console.log(`[E2E] 이메일: ${email}`);
  await signup();
  console.log("[E2E] 회원가입 완료");
  await login();
  console.log("[E2E] 로그인 성공");
  const winnerEmail = await tcpConnectAndClick({
    clickCount: 200,
    interval: 500,
    waitAfter: 200,
  });
  console.log("[E2E] TCP 클릭 완료, 우승자 판단 대기 중...");

  if (!winnerEmail) {
    console.log("[E2E] 우승자 없음 (실격 또는 조건 미충족)");
    return;
  }

  console.log(`[E2E] 우승자 메시지 수신: ${winnerEmail}`);
  assert.strictEqual(winnerEmail, email);
  console.log("E2E 테스트 전과정 통과");
})();
