export type TournamentPlayerStat = {
  rank: number;
  player: string;
  team: string;
  teamFlag: string;
  value: number;
};

export type TournamentStatisticsSource = {
  label: string;
  href: string;
};

export const TOURNAMENT_TOP_SCORERS: TournamentPlayerStat[] = [
  { rank: 1, player: '킬리안 음바페', team: '프랑스', teamFlag: '🇫🇷', value: 10 },
  { rank: 2, player: '리오넬 메시', team: '아르헨티나', teamFlag: '🇦🇷', value: 8 },
  { rank: 3, player: '주드 벨링엄', team: '잉글랜드', teamFlag: '🏴', value: 7 },
  { rank: 3, player: '엘링 홀란', team: '노르웨이', teamFlag: '🇳🇴', value: 7 },
  { rank: 5, player: '우스만 뎀벨레', team: '프랑스', teamFlag: '🇫🇷', value: 6 },
  { rank: 5, player: '해리 케인', team: '잉글랜드', teamFlag: '🏴', value: 6 },
  { rank: 7, player: '미켈 오야르사발', team: '스페인', teamFlag: '🇪🇸', value: 5 },
  { rank: 8, player: '이스마일라 사르', team: '세네갈', teamFlag: '🇸🇳', value: 4 },
  { rank: 8, player: '비니시우스 주니오르', team: '브라질', teamFlag: '🇧🇷', value: 4 },
  { rank: 8, player: '훌리안 키뇨네스', team: '멕시코', teamFlag: '🇲🇽', value: 4 },
];

export const TOURNAMENT_TOP_ASSISTS: TournamentPlayerStat[] = [
  { rank: 1, player: '마이클 올리세', team: '프랑스', teamFlag: '🇫🇷', value: 5 },
  { rank: 2, player: '브루누 기마랑이스', team: '브라질', teamFlag: '🇧🇷', value: 4 },
  { rank: 2, player: '브라힘 디아스', team: '모로코', teamFlag: '🇲🇦', value: 4 },
  { rank: 2, player: '리오넬 메시', team: '아르헨티나', teamFlag: '🇦🇷', value: 4 },
  { rank: 2, player: '마르틴 외데고르', team: '노르웨이', teamFlag: '🇳🇴', value: 4 },
  { rank: 6, player: '플로리안 비르츠', team: '독일', teamFlag: '🇩🇪', value: 3 },
  { rank: 6, player: '킬리안 음바페', team: '프랑스', teamFlag: '🇫🇷', value: 3 },
  { rank: 6, player: '안드레아스 셸데루프', team: '노르웨이', teamFlag: '🇳🇴', value: 3 },
  { rank: 6, player: '알렉산데르 이사크', team: '스웨덴', teamFlag: '🇸🇪', value: 3 },
  { rank: 6, player: '앤서니 고든', team: '잉글랜드', teamFlag: '🏴', value: 3 },
];

export const TOURNAMENT_TOP_CLEAN_SHEETS: TournamentPlayerStat[] = [
  { rank: 1, player: '우나이 시몬', team: '스페인', teamFlag: '🇪🇸', value: 7 },
  { rank: 2, player: '라울 랑헬', team: '멕시코', teamFlag: '🇲🇽', value: 4 },
  { rank: 2, player: '카밀로 바르가스', team: '콜롬비아', teamFlag: '🇨🇴', value: 4 },
  { rank: 2, player: '마이크 메냥', team: '프랑스', teamFlag: '🇫🇷', value: 4 },
];

export const TOURNAMENT_DISCIPLINE = {
  yellowCardLeaders: [
    { player: '다닐루', team: '브라질', teamFlag: '🇧🇷', value: 3 },
    { player: '이사 디오프', team: '모로코', teamFlag: '🇲🇦', value: 3 },
  ],
  totalRedCards: 15,
};

export const TOURNAMENT_STATISTICS_SOURCES: TournamentStatisticsSource[] = [
  {
    label: 'FIFA 공식 통계',
    href: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/statistics',
  },
  {
    label: 'Statbunker 득점',
    href: 'https://www.statbunker.com/competitions/TopGoalScorers?comp_id=790',
  },
  {
    label: 'Statbunker 도움',
    href: 'https://www.statbunker.com/competitions/MostAssists?comp_id=790',
  },
  {
    label: 'Statbunker 무실점',
    href: 'https://www.statbunker.com/competitions/Top10KeepersCleanSheets?comp_id=790',
  },
];
