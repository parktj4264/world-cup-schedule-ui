import type { Match } from '../data/schedule';
import { formatKstDateTime, formatTimeUntilMatch } from '../utils/timeUtils';

type StatusBarProps = {
  currentTime: Date;
  nextMatch?: Match;
  liveMatches: Match[];
  liveScheduleUpdatedAt?: string | null;
  liveScheduleError?: boolean;
};

const formatMatch = (match: Match) => `${match.timeLabel} ${match.home} : ${match.away}`;

const formatLiveScheduleUpdatedAt = (updatedAt: string | null | undefined) => {
  if (!updatedAt) {
    return undefined;
  }

  const date = new Date(updatedAt);

  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  return `${formatKstDateTime(date)} KST`;
};

export function StatusBar({
  currentTime,
  nextMatch,
  liveMatches,
  liveScheduleUpdatedAt,
  liveScheduleError = false,
}: StatusBarProps) {
  const timeUntilNextMatch = formatTimeUntilMatch(nextMatch, currentTime);
  const liveScheduleUpdatedTime = formatLiveScheduleUpdatedAt(liveScheduleUpdatedAt);

  return (
    <div className="status-bar mx-auto mt-3 w-full max-w-[980px] border-y border-neutral-800 py-2 text-[13px] font-bold text-neutral-800">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <span>현재 시각: {formatKstDateTime(currentTime)} KST</span>
        <span>
          다음 경기:{' '}
          {nextMatch ? formatMatch(nextMatch) : '예정된 경기가 없습니다'}
        </span>
        {timeUntilNextMatch ? <span>다음 경기까지 {timeUntilNextMatch}</span> : null}
        {liveMatches.length > 0 ? (
          <span>
            진행 중:{' '}
            <span className="border border-red-700 bg-red-600 px-1 text-[10px] font-black leading-4 text-white">
              LIVE
            </span>{' '}
            {liveMatches.map(formatMatch).join(' / ')}
          </span>
        ) : null}
        {liveScheduleUpdatedTime ? (
          <span className="text-[12px] text-neutral-600">최근 업데이트: {liveScheduleUpdatedTime}</span>
        ) : null}
        {liveScheduleError ? (
          <span className="text-[12px] text-neutral-600">최신 정보 확인 실패</span>
        ) : null}
      </div>
    </div>
  );
}
