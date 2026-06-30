import type { LiveMatchUpdate, LiveSchedule } from './liveSchedule';

const WORLD_CUP_26_GAMES_ENDPOINT = 'https://worldcup26.ir/get/games';

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

type WorldCup26Game = {
  id?: string | number;
  local_date?: string;
  stadium_id?: string | number;
  home_team_name_en?: string;
  away_team_name_en?: string;
  time_elapsed?: string | number | null;
  finished?: string | boolean;
  home_score?: string | number | null;
  away_score?: string | number | null;
  home_penalty_score?: string | number | null;
  away_penalty_score?: string | number | null;
  home_scorers?: string | null;
  away_scorers?: string | null;
  home_penalty_scorers?: string | null;
  away_penalty_scorers?: string | null;
  home_penalty_misses?: string | null;
  away_penalty_misses?: string | null;
};

const toKoreanTeamName = (teamName: string | undefined) =>
  teamName ? (TEAM_ALIASES.get(teamName) ?? teamName) : undefined;

const parseNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseScorers = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value
    .trim()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  if (!normalized || /^null$/i.test(normalized) || normalized === '{}' || normalized === '[]') {
    return undefined;
  }

  const quotedItems = Array.from(normalized.matchAll(/"([^"]+)"/g), (match) => match[1].trim())
    .filter(Boolean);

  const scorers = quotedItems.length > 0
    ? quotedItems
    : normalized
      .replace(/^[{\[]|[}\]]$/g, '')
      .split(/[,،]/)
      .map((item) => item.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);

  return scorers.length > 0 ? scorers : undefined;
};

const toKstIsoFromDate = (date: Date) => {
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
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00+09:00`;
};

const getTimeZoneParts = (date: Date, timeZone: string) =>
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
    .reduce<Record<string, number>>((result, part) => {
      result[part.type] = Number(part.value);
      return result;
    }, {});

const zonedLocalTimeToUtcDate = (
  { year, month, day, hour, minute }: Record<'year' | 'month' | 'day' | 'hour' | 'minute', number>,
  timeZone: string,
) => {
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let utc = targetAsUtc;

  for (let index = 0; index < 3; index += 1) {
    const parts = getTimeZoneParts(new Date(utc), timeZone);
    const zonedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    utc -= zonedAsUtc - targetAsUtc;
  }

  return new Date(utc);
};

const parseWorldCup26Kickoff = (localDate: string | undefined, stadiumId: string | number | undefined) => {
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

const buildLocalId = (kickoff: string | undefined, home: string | undefined, away: string | undefined) => {
  if (!kickoff || !home || !away) {
    return undefined;
  }

  return `${kickoff.slice(0, 10)}-${kickoff.slice(11, 16)}-${home}-${away}`;
};

const getLocalMatchId = (
  matchNumber: number | undefined,
  kickoff: string | undefined,
  home: string | undefined,
  away: string | undefined,
) => {
  if (typeof matchNumber === 'number' && matchNumber >= 73) {
    return `match-${matchNumber}`;
  }

  return buildLocalId(kickoff, home, away);
};

const getWorldCup26Status = (game: WorldCup26Game): LiveMatchUpdate['status'] => {
  const finished = String(game.finished ?? '').toUpperCase() === 'TRUE';
  const elapsed = String(game.time_elapsed ?? '').toLowerCase();

  if (finished || elapsed === 'finished') {
    return 'finished';
  }

  if (elapsed === 'notstarted' || elapsed === 'null' || elapsed === '') {
    return 'scheduled';
  }

  return 'live';
};

const getWinnerFromScores = (
  status: LiveMatchUpdate['status'],
  homeScore: number | undefined,
  awayScore: number | undefined,
  homePenaltyScore?: number,
  awayPenaltyScore?: number,
) => {
  if (status !== 'finished' || typeof homeScore !== 'number' || typeof awayScore !== 'number') {
    return undefined;
  }

  if (homeScore > awayScore) {
    return 'home';
  }

  if (awayScore > homeScore) {
    return 'away';
  }

  if (typeof homePenaltyScore === 'number' && typeof awayPenaltyScore === 'number') {
    if (homePenaltyScore > awayPenaltyScore) {
      return 'home';
    }

    if (awayPenaltyScore > homePenaltyScore) {
      return 'away';
    }
  }

  return 'draw';
};

const normalizeWorldCup26Game = (game: WorldCup26Game): LiveMatchUpdate | undefined => {
  const matchNumber = parseNumber(game.id);
  const kickoff = parseWorldCup26Kickoff(game.local_date, game.stadium_id);
  const home = toKoreanTeamName(game.home_team_name_en);
  const away = toKoreanTeamName(game.away_team_name_en);
  const status = getWorldCup26Status(game);
  const elapsed = parseNumber(game.time_elapsed);
  const homeScore = status !== 'scheduled' ? parseNumber(game.home_score) : undefined;
  const awayScore = status !== 'scheduled' ? parseNumber(game.away_score) : undefined;
  const homePenaltyScore = status !== 'scheduled' ? parseNumber(game.home_penalty_score) : undefined;
  const awayPenaltyScore = status !== 'scheduled' ? parseNumber(game.away_penalty_score) : undefined;

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
    statusLabel: typeof game.time_elapsed === 'string' ? game.time_elapsed : undefined,
    elapsed,
    homeScore,
    awayScore,
    homePenaltyScore,
    awayPenaltyScore,
    homeScorers: parseScorers(game.home_scorers),
    awayScorers: parseScorers(game.away_scorers),
    homePenaltyScorers: parseScorers(game.home_penalty_scorers),
    awayPenaltyScorers: parseScorers(game.away_penalty_scorers),
    homePenaltyMisses: parseScorers(game.home_penalty_misses),
    awayPenaltyMisses: parseScorers(game.away_penalty_misses),
    winner: getWinnerFromScores(status, homeScore, awayScore, homePenaltyScore, awayPenaltyScore),
  };
};

export const fetchBrowserLiveSchedule = async (signal?: AbortSignal): Promise<LiveSchedule> => {
  const response = await fetch(`${WORLD_CUP_26_GAMES_ENDPOINT}?ts=${Date.now()}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`worldcup26.ir failed: ${response.status}`);
  }

  const payload = (await response.json()) as { games?: WorldCup26Game[] };

  if (!Array.isArray(payload.games)) {
    throw new Error('worldcup26.ir response did not include games.');
  }

  const matches = payload.games.map(normalizeWorldCup26Game).filter(Boolean) as LiveMatchUpdate[];

  if (matches.length === 0) {
    throw new Error('worldcup26.ir returned no usable games.');
  }

  return {
    source: 'worldcup26.ir/browser',
    sourceUpdatedAt: new Date().toISOString(),
    matches,
  };
};
