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
