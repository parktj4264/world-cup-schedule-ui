import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV = globalThis.process?.env ?? {};
const API_KEY = ENV.API_FOOTBALL_KEY;
const LEAGUE = 1;
const SEASON = 2026;
const API_FOOTBALL_ENDPOINT = `https://v3.football.api-sports.io/fixtures?league=${LEAGUE}&season=${SEASON}&timezone=Asia/Seoul`;
const WORLD_CUP_26_GAMES_ENDPOINT = 'https://worldcup26.ir/get/games';
const OPENFOOTBALL_ENDPOINT =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const ENABLE_API_FOOTBALL = ENV.LIVE_SCHEDULE_PROVIDER === 'api-football';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '../public/data/live-schedule.json');

const STADIUM_TIME_ZONES = new Map(
  Object.entries({
    1: 'America/Mexico_City',
    2: 'America/Mexico_City',
    3: 'America/Monterrey',
    4: 'America/Chicago',
    5: 'America/Chicago',
    6: 'America/Chicago',
    7: 'America/New_York',
    8: 'America/New_York',
    9: 'America/New_York',
    10: 'America/New_York',
    11: 'America/New_York',
    12: 'America/Toronto',
    13: 'America/Vancouver',
    14: 'America/Los_Angeles',
    15: 'America/Los_Angeles',
    16: 'America/Los_Angeles',
  }),
);

const summarizeApiErrors = (errors) => {
  if (!errors) {
    return 'none';
  }

  if (Array.isArray(errors)) {
    return errors.length > 0 ? JSON.stringify(errors) : 'none';
  }

  if (typeof errors === 'object') {
    const entries = Object.entries(errors);
    return entries.length > 0 ? JSON.stringify(Object.fromEntries(entries.slice(0, 8))) : 'none';
  }

  return String(errors);
};

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
    'Democratic Republic of the Congo': '콩고',
    'DR Congo': '콩고',
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

const parseNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toKstIsoFromDate = (date) => {
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

const getTimeZoneParts = (date, timeZone) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
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
      result[part.type] = Number(part.value);
      return result;
    }, {});

const zonedLocalTimeToUtcDate = ({ year, month, day, hour, minute }, timeZone) => {
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let utc = targetAsUtc;

  for (let index = 0; index < 3; index += 1) {
    const parts = getTimeZoneParts(new Date(utc), timeZone);
    const zonedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    utc -= zonedAsUtc - targetAsUtc;
  }

  return new Date(utc);
};

const parseWorldCup26Kickoff = (localDate, stadiumId) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(localDate ?? '');

  if (!match) {
    return undefined;
  }

  const [, month, day, year, hour, minute] = match;
  const timeZone = STADIUM_TIME_ZONES.get(String(stadiumId));

  if (!timeZone) {
    return undefined;
  }

  return toKstIsoFromDate(
    zonedLocalTimeToUtcDate(
      {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute),
      },
      timeZone,
    ),
  );
};

const parseOpenFootballKickoff = (date, time) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  const timeMatch = /^(\d{1,2}):(\d{2})\s+UTC([+-]\d{1,2})$/.exec(time ?? '');

  if (!dateMatch || !timeMatch) {
    return undefined;
  }

  const [, year, month, day] = dateMatch;
  const [, hour, minute, offset] = timeMatch;
  const utcDate = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - Number(offset),
      Number(minute),
    ),
  );

  return toKstIsoFromDate(utcDate);
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

const getWinnerFromScores = (status, homeScore, awayScore) => {
  if (status !== 'finished' || typeof homeScore !== 'number' || typeof awayScore !== 'number') {
    return undefined;
  }

  if (homeScore > awayScore) {
    return 'home';
  }

  if (awayScore > homeScore) {
    return 'away';
  }

  return 'draw';
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

const getLocalMatchId = (matchNumber, kickoff, home, away) => {
  if (typeof matchNumber === 'number' && matchNumber >= 73) {
    return `match-${matchNumber}`;
  }

  return buildLocalId(kickoff, home, away);
};

const getWorldCup26Status = (game) => {
  const finished = String(game?.finished ?? '').toUpperCase() === 'TRUE';
  const elapsed = String(game?.time_elapsed ?? '').toLowerCase();

  if (finished || elapsed === 'finished') {
    return 'finished';
  }

  if (elapsed === 'notstarted' || elapsed === 'null' || elapsed === '') {
    return 'scheduled';
  }

  return 'live';
};

const normalizeWorldCup26Game = (game) => {
  const matchNumber = parseNumber(game?.id);
  const kickoff = parseWorldCup26Kickoff(game?.local_date, game?.stadium_id);
  const home = toKoreanTeamName(game?.home_team_name_en);
  const away = toKoreanTeamName(game?.away_team_name_en);
  const status = getWorldCup26Status(game);
  const elapsed = parseNumber(game?.time_elapsed);
  const homeScore = status !== 'scheduled' ? parseNumber(game?.home_score) : undefined;
  const awayScore = status !== 'scheduled' ? parseNumber(game?.away_score) : undefined;

  if (!matchNumber || !kickoff) {
    return undefined;
  }

  return {
    id: getLocalMatchId(matchNumber, kickoff, home, away),
    apiFootballFixtureId: matchNumber,
    kickoff,
    home,
    away,
    homeFlag: home ? TEAM_FLAGS.get(home) : undefined,
    awayFlag: away ? TEAM_FLAGS.get(away) : undefined,
    status,
    statusLabel: game?.time_elapsed,
    elapsed,
    homeScore,
    awayScore,
    winner: getWinnerFromScores(status, homeScore, awayScore),
  };
};

const normalizeOpenFootballMatch = (match) => {
  const matchNumber = parseNumber(match?.num);
  const kickoff = parseOpenFootballKickoff(match?.date, match?.time);
  const home = toKoreanTeamName(match?.team1);
  const away = toKoreanTeamName(match?.team2);
  const score = Array.isArray(match?.score?.ft) ? match.score.ft : undefined;
  const homeScore = parseNumber(score?.[0]);
  const awayScore = parseNumber(score?.[1]);
  const status =
    typeof homeScore === 'number' && typeof awayScore === 'number' ? 'finished' : 'scheduled';

  if (!kickoff) {
    return undefined;
  }

  return {
    id: getLocalMatchId(matchNumber, kickoff, home, away),
    apiFootballFixtureId: matchNumber,
    kickoff,
    home,
    away,
    homeFlag: home ? TEAM_FLAGS.get(home) : undefined,
    awayFlag: away ? TEAM_FLAGS.get(away) : undefined,
    status,
    statusLabel: match?.round,
    homeScore: status === 'finished' ? homeScore : undefined,
    awayScore: status === 'finished' ? awayScore : undefined,
    winner: getWinnerFromScores(status, homeScore, awayScore),
  };
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

const normalizeProviderMatches = (source, rawMatches, normalizeMatch) => {
  const normalizedMatches = rawMatches.map(normalizeMatch);
  const matches = normalizedMatches.filter(Boolean);

  console.log(`${source} response fixtures: ${rawMatches.length}`);
  console.log(`${source} normalized usable fixtures: ${matches.length}`);
  console.log(`${source} skipped unusable fixtures: ${normalizedMatches.length - matches.length}`);

  return matches;
};

const fetchApiFootballMatches = async () => {
  if (!API_KEY) {
    console.warn('API_FOOTBALL_KEY is not set. Skipping API-FOOTBALL.');
    return [];
  }

  const data = await fetchJson(API_FOOTBALL_ENDPOINT, {
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  if (!Array.isArray(data?.response)) {
    throw new Error('API-FOOTBALL response did not include a response array.');
  }

  console.log(`API-FOOTBALL request: league=${LEAGUE}, season=${SEASON}, timezone=Asia/Seoul`);
  console.log(`API-FOOTBALL response: results=${data.results ?? 'unknown'}, fixtures=${data.response.length}`);
  console.log(`API-FOOTBALL errors: ${summarizeApiErrors(data.errors)}`);

  return normalizeProviderMatches('api-football', data.response, normalizeFixture);
};

const fetchWorldCup26Matches = async () => {
  const data = await fetchJson(WORLD_CUP_26_GAMES_ENDPOINT, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!Array.isArray(data?.games)) {
    throw new Error('worldcup26.ir response did not include a games array.');
  }

  return normalizeProviderMatches('worldcup26.ir', data.games, normalizeWorldCup26Game);
};

const fetchOpenFootballMatches = async () => {
  const data = await fetchJson(OPENFOOTBALL_ENDPOINT);

  if (!Array.isArray(data?.matches)) {
    throw new Error('openfootball response did not include a matches array.');
  }

  return normalizeProviderMatches('openfootball', data.matches, normalizeOpenFootballMatch);
};

const providers = [
  ['worldcup26.ir', fetchWorldCup26Matches],
  ['openfootball/worldcup.json', fetchOpenFootballMatches],
  ...(ENABLE_API_FOOTBALL ? [['api-football', fetchApiFootballMatches]] : []),
];

let output;

for (const [source, fetchMatches] of providers) {
  try {
    const matches = await fetchMatches();

    if (matches.length === 0) {
      console.warn(`${source} returned no usable fixtures. Trying next provider.`);
      continue;
    }

    output = {
      source,
      sourceUpdatedAt: new Date().toISOString(),
      matches,
    };
    break;
  } catch (error) {
    console.warn(`${source} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (!output) {
  console.warn('No live schedule provider returned usable fixtures. Keeping existing live-schedule.json.');
  process.exit(0);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(`Fetched ${output.source} fixtures at ${output.sourceUpdatedAt}`);
console.log(`Wrote ${output.matches.length} live schedule updates to ${outputPath}`);
