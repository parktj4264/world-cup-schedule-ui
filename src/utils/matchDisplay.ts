import type { Match } from '../data/schedule';

export const hasScore = (match: Match) =>
  typeof match.homeScore === 'number' && typeof match.awayScore === 'number';

const isHalftimeStatus = (statusLabel: string | undefined) => {
  const normalized = (statusLabel ?? '').trim().toLowerCase().replace(/[\s_-]/g, '');

  return ['ht', 'half', 'halftime', 'half-time'].includes(normalized);
};

export const getLiveBadgeLabel = (match: Match) => {
  if (match.status !== 'live') {
    return undefined;
  }

  if (isHalftimeStatus(match.statusLabel)) {
    return 'HT';
  }

  if (typeof match.elapsed === 'number') {
    return `LIVE ${match.elapsed}'`;
  }

  const elapsed = Number(match.statusLabel);

  return Number.isFinite(elapsed) ? `LIVE ${elapsed}'` : 'LIVE';
};

export const getMatchDetailStatusLabel = (match: Match) => {
  const liveLabel = getLiveBadgeLabel(match);

  if (liveLabel) {
    return liveLabel;
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

export const canOpenMatchDetail = (match: Match) =>
  match.status === 'live' || match.status === 'finished' || hasScore(match);
