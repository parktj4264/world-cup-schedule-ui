import type { Match } from '../data/schedule';
import { isLiveMatch, isPastMatch } from './timeUtils';

export const hasScore = (match: Match) =>
  typeof match.homeScore === 'number' && typeof match.awayScore === 'number';

const isHalftimeStatus = (statusLabel: string | undefined) => {
  const normalized = (statusLabel ?? '').trim().toLowerCase().replace(/[\s_-]/g, '');

  return ['ht', 'half', 'halftime', 'half-time'].includes(normalized);
};

export const getLiveBadgeLabel = (match: Match, currentTime?: Date) => {
  if (currentTime && !isLiveMatch(match, currentTime)) {
    return undefined;
  }

  if (match.status === 'live') {
    if (isHalftimeStatus(match.statusLabel)) {
      return 'HT';
    }

    if (typeof match.elapsed === 'number') {
      return `LIVE ${match.elapsed}'`;
    }

    const elapsed = Number(match.statusLabel);

    return Number.isFinite(elapsed) ? `LIVE ${elapsed}'` : 'LIVE';
  }

  if (currentTime && isLiveMatch(match, currentTime)) {
    return 'LIVE';
  }

  return undefined;
};

export const getMatchDetailStatusLabel = (match: Match, currentTime?: Date) => {
  const liveLabel = getLiveBadgeLabel(match, currentTime);

  if (liveLabel) {
    return liveLabel;
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
