import { useEffect, useRef, useState } from 'react';
import type { Match, ScheduleSection } from '../data/schedule';
import { BASE_TABLE_WIDTH, ScheduleTable } from './ScheduleTable';

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
          className="mini-overview-scale origin-top-left"
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
    </div>
  );
}
