import { useEffect, useRef, useState } from 'react';
import type { Match, ScheduleSection } from '../data/schedule';
import { BASE_TABLE_WIDTH, ScheduleTable } from './ScheduleTable';
import { TournamentOverviewBracket } from './TournamentOverviewBracket';

type MiniScheduleTableProps = {
  sections: ScheduleSection[];
  currentTime: Date;
  nextMatchId?: string;
  todayKey?: string;
  onOpenMatchDetail?: (match: Match) => void;
};

const getOverviewScale = (containerWidth: number) =>
  Math.min(1, Math.max(0.32, containerWidth / BASE_TABLE_WIDTH));

const getOverviewHeadingLayout = (containerWidth: number) =>
  containerWidth <= 640
    ? { fontSize: 14, gap: 5, marginBottom: 7 }
    : { fontSize: 20, gap: 8, marginBottom: 10 };

export function MiniScheduleTable({
  sections,
  currentTime,
  nextMatchId,
  todayKey,
  onOpenMatchDetail,
}: MiniScheduleTableProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [baseHeight, setBaseHeight] = useState(1118);
  const [headingLayout, setHeadingLayout] = useState(() => getOverviewHeadingLayout(BASE_TABLE_WIDTH));
  const [selectedTournamentMatchId, setSelectedTournamentMatchId] = useState<string | null>(null);
  const sectionHeadingStyle = {
    fontSize: `${headingLayout.fontSize / scale}px`,
    gap: `${headingLayout.gap / scale}px`,
    marginBottom: `${headingLayout.marginBottom / scale}px`,
  };

  useEffect(() => {
    const updateLayout = () => {
      const width = wrapperRef.current?.clientWidth ?? BASE_TABLE_WIDTH;
      setScale(getOverviewScale(width));
      setHeadingLayout(getOverviewHeadingLayout(width));
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);

    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  useEffect(() => {
    setBaseHeight(contentRef.current?.offsetHeight ?? 1118);
  }, [headingLayout, scale, sections]);

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
            selectedMatchId={selectedTournamentMatchId}
            todayKey={todayKey}
            className="mini-overview-table-wrap overflow-visible pb-0"
            sectionHeadingStyle={sectionHeadingStyle}
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
          className="schedule-overview-heading"
        >
          <span aria-hidden="true">□</span>
          월드컵 16강 이후 토너먼트표
        </h2>
        <div className="schedule-overview-bracket-shell bg-white px-2 py-2">
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
