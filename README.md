# 2026 World Cup Schedule Poster UI

첨부된 인쇄물형 월드컵 일정표를 웹에서 보기 좋게 재현하는 정적 React 앱입니다.

## Run

```bash
npm install
npm run dev
```

## Edit Schedule

일정 데이터는 `src/data/schedule.ts`에 있습니다.

- `game(date, time, group, round, home, away, homeFlag, awayFlag)` 형식으로 경기 추가
- 하루는 `cells` 배열로 구성
- 빈 칸은 생략해도 화면에서 4칸까지 자동 보정
- 한 칸에 두 경기를 넣으려면 `cell(game(...), game(...))` 형태로 작성

## Live Schedule Updates

브라우저에서는 외부 축구 API를 직접 호출하지 않습니다.

- GitHub Actions가 `API_FOOTBALL_KEY` secret으로 API-FOOTBALL을 호출
- `public/data/live-schedule.json`을 빌드 artifact 안에서 갱신
- 앱은 이 JSON을 읽어 기존 표에 스코어와 상태만 조용히 병합
- secret이 없으면 정적 빈 JSON으로 배포
- API 실패 또는 JSON 누락 시 앱은 기존 정적 일정표를 그대로 표시

GitHub repository secret:

```text
API_FOOTBALL_KEY
```

정기 갱신 workflow는 매시간 실행됩니다.
