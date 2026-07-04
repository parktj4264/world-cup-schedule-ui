import { useMemo, useState } from 'react';
import type { Match, MatchStage, ScheduleSection } from '../data/schedule';
import {
  canOpenMatchDetail,
  getDisplayScoreState,
  getPenaltyShootoutLabel,
} from '../utils/matchDisplay';
import { getMatchStartTime, isLiveMatch } from '../utils/timeUtils';
import { FlagIcon } from './FlagIcon';

type TournamentSheetsProps = {
  sections: ScheduleSection[];
  currentTime: Date;
  nextMatchId?: string;
  selectedCountry?: string;
  onOpenMatchDetail?: (match: Match) => void;
};

type TournamentStage = Exclude<MatchStage, 'group'>;
type TournamentEntry = {
  date: string;
  dateLabel: string;
  weekday: string;
  match: Match;
  matchNumber?: number;
};

type SheetTabId = 'round-of-32' | 'round-of-16' | 'quarter-final' | 'semi-final' | 'finals';

type SheetTab = {
  id: SheetTabId;
  label: string;
  title: string;
  heading: string;
  matchesPerRow: 2 | 3;
  stages: TournamentStage[];
};

const SHEET_TABS: SheetTab[] = [
  {
    id: 'round-of-32',
    label: '32강',
    title: '32강',
    heading: '월드컵 32강 일정',
    matchesPerRow: 3,
    stages: ['round-of-32'],
  },
  {
    id: 'round-of-16',
    label: '16강',
    title: '16강',
    heading: '월드컵 16강 일정',
    matchesPerRow: 2,
    stages: ['round-of-16'],
  },
  {
    id: 'quarter-final',
    label: '8강',
    title: '8강',
    heading: '월드컵 8강 일정',
    matchesPerRow: 2,
    stages: ['quarter-final'],
  },
  {
    id: 'semi-final',
    label: '4강',
    title: '4강',
    heading: '월드컵 4강 일정',
    matchesPerRow: 2,
    stages: ['semi-final'],
  },
  {
    id: 'finals',
    label: '결승',
    title: '결승',
    heading: '월드컵 3·4위전 / 결승 일정',
    matchesPerRow: 2,
    stages: ['third-place', 'final'],
  },
];

const SHEET_MATCH_COLUMN_LABELS = ['첫 번째 경기', '두 번째 경기', '세 번째 경기'];

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

const getMatchNumber = (match: Match) => {
  if (typeof match.apiFootballFixtureId === 'number') {
    return match.apiFootballFixtureId;
  }

  const matchNumber = /^match-(\d+)$/.exec(match.id);
  return matchNumber ? Number(matchNumber[1]) : undefined;
};

const formatSheetIssuedAt = (date: Date) => {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '26';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';

  return `'${year}. ${month}. ${day}.(${weekday}) KST`;
};

const isTournamentStage = (stage: MatchStage | undefined): stage is TournamentStage =>
  Boolean(stage && stage !== 'group');

const includesSelectedCountry = (match: Match, selectedCountry: string) => {
  const countryQuery = selectedCountry.trim();

  return (
    countryQuery !== '' &&
    (match.home.includes(countryQuery) || match.away.includes(countryQuery))
  );
};

const isKoreaMatch = (match: Match) =>
  match.isKorea || match.home === '대한민국' || match.away === '대한민국';

const sortEntries = (entries: TournamentEntry[]) =>
  [...entries].sort((first, second) => getMatchStartTime(first.match) - getMatchStartTime(second.match));

const getTournamentEntries = (sections: ScheduleSection[]) =>
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

const getRowsForEntries = (entries: TournamentEntry[], matchesPerRow: 2 | 3) => {
  const groupedByDate = entries.reduce<
    {
      date: string;
      dateLabel: string;
      weekday: string;
      matches: TournamentEntry[];
    }[]
  >((groups, entry) => {
    const group = groups.find((candidate) => candidate.date === entry.date);

    if (group) {
      group.matches.push(entry);
      return groups;
    }

    return [
      ...groups,
      {
        date: entry.date,
        dateLabel: entry.dateLabel,
        weekday: entry.weekday,
        matches: [entry],
      },
    ];
  }, []);

  return groupedByDate.flatMap((group) => {
    const rows = [];

    for (let index = 0; index < group.matches.length; index += matchesPerRow) {
      rows.push({
        key: `${group.date}-${index}`,
        dateLabel: group.dateLabel,
        weekday: group.weekday,
        matches: group.matches.slice(index, index + matchesPerRow),
      });
    }

    return rows;
  });
};

const getWinnerClassName = (match: Match, side: 'home' | 'away') => {
  const isWinner =
    (side === 'home' && match.winner === 'home') ||
    (side === 'away' && match.winner === 'away');

  return isWinner ? 'tournament-sheet-winner' : '';
};

const getMatchHighlightClassName = (
  match: Match,
  selectedCountry: string,
  nextMatchId: string | undefined,
  currentTime: Date,
) => [
  includesSelectedCountry(match, selectedCountry) ? 'tournament-sheet-selected-country' : '',
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

const SheetMatch = ({
  entry,
  currentTime,
  nextMatchId,
  selectedCountry,
  selectedMatchId,
  onSelectMatch,
  onOpenMatchDetail,
}: {
  entry: TournamentEntry;
  currentTime: Date;
  nextMatchId?: string;
  selectedCountry: string;
  selectedMatchId?: string | null;
  onSelectMatch: (match: Match) => void;
  onOpenMatchDetail?: (match: Match) => void;
}) => {
  const { match, matchNumber } = entry;
  const scoreParts = getScoreParts(match, currentTime);
  const penaltyShootoutLabel = getPenaltyShootoutLabel(match);
  const highlightClassName = getMatchHighlightClassName(match, selectedCountry, nextMatchId, currentTime);
  const isSelected = match.id === selectedMatchId;
  const matchContent = (
    <>
      <div className="tournament-sheet-time-row">
        <span>{match.timeLabel}</span>
        {matchNumber ? <span className="tournament-sheet-match-number">{matchNumber}번</span> : null}
      </div>
      <div className="tournament-sheet-versus-row">
        <div className={['tournament-sheet-team', getWinnerClassName(match, 'home')].filter(Boolean).join(' ')}>
          <FlagIcon teamName={match.home} fallback={match.homeFlag} className="tournament-sheet-flag" />
          <span>{match.home}</span>
        </div>
        <div className="tournament-sheet-score" aria-label={penaltyShootoutLabel}>
          {scoreParts ? (
            <span className={getWinnerClassName(match, 'home')}>
              {scoreParts.home}
              {scoreParts.homePenalty ? <span className="tournament-sheet-penalty">({scoreParts.homePenalty})</span> : null}
            </span>
          ) : null}
          <span className="tournament-sheet-colon">:</span>
          {scoreParts ? (
            <span className={getWinnerClassName(match, 'away')}>
              {scoreParts.awayPenalty ? <span className="tournament-sheet-penalty">({scoreParts.awayPenalty})</span> : null}
              {scoreParts.away}
            </span>
          ) : null}
        </div>
        <div className={['tournament-sheet-team', getWinnerClassName(match, 'away')].filter(Boolean).join(' ')}>
          <FlagIcon teamName={match.away} fallback={match.awayFlag} className="tournament-sheet-flag" />
          <span>{match.away}</span>
        </div>
      </div>
    </>
  );
  const openMatchDetail = canOpenMatchDetail(match, currentTime) ? onOpenMatchDetail : undefined;

  return (
    <button
      type="button"
      data-match-id={match.id}
      className={[
        'tournament-sheet-match',
        'tournament-sheet-match-button',
        highlightClassName,
        isSelected ? 'tournament-sheet-match-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${match.home} 대 ${match.away} 경기 선택`}
      aria-pressed={isSelected}
      onClick={() => onSelectMatch(match)}
      onDoubleClick={() => openMatchDetail?.(match)}
    >
      {matchContent}
    </button>
  );
};

const BracketMatchBox = ({
  entry,
  matchNumber,
  currentTime,
  nextMatchId,
  selectedCountry,
  selectedMatchId,
  onSelectMatch,
  onOpenMatchDetail,
}: {
  entry?: TournamentEntry;
  matchNumber: number;
  currentTime: Date;
  nextMatchId?: string;
  selectedCountry: string;
  selectedMatchId?: string | null;
  onSelectMatch: (match: Match) => void;
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
  const highlightClassName = getMatchHighlightClassName(match, selectedCountry, nextMatchId, currentTime);
  const isSelected = match.id === selectedMatchId;
  const boxContent = (
    <>
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
    </>
  );
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
      onClick={() => onSelectMatch(match)}
      onDoubleClick={() => openMatchDetail?.(match)}
    >
      {boxContent}
    </button>
  );
};

export function TournamentSheets({
  sections,
  currentTime,
  nextMatchId,
  selectedCountry = '',
  onOpenMatchDetail,
}: TournamentSheetsProps) {
  const [activeTabId, setActiveTabId] = useState<SheetTabId>('round-of-32');
  const [selectedTournamentMatchId, setSelectedTournamentMatchId] = useState<string | null>(null);
  const tournamentEntries = useMemo(() => getTournamentEntries(sections), [sections]);
  const entriesByNumber = useMemo(
    () =>
      new Map(
        tournamentEntries
          .filter((entry): entry is TournamentEntry & { matchNumber: number } =>
            typeof entry.matchNumber === 'number',
          )
          .map((entry) => [entry.matchNumber, entry]),
      ),
    [tournamentEntries],
  );
  const activeTab = SHEET_TABS.find((tab) => tab.id === activeTabId) ?? SHEET_TABS[0];
  const activeEntries = tournamentEntries.filter((entry) =>
    activeTab.stages.includes(entry.match.stage as TournamentStage),
  );
  const sheetRows = getRowsForEntries(activeEntries, activeTab.matchesPerRow);
  const matchColumnIndexes = Array.from(
    { length: activeTab.matchesPerRow },
    (_, index) => index,
  );
  const activeBracketLabel = activeTab.id === 'round-of-32' ? undefined : activeTab.label;
  const selectedBracketMatchNumber = selectedTournamentMatchId
    ? tournamentEntries.find((entry) => entry.match.id === selectedTournamentMatchId)?.matchNumber
    : undefined;
  const thirdPlaceEntry = entriesByNumber.get(103);
  const issuedAt = formatSheetIssuedAt(currentTime);

  return (
    <section className="tournament-sheets mx-auto w-full max-w-[1040px] pb-6">
      <div className="tournament-sheet-tabs" role="tablist" aria-label="토너먼트 라운드 시트">
        {SHEET_TABS.map((tab) => {
          const isActive = tab.id === activeTab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={['tournament-sheet-tab', isActive ? 'tournament-sheet-tab-active' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="tournament-sheet-page">
        <div className="tournament-sheet-rule" />
        <h2 className="tournament-sheet-title">제23회 2026 북중미 월드컵 {activeTab.title} 일정</h2>
        <div className="tournament-sheet-subtitle">{issuedAt}</div>
        <div className="tournament-sheet-rule" />

        <section className="tournament-sheet-block" aria-labelledby="tournament-sheet-heading">
          <h3 id="tournament-sheet-heading" className="tournament-sheet-heading">
            <span aria-hidden="true">□</span>
            {activeTab.heading}
          </h3>
          <div className="tournament-sheet-table-scroll">
            <table
              className={[
                'tournament-sheet-table',
                activeTab.matchesPerRow === 3 ? 'tournament-sheet-table-three-matches' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <colgroup>
                <col className="tournament-sheet-date-col" />
                {matchColumnIndexes.map((index) => (
                  <col key={index} className="tournament-sheet-match-col" />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className="tournament-sheet-corner" aria-label="날짜" />
                  {matchColumnIndexes.map((index) => (
                    <th key={index}>{SHEET_MATCH_COLUMN_LABELS[index]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetRows.length > 0 ? (
                  sheetRows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row" className="tournament-sheet-date-cell">
                        <span>{row.dateLabel}</span>
                        <span>({row.weekday})</span>
                      </th>
                      {matchColumnIndexes.map((index) => (
                        <td key={index}>
                          {row.matches[index] ? (
                            <SheetMatch
                              entry={row.matches[index]}
                              currentTime={currentTime}
                              nextMatchId={nextMatchId}
                              selectedCountry={selectedCountry}
                              selectedMatchId={selectedTournamentMatchId}
                              onSelectMatch={(match) => setSelectedTournamentMatchId(match.id)}
                              onOpenMatchDetail={onOpenMatchDetail}
                            />
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={activeTab.matchesPerRow + 1} className="tournament-sheet-empty">
                      표시할 토너먼트 일정이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tournament-sheet-block" aria-labelledby="tournament-bracket-heading">
          <h3 id="tournament-bracket-heading" className="tournament-sheet-heading">
            <span aria-hidden="true">□</span>
            월드컵 16강 이후 토너먼트표
          </h3>
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
                        selectedCountry={selectedCountry}
                        selectedMatchId={selectedTournamentMatchId}
                        onSelectMatch={(match) => setSelectedTournamentMatchId(match.id)}
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
                  selectedCountry={selectedCountry}
                  selectedMatchId={selectedTournamentMatchId}
                  onSelectMatch={(match) => setSelectedTournamentMatchId(match.id)}
                  onOpenMatchDetail={onOpenMatchDetail}
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
