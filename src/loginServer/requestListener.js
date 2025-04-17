import { parse as parseUrl } from "url";
import { parse as parseQueryString } from "querystring";
import { isValidEmail } from "../utils/validator.js";
import { getDatabase } from "../db/init.js";

export const requestListener = (req, res) => {
  const parsedUrl = parseUrl(req.url);
  const path = parsedUrl.pathname;
  const method = req.method;

  if (path === "/signup" && method === "POST") {
    let body = "";

    // 요청 데이터 수신
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    // 요청 데이터 수신 완료
    req.on("end", () => {
      const parsedBody = parseQueryString(body);
      const email = parsedBody.email;
      const address = parsedBody.address;

      // 간단한 유효성 검사
      const validateEmail = isValidEmail(email);

      if (!validateEmail) {
        res.statusCode = 400;
        res.end("적절하지 않은 이메일입니다.");
        return;
      }

      // 사용자 데이터 저장
      const db = getDatabase();

      // 이메일 중복 체크
      const stmt = db.prepare("SELECT id FROM Customers WHERE email = ?");
      const existing = stmt.get(email);
      if (existing) {
        res.statusCode = 400;
        res.end("이미 존재하는 이메일 계정입니다.");
        return;
      }

      // 생성 날짜 계산하기
      const createdAt = new Date().toISOString();
      // DB에 회원 정보 저장
      const insertStmt = db.prepare(
        "INSERT INTO Customers (email, address, retryable, createdAt) VALUES (?, ?, ?, ?)"
      );
      insertStmt.run(email, address, 1, createdAt);

      res.statusCode = 201;
      res.end("회원가입 성공");
    });
  } else if (path === "/login" && method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const parsedBody = parseQueryString(body);
      const email = parsedBody.email;

      // email이 DB에 저장되어 있는지 확인
      const db = getDatabase();
      const stmt = db.prepare("SELECT id FROM Customers WHERE email = ?");
      const result = stmt.get(email);
      if (!result) {
        res.statusCode = 400;
        res.end("존재하지 않는 이메일 계정입니다.");
        return;
      }

      res.statusCode = 200;
      res.end("로그인 성공");
    });
  } else {
    res.statusCode = 404;
    res.end("Not Found");
  }
};
