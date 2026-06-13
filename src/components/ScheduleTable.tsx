import type { CSSProperties, RefObject } from 'react';
import type { ScheduleSection } from '../data/schedule';
import { ScheduleRow } from './ScheduleRow';

type ScheduleTableProps = {
  sections: ScheduleSection[];
  currentTime: Date;
  nextMatchId?: string;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  zoom: number;
  selectedCountry?: string;
  todayKey?: string;
  className?: string;
};

const BASE_DATE_WIDTH = 86;
const BASE_MATCH_WIDTH = 222;
const BASE_ROW_HEIGHT = 62;
const BASE_CELL_PADDING_X = 8;
const BASE_CELL_PADDING_Y = 4;
const BASE_META_FONT = 13;
const BASE_TIME_FONT = 15;
const BASE_TEAM_FONT = 13;
const BASE_DATE_FONT = 18;
const BASE_WEEKDAY_FONT = 17;

export const BASE_TABLE_WIDTH = BASE_DATE_WIDTH + BASE_MATCH_WIDTH * 4;

export function ScheduleTable({
  sections,
  currentTime,
  nextMatchId,
  scrollContainerRef,
  zoom,
  selectedCountry,
  todayKey,
  className = '',
}: ScheduleTableProps) {
  const hasRows = sections.some((section) => section.days.length > 0);
  const zoomRatio = zoom / 100;
  const tableStyle = {
    '--schedule-date-width': `${BASE_DATE_WIDTH * zoomRatio}px`,
    '--schedule-match-width': `${BASE_MATCH_WIDTH * zoomRatio}px`,
    '--schedule-table-width': `${BASE_TABLE_WIDTH * zoomRatio}px`,
    '--schedule-row-height': `${BASE_ROW_HEIGHT * zoomRatio}px`,
    '--schedule-cell-padding': `${BASE_CELL_PADDING_Y * zoomRatio}px ${BASE_CELL_PADDING_X * zoomRatio}px`,
    '--schedule-meta-font': `${Math.max(10, BASE_META_FONT * zoomRatio)}px`,
    '--schedule-time-font': `${Math.max(12, BASE_TIME_FONT * zoomRatio)}px`,
    '--schedule-team-font': `${Math.max(10, BASE_TEAM_FONT * zoomRatio)}px`,
    '--schedule-date-font': `${Math.max(13, BASE_DATE_FONT * zoomRatio)}px`,
    '--schedule-weekday-font': `${Math.max(12, BASE_WEEKDAY_FONT * zoomRatio)}px`,
  } as CSSProperties;

  return (
    <div
      ref={scrollContainerRef}
      className={['schedule-scroll mx-auto w-full max-w-[1040px] overflow-x-auto pb-4', className]
        .filter(Boolean)
        .join(' ')}
      style={tableStyle}
    >
      {hasRows ? (
        sections.map((section) => (
          <div key={section.id} className="schedule-section mx-auto mb-4">
            <h2 className="schedule-section-title border-x-2 border-t-2 border-neutral-900 bg-white py-1 text-center text-sm font-black text-neutral-950">
              {section.title}
            </h2>
            <table
              className="schedule-table mx-auto table-fixed border-collapse border-2 border-neutral-900 bg-white text-center"
              aria-label={section.title}
            >
              <colgroup>
                <col className="schedule-date-col" />
                <col className="schedule-match-col" />
                <col className="schedule-match-col" />
                <col className="schedule-match-col" />
                <col className="schedule-match-col" />
              </colgroup>
              <tbody>
                {section.days.map((day) => (
                  <ScheduleRow
                    key={day.date}
                    day={day}
                    currentTime={currentTime}
                    nextMatchId={nextMatchId}
                    selectedCountry={selectedCountry}
                    todayKey={todayKey}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <div className="mx-auto w-[974px] border-2 border-neutral-900 bg-white p-6 text-center text-sm font-bold text-neutral-700">
          표시할 일정이 없습니다.
        </div>
      )}
    </div>
  );
}
