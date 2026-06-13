import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FilterBar } from '../components/FilterBar';
import { MiniScheduleTable } from '../components/MiniScheduleTable';
import { ScheduleControls } from '../components/ScheduleControls';
import { ScheduleTable } from '../components/ScheduleTable';
import { StatusBar } from '../components/StatusBar';
import { scheduleSections, type Match, type ScheduleSection } from '../data/schedule';
import {
  isResolvedTeamName,
  mergeLiveSchedule,
  parseLiveSchedule,
  type LiveSchedule,
} from '../utils/liveSchedule';
import { getKstDateKey, getLiveMatches, getNextMatch } from '../utils/timeUtils';

const DETAIL_VIEW_ZOOM = 70;
const LIVE_SCHEDULE_URL = `${import.meta.env.BASE_URL}data/live-schedule.json`;
const SHARE_TOAST_DURATION_MS = 2200;

const getShareUrl = () => new URL(import.meta.env.BASE_URL, window.location.origin).href;

const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  try {
    const copied = document.execCommand('copy');

    if (!copied) {
      throw new Error('Copy command failed');
    }
  } finally {
    document.body.removeChild(textArea);
  }
};

const getCountryOptions = (sections: ScheduleSection[]) =>
  Array.from(
    new Set(
      sections.flatMap((section) =>
        section.days.flatMap((day) =>
          day.cells.flatMap((scheduleCell) =>
            scheduleCell.matches
              .flatMap((match: Match) => [match.home, match.away])
              .filter(isResolvedTeamName),
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
  const [shareMessage, setShareMessage] = useState('');
  const shareToastTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => () => {
    if (shareToastTimeoutRef.current) {
      window.clearTimeout(shareToastTimeoutRef.current);
    }
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
          console.log(
            '[world-cup-schedule] live schedule loaded',
            {
              source: parsed.source,
              sourceUpdatedAt: parsed.sourceUpdatedAt ?? 'unknown',
              matchCount: parsed.matches.length,
            },
          );
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

  const showShareMessage = useCallback((message: string) => {
    setShareMessage(message);

    if (shareToastTimeoutRef.current) {
      window.clearTimeout(shareToastTimeoutRef.current);
    }

    shareToastTimeoutRef.current = window.setTimeout(() => {
      setShareMessage('');
    }, SHARE_TOAST_DURATION_MS);
  }, []);

  const handleCopyShareLink = useCallback(async () => {
    try {
      await copyTextToClipboard(getShareUrl());
      showShareMessage('공유 링크 복사 완료');
    } catch {
      showShareMessage('복사 실패: 주소창 링크를 복사해 주세요');
    }
  }, [showShareMessage]);

  return (
    <main className="min-h-screen bg-white px-3 py-6 font-poster text-neutral-950">
      {shareMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-black text-neutral-950"
        >
          {shareMessage}
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-[1040px]">
        <header className="mx-auto w-full max-w-[980px]">
          <div className="h-[5px] bg-[#2f5365]" />
          <h1 className="whitespace-nowrap px-2 pt-3 text-center text-[24px] font-black leading-tight tracking-normal sm:text-[38px]">
            2026 월드컵 일정표
          </h1>
          <div className="pb-3 pt-1 text-right text-[10px] font-bold leading-none text-neutral-600 sm:text-[12px]">
            T.J. PARK · qkr4264@naver.com
          </div>
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
          onCopyShareLink={handleCopyShareLink}
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
