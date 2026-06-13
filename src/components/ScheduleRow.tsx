import type { ScheduleCell, ScheduleDay } from '../data/schedule';
import { MatchCell } from './MatchCell';

type ScheduleRowProps = {
  day: ScheduleDay;
  currentTime: Date;
  nextMatchId?: string;
  selectedCountry?: string;
  todayKey?: string;
};

const CELL_COUNT = 4;

const normalizeCells = (cells: ScheduleCell[]) => {
  const visibleCells = cells.slice(0, CELL_COUNT);

  while (visibleCells.length < CELL_COUNT) {
    visibleCells.push({ matches: [] });
  }

  return visibleCells;
};

export function ScheduleRow({
  day,
  currentTime,
  nextMatchId,
  selectedCountry,
  todayKey,
}: ScheduleRowProps) {
  const isToday = day.date === todayKey;

  return (
    <tr data-day-date={day.date} className={isToday ? 'schedule-today-row' : undefined}>
      <th
        scope="row"
        className={[
          'schedule-date-cell border border-neutral-800 text-center align-middle',
          isToday ? 'schedule-today-date-cell' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="schedule-date-label font-black leading-tight text-neutral-950">{day.dateLabel}</div>
        <div className="schedule-weekday mt-[2px] font-black leading-tight text-neutral-950">({day.weekday})</div>
      </th>
      {normalizeCells(day.cells).map((scheduleCell, index) => (
        <MatchCell
          key={`${day.date}-${index}`}
          cell={scheduleCell}
          currentTime={currentTime}
          nextMatchId={nextMatchId}
          selectedCountry={selectedCountry}
        />
      ))}
    </tr>
  );
}
