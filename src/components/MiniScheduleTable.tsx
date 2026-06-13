import type { Match, ScheduleCell, ScheduleDay, ScheduleSection } from '../data/schedule';
import { isLiveMatch, isPastMatch } from '../utils/timeUtils';

type MiniScheduleTableProps = {
  sections: ScheduleSection[];
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

const formatMiniMatch = (match: Match) => {
  const homeName = match.isKorea ? match.home : match.home.slice(0, 2);
  const awayName = match.isKorea ? match.away : match.away.slice(0, 2);

  return `${match.timeLabel} ${match.homeFlag}${homeName}:${awayName}${match.awayFlag}`;
};

function MiniCell({
  cell,
  currentTime,
  nextMatchId,
}: {
  cell: ScheduleCell;
  currentTime: Date;
  nextMatchId?: string;
}) {
  const hasKorea = cell.matches.some((match) => match.isKorea);
  const hasNextMatch = cell.matches.some((match) => match.id === nextMatchId);
  const hasLiveMatch = cell.matches.some((match) => isLiveMatch(match, currentTime));
  const isPastCell =
    cell.matches.length > 0 && cell.matches.every((match) => isPastMatch(match, currentTime));

  return (
    <td
      className={[
        'mini-match-cell border border-neutral-700 px-1 py-[2px] align-middle',
        hasKorea ? 'schedule-korea-cell bg-[#fff8a8]' : 'bg-white',
        hasNextMatch ? 'schedule-match-cell-next ring-2 ring-inset ring-sky-600' : '',
        hasLiveMatch ? 'ring-2 ring-inset ring-red-600' : '',
        isPastCell ? 'opacity-45' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {cell.matches.slice(0, 2).map((match) => (
        <div
          key={match.id}
          data-match-id={match.id}
          className="truncate text-[8px] font-black leading-[1.15] text-neutral-950 sm:text-[9px]"
          title={`${match.timeLabel}, ${match.group} ${match.round} ${match.home} : ${match.away}`}
        >
          {formatMiniMatch(match)}
          {isLiveMatch(match, currentTime) ? (
            <span className="ml-[2px] bg-red-600 px-[2px] text-[7px] text-white">LIVE</span>
          ) : null}
        </div>
      ))}
    </td>
  );
}

function MiniRow({
  day,
  currentTime,
  nextMatchId,
}: {
  day: ScheduleDay;
  currentTime: Date;
  nextMatchId?: string;
}) {
  return (
    <tr data-day-date={day.date}>
      <th className="mini-date-cell border border-neutral-800 bg-[#e8eef7] px-1 py-[2px] text-center align-middle">
        <div className="text-[10px] font-black leading-tight text-neutral-950">{day.dateLabel}</div>
        <div className="text-[9px] font-black leading-tight text-neutral-950">({day.weekday})</div>
      </th>
      {normalizeCells(day.cells).map((scheduleCell, index) => (
        <MiniCell
          key={`${day.date}-${index}`}
          cell={scheduleCell}
          currentTime={currentTime}
          nextMatchId={nextMatchId}
        />
      ))}
    </tr>
  );
}

export function MiniScheduleTable({
  sections,
  currentTime,
  nextMatchId,
}: MiniScheduleTableProps) {
  const hasRows = sections.some((section) => section.days.length > 0);

  return (
    <div className="mini-schedule-wrap mx-auto w-full max-w-[980px] pb-4">
      {hasRows ? (
        sections.map((section) => (
          <table
            key={section.id}
            className="mini-schedule-table w-full table-fixed border-collapse border-2 border-neutral-900 bg-white"
            aria-label={`${section.title} 미니 보기`}
          >
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[21.25%]" />
              <col className="w-[21.25%]" />
              <col className="w-[21.25%]" />
              <col className="w-[21.25%]" />
            </colgroup>
            <tbody>
              {section.days.map((day) => (
                <MiniRow
                  key={day.date}
                  day={day}
                  currentTime={currentTime}
                  nextMatchId={nextMatchId}
                />
              ))}
            </tbody>
          </table>
        ))
      ) : (
        <div className="border-2 border-neutral-900 bg-white p-4 text-center text-sm font-bold text-neutral-700">
          표시할 일정이 없습니다.
        </div>
      )}
    </div>
  );
}
