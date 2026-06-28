import type { Match, MatchStage, ScheduleCell, ScheduleDay } from '../data/schedule';
import { MatchCell } from './MatchCell';

type ScheduleRowProps = {
  day: ScheduleDay;
  currentTime: Date;
  nextMatchId?: string;
  selectedCountry?: string;
  todayKey?: string;
  onOpenMatchDetail?: (match: Match) => void;
};

const CELL_COUNT = 4;

type TournamentStage = Exclude<MatchStage, 'group'>;

const TOURNAMENT_STAGE_ORDER: TournamentStage[] = [
  'round-of-32',
  'round-of-16',
  'quarter-final',
  'semi-final',
  'third-place',
  'final',
];

const TOURNAMENT_STAGE_LABELS: Record<TournamentStage, string> = {
  'round-of-32': '32강',
  'round-of-16': '16강',
  'quarter-final': '8강',
  'semi-final': '4강',
  'third-place': '3·4위전',
  final: '결승',
};

const normalizeCells = (cells: ScheduleCell[]) => {
  const visibleCells = cells.slice(0, CELL_COUNT);

  while (visibleCells.length < CELL_COUNT) {
    visibleCells.push({ matches: [] });
  }

  return visibleCells;
};

const isTournamentStage = (stage: MatchStage | undefined): stage is TournamentStage =>
  Boolean(stage && stage !== 'group');

const getTournamentStages = (day: ScheduleDay) => {
  const stageSet = new Set<TournamentStage>();

  day.cells.forEach((scheduleCell) => {
    scheduleCell.matches.forEach((match) => {
      if (isTournamentStage(match.stage)) {
        stageSet.add(match.stage);
      }
    });
  });

  return TOURNAMENT_STAGE_ORDER.filter((stage) => stageSet.has(stage));
};

export function ScheduleRow({
  day,
  currentTime,
  nextMatchId,
  selectedCountry,
  todayKey,
  onOpenMatchDetail,
}: ScheduleRowProps) {
  const isToday = day.date === todayKey;
  const tournamentStages = getTournamentStages(day);
  const primaryTournamentStage = tournamentStages[0];

  return (
    <tr data-day-date={day.date} className={isToday ? 'schedule-today-row' : undefined}>
      <th
        scope="row"
        className={[
          'schedule-date-cell border border-neutral-800 text-center align-middle',
          primaryTournamentStage ? `schedule-date-cell-${primaryTournamentStage}` : '',
          isToday ? 'schedule-today-date-cell' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="schedule-date-content">
          {tournamentStages.length > 0 ? (
            <div
              className="schedule-round-badges"
              aria-label={`${tournamentStages
                .map((stage) => TOURNAMENT_STAGE_LABELS[stage])
                .join(', ')} 라운드`}
            >
              {tournamentStages.map((stage) => (
                <span
                  key={stage}
                  className={`schedule-round-badge schedule-round-badge-${stage}`}
                >
                  {TOURNAMENT_STAGE_LABELS[stage]}
                </span>
              ))}
            </div>
          ) : null}
          <div className="schedule-date-label font-black leading-tight text-neutral-950">{day.dateLabel}</div>
          <div className="schedule-weekday mt-[2px] font-black leading-tight text-neutral-950">({day.weekday})</div>
        </div>
      </th>
      {normalizeCells(day.cells).map((scheduleCell, index) => (
        <MatchCell
          key={`${day.date}-${index}`}
          cell={scheduleCell}
          currentTime={currentTime}
          nextMatchId={nextMatchId}
          selectedCountry={selectedCountry}
          onOpenMatchDetail={onOpenMatchDetail}
        />
      ))}
    </tr>
  );
}
