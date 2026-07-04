import { FlagIcon } from './FlagIcon';
import type { Match, ScheduleCell } from '../data/schedule';
import {
  canOpenMatchDetail,
  getDisplayScoreState,
  getLiveBadgeLabel,
  getPenaltyShootoutLabel,
} from '../utils/matchDisplay';
import { isLiveMatch, isPastMatch } from '../utils/timeUtils';

type MatchCellProps = {
  cell: ScheduleCell;
  currentTime: Date;
  nextMatchId?: string;
  selectedMatchId?: string | null;
  onOpenMatchDetail?: (match: Match) => void;
};

type MatchGroup = {
  key: string;
  timeLabel: string;
  group: string;
  round: string;
  matches: Match[];
};

const groupMatches = (matches: Match[]) =>
  matches.reduce<MatchGroup[]>((groups, match) => {
    const key = `${match.timeLabel}-${match.group}-${match.round}`;
    const existingGroup = groups.find((group) => group.key === key);

    if (existingGroup) {
      existingGroup.matches.push(match);
      return groups;
    }

    return [
      ...groups,
      {
        key,
        timeLabel: match.timeLabel,
        group: match.group,
        round: match.round,
        matches: [match],
      },
    ];
  }, []);

const getScoreClassName = (match: Match, side: 'home' | 'away', isPending = false) => {
  const isWinner =
    !isPending &&
    ((side === 'home' && match.winner === 'home') ||
      (side === 'away' && match.winner === 'away'));

  return [
    'mx-1 inline-block min-w-4 border border-neutral-400 bg-white px-1 text-center text-[12px] font-black leading-4',
    isPending
      ? 'border-neutral-300 bg-neutral-50 text-neutral-400'
      : isWinner
        ? 'border-neutral-900 text-neutral-950'
        : 'text-neutral-700',
  ].join(' ');
};

const getPenaltyScoreClassName = (match: Match, side: 'home' | 'away') => {
  const isWinner =
    (side === 'home' && match.winner === 'home') ||
    (side === 'away' && match.winner === 'away');

  return [
    'mx-[1px] inline-block text-[11px] font-black leading-4',
    isWinner ? 'text-neutral-950' : 'text-neutral-600',
  ].join(' ');
};

export function MatchCell({
  cell,
  currentTime,
  nextMatchId,
  selectedMatchId,
  onOpenMatchDetail,
}: MatchCellProps) {
  const hasKorea = cell.matches.some((match) => match.isKorea);
  const hasSelectedMatch = cell.matches.some((match) => match.id === selectedMatchId);
  const hasNextMatch = cell.matches.some((match) => match.id === nextMatchId);
  const hasLiveMatch = cell.matches.some((match) => isLiveMatch(match, currentTime));

  const cellClassName = [
    'schedule-match-cell relative border border-neutral-700 text-center align-middle',
    hasSelectedMatch
      ? 'schedule-selected-match-cell bg-[#e8f7cf]'
      : hasKorea
        ? 'schedule-korea-cell bg-[#fff8a8]'
        : 'bg-white',
    hasNextMatch ? 'schedule-match-cell-next ring-2 ring-inset ring-sky-600' : '',
    hasLiveMatch ? 'ring-2 ring-inset ring-red-600' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (cell.matches.length === 0) {
    return <td className={cellClassName} aria-label="빈 경기 칸" />;
  }

  return (
    <td className={cellClassName}>
      <div className="flex flex-col items-center gap-[3px]">
        {groupMatches(cell.matches).map((matchGroup, groupIndex) => {
          const isGroupPast = matchGroup.matches.every((match) => isPastMatch(match, currentTime));
          const liveBadgeLabel = matchGroup.matches
            .map((match) => getLiveBadgeLabel(match, currentTime))
            .find(Boolean);

          return (
            <div
              key={matchGroup.key}
              className={[
                'leading-tight',
                isGroupPast ? 'opacity-45' : '',
                groupIndex > 0 ? 'border-t border-neutral-300 pt-1' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="schedule-match-meta whitespace-nowrap text-center text-neutral-900">
                <span className="schedule-match-time font-black">{matchGroup.timeLabel}</span>
                <span className="font-semibold">, {matchGroup.group} {matchGroup.round}</span>
                {liveBadgeLabel ? (
                  <span className="ml-1 inline-block border border-red-700 bg-red-600 px-1 text-[10px] font-black leading-4 text-white">
                    {liveBadgeLabel}
                  </span>
                ) : null}
              </div>
              <div className="mt-[1px] flex flex-col items-center gap-[1px]">
                {matchGroup.matches.map((match) => {
                  const displayScoreState = getDisplayScoreState(match, currentTime);
                  const isScorePending = displayScoreState?.kind === 'pending';
                  const homeScoreLabel = displayScoreState?.kind === 'score'
                    ? displayScoreState.homeScore
                    : '-';
                  const awayScoreLabel = displayScoreState?.kind === 'score'
                    ? displayScoreState.awayScore
                    : '-';
                  const hasPenaltyScore =
                    displayScoreState?.kind === 'score' &&
                    typeof displayScoreState.homePenaltyScore === 'number' &&
                    typeof displayScoreState.awayPenaltyScore === 'number';
                  const homePenaltyScore = displayScoreState?.kind === 'score'
                    ? displayScoreState.homePenaltyScore
                    : undefined;
                  const awayPenaltyScore = displayScoreState?.kind === 'score'
                    ? displayScoreState.awayPenaltyScore
                    : undefined;
                  const penaltyShootoutLabel = getPenaltyShootoutLabel(match);
                  const matchContent = (
                    <>
                      <FlagIcon teamName={match.home} fallback={match.homeFlag} className="mr-1" />
                      {match.home}
                      {displayScoreState ? (
                        <span className={getScoreClassName(match, 'home', isScorePending)}>{homeScoreLabel}</span>
                      ) : null}
                      {hasPenaltyScore ? (
                        <span
                          className={getPenaltyScoreClassName(match, 'home')}
                          aria-label={penaltyShootoutLabel}
                        >
                          ({homePenaltyScore})
                        </span>
                      ) : null}
                      <span className="px-1 font-black">:</span>
                      {hasPenaltyScore ? (
                        <span
                          className={getPenaltyScoreClassName(match, 'away')}
                          aria-label={penaltyShootoutLabel}
                        >
                          ({awayPenaltyScore})
                        </span>
                      ) : null}
                      {displayScoreState ? (
                        <span className={getScoreClassName(match, 'away', isScorePending)}>{awayScoreLabel}</span>
                      ) : null}
                      {match.away}
                      <FlagIcon teamName={match.away} fallback={match.awayFlag} className="ml-1" />
                    </>
                  );
                  const openMatchDetail = canOpenMatchDetail(match, currentTime) ? onOpenMatchDetail : undefined;

                  return openMatchDetail ? (
                    <button
                      key={match.id}
                      type="button"
                      data-match-id={match.id}
                      className="schedule-teams schedule-match-trigger whitespace-nowrap border-0 bg-transparent p-0 text-center font-extrabold leading-[1.25] text-neutral-950 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
                      aria-label={`${match.home} 대 ${match.away} 경기 상세 보기`}
                      onClick={() => openMatchDetail(match)}
                    >
                      {matchContent}
                    </button>
                  ) : (
                    <div
                      key={match.id}
                      data-match-id={match.id}
                      className="schedule-teams whitespace-nowrap text-center font-extrabold leading-[1.25] text-neutral-950"
                    >
                      {matchContent}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </td>
  );
}
