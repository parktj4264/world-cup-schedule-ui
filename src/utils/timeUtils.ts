import type { Match, ScheduleSection } from '../data/schedule';

export const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;
const TIME_SENSITIVE_STATUS_MAX_AGE_MS = 3 * 60 * 60 * 1000;

export const getMatchStartTime = (match: Match) => new Date(match.kickoff).getTime();

const getSourceUpdatedTime = (match: Match) => {
  const time = new Date(match.sourceUpdatedAt ?? '').getTime();

  return Number.isFinite(time) ? time : undefined;
};

const isTimeSensitiveStatusFresh = (match: Match, now: Date) => {
  const sourceUpdatedTime = getSourceUpdatedTime(match);

  if (!sourceUpdatedTime) {
    return true;
  }

  const ageMs = now.getTime() - sourceUpdatedTime;

  return ageMs >= 0 && ageMs <= TIME_SENSITIVE_STATUS_MAX_AGE_MS;
};

const isTerminalStatus = (status: Match['status']) =>
  status === 'finished' || status === 'postponed' || status === 'cancelled' || status === 'suspended';

const isTimeBasedLiveMatch = (match: Match, now: Date) => {
  const start = getMatchStartTime(match);
  const current = now.getTime();

  return current >= start && current < start + MATCH_DURATION_MS;
};

export const isLiveMatch = (match: Match, now: Date) => {
  if (match.status === 'live' && isTimeSensitiveStatusFresh(match, now)) {
    return true;
  }

  if (isTerminalStatus(match.status)) {
    return false;
  }

  return isTimeBasedLiveMatch(match, now);
};

export const isPastMatch = (match: Match, now: Date) => {
  if (match.status === 'finished') {
    return true;
  }

  if (match.status === 'live' && isTimeSensitiveStatusFresh(match, now)) {
    return false;
  }

  if (match.status === 'postponed' || match.status === 'cancelled' || match.status === 'suspended') {
    return false;
  }

  const end = getMatchStartTime(match) + MATCH_DURATION_MS;

  return now.getTime() >= end;
};

export const flattenMatches = (sections: ScheduleSection[]) =>
  sections.flatMap((section) =>
    section.days.flatMap((day) =>
      day.cells.flatMap((scheduleCell) => scheduleCell.matches),
    ),
  );

export const getNextMatch = (sections: ScheduleSection[], now: Date) =>
  flattenMatches(sections)
    .filter((match) =>
      getMatchStartTime(match) > now.getTime() &&
      !isLiveMatch(match, now) &&
      !isPastMatch(match, now) &&
      !isTerminalStatus(match.status),
    )
    .sort((a, b) => getMatchStartTime(a) - getMatchStartTime(b))[0];

export const getLiveMatches = (sections: ScheduleSection[], now: Date) =>
  flattenMatches(sections).filter((match) => isLiveMatch(match, now));

export const formatKstDateTime = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

export const getKstDateKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
};

export const formatTimeUntilMatch = (match: Match | undefined, now: Date) => {
  if (!match) {
    return undefined;
  }

  const remainingMs = getMatchStartTime(match) - now.getTime();

  if (remainingMs <= 0) {
    return '곧 시작';
  }

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}분`;
  }

  return `${hours}시간 ${minutes}분`;
};
