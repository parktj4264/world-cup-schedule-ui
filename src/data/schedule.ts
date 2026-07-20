export type Match = {
  id: string;
  kickoff: string; // Asia/Seoul local datetime, e.g. "2026-06-12T11:00:00+09:00"
  timeLabel: string;
  group: string;
  round: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  isKorea?: boolean;
  apiFootballFixtureId?: number;
  status?: MatchStatus;
  statusLabel?: string;
  elapsed?: number;
  homeScore?: number;
  awayScore?: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  homeScorers?: string[];
  awayScorers?: string[];
  homePenaltyScorers?: string[];
  awayPenaltyScorers?: string[];
  homePenaltyMisses?: string[];
  awayPenaltyMisses?: string[];
  winner?: 'home' | 'away' | 'draw';
  sourceUpdatedAt?: string;
  stage?: MatchStage;
};

export type ScheduleCell = {
  matches: Match[];
};

export type ScheduleDay = {
  date: string;
  dateLabel: string;
  weekday: string;
  cells: ScheduleCell[];
};

export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'suspended';

export type MatchStage =
  | 'group'
  | 'round-of-32'
  | 'round-of-16'
  | 'quarter-final'
  | 'semi-final'
  | 'third-place'
  | 'final';

export type ScheduleStage = MatchStage | 'tournament';

export type ScheduleSection = {
  id: string;
  title: string;
  stage: ScheduleStage;
  days: ScheduleDay[];
};

const game = (
  date: string,
  timeLabel: string,
  group: string,
  round: string,
  home: string,
  away: string,
  homeFlag: string,
  awayFlag: string,
): Match => ({
  id: `${date}-${timeLabel}-${home}-${away}`,
  kickoff: `${date}T${timeLabel}:00+09:00`,
  timeLabel,
  group,
  round,
  home,
  away,
  homeFlag,
  awayFlag,
  isKorea: home === '대한민국' || away === '대한민국',
  stage: 'group',
});

const cell = (...matches: Match[]): ScheduleCell => ({ matches });

const knockoutGame = (
  date: string,
  timeLabel: string,
  stage: MatchStage,
  round: string,
  matchNumber: number,
  home: string,
  away: string,
): Match => ({
  id: `match-${matchNumber}`,
  kickoff: `${date}T${timeLabel}:00+09:00`,
  timeLabel,
  group: round,
  round: `${matchNumber}번 경기`,
  home,
  away,
  homeFlag: '',
  awayFlag: '',
  stage,
});

export const scheduleSections: ScheduleSection[] = [
  {
    id: 'group-stage',
    title: '조별리그',
    stage: 'group',
    days: [
      {
        date: '2026-06-12',
        dateLabel: '6. 12.',
        weekday: '금',
        cells: [
          cell(game('2026-06-12', '04:00', 'A조', '1차전', '멕시코', '남아공', '🇲🇽', '🇿🇦')),
          cell(game('2026-06-12', '11:00', 'A조', '1차전', '대한민국', '체코', '🇰🇷', '🇨🇿')),
        ],
      },
      {
        date: '2026-06-13',
        dateLabel: '6. 13.',
        weekday: '토',
        cells: [
          cell(game('2026-06-13', '04:00', 'B조', '1차전', '캐나다', '보스니아', '🇨🇦', '🇧🇦')),
          cell(game('2026-06-13', '10:00', 'D조', '1차전', '미국', '파라과이', '🇺🇸', '🇵🇾')),
        ],
      },
      {
        date: '2026-06-14',
        dateLabel: '6. 14.',
        weekday: '일',
        cells: [
          cell(game('2026-06-14', '04:00', 'B조', '1차전', '카타르', '스위스', '🇶🇦', '🇨🇭')),
          cell(game('2026-06-14', '07:00', 'C조', '1차전', '브라질', '모로코', '🇧🇷', '🇲🇦')),
          cell(game('2026-06-14', '10:00', 'C조', '1차전', '아이티', '스코틀랜드', '🇭🇹', '🏴')),
          cell(game('2026-06-14', '13:00', 'D조', '1차전', '호주', '튀르키예', '🇦🇺', '🇹🇷')),
        ],
      },
      {
        date: '2026-06-15',
        dateLabel: '6. 15.',
        weekday: '월',
        cells: [
          cell(game('2026-06-15', '02:00', 'F조', '1차전', '독일', '퀴라소', '🇩🇪', '🇨🇼')),
          cell(game('2026-06-15', '05:00', 'E조', '1차전', '네덜란드', '일본', '🇳🇱', '🇯🇵')),
          cell(game('2026-06-15', '08:00', 'F조', '1차전', '코트디', '에콰도르', '🇨🇮', '🇪🇨')),
          cell(game('2026-06-15', '11:00', 'E조', '1차전', '스웨덴', '튀니지', '🇸🇪', '🇹🇳')),
        ],
      },
      {
        date: '2026-06-16',
        dateLabel: '6. 16.',
        weekday: '화',
        cells: [
          cell(game('2026-06-16', '01:00', 'H조', '1차전', '스페인', '카보베르', '🇪🇸', '🇨🇻')),
          cell(game('2026-06-16', '04:00', 'G조', '1차전', '벨기에', '이집트', '🇧🇪', '🇪🇬')),
          cell(game('2026-06-16', '07:00', 'H조', '1차전', '사우디', '우루과이', '🇸🇦', '🇺🇾')),
          cell(game('2026-06-16', '10:00', 'G조', '1차전', '이란', '뉴질랜드', '🇮🇷', '🇳🇿')),
        ],
      },
      {
        date: '2026-06-17',
        dateLabel: '6. 17.',
        weekday: '수',
        cells: [
          cell(game('2026-06-17', '04:00', 'I조', '1차전', '프랑스', '세네갈', '🇫🇷', '🇸🇳')),
          cell(game('2026-06-17', '07:00', 'I조', '1차전', '이라크', '노르웨이', '🇮🇶', '🇳🇴')),
          cell(game('2026-06-17', '10:00', 'J조', '1차전', '아르헨', '알제리', '🇦🇷', '🇩🇿')),
          cell(game('2026-06-17', '13:00', 'J조', '1차전', '오스트리아', '요르단', '🇦🇹', '🇯🇴')),
        ],
      },
      {
        date: '2026-06-18',
        dateLabel: '6. 18.',
        weekday: '목',
        cells: [
          cell(game('2026-06-18', '02:00', 'K조', '1차전', '포르투갈', '콩고', '🇵🇹', '🇨🇩')),
          cell(game('2026-06-18', '05:00', 'L조', '1차전', '잉글랜드', '크로아티아', '🏴', '🇭🇷')),
          cell(game('2026-06-18', '08:00', 'K조', '1차전', '가나', '파나마', '🇬🇭', '🇵🇦')),
          cell(game('2026-06-18', '11:00', 'L조', '1차전', '우즈벡', '콜롬비아', '🇺🇿', '🇨🇴')),
        ],
      },
      {
        date: '2026-06-19',
        dateLabel: '6. 19.',
        weekday: '금',
        cells: [
          cell(game('2026-06-19', '01:00', 'A조', '2차전', '체코', '남아공', '🇨🇿', '🇿🇦')),
          cell(game('2026-06-19', '04:00', 'B조', '2차전', '스위스', '보스니아', '🇨🇭', '🇧🇦')),
          cell(game('2026-06-19', '07:00', 'B조', '2차전', '캐나다', '카타르', '🇨🇦', '🇶🇦')),
          cell(game('2026-06-19', '10:00', 'A조', '2차전', '멕시코', '대한민국', '🇲🇽', '🇰🇷')),
        ],
      },
      {
        date: '2026-06-20',
        dateLabel: '6. 20.',
        weekday: '토',
        cells: [
          cell(game('2026-06-20', '04:00', 'D조', '2차전', '미국', '호주', '🇺🇸', '🇦🇺')),
          cell(game('2026-06-20', '07:00', 'C조', '2차전', '스코틀랜드', '모로코', '🏴', '🇲🇦')),
          cell(game('2026-06-20', '10:00', 'C조', '2차전', '브라질', '아이티', '🇧🇷', '🇭🇹')),
          cell(game('2026-06-20', '12:00', 'D조', '2차전', '튀르키예', '파라과이', '🇹🇷', '🇵🇾')),
        ],
      },
      {
        date: '2026-06-21',
        dateLabel: '6. 21.',
        weekday: '일',
        cells: [
          cell(game('2026-06-21', '02:00', 'F조', '2차전', '네덜란드', '스웨덴', '🇳🇱', '🇸🇪')),
          cell(game('2026-06-21', '05:00', 'E조', '2차전', '독일', '코트디', '🇩🇪', '🇨🇮')),
          cell(game('2026-06-21', '09:00', 'E조', '2차전', '에콰도르', '퀴라소', '🇪🇨', '🇨🇼')),
          cell(game('2026-06-21', '13:00', 'F조', '2차전', '튀니지', '일본', '🇹🇳', '🇯🇵')),
        ],
      },
      {
        date: '2026-06-22',
        dateLabel: '6. 22.',
        weekday: '월',
        cells: [
          cell(game('2026-06-22', '01:00', 'H조', '2차전', '스페인', '사우디', '🇪🇸', '🇸🇦')),
          cell(game('2026-06-22', '04:00', 'G조', '2차전', '벨기에', '이란', '🇧🇪', '🇮🇷')),
          cell(game('2026-06-22', '07:00', 'H조', '2차전', '우루과이', '카보베르', '🇺🇾', '🇨🇻')),
          cell(game('2026-06-22', '10:00', 'G조', '2차전', '뉴질랜드', '이집트', '🇳🇿', '🇪🇬')),
        ],
      },
      {
        date: '2026-06-23',
        dateLabel: '6. 23.',
        weekday: '화',
        cells: [
          cell(game('2026-06-23', '02:00', 'J조', '2차전', '아르헨', '오스트리아', '🇦🇷', '🇦🇹')),
          cell(game('2026-06-23', '06:00', 'I조', '2차전', '프랑스', '이라크', '🇫🇷', '🇮🇶')),
          cell(game('2026-06-23', '09:00', 'I조', '2차전', '노르웨이', '세네갈', '🇳🇴', '🇸🇳')),
          cell(game('2026-06-23', '12:00', 'J조', '2차전', '요르단', '알제리', '🇯🇴', '🇩🇿')),
        ],
      },
      {
        date: '2026-06-24',
        dateLabel: '6. 24.',
        weekday: '수',
        cells: [
          cell(game('2026-06-24', '02:00', 'K조', '2차전', '포르투갈', '우즈벡', '🇵🇹', '🇺🇿')),
          cell(game('2026-06-24', '05:00', 'L조', '2차전', '잉글랜드', '가나', '🏴', '🇬🇭')),
          cell(game('2026-06-24', '08:00', 'K조', '2차전', '파나마', '크로아티아', '🇵🇦', '🇭🇷')),
          cell(game('2026-06-24', '11:00', 'L조', '2차전', '콜롬비아', '콩고', '🇨🇴', '🇨🇩')),
        ],
      },
      {
        date: '2026-06-25',
        dateLabel: '6. 25.',
        weekday: '목',
        cells: [
          cell(
            game('2026-06-25', '04:00', 'B조', '3차전', '스위스', '캐나다', '🇨🇭', '🇨🇦'),
            game('2026-06-25', '04:00', 'B조', '3차전', '보스니아', '카타르', '🇧🇦', '🇶🇦'),
          ),
          cell(
            game('2026-06-25', '07:00', 'C조', '3차전', '스코틀랜드', '브라질', '🏴', '🇧🇷'),
            game('2026-06-25', '07:00', 'C조', '3차전', '모로코', '아이티', '🇲🇦', '🇭🇹'),
          ),
          cell(
            game('2026-06-25', '10:00', 'A조', '3차전', '남아공', '대한민국', '🇿🇦', '🇰🇷'),
            game('2026-06-25', '10:00', 'A조', '3차전', '체코', '멕시코', '🇨🇿', '🇲🇽'),
          ),
        ],
      },
      {
        date: '2026-06-26',
        dateLabel: '6. 26.',
        weekday: '금',
        cells: [
          cell(
            game('2026-06-26', '05:00', 'E조', '3차전', '퀴라소', '코트디', '🇨🇼', '🇨🇮'),
            game('2026-06-26', '05:00', 'E조', '3차전', '에콰도르', '독일', '🇪🇨', '🇩🇪'),
          ),
          cell(
            game('2026-06-26', '08:00', 'F조', '3차전', '튀니지', '네덜란드', '🇹🇳', '🇳🇱'),
            game('2026-06-26', '08:00', 'F조', '3차전', '일본', '스웨덴', '🇯🇵', '🇸🇪'),
          ),
          cell(
            game('2026-06-26', '11:00', 'D조', '3차전', '파라과이', '호주', '🇵🇾', '🇦🇺'),
            game('2026-06-26', '11:00', 'D조', '3차전', '튀르키예', '미국', '🇹🇷', '🇺🇸'),
          ),
        ],
      },
      {
        date: '2026-06-27',
        dateLabel: '6. 27.',
        weekday: '토',
        cells: [
          cell(
            game('2026-06-27', '04:00', 'I조', '3차전', '세네갈', '이라크', '🇸🇳', '🇮🇶'),
            game('2026-06-27', '04:00', 'I조', '3차전', '노르웨이', '프랑스', '🇳🇴', '🇫🇷'),
          ),
          cell(
            game('2026-06-27', '09:00', 'H조', '3차전', '우루과이', '스페인', '🇺🇾', '🇪🇸'),
            game('2026-06-27', '09:00', 'H조', '3차전', '카보베르', '사우디', '🇨🇻', '🇸🇦'),
          ),
          cell(
            game('2026-06-27', '12:00', 'G조', '3차전', '뉴질랜드', '벨기에', '🇳🇿', '🇧🇪'),
            game('2026-06-27', '12:00', 'G조', '3차전', '이집트', '이란', '🇪🇬', '🇮🇷'),
          ),
        ],
      },
      {
        date: '2026-06-28',
        dateLabel: '6. 28.',
        weekday: '일',
        cells: [
          cell(
            game('2026-06-28', '06:00', 'L조', '3차전', '파나마', '잉글랜드', '🇵🇦', '🏴'),
            game('2026-06-28', '06:00', 'L조', '3차전', '크로아티아', '가나', '🇭🇷', '🇬🇭'),
          ),
          cell(
            game('2026-06-28', '08:30', 'K조', '3차전', '콜롬비아', '포르투갈', '🇨🇴', '🇵🇹'),
            game('2026-06-28', '08:30', 'K조', '3차전', '콩고', '우즈벡', '🇨🇩', '🇺🇿'),
          ),
          cell(
            game('2026-06-28', '11:00', 'J조', '3차전', '요르단', '아르헨', '🇯🇴', '🇦🇷'),
            game('2026-06-28', '11:00', 'J조', '3차전', '알제리', '오스트리아', '🇩🇿', '🇦🇹'),
          ),
        ],
      },
    ],
  },
  {
    id: 'knockout-stage',
    title: '토너먼트',
    stage: 'tournament',
    days: [
      {
        date: '2026-06-29',
        dateLabel: '6. 29.',
        weekday: '월',
        cells: [
          cell(knockoutGame('2026-06-29', '04:00', 'round-of-32', '32강', 73, 'A조 2위', 'B조 2위')),
        ],
      },
      {
        date: '2026-06-30',
        dateLabel: '6. 30.',
        weekday: '화',
        cells: [
          cell(knockoutGame('2026-06-30', '02:00', 'round-of-32', '32강', 76, 'C조 1위', 'F조 2위')),
          cell(knockoutGame('2026-06-30', '05:30', 'round-of-32', '32강', 74, 'E조 1위', 'A/B/C/D/F조 3위')),
          cell(knockoutGame('2026-06-30', '10:00', 'round-of-32', '32강', 75, 'F조 1위', 'C조 2위')),
        ],
      },
      {
        date: '2026-07-01',
        dateLabel: '7. 1.',
        weekday: '수',
        cells: [
          cell(knockoutGame('2026-07-01', '02:00', 'round-of-32', '32강', 78, 'E조 2위', 'I조 2위')),
          cell(knockoutGame('2026-07-01', '06:00', 'round-of-32', '32강', 77, 'I조 1위', 'C/D/F/G/H조 3위')),
          cell(knockoutGame('2026-07-01', '10:00', 'round-of-32', '32강', 79, 'A조 1위', 'C/E/F/H/I조 3위')),
        ],
      },
      {
        date: '2026-07-02',
        dateLabel: '7. 2.',
        weekday: '목',
        cells: [
          cell(knockoutGame('2026-07-02', '01:00', 'round-of-32', '32강', 80, 'L조 1위', 'E/H/I/J/K조 3위')),
          cell(knockoutGame('2026-07-02', '05:00', 'round-of-32', '32강', 82, 'G조 1위', 'A/E/H/I/J조 3위')),
          cell(knockoutGame('2026-07-02', '09:00', 'round-of-32', '32강', 81, 'D조 1위', 'B/E/F/I/J조 3위')),
        ],
      },
      {
        date: '2026-07-03',
        dateLabel: '7. 3.',
        weekday: '금',
        cells: [
          cell(knockoutGame('2026-07-03', '04:00', 'round-of-32', '32강', 84, 'H조 1위', 'J조 2위')),
          cell(knockoutGame('2026-07-03', '08:00', 'round-of-32', '32강', 83, 'K조 2위', 'L조 2위')),
          cell(knockoutGame('2026-07-03', '12:00', 'round-of-32', '32강', 85, 'B조 1위', 'E/F/G/I/J조 3위')),
        ],
      },
      {
        date: '2026-07-04',
        dateLabel: '7. 4.',
        weekday: '토',
        cells: [
          cell(knockoutGame('2026-07-04', '03:00', 'round-of-32', '32강', 88, 'D조 2위', 'G조 2위')),
          cell(knockoutGame('2026-07-04', '07:00', 'round-of-32', '32강', 86, 'J조 1위', 'H조 2위')),
          cell(knockoutGame('2026-07-04', '10:30', 'round-of-32', '32강', 87, 'K조 1위', 'D/E/I/J/L조 3위')),
        ],
      },
      {
        date: '2026-07-05',
        dateLabel: '7. 5.',
        weekday: '일',
        cells: [
          cell(knockoutGame('2026-07-05', '02:00', 'round-of-16', '16강', 90, '73번 승자', '75번 승자')),
          cell(knockoutGame('2026-07-05', '06:00', 'round-of-16', '16강', 89, '74번 승자', '77번 승자')),
        ],
      },
      {
        date: '2026-07-06',
        dateLabel: '7. 6.',
        weekday: '월',
        cells: [
          cell(knockoutGame('2026-07-06', '05:00', 'round-of-16', '16강', 91, '76번 승자', '78번 승자')),
          cell(knockoutGame('2026-07-06', '09:00', 'round-of-16', '16강', 92, '79번 승자', '80번 승자')),
        ],
      },
      {
        date: '2026-07-07',
        dateLabel: '7. 7.',
        weekday: '화',
        cells: [
          cell(knockoutGame('2026-07-07', '04:00', 'round-of-16', '16강', 93, '83번 승자', '84번 승자')),
          cell(knockoutGame('2026-07-07', '09:00', 'round-of-16', '16강', 94, '81번 승자', '82번 승자')),
        ],
      },
      {
        date: '2026-07-08',
        dateLabel: '7. 8.',
        weekday: '수',
        cells: [
          cell(knockoutGame('2026-07-08', '01:00', 'round-of-16', '16강', 95, '86번 승자', '88번 승자')),
          cell(knockoutGame('2026-07-08', '05:00', 'round-of-16', '16강', 96, '85번 승자', '87번 승자')),
        ],
      },
      {
        date: '2026-07-10',
        dateLabel: '7. 10.',
        weekday: '금',
        cells: [
          cell(knockoutGame('2026-07-10', '05:00', 'quarter-final', '8강', 97, '89번 승자', '90번 승자')),
        ],
      },
      {
        date: '2026-07-11',
        dateLabel: '7. 11.',
        weekday: '토',
        cells: [
          cell(knockoutGame('2026-07-11', '04:00', 'quarter-final', '8강', 98, '93번 승자', '94번 승자')),
        ],
      },
      {
        date: '2026-07-12',
        dateLabel: '7. 12.',
        weekday: '일',
        cells: [
          cell(knockoutGame('2026-07-12', '06:00', 'quarter-final', '8강', 99, '91번 승자', '92번 승자')),
          cell(knockoutGame('2026-07-12', '10:00', 'quarter-final', '8강', 100, '95번 승자', '96번 승자')),
        ],
      },
      {
        date: '2026-07-15',
        dateLabel: '7. 15.',
        weekday: '수',
        cells: [
          cell(knockoutGame('2026-07-15', '04:00', 'semi-final', '4강', 101, '97번 승자', '98번 승자')),
        ],
      },
      {
        date: '2026-07-16',
        dateLabel: '7. 16.',
        weekday: '목',
        cells: [
          cell(knockoutGame('2026-07-16', '04:00', 'semi-final', '4강', 102, '99번 승자', '100번 승자')),
        ],
      },
      {
        date: '2026-07-19',
        dateLabel: '7. 19.',
        weekday: '일',
        cells: [
          cell(knockoutGame('2026-07-19', '06:00', 'third-place', '3·4위전', 103, '101번 패자', '102번 패자')),
        ],
      },
      {
        date: '2026-07-20',
        dateLabel: '7. 20.',
        weekday: '월',
        cells: [
          cell(knockoutGame('2026-07-20', '04:00', 'final', '결승', 104, '101번 승자', '102번 승자')),
        ],
      },
    ],
  },
];
