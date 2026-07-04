import type { Match, MatchStage, ScheduleSection } from '../data/schedule';
import { canOpenMatchDetail, getDisplayScoreState } from '../utils/matchDisplay';
import { getMatchStartTime, isLiveMatch } from '../utils/timeUtils';
import { FlagIcon } from './FlagIcon';

export type TournamentStage = Exclude<MatchStage, 'group'>;

export type TournamentEntry = {
  date: string;
  dateLabel: string;
  weekday: string;
  match: Match;
  matchNumber?: number;
};

type TournamentBracketProps = {
  sections: ScheduleSection[];
  currentTime: Date;
  nextMatchId?: string;
  activeBracketLabel?: string;
  selectedMatchId?: string | null;
  onSelectMatch?: (match: Match) => void;
  onOpenMatchDetail?: (match: Match) => void;
};

const BRACKET_WIDTH = 1000;
const BRACKET_HEIGHT = 520;
const BRACKET_NODE_WIDTH = 210;

const BRACKET_ROUNDS: {
  label: string;
  left: number;
  matches: { matchNumber: number; centerY: number }[];
}[] = [
  {
    label: '16강',
    left: 0,
    matches: [
      { matchNumber: 90, centerY: 32 },
      { matchNumber: 89, centerY: 97 },
      { matchNumber: 93, centerY: 162 },
      { matchNumber: 94, centerY: 227 },
      { matchNumber: 91, centerY: 292 },
      { matchNumber: 92, centerY: 357 },
      { matchNumber: 95, centerY: 422 },
      { matchNumber: 96, centerY: 487 },
    ],
  },
  {
    label: '8강',
    left: 263,
    matches: [
      { matchNumber: 97, centerY: 65 },
      { matchNumber: 98, centerY: 195 },
      { matchNumber: 99, centerY: 325 },
      { matchNumber: 100, centerY: 455 },
    ],
  },
  {
    label: '4강',
    left: 526,
    matches: [
      { matchNumber: 101, centerY: 130 },
      { matchNumber: 102, centerY: 390 },
    ],
  },
  {
    label: '결승',
    left: 789,
    matches: [{ matchNumber: 104, centerY: 260 }],
  },
];

const BRACKET_LINKS = [
  { from: [90, 89], to: 97 },
  { from: [93, 94], to: 98 },
  { from: [91, 92], to: 99 },
  { from: [95, 96], to: 100 },
  { from: [97, 98], to: 101 },
  { from: [99, 100], to: 102 },
  { from: [101, 102], to: 104 },
];

const BRACKET_NODES_BY_MATCH_NUMBER = new Map(
  BRACKET_ROUNDS.flatMap((round) =>
    round.matches.map((match) => [
      match.matchNumber,
      {
        ...match,
        left: round.left,
      },
    ]),
  ),
);

const getMatchNumber = (match: Match) => {
  if (typeof match.apiFootballFixtureId === 'number') {
    return match.apiFootballFixtureId;
  }

  const matchNumber = /^match-(\d+)$/.exec(match.id);
  return matchNumber ? Number(matchNumber[1]) : undefined;
};

const getBracketLinePath = (fromMatchNumber: number, toMatchNumber: number) => {
  const fromNode = BRACKET_NODES_BY_MATCH_NUMBER.get(fromMatchNumber);
  const toNode = BRACKET_NODES_BY_MATCH_NUMBER.get(toMatchNumber);

  if (!fromNode || !toNode) {
    return '';
  }

  const startX = fromNode.left + BRACKET_NODE_WIDTH;
  const endX = toNode.left;
  const middleX = startX + (endX - startX) * 0.55;

  return `M ${startX} ${fromNode.centerY} H ${middleX} V ${toNode.centerY} H ${endX}`;
};

const isTournamentStage = (stage: MatchStage | undefined): stage is TournamentStage =>
  Boolean(stage && stage !== 'group');

const sortEntries = (entries: TournamentEntry[]) =>
  [...entries].sort((first, second) => getMatchStartTime(first.match) - getMatchStartTime(second.match));

export const getTournamentEntries = (sections: ScheduleSection[]) =>
  sortEntries(
    sections.flatMap((section) =>
      section.days.flatMap((day) =>
        day.cells.flatMap((scheduleCell) =>
          scheduleCell.matches
            .filter((match) => isTournamentStage(match.stage))
            .map((match) => ({
              date: day.date,
              dateLabel: day.dateLabel,
              weekday: day.weekday,
              match,
              matchNumber: getMatchNumber(match),
            })),
        ),
      ),
    ),
  );

const isKoreaMatch = (match: Match) =>
  match.isKorea || match.home === '대한민국' || match.away === '대한민국';

const getWinnerClassName = (match: Match, side: 'home' | 'away') => {
  const isWinner =
    (side === 'home' && match.winner === 'home') ||
    (side === 'away' && match.winner === 'away');

  return isWinner ? 'tournament-sheet-winner' : '';
};

const getMatchHighlightClassName = (
  match: Match,
  nextMatchId: string | undefined,
  currentTime: Date,
) => [
  isKoreaMatch(match) ? 'tournament-sheet-korea-match' : '',
  match.id === nextMatchId ? 'tournament-sheet-next-match' : '',
  isLiveMatch(match, currentTime) ? 'tournament-sheet-live-match' : '',
]
  .filter(Boolean)
  .join(' ');

const getScoreParts = (match: Match, currentTime: Date) => {
  const displayScoreState = getDisplayScoreState(match, currentTime);

  if (!displayScoreState) {
    return undefined;
  }

  if (displayScoreState.kind === 'pending') {
    return {
      home: '-',
      away: '-',
      homePenalty: undefined,
      awayPenalty: undefined,
    };
  }

  return {
    home: String(displayScoreState.homeScore),
    away: String(displayScoreState.awayScore),
    homePenalty:
      typeof displayScoreState.homePenaltyScore === 'number'
        ? String(displayScoreState.homePenaltyScore)
        : undefined,
    awayPenalty:
      typeof displayScoreState.awayPenaltyScore === 'number'
        ? String(displayScoreState.awayPenaltyScore)
        : undefined,
  };
};

const getCompactScoreLabel = (match: Match, currentTime: Date) => {
  const scoreParts = getScoreParts(match, currentTime);

  if (!scoreParts) {
    return undefined;
  }

  const home = `${scoreParts.home}${scoreParts.homePenalty ? `(${scoreParts.homePenalty})` : ''}`;
  const away = `${scoreParts.awayPenalty ? `(${scoreParts.awayPenalty})` : ''}${scoreParts.away}`;

  return `${home} : ${away}`;
};

const BracketMatchBox = ({
  entry,
  matchNumber,
  currentTime,
  nextMatchId,
  selectedMatchId,
  onSelectMatch,
  onOpenMatchDetail,
}: {
  entry?: TournamentEntry;
  matchNumber: number;
  currentTime: Date;
  nextMatchId?: string;
  selectedMatchId?: string | null;
  onSelectMatch?: (match: Match) => void;
  onOpenMatchDetail?: (match: Match) => void;
}) => {
  if (!entry) {
    return (
      <div className="tournament-bracket-box tournament-bracket-box-empty">
        <div className="tournament-bracket-number">{matchNumber}번</div>
        <div className="tournament-bracket-teams">대진 미정</div>
      </div>
    );
  }

  const { match } = entry;
  const scoreLabel = getCompactScoreLabel(match, currentTime);
  const highlightClassName = getMatchHighlightClassName(match, nextMatchId, currentTime);
  const isSelected = match.id === selectedMatchId;
  const openMatchDetail = canOpenMatchDetail(match, currentTime) ? onOpenMatchDetail : undefined;

  return (
    <button
      type="button"
      data-match-id={match.id}
      className={[
        'tournament-bracket-box',
        'tournament-bracket-box-button',
        highlightClassName,
        isSelected ? 'tournament-bracket-box-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={isSelected}
      onClick={() => onSelectMatch?.(match)}
      onDoubleClick={() => openMatchDetail?.(match)}
    >
      <div className="tournament-bracket-meta">
        <span className="tournament-bracket-number">{matchNumber}번</span>
        <span className="tournament-bracket-time">
          {entry.dateLabel}({entry.weekday}) {match.timeLabel}
        </span>
      </div>
      <div className="tournament-bracket-teams">
        <span className="tournament-bracket-team">
          <FlagIcon teamName={match.home} fallback={match.homeFlag} className="tournament-bracket-flag" />
          <span className={['tournament-bracket-team-name', getWinnerClassName(match, 'home')]
            .filter(Boolean)
            .join(' ')}
          >
            {match.home}
          </span>
        </span>
        <span className="tournament-bracket-versus">vs</span>
        <span className="tournament-bracket-team">
          <FlagIcon teamName={match.away} fallback={match.awayFlag} className="tournament-bracket-flag" />
          <span className={['tournament-bracket-team-name', getWinnerClassName(match, 'away')]
            .filter(Boolean)
            .join(' ')}
          >
            {match.away}
          </span>
        </span>
      </div>
      {scoreLabel ? <div className="tournament-bracket-score">{scoreLabel}</div> : null}
    </button>
  );
};

export function TournamentBracket({
  sections,
  currentTime,
  nextMatchId,
  activeBracketLabel,
  selectedMatchId,
  onSelectMatch,
  onOpenMatchDetail,
}: TournamentBracketProps) {
  const tournamentEntries = getTournamentEntries(sections);
  const entriesByNumber = new Map(
    tournamentEntries
      .filter((entry): entry is TournamentEntry & { matchNumber: number } =>
        typeof entry.matchNumber === 'number',
      )
      .map((entry) => [entry.matchNumber, entry]),
  );
  const selectedBracketMatchNumber = selectedMatchId
    ? tournamentEntries.find((entry) => entry.match.id === selectedMatchId)?.matchNumber
    : undefined;
  const thirdPlaceEntry = entriesByNumber.get(103);

  return (
    <div className="tournament-bracket-scroll">
      <div className="tournament-bracket-board">
        <div className="tournament-bracket-header-row" aria-hidden="true">
          {BRACKET_ROUNDS.map((round) => (
            <div
              key={round.label}
              className={[
                'tournament-bracket-column-label',
                round.label === activeBracketLabel ? 'tournament-bracket-column-label-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: `${(round.left / BRACKET_WIDTH) * 100}%`,
                width: `${(BRACKET_NODE_WIDTH / BRACKET_WIDTH) * 100}%`,
              }}
            >
              {round.label}
            </div>
          ))}
        </div>
        <div className="tournament-bracket-field">
          <svg
            className="tournament-bracket-lines"
            viewBox={`0 0 ${BRACKET_WIDTH} ${BRACKET_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {BRACKET_LINKS.flatMap((link) =>
              link.from.map((fromMatchNumber) => (
                <path
                  key={`${fromMatchNumber}-${link.to}`}
                  className={[
                    'tournament-bracket-line',
                    selectedBracketMatchNumber === fromMatchNumber ||
                    selectedBracketMatchNumber === link.to
                      ? 'tournament-bracket-line-selected'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  d={getBracketLinePath(fromMatchNumber, link.to)}
                  vectorEffect="non-scaling-stroke"
                />
              )),
            )}
          </svg>
          {BRACKET_ROUNDS.flatMap((round) =>
            round.matches.map(({ matchNumber, centerY }) => (
              <div
                key={matchNumber}
                className="tournament-bracket-node"
                style={{
                  left: `${(round.left / BRACKET_WIDTH) * 100}%`,
                  top: `${(centerY / BRACKET_HEIGHT) * 100}%`,
                  width: `${(BRACKET_NODE_WIDTH / BRACKET_WIDTH) * 100}%`,
                }}
              >
                <BracketMatchBox
                  entry={entriesByNumber.get(matchNumber)}
                  matchNumber={matchNumber}
                  currentTime={currentTime}
                  nextMatchId={nextMatchId}
                  selectedMatchId={selectedMatchId}
                  onSelectMatch={onSelectMatch}
                  onOpenMatchDetail={onOpenMatchDetail}
                />
              </div>
            )),
          )}
        </div>
      </div>
      {thirdPlaceEntry ? (
        <div className="tournament-bracket-placement">
          <div className="tournament-bracket-placement-label">3·4위전</div>
          <BracketMatchBox
            entry={thirdPlaceEntry}
            matchNumber={103}
            currentTime={currentTime}
            nextMatchId={nextMatchId}
            selectedMatchId={selectedMatchId}
            onSelectMatch={onSelectMatch}
            onOpenMatchDetail={onOpenMatchDetail}
          />
        </div>
      ) : null}
    </div>
  );
}
