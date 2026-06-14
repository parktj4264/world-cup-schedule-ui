import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
const DEPLOYED_LIVE_SCHEDULE_ENDPOINT =
  ENV.LIVE_SCHEDULE_ENDPOINT ??
  'https://parktj4264.github.io/world-cup-schedule-ui/data/live-schedule.json';
const RECENT_LIVE_SKIP_MS = Number(ENV.LIVE_SCHEDULE_MIN_INTERVAL_MINUTES ?? 8) * 60 * 1000;
const WORLD_CUP_26_RETRY_DELAYS_MS = (ENV.WORLD_CUP_26_RETRY_DELAYS_MS ?? '0,10000,30000,60000')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value >= 0);
const LIVE_PROVIDER_SOURCES = new Set(['worldcup26.ir', 'api-football']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '../public/data/live-schedule.json');

class FetchHttpError extends Error {
  constructor(url, response) {
    super(`${url} failed: ${response.status} ${response.statusText}`);
    this.name = 'FetchHttpError';
    this.status = response.status;
  }
}

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const getOutputSummary = (output) => {
  const matches = Array.isArray(output?.matches) ? output.matches : [];
  const live = matches.filter((match) => match?.status === 'live').length;
  const finished = matches.filter((match) => match?.status === 'finished').length;
  const scored = matches.filter(
    (match) => typeof match?.homeScore === 'number' || typeof match?.awayScore === 'number',
  ).length;

  return {
    total: matches.length,
    live,
    finished,
    scored,
    liveCapable: LIVE_PROVIDER_SOURCES.has(output?.source),
  };
};

const logOutputSummary = (label, output) => {
  if (!output) {
    console.log(`${label}: none`);
    return;
  }

  const summary = getOutputSummary(output);
  console.log(
    `${label}: source=${output.source}, updated=${output.sourceUpdatedAt ?? 'unknown'}, ` +
      `matches=${summary.total}, live=${summary.live}, finished=${summary.finished}, scored=${summary.scored}`,
  );
};

const getOutputTimestamp = (output) => {
  const time = new Date(output?.sourceUpdatedAt ?? '').getTime();

  return Number.isFinite(time) ? time : 0;
};

const getPreviousOutputRank = (output) => {
  const summary = getOutputSummary(output);

  if (summary.liveCapable) {
    return 3;
  }

  if (summary.live > 0 || summary.scored > 0) {
    return 2;
  }

  return 1;
};

const chooseBestPreviousOutput = (outputs) =>
  outputs
    .filter(Boolean)
    .sort((left, right) => {
      const rankDelta = getPreviousOutputRank(right) - getPreviousOutputRank(left);

      if (rankDelta !== 0) {
        return rankDelta;
      }

      return getOutputTimestamp(right) - getOutputTimestamp(left);
    })[0];

const parseLiveScheduleOutput = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const source = typeof payload.source === 'string' ? payload.source : undefined;
  const matches = Array.isArray(payload.matches) ? payload.matches.filter(Boolean) : undefined;

  if (!source || !matches || matches.length === 0) {
    return undefined;
  }

  return {
    source,
    sourceUpdatedAt: typeof payload.sourceUpdatedAt === 'string' ? payload.sourceUpdatedAt : null,
    matches,
  };
};

const loadPreviousOutput = async () => {
  const deployedUrl = `${DEPLOYED_LIVE_SCHEDULE_ENDPOINT}?cacheBust=${Date.now()}`;
  const outputs = [];
  const candidates = [
    [
      'deployed Pages JSON',
      async () => fetchJson(deployedUrl, {
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      }),
    ],
    ['local repository JSON', async () => JSON.parse(await readFile(outputPath, 'utf8'))],
  ];

  for (const [label, load] of candidates) {
    try {
      const output = parseLiveScheduleOutput(await load());

      if (output) {
        logOutputSummary(`Loaded previous ${label}`, output);
        outputs.push(output);
        continue;
      }

      console.warn(`Previous ${label} did not look like live-schedule.json.`);
    } catch (error) {
      console.warn(`Could not load previous ${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const bestOutput = chooseBestPreviousOutput(outputs);

  if (bestOutput) {
    logOutputSummary('Selected previous schedule baseline', bestOutput);
  }

  return bestOutput;
};

const isRecentLiveOutput = (output, now = new Date()) => {
  if (!output || !LIVE_PROVIDER_SOURCES.has(output.source) || !output.sourceUpdatedAt) {
    return false;
  }

  const updatedAt = new Date(output.sourceUpdatedAt).getTime();

  if (!Number.isFinite(updatedAt)) {
    return false;
  }

  const ageMs = now.getTime() - updatedAt;

  return ageMs >= 0 && ageMs < RECENT_LIVE_SKIP_MS;
};

const shouldKeepPreviousInsteadOfStatic = (previousOutput) => {
  if (!previousOutput) {
    return false;
  }

  const summary = getOutputSummary(previousOutput);

  return summary.liveCapable || summary.live > 0 || summary.scored > 0;
};

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
    throw new FetchHttpError(url, response);
  }

  return response.json();
};

const isRetryableFetchError = (error) => {
  if (error instanceof FetchHttpError) {
    return error.status === 429 || error.status >= 500;
  }

  return true;
};

const fetchJsonWithRetry = async (url, options, retryDelaysMs, label) => {
  let lastError;

  for (let attemptIndex = 0; attemptIndex < retryDelaysMs.length; attemptIndex += 1) {
    const delayMs = retryDelaysMs[attemptIndex];

    if (delayMs > 0) {
      console.warn(`${label} retry ${attemptIndex + 1}/${retryDelaysMs.length} after ${delayMs}ms`);
      await sleep(delayMs);
    }

    try {
      return await fetchJson(url, options);
    } catch (error) {
      lastError = error;

      if (!isRetryableFetchError(error) || attemptIndex === retryDelaysMs.length - 1) {
        break;
      }

      console.warn(`${label} attempt ${attemptIndex + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw lastError;
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
  const data = await fetchJsonWithRetry(
    WORLD_CUP_26_GAMES_ENDPOINT,
    {
      headers: {
        Accept: 'application/json',
      },
    },
    WORLD_CUP_26_RETRY_DELAYS_MS.length > 0 ? WORLD_CUP_26_RETRY_DELAYS_MS : [0],
    'worldcup26.ir',
  );

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

const liveProviders = [
  ['worldcup26.ir', fetchWorldCup26Matches],
  ...(ENABLE_API_FOOTBALL ? [['api-football', fetchApiFootballMatches]] : []),
];

const staticProviders = [['openfootball/worldcup.json', fetchOpenFootballMatches]];

const fetchProviderOutput = async (providers, providerType) => {
  for (const [source, fetchMatches] of providers) {
    try {
      const matches = await fetchMatches();

      if (matches.length === 0) {
        console.warn(`${source} returned no usable fixtures. Trying next ${providerType} provider.`);
        continue;
      }

      const output = {
        source,
        sourceUpdatedAt: new Date().toISOString(),
        matches,
      };

      logOutputSummary(`Fetched ${providerType} provider`, output);

      return output;
    } catch (error) {
      console.warn(`${source} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return undefined;
};

const previousOutput = await loadPreviousOutput();
let output;

if (isRecentLiveOutput(previousOutput)) {
  output = previousOutput;
  console.log(
    `Previous live provider output is newer than ${RECENT_LIVE_SKIP_MS / 60_000} minutes. ` +
      'Skipping provider fetch to avoid bursty duplicate checks.',
  );
} else {
  output = await fetchProviderOutput(liveProviders, 'live');
}

if (!output && previousOutput && shouldKeepPreviousInsteadOfStatic(previousOutput)) {
  output = previousOutput;
  console.warn('No live provider succeeded. Keeping previous live/scored schedule instead of downgrading to static data.');
}

if (!output) {
  const staticOutput = await fetchProviderOutput(staticProviders, 'static');

  if (staticOutput && !shouldKeepPreviousInsteadOfStatic(previousOutput)) {
    output = staticOutput;
  } else if (previousOutput) {
    output = previousOutput;
    console.warn('Static fallback was not allowed to replace previous schedule quality. Keeping previous schedule.');
  }
}

if (!output) {
  console.warn('No provider returned usable fixtures and no previous schedule exists. Keeping repository live-schedule.json untouched.');
  process.exit(0);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

logOutputSummary('Final live schedule output', output);
console.log(`Wrote ${output.matches.length} live schedule updates to ${outputPath}`);
