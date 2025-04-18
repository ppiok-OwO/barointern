## Contents
1. [프로젝트 소개](#-프로젝트-소개)
2. [플로우 차트](#-플로우-차트)
3. [ERD](#-ERD)
4. [실행 방법](#-실행-방법)

# 프로젝트 소개
[힘내라💪 클릭 대회!]
### **(1) 이벤트 개요**

HH시 00분 부터 **1분 간** ⭐회사의 대표 마스코트인 😡(심술이)를 가장 많이 클릭한 사용자 경품 발송 이벤트

### **(2) 이벤트 참여 규칙**

1. “1분”은 00초부터 59.999999초를 의미합니다. 시간 범위에 들어오지 않은 클릭은 세지 말아야합니다.
2. 어떠한 연속된 1초 구간 내에 클릭 횟수가 4회를 초과하면 실격 처리됩니다. 초당 4회를 초과시 부정행위자로 간주하고 누적 클릭량에 관계 없이 실격 처리 됩니다.
3. 회원가입하지 않은 유저는 참여 할 수 없습니다.
4. 첫 클릭은 참여로 간주됩니다.
5. 참여한 유저가 10초간 클릭하지 않는다면 자동 실격 처리됩니다. 즉, 이후의 요청을 세지 말아야합니다.
6. 각종 사유로 실격한 참여자는 재참여 할 수 없습니다.
7. 경품이 비싸기 때문에 복수의 유저가 우승자가 될 수 없습니다. 클릭수가 동일한 선두가 생길 경우, 1 마이크로초라도 빠르게 클릭수에 도달한 유저가 우승자가 됩니다.

# 플로우 차트
![image](https://github.com/user-attachments/assets/040f146d-a280-4b7a-802b-b5204fa81ad2)

# ERD
![image](https://github.com/user-attachments/assets/e29a77fb-377f-4f68-845e-f976bd9e981b)

# 테스트 실행 방법
## e2e 테스트
콘솔 창에서 다음 명령어를 입력합니다.(bash)
```bash
chmod +x run-all.sh
./run-all.sh
```
## 유닛 테스트
콘솔 창에서 다음 명령어를 입력합니다.(powershell)
```powershell
node test/unit/unit.test.js
```

# 세부 코드 설명
본 프로젝트는 HTTP 서버로 구현된 로그인 서버와 TCP 서버로 나뉘어져 있습니다.

## src/loginServer/loginServer.js
```JS
import http from "node:http";
import { config } from "../config/config.js";
import { requestListener } from "./requestListener.js";

const PORT = config.LOGIN_SERVER_PORT;

const server = http.createServer(requestListener);
server.listen(PORT);
```
로그인 서버는 http 내장 모듈로 제작되었으며, 3000번 포트에서 실행됩니다.

## src/index.js 와 src/server.js
```js
import cluster from "node:cluster";
import os from "node:os";
import {
  scheduleEventStart,
  triggerEventManually,
} from "./events/eventController.js";
import { evaluateWinner } from "./utils/evaluator.js";

const results = [];

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;

  // 워커 프로세스 생성
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    const worker = cluster.workers[id];

    worker.on("message", (msg) => {
      if (msg.type === "EVENT_RESULT") {
        console.log(
          `[MASTER] 결과 수신 from ${msg.from}, count=${msg.data.length}`
        );
        results.push(...msg.data);
      }
    });
  }

  // 테스트 환경: MANUAL=true 설정 시 즉시 이벤트 시작
  if (process.env.MANUAL === "true") {
    setTimeout(() => {
      triggerEventManually((eventType) => {
        for (const id in cluster.workers) {
          cluster.workers[id].send({ type: eventType });
        }

        if (eventType === "EVENT_END") {
          setTimeout(() => {
            console.log("[MASTER] 우승자 평가 시작");
            evaluateWinner(results);
          }, 1000);
        }
      });
    }, 1000); // 서버 준비 시간 확보
  } else {
    // 실서비스용: 정시 예약 이벤트 시작
    scheduleEventStart((eventType) => {
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: eventType });
      }

      if (eventType === "EVENT_END") {
        setTimeout(() => {
          console.log("[MASTER] 우승자 평가 시작");
          evaluateWinner(results);
        }, 1000);
      }
    });
  }
} else {
  import("./server.js");
}
```
TCP 서버는 cluster 내장 모듈을 통해 CPU 개수만큼 Worker 분산 생성합니다.<br>
scheduleEventStart로 매시 정각 이벤트 시작합니다.<br>
1분 후 자동 종료하고, 우승자를 평가합니다.<br>

```js
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
```
각 워커에서는 마스터 메시지 수신하고, 유저 상태를 배열 형태로 회신합니다.<br>

```js
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
```
한편 net 모듈로 생성된 소켓에서는 onData 이벤트를 처리합니다.<br>
만약 수신한 데이터가 이메일이라면,<br>
email을 key로 가지고 클릭에 대한 기록을 value로 저장하는 Map 자료구조를<br>
Customers 클래스 내부에 생성합니다.<br>
이메일이 이미 존재한다면 데이터를 수신받은 시각을 customer.lastClicks 배열에 기록합니다.<br>

# 기술 스택
Node.js v22.14.0<br>
HTTP 서버: node:http<br>
TCP 서버: node:net<br>
멀티코어 병렬 처리: node:cluster<br>
DB: node:sqlite<br>
