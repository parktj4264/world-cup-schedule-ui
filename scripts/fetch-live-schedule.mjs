import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE = 1;
const SEASON = 2026;
const ENDPOINT = `https://v3.football.api-sports.io/fixtures?league=${LEAGUE}&season=${SEASON}&timezone=Asia/Seoul`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '../public/data/live-schedule.json');

const TEAM_ALIASES = new Map(
  Object.entries({
    Algeria: '알제리',
    Argentina: '아르헨',
    Australia: '호주',
    Austria: '오스트리아',
    Belgium: '벨기에',
    'Bosnia & Herzegovina': '보스니아',
    'Bosnia and Herzegovina': '보스니아',
    Brazil: '브라질',
    Canada: '캐나다',
    'Cape Verde': '카보베르',
    Colombia: '콜롬비아',
    'Congo DR': '콩고',
    'Costa Rica': '코스타리카',
    Croatia: '크로아티아',
    Curacao: '퀴라소',
    Curaçao: '퀴라소',
    Czechia: '체코',
    'Czech Republic': '체코',
    Ecuador: '에콰도르',
    Egypt: '이집트',
    England: '잉글랜드',
    France: '프랑스',
    Germany: '독일',
    Ghana: '가나',
    Haiti: '아이티',
    Iran: '이란',
    Iraq: '이라크',
    'Ivory Coast': '코트디',
    "Côte d'Ivoire": '코트디',
    Japan: '일본',
    Jordan: '요르단',
    Mexico: '멕시코',
    Morocco: '모로코',
    Netherlands: '네덜란드',
    'New Zealand': '뉴질랜드',
    Norway: '노르웨이',
    Panama: '파나마',
    Paraguay: '파라과이',
    Portugal: '포르투갈',
    Qatar: '카타르',
    Saudi: '사우디',
    'Saudi Arabia': '사우디',
    Scotland: '스코틀랜드',
    Senegal: '세네갈',
    'South Africa': '남아공',
    'South Korea': '대한민국',
    Spain: '스페인',
    Sweden: '스웨덴',
    Switzerland: '스위스',
    Tunisia: '튀니지',
    Turkey: '튀르키예',
    Türkiye: '튀르키예',
    Turkiye: '튀르키예',
    'United States': '미국',
    USA: '미국',
    Uruguay: '우루과이',
    Uzbekistan: '우즈벡',
  }),
);

const TEAM_FLAGS = new Map(
  Object.entries({
    가나: '🇬🇭',
    남아공: '🇿🇦',
    네덜란드: '🇳🇱',
    노르웨이: '🇳🇴',
    뉴질랜드: '🇳🇿',
    대한민국: '🇰🇷',
    독일: '🇩🇪',
    멕시코: '🇲🇽',
    모로코: '🇲🇦',
    미국: '🇺🇸',
    벨기에: '🇧🇪',
    보스니아: '🇧🇦',
    브라질: '🇧🇷',
    사우디: '🇸🇦',
    세네갈: '🇸🇳',
    스웨덴: '🇸🇪',
    스위스: '🇨🇭',
    스코틀랜드: '🏴',
    스페인: '🇪🇸',
    아르헨: '🇦🇷',
    아이티: '🇭🇹',
    알제리: '🇩🇿',
    에콰도르: '🇪🇨',
    오스트리아: '🇦🇹',
    요르단: '🇯🇴',
    우루과이: '🇺🇾',
    우즈벡: '🇺🇿',
    이라크: '🇮🇶',
    이란: '🇮🇷',
    이집트: '🇪🇬',
    일본: '🇯🇵',
    잉글랜드: '🏴',
    체코: '🇨🇿',
    카보베르: '🇨🇻',
    카타르: '🇶🇦',
    캐나다: '🇨🇦',
    코스타리카: '🇨🇷',
    코트디: '🇨🇮',
    콜롬비아: '🇨🇴',
    콩고: '🇨🇩',
    퀴라소: '🇨🇼',
    크로아티아: '🇭🇷',
    튀니지: '🇹🇳',
    튀르키예: '🇹🇷',
    파나마: '🇵🇦',
    파라과이: '🇵🇾',
    포르투갈: '🇵🇹',
    프랑스: '🇫🇷',
    호주: '🇦🇺',
  }),
);

const STATUS_MAP = new Map(
  Object.entries({
    TBD: 'scheduled',
    NS: 'scheduled',
    '1H': 'live',
    HT: 'live',
    '2H': 'live',
    ET: 'live',
    BT: 'live',
    P: 'live',
    FT: 'finished',
    AET: 'finished',
    PEN: 'finished',
    AWD: 'finished',
    WO: 'finished',
    PST: 'postponed',
    CANC: 'cancelled',
    SUSP: 'suspended',
    INT: 'suspended',
    ABD: 'suspended',
  }),
);

const toKoreanTeamName = (teamName) => {
  if (!teamName) {
    return undefined;
  }

  return TEAM_ALIASES.get(teamName) ?? teamName;
};

const toKstIso = (dateString) => {
  const date = new Date(dateString);

  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00+09:00`;
};

const getWinner = (fixture, status, homeScore, awayScore) => {
  if (fixture?.teams?.home?.winner === true) {
    return 'home';
  }

  if (fixture?.teams?.away?.winner === true) {
    return 'away';
  }

  if (status === 'finished' && typeof homeScore === 'number' && typeof awayScore === 'number') {
    if (homeScore > awayScore) {
      return 'home';
    }

    if (awayScore > homeScore) {
      return 'away';
    }

    return 'draw';
  }

  return undefined;
};

const buildLocalId = (kickoff, home, away) => {
  if (!kickoff || !home || !away) {
    return undefined;
  }

  return `${kickoff.slice(0, 10)}-${kickoff.slice(11, 16)}-${home}-${away}`;
};

const normalizeFixture = (fixture) => {
  const apiFootballFixtureId = fixture?.fixture?.id;
  const kickoff = toKstIso(fixture?.fixture?.date);
  const home = toKoreanTeamName(fixture?.teams?.home?.name);
  const away = toKoreanTeamName(fixture?.teams?.away?.name);
  const statusCode = fixture?.fixture?.status?.short;
  const status = STATUS_MAP.get(statusCode) ?? 'scheduled';
  const homeScore = fixture?.goals?.home;
  const awayScore = fixture?.goals?.away;

  if (!apiFootballFixtureId || !kickoff) {
    return undefined;
  }

  return {
    id: buildLocalId(kickoff, home, away),
    apiFootballFixtureId,
    kickoff,
    home,
    away,
    homeFlag: home ? TEAM_FLAGS.get(home) : undefined,
    awayFlag: away ? TEAM_FLAGS.get(away) : undefined,
    status,
    statusLabel: fixture?.fixture?.status?.long,
    elapsed: fixture?.fixture?.status?.elapsed ?? undefined,
    homeScore: typeof homeScore === 'number' ? homeScore : undefined,
    awayScore: typeof awayScore === 'number' ? awayScore : undefined,
    winner: getWinner(fixture, status, homeScore, awayScore),
  };
};

if (!API_KEY) {
  throw new Error('Missing API_FOOTBALL_KEY environment variable.');
}

const response = await fetch(ENDPOINT, {
  headers: {
    'x-apisports-key': API_KEY,
  },
});

if (!response.ok) {
  throw new Error(`API-FOOTBALL request failed: ${response.status} ${response.statusText}`);
}

const data = await response.json();

if (!Array.isArray(data?.response)) {
  throw new Error('API-FOOTBALL response did not include a response array.');
}

const matches = data.response.map(normalizeFixture).filter(Boolean);

if (matches.length === 0) {
  throw new Error('API-FOOTBALL returned no usable World Cup fixtures.');
}

const output = {
  source: 'api-football',
  sourceUpdatedAt: new Date().toISOString(),
  league: LEAGUE,
  season: SEASON,
  matches,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(`Wrote ${matches.length} live schedule updates to ${outputPath}`);
