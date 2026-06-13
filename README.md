# 2026 World Cup Schedule Poster UI

첨부된 인쇄물형 월드컵 조별리그 일정표를 웹에서 보기 좋게 재현하는 정적 React 앱입니다.

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

외부 서버, DB, 축구 API 없이 GitHub Pages 또는 Vercel에 정적 배포할 수 있는 구조입니다.
