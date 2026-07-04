import { useEffect, useRef, useState } from 'react';
import type { Match, ScheduleSection } from '../data/schedule';
import { BASE_TABLE_WIDTH, ScheduleTable } from './ScheduleTable';
import { TournamentOverviewBracket } from './TournamentOverviewBracket';

type MiniScheduleTableProps = {
  sections: ScheduleSection[];
  currentTime: Date;
  nextMatchId?: string;
  selectedCountry?: string;
  todayKey?: string;
  onOpenMatchDetail?: (match: Match) => void;
};

const getOverviewScale = (containerWidth: number) =>
  Math.min(1, Math.max(0.32, containerWidth / BASE_TABLE_WIDTH));

export function MiniScheduleTable({
  sections,
  currentTime,
  nextMatchId,
  selectedCountry,
  todayKey,
  onOpenMatchDetail,
}: MiniScheduleTableProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [baseHeight, setBaseHeight] = useState(1118);
  const [selectedTournamentMatchId, setSelectedTournamentMatchId] = useState<string | null>(null);

  useEffect(() => {
    const updateLayout = () => {
      const width = wrapperRef.current?.clientWidth ?? BASE_TABLE_WIDTH;
      setScale(getOverviewScale(width));
      setBaseHeight(contentRef.current?.offsetHeight ?? 1118);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);

    return () => window.removeEventListener('resize', updateLayout);
  }, [sections]);

  return (
    <div ref={wrapperRef} className="mini-overview-wrap mx-auto w-full max-w-[1040px] pb-4">
      <div
        className="mini-overview-stage"
        style={{ height: `${baseHeight * scale}px` }}
      >
        <div
          ref={contentRef}
          className="mini-overview-scale mx-auto origin-top-left"
          style={{
            width: `${BASE_TABLE_WIDTH}px`,
            transform: `scale(${scale})`,
          }}
        >
          <ScheduleTable
            sections={sections}
            currentTime={currentTime}
            nextMatchId={nextMatchId}
            zoom={100}
            selectedCountry={selectedCountry}
            todayKey={todayKey}
            className="mini-overview-table-wrap overflow-visible pb-0"
            onOpenMatchDetail={onOpenMatchDetail}
          />
        </div>
      </div>
      <section
        className="schedule-overview-bracket-section mx-auto mb-4"
        aria-labelledby="schedule-overview-bracket-heading"
      >
        <h2
          id="schedule-overview-bracket-heading"
          className="schedule-section-title border-x-2 border-t-2 border-neutral-900 bg-white py-1 text-center text-sm font-black text-neutral-950"
        >
          월드컵 16강 이후 토너먼트표
        </h2>
        <div className="schedule-overview-bracket-shell border-x-2 border-b-2 border-neutral-900 bg-white px-2 py-2">
          <TournamentOverviewBracket
            sections={sections}
            currentTime={currentTime}
            nextMatchId={nextMatchId}
            selectedMatchId={selectedTournamentMatchId}
            onSelectMatch={(match) => setSelectedTournamentMatchId(match.id)}
            onOpenMatchDetail={onOpenMatchDetail}
          />
        </div>
      </section>
    </div>
  );
}
