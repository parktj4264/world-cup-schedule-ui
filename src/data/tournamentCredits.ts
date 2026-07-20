export type TournamentAward = {
  id: 'golden-ball' | 'golden-boot' | 'golden-glove' | 'young-player';
  label: string;
  englishLabel: string;
  recipient: string;
  englishRecipient: string;
  team: string;
  teamFlag: string;
  detail: string;
};

export type TournamentCreditSource = {
  label: string;
  href: string;
};

export const TOURNAMENT_AWARDS: TournamentAward[] = [
  {
    id: 'golden-ball',
    label: '골든볼',
    englishLabel: 'GOLDEN BALL',
    recipient: '로드리',
    englishRecipient: 'Rodri',
    team: '스페인',
    teamFlag: '🇪🇸',
    detail: '대회 최우수 선수',
  },
  {
    id: 'golden-boot',
    label: '골든부트',
    englishLabel: 'GOLDEN BOOT',
    recipient: '킬리안 음바페',
    englishRecipient: 'Kylian Mbappé',
    team: '프랑스',
    teamFlag: '🇫🇷',
    detail: '10골 · 대회 득점왕',
  },
  {
    id: 'golden-glove',
    label: '골든글러브',
    englishLabel: 'GOLDEN GLOVE',
    recipient: '우나이 시몬',
    englishRecipient: 'Unai Simón',
    team: '스페인',
    teamFlag: '🇪🇸',
    detail: '대회 최우수 골키퍼',
  },
  {
    id: 'young-player',
    label: '영플레이어',
    englishLabel: 'YOUNG PLAYER',
    recipient: '파우 쿠바르시',
    englishRecipient: 'Pau Cubarsí',
    team: '스페인',
    teamFlag: '🇪🇸',
    detail: '대회 최우수 영플레이어',
  },
];

export const TOURNAMENT_CREDIT_SOURCES: TournamentCreditSource[] = [
  {
    label: 'FIFPRO 수상자 정리',
    href: 'https://www.fifpro.org/en/articles/2026/07/players-recognised-with-individual-awards-at-the-2026-world-cup',
  },
  {
    label: 'AP 결승 보도',
    href: 'https://apnews.com/article/fccc26aa12d9226e63d06b601b770617',
  },
];
