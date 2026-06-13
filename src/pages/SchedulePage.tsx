import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FilterBar, type FilterMode } from '../components/FilterBar';
import { MiniScheduleTable } from '../components/MiniScheduleTable';
import { ScheduleControls } from '../components/ScheduleControls';
import { BASE_TABLE_WIDTH, ScheduleTable } from '../components/ScheduleTable';
import { StatusBar } from '../components/StatusBar';
import { scheduleSections, type Match, type ScheduleSection } from '../data/schedule';
import { getKstDateKey, getLiveMatches, getNextMatch } from '../utils/timeUtils';

const MIN_ZOOM = 70;
const MAX_ZOOM = 130;
const ZOOM_STEP = 10;
const ZOOM_STORAGE_KEY = 'world-cup-schedule-table-zoom';

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

const getInitialZoom = () => {
  if (typeof window === 'undefined') {
    return 100;
  }

  const storedZoom = Number(window.localStorage.getItem(ZOOM_STORAGE_KEY));

  return Number.isFinite(storedZoom) ? clampZoom(storedZoom) : 100;
};

const filterSections = (
  sections: ScheduleSection[],
  filter: FilterMode,
  todayKey: string,
): ScheduleSection[] =>
  sections.map((section) => {
    const days = section.days.filter((day) => {
        if (filter === 'today') {
          return day.date === todayKey;
        }

        return true;
      });

    return { ...section, days };
  });

const getCountryOptions = (sections: ScheduleSection[]) =>
  Array.from(
    new Set(
      sections.flatMap((section) =>
        section.days.flatMap((day) =>
          day.cells.flatMap((scheduleCell) =>
            scheduleCell.matches.flatMap((match: Match) => [match.home, match.away]),
          ),
        ),
      ),
    ),
  ).sort((firstCountry, secondCountry) => firstCountry.localeCompare(secondCountry, 'ko-KR'));

export function SchedulePage() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [zoom, setZoom] = useState(getInitialZoom);
  const [isMiniView, setIsMiniView] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ZOOM_STORAGE_KEY, String(zoom));
  }, [zoom]);

  const todayKey = getKstDateKey(currentTime);
  const nextMatch = useMemo(() => getNextMatch(scheduleSections, currentTime), [currentTime]);
  const liveMatches = useMemo(() => getLiveMatches(scheduleSections, currentTime), [currentTime]);
  const countryOptions = useMemo(() => getCountryOptions(scheduleSections), []);

  const visibleSections = useMemo(
    () => filterSections(scheduleSections, activeFilter, todayKey),
    [activeFilter, todayKey],
  );

  const setZoomValue = useCallback((nextZoom: number) => {
    setZoom(clampZoom(Math.round(nextZoom)));
  }, []);

  const scrollAfterRender = useCallback((selector: string) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(selector)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
      });
    });
  }, []);

  const handleGoToToday = useCallback(() => {
    setActiveFilter('all');
    scrollAfterRender(`[data-day-date="${todayKey}"]`);
  }, [scrollAfterRender, todayKey]);

  const handleGoToNextMatch = useCallback(() => {
    setActiveFilter('all');
    scrollAfterRender('.schedule-match-cell-next');
  }, [scrollAfterRender]);

  const handleShowKorea = useCallback(() => {
    setActiveFilter('all');
    setSelectedCountry('대한민국');
    scrollAfterRender('.schedule-match-cell-next, .schedule-korea-cell');
  }, [scrollAfterRender]);

  const handleFitToWidth = useCallback(() => {
    const visibleWidth = tableScrollRef.current?.clientWidth ?? BASE_TABLE_WIDTH;
    const nextZoom = Math.min(100, Math.floor((visibleWidth / BASE_TABLE_WIDTH) * 100));

    setZoomValue(nextZoom);
    tableScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [setZoomValue]);

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
        <ScheduleControls
          zoom={zoom}
          isMiniView={isMiniView}
          onGoToToday={handleGoToToday}
          onGoToNextMatch={handleGoToNextMatch}
          onShowKorea={handleShowKorea}
          onToggleMiniView={() => setIsMiniView((currentMode) => !currentMode)}
          onZoomIn={() => setZoomValue(zoom + ZOOM_STEP)}
          onZoomOut={() => setZoomValue(zoom - ZOOM_STEP)}
          onResetZoom={() => setZoomValue(100)}
          onFitToWidth={handleFitToWidth}
        />
        <FilterBar
          activeFilter={activeFilter}
          selectedCountry={selectedCountry}
          countryOptions={countryOptions}
          onFilterChange={setActiveFilter}
          onCountryChange={setSelectedCountry}
          onClearCountry={() => setSelectedCountry('')}
        />
        {isMiniView ? (
          <MiniScheduleTable
            sections={visibleSections}
            currentTime={currentTime}
            nextMatchId={nextMatch?.id}
            selectedCountry={selectedCountry}
          />
        ) : (
          <ScheduleTable
            sections={visibleSections}
            currentTime={currentTime}
            nextMatchId={nextMatch?.id}
            scrollContainerRef={tableScrollRef}
            zoom={zoom}
            selectedCountry={selectedCountry}
          />
        )}
      </div>
    </main>
  );
}
