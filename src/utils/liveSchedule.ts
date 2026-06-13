import type { Match, MatchStatus, ScheduleSection } from '../data/schedule';

export type LiveMatchUpdate = {
  id?: string;
  apiFootballFixtureId?: number;
  kickoff?: string;
  home?: string;
  away?: string;
  homeFlag?: string;
  awayFlag?: string;
  status?: MatchStatus;
  statusLabel?: string;
  elapsed?: number;
  homeScore?: number;
  awayScore?: number;
  winner?: 'home' | 'away' | 'draw';
  sourceUpdatedAt?: string;
};

export type LiveSchedule = {
  source: string;
  sourceUpdatedAt: string | null;
  matches: LiveMatchUpdate[];
};

const isNumberOrUndefined = (value: unknown) =>
  typeof value === 'undefined' || typeof value === 'number';

const isStringOrUndefined = (value: unknown) =>
  typeof value === 'undefined' || typeof value === 'string';

const normalizeTeamName = (teamName: string | undefined) =>
  (teamName ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\s.'’&()-]/g, '');

const getKickoffTime = (kickoff: string | undefined) => {
  if (!kickoff) {
    return undefined;
  }

  const time = new Date(kickoff).getTime();
  return Number.isFinite(time) ? time : undefined;
};

const getTeamKickoffKey = (match: Pick<Match | LiveMatchUpdate, 'kickoff' | 'home' | 'away'>) => {
  const kickoffTime = getKickoffTime(match.kickoff);

  if (!kickoffTime || !match.home || !match.away) {
    return undefined;
  }

  return [
    kickoffTime,
    normalizeTeamName(match.home),
    normalizeTeamName(match.away),
  ].join('|');
};

const getKickoffKey = (kickoff: string | undefined) => {
  const kickoffTime = getKickoffTime(kickoff);

  return typeof kickoffTime === 'number' ? String(kickoffTime) : undefined;
};

export const isPlaceholderTeamName = (teamName: string | undefined) => {
  const value = (teamName ?? '').trim();

  if (!value) {
    return true;
  }

  return (
    /승자|패자|TBD|To be decided|Winner|Loser/i.test(value) ||
    /[A-L](?:\/[A-L])*\s*조\s*[1-3]위/i.test(value) ||
    /^[1-3][A-L]$/i.test(value)
  );
};

export const isResolvedTeamName = (teamName: string | undefined) =>
  Boolean(teamName?.trim()) && !isPlaceholderTeamName(teamName);

const shouldReplaceTeams = (match: Match, update: LiveMatchUpdate) =>
  match.stage !== 'group' &&
  isResolvedTeamName(update.home) &&
  isResolvedTeamName(update.away);

const mergeMatch = (
  match: Match,
  update: LiveMatchUpdate | undefined,
  sourceUpdatedAt: string | null,
): Match => {
  if (!update) {
    return match;
  }

  const replaceTeams = shouldReplaceTeams(match, update);
  const home = replaceTeams && update.home ? update.home : match.home;
  const away = replaceTeams && update.away ? update.away : match.away;

  return {
    ...match,
    apiFootballFixtureId: update.apiFootballFixtureId ?? match.apiFootballFixtureId,
    status: update.status ?? match.status,
    statusLabel: update.statusLabel ?? match.statusLabel,
    elapsed: update.elapsed ?? match.elapsed,
    homeScore: update.homeScore,
    awayScore: update.awayScore,
    winner: update.winner,
    sourceUpdatedAt: update.sourceUpdatedAt ?? sourceUpdatedAt ?? match.sourceUpdatedAt,
    home,
    away,
    homeFlag: replaceTeams ? (update.homeFlag ?? match.homeFlag) : match.homeFlag,
    awayFlag: replaceTeams ? (update.awayFlag ?? match.awayFlag) : match.awayFlag,
    isKorea: match.isKorea || home === '대한민국' || away === '대한민국',
  };
};

export const parseLiveSchedule = (payload: unknown): LiveSchedule | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const value = payload as Partial<LiveSchedule>;

  if (typeof value.source !== 'string' || !Array.isArray(value.matches)) {
    return undefined;
  }

  const matches = value.matches.filter((match): match is LiveMatchUpdate => {
    if (!match || typeof match !== 'object') {
      return false;
    }

    const candidate = match as LiveMatchUpdate;

    return (
      isStringOrUndefined(candidate.id) &&
      isStringOrUndefined(candidate.kickoff) &&
      isStringOrUndefined(candidate.home) &&
      isStringOrUndefined(candidate.away) &&
      isNumberOrUndefined(candidate.apiFootballFixtureId) &&
      isNumberOrUndefined(candidate.homeScore) &&
      isNumberOrUndefined(candidate.awayScore) &&
      isNumberOrUndefined(candidate.elapsed)
    );
  });

  return {
    source: value.source,
    sourceUpdatedAt: typeof value.sourceUpdatedAt === 'string' ? value.sourceUpdatedAt : null,
    matches,
  };
};

export const mergeLiveSchedule = (
  sections: ScheduleSection[],
  liveSchedule: LiveSchedule | undefined,
) => {
  if (!liveSchedule || liveSchedule.matches.length === 0) {
    return sections;
  }

  const byId = new Map<string, LiveMatchUpdate>();
  const byApiFixtureId = new Map<number, LiveMatchUpdate>();
  const byTeamKickoff = new Map<string, LiveMatchUpdate>();
  const byKickoff = new Map<string, LiveMatchUpdate>();

  liveSchedule.matches.forEach((match) => {
    if (match.id) {
      byId.set(match.id, match);
    }

    if (typeof match.apiFootballFixtureId === 'number') {
      byApiFixtureId.set(match.apiFootballFixtureId, match);
    }

    const teamKickoffKey = getTeamKickoffKey(match);
    if (teamKickoffKey) {
      byTeamKickoff.set(teamKickoffKey, match);
    }

    const kickoffKey = getKickoffKey(match.kickoff);
    if (kickoffKey) {
      byKickoff.set(kickoffKey, match);
    }
  });

  return sections.map((section) => ({
    ...section,
    days: section.days.map((day) => ({
      ...day,
      cells: day.cells.map((cell) => ({
        ...cell,
        matches: cell.matches.map((match) => {
          const teamKickoffKey = getTeamKickoffKey(match);
          const kickoffKey = getKickoffKey(match.kickoff);
          const update =
            byId.get(match.id) ??
            (typeof match.apiFootballFixtureId === 'number'
              ? byApiFixtureId.get(match.apiFootballFixtureId)
              : undefined) ??
            (teamKickoffKey ? byTeamKickoff.get(teamKickoffKey) : undefined) ??
            (match.stage !== 'group' && kickoffKey ? byKickoff.get(kickoffKey) : undefined);

          return mergeMatch(match, update, liveSchedule.sourceUpdatedAt);
        }),
      })),
    })),
  }));
};
