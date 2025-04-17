#!/bin/bash

echo "loginServer 실행 중..."
node src/loginServer/loginServer.js &
LOGIN_PID=$!

echo "index.js 실행 중..."
MANUAL=true node src/index.js &
MASTER_PID=$!

sleep 5

echo "E2E 테스트 실행 중..."
node test/e2e/e2e.test.js

echo "서버 종료 중..."
kill $LOGIN_PID
kill $MASTER_PID

# 로그인 서버, TCP서버, 테스트 클라이언트 일괄 실행하기
# chmod +x run-all.sh
# ./run-all.sh