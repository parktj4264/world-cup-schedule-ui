import type { ScheduleCell, ScheduleDay } from '../data/schedule';
import { MatchCell } from './MatchCell';

type ScheduleRowProps = {
  day: ScheduleDay;
  currentTime: Date;
  nextMatchId?: string;
};

const CELL_COUNT = 4;

const normalizeCells = (cells: ScheduleCell[]) => {
  const visibleCells = cells.slice(0, CELL_COUNT);

  while (visibleCells.length < CELL_COUNT) {
    visibleCells.push({ matches: [] });
  }

  return visibleCells;
};

export function ScheduleRow({ day, currentTime, nextMatchId }: ScheduleRowProps) {
  return (
    <tr>
      <th
        scope="row"
        className="h-[62px] min-w-[86px] border border-neutral-800 bg-[#e8eef7] px-2 py-1 text-center align-middle"
      >
        <div className="text-[18px] font-black leading-tight text-neutral-950">{day.dateLabel}</div>
        <div className="mt-[2px] text-[17px] font-black leading-tight text-neutral-950">({day.weekday})</div>
      </th>
      {normalizeCells(day.cells).map((scheduleCell, index) => (
        <MatchCell
          key={`${day.date}-${index}`}
          cell={scheduleCell}
          currentTime={currentTime}
          nextMatchId={nextMatchId}
        />
      ))}
    </tr>
  );
}
