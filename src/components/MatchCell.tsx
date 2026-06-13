import type { Match, ScheduleCell } from '../data/schedule';
import { isLiveMatch, isPastMatch } from '../utils/timeUtils';

type MatchCellProps = {
  cell: ScheduleCell;
  currentTime: Date;
  nextMatchId?: string;
  selectedCountry?: string;
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

const hasScore = (match: Match) =>
  typeof match.homeScore === 'number' && typeof match.awayScore === 'number';

const getScoreClassName = (match: Match, side: 'home' | 'away') => {
  const isWinner =
    (side === 'home' && match.winner === 'home') ||
    (side === 'away' && match.winner === 'away');

  return [
    'mx-1 inline-block min-w-4 border border-neutral-400 bg-white px-1 text-center text-[12px] font-black leading-4',
    isWinner ? 'border-neutral-900 text-neutral-950' : 'text-neutral-700',
  ].join(' ');
};

const includesSelectedCountry = (match: Match, selectedCountry: string) => {
  const countryQuery = selectedCountry.trim();

  return (
    countryQuery !== '' &&
    (match.home.includes(countryQuery) || match.away.includes(countryQuery))
  );
};

export function MatchCell({
  cell,
  currentTime,
  nextMatchId,
  selectedCountry = '',
}: MatchCellProps) {
  const hasKorea = cell.matches.some((match) => match.isKorea);
  const hasSelectedCountry = cell.matches.some((match) =>
    includesSelectedCountry(match, selectedCountry),
  );
  const hasNextMatch = cell.matches.some((match) => match.id === nextMatchId);
  const hasLiveMatch = cell.matches.some((match) => isLiveMatch(match, currentTime));

  const cellClassName = [
    'schedule-match-cell relative border border-neutral-700 align-middle',
    hasSelectedCountry
      ? 'schedule-selected-country-cell bg-[#e8f7cf]'
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
      <div className="flex flex-col gap-[3px]">
        {groupMatches(cell.matches).map((matchGroup, groupIndex) => {
          const isGroupPast = matchGroup.matches.every((match) => isPastMatch(match, currentTime));
          const isGroupLive = matchGroup.matches.some((match) => isLiveMatch(match, currentTime));

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
              <div className="schedule-match-meta whitespace-nowrap text-neutral-900">
                <span className="schedule-match-time font-black">{matchGroup.timeLabel}</span>
                <span className="font-semibold">, {matchGroup.group} {matchGroup.round}</span>
                {isGroupLive ? (
                  <span className="ml-1 inline-block border border-red-700 bg-red-600 px-1 text-[10px] font-black leading-4 text-white">
                    LIVE
                  </span>
                ) : null}
              </div>
              <div className="mt-[1px] flex flex-col gap-[1px]">
                {matchGroup.matches.map((match) => (
                  <div
                    key={match.id}
                    data-match-id={match.id}
                    className="schedule-teams whitespace-nowrap font-extrabold leading-[1.25] text-neutral-950"
                  >
                    <span className="mr-1">{match.homeFlag}</span>
                    {match.home}
                    {hasScore(match) ? (
                      <span className={getScoreClassName(match, 'home')}>{match.homeScore}</span>
                    ) : null}
                    <span className="px-1 font-black">:</span>
                    {hasScore(match) ? (
                      <span className={getScoreClassName(match, 'away')}>{match.awayScore}</span>
                    ) : null}
                    {match.away}
                    <span className="ml-1">{match.awayFlag}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </td>
  );
}
