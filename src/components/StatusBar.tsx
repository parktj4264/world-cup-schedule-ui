import type { Match } from '../data/schedule';
import { formatKstDateTime } from '../utils/matchStatus';

type StatusBarProps = {
  currentTime: Date;
  nextMatch?: Match;
  liveMatches: Match[];
};

const formatMatch = (match: Match) => `${match.timeLabel} ${match.home} : ${match.away}`;

export function StatusBar({ currentTime, nextMatch, liveMatches }: StatusBarProps) {
  return (
    <div className="mx-auto mt-3 w-full max-w-[980px] border-y border-neutral-800 py-2 text-[13px] font-bold text-neutral-800">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <span>현재 시각: {formatKstDateTime(currentTime)} KST</span>
        <span>
          다음 경기:{' '}
          {nextMatch ? formatMatch(nextMatch) : '예정된 경기가 없습니다'}
        </span>
        {liveMatches.length > 0 ? (
          <span>
            진행 중:{' '}
            <span className="border border-red-700 bg-red-600 px-1 text-[10px] font-black leading-4 text-white">
              LIVE
            </span>{' '}
            {liveMatches.map(formatMatch).join(' / ')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
