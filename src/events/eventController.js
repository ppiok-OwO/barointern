let isRunning = false;

function getDelayToNextHour() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0); // 00분 00초

  if (
    now.getMinutes() !== 0 ||
    now.getSeconds() !== 0 ||
    now.getMilliseconds() !== 0
  ) {
    nextHour.setHours(now.getHours() + 1);
  }

  return nextHour.getTime() - now.getTime(); // 밀리세컨드
}

export function scheduleEventStart(broadcast) {
  const delay = getDelayToNextHour();
  console.log(`[INFO] ${Math.floor(delay / 1000)}초 뒤 이벤트 시작`);

  setTimeout(() => {
    isRunning = true;
    console.log(`[${new Date().toISOString()}] 이벤트 시작`);
    broadcast?.("EVENT_START");

    setTimeout(() => {
      isRunning = false;
      console.log(`[${new Date().toISOString()}] 이벤트 종료`);
      broadcast?.("EVENT_END");
    }, 60_000);

    scheduleEventStart(broadcast); // 다음 정시 예약
  }, delay);
}

export function triggerEventManually(broadcast) {
  isRunning = true;
  console.log(`[${new Date().toISOString()}] 이벤트 수동 시작`);
  broadcast?.("EVENT_START");

  setTimeout(() => {
    isRunning = false;
    console.log(`[${new Date().toISOString()}] 이벤트 수동 종료`);
    broadcast?.("EVENT_END");
  }, 60000);
}

export function isEventRunning() {
  return isRunning;
}
