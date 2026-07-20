import type { Match } from '../data/schedule';
import { getDisplayScoreState } from '../utils/matchDisplay';
import { formatKstDateTime, formatTimeUntilMatch } from '../utils/timeUtils';

type StatusBarProps = {
  archiveMode?: boolean;
  archiveLoaded?: boolean;
  totalMatchCount?: number;
  completedMatchCount?: number;
  currentTime: Date;
  nextMatch?: Match;
  liveMatches: Match[];
  liveScheduleUpdatedAt?: string | null;
  liveScheduleError?: boolean;
  browserLiveUpdatedAt?: string | null;
  browserLiveError?: boolean;
  browserLiveChecking?: boolean;
  onRefreshLiveSchedule?: () => void;
};

const STALE_UPDATE_WARNING_MS = 6 * 60 * 60 * 1000;
const CRITICAL_STALE_UPDATE_MS = 24 * 60 * 60 * 1000;

const formatMatch = (match: Match, currentTime: Date) => {
  const displayScoreState = getDisplayScoreState(match, currentTime);

  if (displayScoreState?.kind === 'score') {
    return `${match.timeLabel} ${match.home} ${displayScoreState.homeScore} : ${displayScoreState.awayScore} ${match.away}`;
  }

  if (displayScoreState?.kind === 'pending') {
    return `${match.timeLabel} ${match.home} - : - ${match.away}`;
  }

  return `${match.timeLabel} ${match.home} : ${match.away}`;
};

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

const getUpdatedAtTime = (updatedAt: string | null | undefined) => {
  const time = new Date(updatedAt ?? '').getTime();

  return Number.isFinite(time) ? time : 0;
};

const getLatestUpdatedAt = (...updatedAts: (string | null | undefined)[]) => {
  const latest = updatedAts
    .map((updatedAt) => ({ updatedAt, time: getUpdatedAtTime(updatedAt) }))
    .sort((left, right) => right.time - left.time)[0];

  return latest?.time ? latest.updatedAt : undefined;
};

const formatUpdateAge = (updatedAt: string | null | undefined, currentTime: Date) => {
  const updatedTime = getUpdatedAtTime(updatedAt);

  if (!updatedTime) {
    return '알 수 없음';
  }

  const ageMinutes = Math.max(0, Math.floor((currentTime.getTime() - updatedTime) / 60_000));

  if (ageMinutes < 1) {
    return '방금 전';
  }

  if (ageMinutes < 60) {
    return `${ageMinutes}분 전`;
  }

  const hours = Math.floor(ageMinutes / 60);
  const minutes = ageMinutes % 60;

  if (hours < 24) {
    return minutes > 0 ? `${hours}시간 ${minutes}분 전` : `${hours}시간 전`;
  }

  const days = Math.floor(hours / 24);

  return `${days}일 전`;
};

const getUpdateAgeMs = (updatedAt: string | null | undefined, currentTime: Date) => {
  const updatedTime = getUpdatedAtTime(updatedAt);

  return updatedTime ? Math.max(0, currentTime.getTime() - updatedTime) : Number.POSITIVE_INFINITY;
};

const BrowserCheckingBadge = () => (
  <span className="inline-flex h-4 items-center gap-1 border border-blue-700 bg-blue-50 px-1.5 text-[10px] font-black leading-none text-blue-800">
    <span className="browser-checking-hourglass" aria-hidden="true" />
    확인 중
  </span>
);

const RefreshIcon = () => (
  <svg
    aria-hidden="true"
    className="h-3 w-3"
    fill="none"
    stroke="currentColor"
    strokeLinecap="square"
    strokeLinejoin="miter"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M20 6v5h-5" />
    <path d="M4 18v-5h5" />
    <path d="M18.3 8A7 7 0 0 0 6.8 5.7L4 8.3" />
    <path d="M5.7 16A7 7 0 0 0 17.2 18.3L20 15.7" />
  </svg>
);

const BrowserLiveStatus = ({
  updatedTime,
  isChecking,
  onRefresh,
}: {
  updatedTime?: string;
  isChecking: boolean;
  onRefresh?: () => void;
}) => {
  if (!updatedTime && !isChecking && !onRefresh) {
    return null;
  }

  return (
    <span className="inline-flex min-w-[278px] items-center gap-1 whitespace-nowrap text-[12px] leading-4 text-neutral-600">
      <span>브라우저 최신 확인:</span>
      {updatedTime ? <span>{updatedTime}</span> : null}
      {isChecking ? <BrowserCheckingBadge /> : null}
      {onRefresh ? (
        <button
          type="button"
          className="ml-1 inline-flex items-center gap-1 border-2 border-neutral-900 bg-white px-2 py-0.5 text-[11px] font-black leading-none text-neutral-950 hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
          disabled={isChecking}
          onClick={onRefresh}
        >
          <RefreshIcon />
          새로고침
        </button>
      ) : null}
    </span>
  );
};

export function StatusBar({
  archiveMode = false,
  archiveLoaded = false,
  totalMatchCount = 0,
  completedMatchCount = 0,
  currentTime,
  nextMatch,
  liveMatches,
  liveScheduleUpdatedAt,
  liveScheduleError = false,
  browserLiveUpdatedAt,
  browserLiveError = false,
  browserLiveChecking = false,
  onRefreshLiveSchedule,
}: StatusBarProps) {
  if (archiveMode) {
    const archivedAt = formatLiveScheduleUpdatedAt(liveScheduleUpdatedAt);
    const resultSummary = archiveLoaded
      ? completedMatchCount === totalMatchCount
        ? `${totalMatchCount}경기 최종 기록`
        : `${completedMatchCount}/${totalMatchCount}경기 반영`
      : '최종 결과 불러오는 중';

    return (
      <div className="status-bar mx-auto mt-3 w-full max-w-[980px] border-y border-neutral-800 py-2 text-[13px] font-bold text-neutral-800">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="border border-[#2f5365] bg-[#2f5365] px-2 py-0.5 text-[11px] font-black text-white">
            대회 종료
          </span>
          <span>{resultSummary}</span>
          {archivedAt ? (
            <span className="text-[12px] text-neutral-600">최종 업데이트: {archivedAt}</span>
          ) : null}
        </div>
      </div>
    );
  }

  const timeUntilNextMatch = formatTimeUntilMatch(nextMatch, currentTime);
  const liveScheduleUpdatedTime = formatLiveScheduleUpdatedAt(liveScheduleUpdatedAt);
  const browserLiveUpdatedTime = formatLiveScheduleUpdatedAt(browserLiveUpdatedAt);
  const hasUpdateError = liveScheduleError || browserLiveError;
  const latestSuccessfulUpdateAt = getLatestUpdatedAt(liveScheduleUpdatedAt, browserLiveUpdatedAt);
  const updateAge = formatUpdateAge(latestSuccessfulUpdateAt, currentTime);
  const updateAgeMs = getUpdateAgeMs(latestSuccessfulUpdateAt, currentTime);
  const isStale = updateAgeMs >= STALE_UPDATE_WARNING_MS;
  const isCriticallyStale = updateAgeMs >= CRITICAL_STALE_UPDATE_MS;
  const staleMessage = isStale ? `정보가 오래됐습니다 · 기존 정보 기준: ${updateAge}` : `기존 정보 기준: ${updateAge}`;

  return (
    <div className="status-bar mx-auto mt-3 w-full max-w-[980px] border-y border-neutral-800 py-2 text-[13px] font-bold text-neutral-800">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <span>현재 시각: {formatKstDateTime(currentTime)} KST</span>
        <span>
          다음 경기:{' '}
          {nextMatch ? formatMatch(nextMatch, currentTime) : '예정된 경기가 없습니다'}
        </span>
        {timeUntilNextMatch ? <span>다음 경기까지 {timeUntilNextMatch}</span> : null}
        <span>
          진행 중:{' '}
          {liveMatches.length > 0 ? (
            <>
              <span className="border border-red-700 bg-red-600 px-1 text-[10px] font-black leading-4 text-white">
                LIVE
              </span>{' '}
              {liveMatches.map((match) => formatMatch(match, currentTime)).join(' / ')}
            </>
          ) : (
            '-'
          )}
        </span>
        {liveScheduleUpdatedTime ? (
          <span className="text-[12px] text-neutral-600">최근 자동 확인: {liveScheduleUpdatedTime}</span>
        ) : null}
        <BrowserLiveStatus
          updatedTime={browserLiveUpdatedTime}
          isChecking={browserLiveChecking}
          onRefresh={onRefreshLiveSchedule}
        />
        {hasUpdateError || isStale ? (
          <span
            className={[
              'text-[12px]',
              isCriticallyStale ? 'font-black text-sky-900' : 'text-sky-700',
            ].join(' ')}
          >
            {staleMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}
