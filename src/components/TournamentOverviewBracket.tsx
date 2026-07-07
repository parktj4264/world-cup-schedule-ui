import type { Match, ScheduleSection } from '../data/schedule';
import { canOpenMatchDetail, getDisplayScoreState, getLiveBadgeLabel } from '../utils/matchDisplay';
import { isLiveMatch } from '../utils/timeUtils';
import { FlagIcon } from './FlagIcon';
import {
  getTournamentEntries,
  type TournamentEntry,
  type TournamentStage,
} from './TournamentBracket';

type TournamentOverviewBracketProps = {
  sections: ScheduleSection[];
  currentTime: Date;
  nextMatchId?: string;
  showMatchStatusHighlights?: boolean;
  activeStages?: TournamentStage[];
  selectedMatchId?: string | null;
  onSelectMatch?: (match: Match) => void;
  onOpenMatchDetail?: (match: Match) => void;
};

type OverviewNode = {
  matchNumber: number;
  round: 'round-of-16' | 'quarter-final' | 'semi-final' | 'final';
  x: number;
  y: number;
};

const OVERVIEW_WIDTH = 1000;
const OVERVIEW_HEIGHT = 430;

const OVERVIEW_NODES: OverviewNode[] = [
  { matchNumber: 104, round: 'final', x: 500, y: 50 },
  { matchNumber: 101, round: 'semi-final', x: 250, y: 160 },
  { matchNumber: 102, round: 'semi-final', x: 750, y: 160 },
  { matchNumber: 97, round: 'quarter-final', x: 125, y: 270 },
  { matchNumber: 98, round: 'quarter-final', x: 375, y: 270 },
  { matchNumber: 99, round: 'quarter-final', x: 625, y: 270 },
  { matchNumber: 100, round: 'quarter-final', x: 875, y: 270 },
  { matchNumber: 90, round: 'round-of-16', x: 60, y: 380 },
  { matchNumber: 89, round: 'round-of-16', x: 185, y: 380 },
  { matchNumber: 93, round: 'round-of-16', x: 310, y: 380 },
  { matchNumber: 94, round: 'round-of-16', x: 435, y: 380 },
  { matchNumber: 91, round: 'round-of-16', x: 565, y: 380 },
  { matchNumber: 92, round: 'round-of-16', x: 690, y: 380 },
  { matchNumber: 95, round: 'round-of-16', x: 815, y: 380 },
  { matchNumber: 96, round: 'round-of-16', x: 940, y: 380 },
];

const OVERVIEW_LINKS = [
  { parent: 104, children: [101, 102] },
  { parent: 101, children: [97, 98] },
  { parent: 102, children: [99, 100] },
  { parent: 97, children: [90, 89] },
  { parent: 98, children: [93, 94] },
  { parent: 99, children: [91, 92] },
  { parent: 100, children: [95, 96] },
];

const OVERVIEW_NODE_BY_NUMBER = new Map(
  OVERVIEW_NODES.map((node) => [node.matchNumber, node]),
);

const getOverviewLinePath = (parentNumber: number, childNumber: number) => {
  const parent = OVERVIEW_NODE_BY_NUMBER.get(parentNumber);
  const child = OVERVIEW_NODE_BY_NUMBER.get(childNumber);

  if (!parent || !child) {
    return '';
  }

  const middleY = parent.y + (child.y - parent.y) * 0.45;

  return `M ${parent.x} ${parent.y} V ${middleY} H ${child.x} V ${child.y}`;
};

const formatOverviewDate = (entry: TournamentEntry) =>
  `${entry.dateLabel.replace(/\s+/g, '')}(${entry.weekday})`;

const getCompactTeamName = (teamName: string) => {
  const placeholder = /^(\d+)번\s*(승자|패자)$/.exec(teamName);

  if (placeholder) {
    return '';
  }

  return teamName;
};

const getOverviewScoreParts = (match: Match, currentTime: Date) => {
  const displayScoreState = getDisplayScoreState(match, currentTime);

  if (!displayScoreState) {
    return undefined;
  }

  if (displayScoreState.kind === 'pending') {
    return {
      home: '-',
      away: '-',
    };
  }

  const homePenalty =
    typeof displayScoreState.homePenaltyScore === 'number'
      ? `(${displayScoreState.homePenaltyScore})`
      : '';
  const awayPenalty =
    typeof displayScoreState.awayPenaltyScore === 'number'
      ? `(${displayScoreState.awayPenaltyScore})`
      : '';

  return {
    home: `${displayScoreState.homeScore}${homePenalty}`,
    away: `${displayScoreState.awayScore}${awayPenalty}`,
  };
};

const getWinnerScoreClassName = (match: Match, side: 'home' | 'away') => {
  const isWinner =
    (side === 'home' && match.winner === 'home') ||
    (side === 'away' && match.winner === 'away');

  return isWinner ? 'tournament-overview-score-winner' : '';
};

const OverviewMatchNode = ({
  node,
  entry,
  currentTime,
  nextMatchId,
  showMatchStatusHighlights,
  activeStages,
  selectedMatchId,
  onSelectMatch,
  onOpenMatchDetail,
}: {
  node: OverviewNode;
  entry?: TournamentEntry;
  currentTime: Date;
  nextMatchId?: string;
  showMatchStatusHighlights: boolean;
  activeStages?: TournamentStage[];
  selectedMatchId?: string | null;
  onSelectMatch?: (match: Match) => void;
  onOpenMatchDetail?: (match: Match) => void;
}) => {
  const match = entry?.match;
  const isSelected = match?.id === selectedMatchId;
  const isNext = showMatchStatusHighlights && match?.id === nextMatchId;
  const isLive = Boolean(showMatchStatusHighlights && match && isLiveMatch(match, currentTime));
  const isActiveStage = Boolean(match?.stage && activeStages?.includes(match.stage as TournamentStage));
  const scoreParts = match ? getOverviewScoreParts(match, currentTime) : undefined;
  const liveBadgeLabel = match ? getLiveBadgeLabel(match, currentTime) : undefined;
  const homeName = match ? getCompactTeamName(match.home) : '';
  const awayName = match ? getCompactTeamName(match.away) : '';
  const openMatchDetail = match && canOpenMatchDetail(match, currentTime) ? onOpenMatchDetail : undefined;
  const className = [
    'tournament-overview-box',
    `tournament-overview-box-${node.round}`,
    isActiveStage ? 'tournament-overview-box-active-stage' : '',
    isSelected ? 'tournament-overview-box-selected' : '',
    isNext ? 'tournament-overview-box-next' : '',
    isLive ? 'tournament-overview-box-live' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const style = {
    left: `${(node.x / OVERVIEW_WIDTH) * 100}%`,
    top: `${(node.y / OVERVIEW_HEIGHT) * 100}%`,
  };

  if (!match || !entry) {
    return (
      <div className={`tournament-overview-node tournament-overview-node-${node.round}`} style={style}>
        <div className={`${className} tournament-overview-box-empty`}>
          <span className="tournament-overview-date">{node.matchNumber}번</span>
          <span className="tournament-overview-time">미정</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`tournament-overview-node tournament-overview-node-${node.round}`} style={style}>
      <button
        type="button"
        data-match-id={match.id}
        className={className}
        aria-label={`${formatOverviewDate(entry)} ${match.timeLabel} 경기 선택`}
        aria-pressed={isSelected}
        onClick={() => onSelectMatch?.(match)}
        onDoubleClick={() => openMatchDetail?.(match)}
      >
        <span className="tournament-overview-meta">
          <span className="tournament-overview-date">{formatOverviewDate(entry)}</span>
          <span className="tournament-overview-time">
            {match.timeLabel}
            {liveBadgeLabel ? <span className="tournament-overview-live-badge">{liveBadgeLabel}</span> : null}
          </span>
        </span>
        <span className="tournament-overview-teams">
          <span className="tournament-overview-team">
            {homeName ? (
              <>
                <FlagIcon teamName={match.home} fallback={match.homeFlag} className="tournament-overview-flag" />
                <span className="tournament-overview-team-name">{homeName}</span>
              </>
            ) : null}
          </span>
          <span className="tournament-overview-team">
            {awayName ? (
              <>
                <FlagIcon teamName={match.away} fallback={match.awayFlag} className="tournament-overview-flag" />
                <span className="tournament-overview-team-name">{awayName}</span>
              </>
            ) : null}
          </span>
        </span>
        <span className="tournament-overview-score">
          {scoreParts ? (
            <>
              <span className={getWinnerScoreClassName(match, 'home')}>{scoreParts.home}</span>
              <span className="tournament-overview-score-divider">:</span>
              <span className={getWinnerScoreClassName(match, 'away')}>{scoreParts.away}</span>
            </>
          ) : (
            'vs'
          )}
        </span>
      </button>
    </div>
  );
};

export function TournamentOverviewBracket({
  sections,
  currentTime,
  nextMatchId,
  showMatchStatusHighlights = true,
  activeStages,
  selectedMatchId,
  onSelectMatch,
  onOpenMatchDetail,
}: TournamentOverviewBracketProps) {
  const entriesByNumber = new Map(
    getTournamentEntries(sections)
      .filter((entry): entry is TournamentEntry & { matchNumber: number } =>
        typeof entry.matchNumber === 'number',
      )
      .map((entry) => [entry.matchNumber, entry]),
  );

  return (
    <div className="tournament-overview-bracket" aria-label="월드컵 16강 이후 토너먼트 한눈보기">
      <div className="tournament-overview-board">
        <svg
          className="tournament-overview-lines"
          viewBox={`0 0 ${OVERVIEW_WIDTH} ${OVERVIEW_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {OVERVIEW_LINKS.flatMap((link) =>
            link.children.map((childNumber) => (
              <path
                key={`${link.parent}-${childNumber}`}
                className="tournament-overview-line"
                d={getOverviewLinePath(link.parent, childNumber)}
                vectorEffect="non-scaling-stroke"
              />
            )),
          )}
        </svg>
        {OVERVIEW_NODES.map((node) => (
          <OverviewMatchNode
            key={node.matchNumber}
            node={node}
            entry={entriesByNumber.get(node.matchNumber)}
            currentTime={currentTime}
            nextMatchId={nextMatchId}
            showMatchStatusHighlights={showMatchStatusHighlights}
            activeStages={activeStages}
            selectedMatchId={selectedMatchId}
            onSelectMatch={onSelectMatch}
            onOpenMatchDetail={onOpenMatchDetail}
          />
        ))}
      </div>
    </div>
  );
}
