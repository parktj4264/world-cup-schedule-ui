import type { Match } from '../data/schedule';
import { getMatchStartTime, isLiveMatch, isPastMatch } from './timeUtils';

export const hasScore = (match: Match) =>
  typeof match.homeScore === 'number' && typeof match.awayScore === 'number';

export const getDisplayScores = (match: Match, currentTime?: Date) => {
  if (hasScore(match)) {
    return {
      homeScore: match.homeScore as number,
      awayScore: match.awayScore as number,
    };
  }

  const shouldShowLiveScore =
    (currentTime ? isLiveMatch(match, currentTime) : match.status === 'live') &&
    match.status !== 'finished';

  if (!shouldShowLiveScore) {
    return undefined;
  }

  return {
    homeScore: typeof match.homeScore === 'number' ? match.homeScore : 0,
    awayScore: typeof match.awayScore === 'number' ? match.awayScore : 0,
  };
};

const isHalftimeStatus = (statusLabel: string | undefined) => {
  const normalized = (statusLabel ?? '').trim().toLowerCase().replace(/[\s_-]/g, '');

  return ['ht', 'half', 'halftime', 'half-time'].includes(normalized);
};

const getElapsedMinute = (match: Match, currentTime?: Date) => {
  if (typeof match.elapsed === 'number') {
    return match.elapsed;
  }

  const statusElapsed = Number(match.statusLabel);

  if (Number.isFinite(statusElapsed)) {
    return statusElapsed;
  }

  if (!currentTime || !isLiveMatch(match, currentTime)) {
    return undefined;
  }

  const elapsed = Math.floor((currentTime.getTime() - getMatchStartTime(match)) / 60_000) + 1;

  return elapsed > 0 ? elapsed : undefined;
};

const formatLiveMinute = (minute: number) => {
  const safeMinute = Math.max(1, Math.floor(minute));

  if (safeMinute <= 45) {
    return `전반 ${safeMinute}분`;
  }

  if (safeMinute <= 90) {
    return `후반 ${safeMinute - 45}분`;
  }

  if (safeMinute <= 105) {
    return `연장 전반 ${safeMinute - 90}분`;
  }

  if (safeMinute <= 120) {
    return `연장 후반 ${safeMinute - 105}분`;
  }

  return `연장 ${safeMinute}분`;
};

export const getLiveBadgeLabel = (match: Match, currentTime?: Date) => {
  if (currentTime && !isLiveMatch(match, currentTime)) {
    return undefined;
  }

  if (match.status === 'live') {
    return 'LIVE';
  }

  if (currentTime && isLiveMatch(match, currentTime)) {
    return 'LIVE';
  }

  return undefined;
};

export const getLiveTimingLabel = (match: Match, currentTime?: Date) => {
  if (currentTime && !isLiveMatch(match, currentTime)) {
    return undefined;
  }

  if (isHalftimeStatus(match.statusLabel)) {
    return 'HT';
  }

  const elapsedMinute = getElapsedMinute(match, currentTime);

  return typeof elapsedMinute === 'number' ? formatLiveMinute(elapsedMinute) : undefined;
};

export const getMatchDetailStatusLabel = (match: Match, currentTime?: Date) => {
  const liveLabel = getLiveBadgeLabel(match, currentTime);
  const liveTimingLabel = getLiveTimingLabel(match, currentTime);

  if (liveLabel) {
    return liveTimingLabel ? `${liveLabel} · ${liveTimingLabel}` : liveLabel;
  }

  if (currentTime && isPastMatch(match, currentTime)) {
    return match.status === 'finished' ? '종료' : '시간 기준 종료';
  }

  if (match.status === 'finished') {
    return '종료';
  }

  if (match.status === 'postponed') {
    return '연기';
  }

  if (match.status === 'cancelled') {
    return '취소';
  }

  if (match.status === 'suspended') {
    return '중단';
  }

  return '예정';
};

export const canOpenMatchDetail = (match: Match, currentTime?: Date) =>
  (currentTime ? isLiveMatch(match, currentTime) : match.status === 'live') ||
  match.status === 'finished' ||
  hasScore(match);
