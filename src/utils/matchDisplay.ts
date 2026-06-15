import type { Match } from '../data/schedule';
import { isLiveMatch, isPastMatch } from './timeUtils';

export const hasScore = (match: Match) =>
  typeof match.homeScore === 'number' && typeof match.awayScore === 'number';

export const getDisplayScores = (match: Match) => {
  if (hasScore(match)) {
    return {
      homeScore: match.homeScore as number,
      awayScore: match.awayScore as number,
    };
  }

  return undefined;
};

export type DisplayScoreState =
  | {
      kind: 'score';
      homeScore: number;
      awayScore: number;
    }
  | {
      kind: 'pending';
    };

export const getDisplayScoreState = (
  match: Match,
  currentTime?: Date,
): DisplayScoreState | undefined => {
  const displayScores = getDisplayScores(match);

  if (displayScores) {
    return {
      kind: 'score',
      ...displayScores,
    };
  }

  const isLive = currentTime ? isLiveMatch(match, currentTime) : match.status === 'live';

  return isLive ? { kind: 'pending' } : undefined;
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
