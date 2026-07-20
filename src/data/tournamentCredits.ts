export type TournamentAward = {
  id: 'golden-ball' | 'golden-boot' | 'golden-glove' | 'young-player';
  label: string;
  englishLabel: string;
  recipient: string;
  englishRecipient: string;
  team: string;
  teamFlag: string;
  detail: string;
  photoUrl: string;
  photoAlt: string;
  photoSourceUrl: string;
  photoCredit: string;
  photoLicense: string;
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
    photoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Rodri_France_v_Spain_7.24.26-260.jpg/330px-Rodri_France_v_Spain_7.24.26-260.jpg',
    photoAlt: '2026 월드컵 프랑스전에서 경기 중인 로드리',
    photoSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Rodri_France_v_Spain_7.24.26-260.jpg',
    photoCredit: 'Bryan Berlin',
    photoLicense: 'CC BY-SA 4.0',
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
    photoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Kylian_Mbappe_France_v_Senegal_16_June_2026-391_%28cropped%29.jpg/330px-Kylian_Mbappe_France_v_Senegal_16_June_2026-391_%28cropped%29.jpg',
    photoAlt: '2026 월드컵 세네갈전에서 경기 중인 킬리안 음바페',
    photoSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Kylian_Mbappe_France_v_Senegal_16_June_2026-391_(cropped).jpg',
    photoCredit: 'Bryan Berlin',
    photoLicense: 'CC BY-SA 4.0',
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
    photoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Unai_Simon_France_v_Spain_7.24.26-118_%28cropped%29.jpg/330px-Unai_Simon_France_v_Spain_7.24.26-118_%28cropped%29.jpg',
    photoAlt: '2026 월드컵 프랑스전에서 골키퍼 유니폼을 입은 우나이 시몬',
    photoSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Unai_Simon_France_v_Spain_7.24.26-118_(cropped).jpg',
    photoCredit: 'Bryan Berlin',
    photoLicense: 'CC BY-SA 4.0',
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
    photoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Pau_Cubarsi_France_v_Spain_7.24.26-155.jpg/330px-Pau_Cubarsi_France_v_Spain_7.24.26-155.jpg',
    photoAlt: '2026 월드컵 프랑스전에서 경기 중인 파우 쿠바르시',
    photoSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Pau_Cubarsi_France_v_Spain_7.24.26-155.jpg',
    photoCredit: 'Bryan Berlin',
    photoLicense: 'CC BY-SA 4.0',
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
