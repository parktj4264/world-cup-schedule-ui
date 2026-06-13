import type { Match, ScheduleSection } from '../data/schedule';

export const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

export const getMatchStartTime = (match: Match) => new Date(match.kickoff).getTime();

export const isLiveMatch = (match: Match, now: Date) => {
  if (match.status) {
    return match.status === 'live';
  }

  const start = getMatchStartTime(match);
  const current = now.getTime();

  return current >= start && current < start + MATCH_DURATION_MS;
};

export const isPastMatch = (match: Match, now: Date) => {
  if (match.status) {
    return match.status === 'finished';
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
    .filter((match) => (!match.status || match.status === 'scheduled') && getMatchStartTime(match) > now.getTime())
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

export const formatKstTime = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).format(date);

export const getNextAutoRefreshTime = (date: Date) => {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffsetMs);
  const year = kstDate.getUTCFullYear();
  const month = kstDate.getUTCMonth();
  const day = kstDate.getUTCDate();
  let hour = kstDate.getUTCHours();
  const minute = kstDate.getUTCMinutes();
  let nextMinute = 17;

  if (minute < 17) {
    nextMinute = 17;
  } else if (minute < 47) {
    nextMinute = 47;
  } else {
    hour += 1;
    nextMinute = 17;
  }

  const nextKstTimestamp = Date.UTC(year, month, day, hour, nextMinute);

  return new Date(nextKstTimestamp - kstOffsetMs);
};

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
