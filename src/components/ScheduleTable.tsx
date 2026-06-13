import type { ScheduleSection } from '../data/schedule';
import { ScheduleRow } from './ScheduleRow';

type ScheduleTableProps = {
  sections: ScheduleSection[];
  currentTime: Date;
  nextMatchId?: string;
};

export function ScheduleTable({ sections, currentTime, nextMatchId }: ScheduleTableProps) {
  const hasRows = sections.some((section) => section.days.length > 0);

  return (
    <div className="mx-auto w-full max-w-[1040px] overflow-x-auto pb-4">
      {hasRows ? (
        sections.map((section) => (
          <table
            key={section.id}
            className="mx-auto w-[974px] table-fixed border-collapse border-2 border-neutral-900 bg-white text-left"
            aria-label={section.title}
          >
            <colgroup>
              <col className="w-[86px]" />
              <col className="w-[222px]" />
              <col className="w-[222px]" />
              <col className="w-[222px]" />
              <col className="w-[222px]" />
            </colgroup>
            <tbody>
              {section.days.map((day) => (
                <ScheduleRow
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
        <div className="mx-auto w-[974px] border-2 border-neutral-900 bg-white p-6 text-center text-sm font-bold text-neutral-700">
          표시할 일정이 없습니다.
        </div>
      )}
    </div>
  );
}
