import { useEffect, useMemo, useState } from 'react';
import { FilterBar, type FilterMode } from '../components/FilterBar';
import { ScheduleTable } from '../components/ScheduleTable';
import { StatusBar } from '../components/StatusBar';
import { scheduleSections, type ScheduleSection } from '../data/schedule';
import { getKstDateKey, getLiveMatches, getNextMatch } from '../utils/matchStatus';

const filterSections = (
  sections: ScheduleSection[],
  filter: FilterMode,
  todayKey: string,
): ScheduleSection[] =>
  sections.map((section) => {
    const days = section.days
      .map((day) => {
        const cells =
          filter === 'korea'
            ? day.cells.map((scheduleCell) => ({
                matches: scheduleCell.matches.filter((match) => match.isKorea),
              }))
            : day.cells;

        return { ...day, cells };
      })
      .filter((day) => {
        if (filter === 'today') {
          return day.date === todayKey;
        }

        if (filter === 'korea') {
          return day.cells.some((scheduleCell) => scheduleCell.matches.length > 0);
        }

        return true;
      });

    return { ...section, days };
  });

export function SchedulePage() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all');

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const todayKey = getKstDateKey(currentTime);
  const nextMatch = useMemo(() => getNextMatch(scheduleSections, currentTime), [currentTime]);
  const liveMatches = useMemo(() => getLiveMatches(scheduleSections, currentTime), [currentTime]);

  const visibleSections = useMemo(
    () => filterSections(scheduleSections, activeFilter, todayKey),
    [activeFilter, todayKey],
  );

  return (
    <main className="min-h-screen bg-white px-3 py-6 font-poster text-neutral-950">
      <div className="mx-auto w-full max-w-[1040px]">
        <header className="mx-auto w-full max-w-[980px]">
          <div className="h-[5px] bg-[#2f5365]" />
          <h1 className="px-2 py-3 text-center text-[26px] font-black leading-tight tracking-normal sm:text-[38px]">
            제23회 2026 북중미 월드컵 조별리그 일정
          </h1>
          <div className="h-[5px] bg-[#2f5365]" />
        </header>

        <StatusBar
          currentTime={currentTime}
          nextMatch={nextMatch}
          liveMatches={liveMatches}
        />
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <ScheduleTable
          sections={visibleSections}
          currentTime={currentTime}
          nextMatchId={nextMatch?.id}
        />
      </div>
    </main>
  );
}
