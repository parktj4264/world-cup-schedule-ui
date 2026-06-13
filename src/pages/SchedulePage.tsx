import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilterBar } from '../components/FilterBar';
import { MiniScheduleTable } from '../components/MiniScheduleTable';
import { ScheduleControls } from '../components/ScheduleControls';
import { ScheduleTable } from '../components/ScheduleTable';
import { StatusBar } from '../components/StatusBar';
import { scheduleSections, type Match, type ScheduleSection } from '../data/schedule';
import { mergeLiveSchedule, parseLiveSchedule, type LiveSchedule } from '../utils/liveSchedule';
import { getKstDateKey, getLiveMatches, getNextMatch } from '../utils/timeUtils';

const DETAIL_VIEW_ZOOM = 70;
const LIVE_SCHEDULE_URL = `${import.meta.env.BASE_URL}data/live-schedule.json`;

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
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isMiniView, setIsMiniView] = useState(true);
  const [liveSchedule, setLiveSchedule] = useState<LiveSchedule>();
  const [liveScheduleError, setLiveScheduleError] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadLiveSchedule = async () => {
      try {
        const response = await fetch(`${LIVE_SCHEDULE_URL}?ts=${Date.now()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          setLiveScheduleError(response.status !== 404);
          return;
        }

        const parsed = parseLiveSchedule(await response.json());

        if (parsed) {
          setLiveSchedule(parsed);
          setLiveScheduleError(false);
        } else {
          setLiveScheduleError(true);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLiveScheduleError(true);
        }
      }
    };

    loadLiveSchedule();
    const intervalId = window.setInterval(loadLiveSchedule, 5 * 60 * 1000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  const todayKey = getKstDateKey(currentTime);
  const visibleSections = useMemo(
    () => mergeLiveSchedule(scheduleSections, liveSchedule),
    [liveSchedule],
  );
  const nextMatch = useMemo(() => getNextMatch(visibleSections, currentTime), [currentTime, visibleSections]);
  const liveMatches = useMemo(() => getLiveMatches(visibleSections, currentTime), [currentTime, visibleSections]);
  const countryOptions = useMemo(() => getCountryOptions(visibleSections), [visibleSections]);

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

  const handleShowKorea = useCallback(() => {
    setSelectedCountry('대한민국');
    scrollAfterRender('.schedule-korea-cell');
  }, [scrollAfterRender]);

  return (
    <main className="min-h-screen bg-white px-3 py-6 font-poster text-neutral-950">
      <div className="mx-auto w-full max-w-[1040px]">
        <header className="mx-auto w-full max-w-[980px]">
          <div className="h-[5px] bg-[#2f5365]" />
          <h1 className="px-2 py-3 text-center text-[26px] font-black leading-tight tracking-normal sm:text-[38px]">
            제23회 2026 북중미 월드컵 일정표
          </h1>
          <div className="h-[5px] bg-[#2f5365]" />
        </header>

        <StatusBar
          currentTime={currentTime}
          nextMatch={nextMatch}
          liveMatches={liveMatches}
          liveScheduleUpdatedAt={liveSchedule?.sourceUpdatedAt}
          liveScheduleError={liveScheduleError}
        />
        <ScheduleControls
          isMiniView={isMiniView}
          onShowKorea={handleShowKorea}
          onToggleMiniView={() => setIsMiniView((currentMode) => !currentMode)}
        />
        <FilterBar
          selectedCountry={selectedCountry}
          countryOptions={countryOptions}
          onCountryChange={setSelectedCountry}
          onClearCountry={() => setSelectedCountry('')}
        />
        {isMiniView ? (
          <MiniScheduleTable
            sections={visibleSections}
            currentTime={currentTime}
            nextMatchId={nextMatch?.id}
            selectedCountry={selectedCountry}
            todayKey={todayKey}
          />
        ) : (
          <ScheduleTable
            sections={visibleSections}
            currentTime={currentTime}
            nextMatchId={nextMatch?.id}
            zoom={DETAIL_VIEW_ZOOM}
            selectedCountry={selectedCountry}
            todayKey={todayKey}
          />
        )}
      </div>
    </main>
  );
}
