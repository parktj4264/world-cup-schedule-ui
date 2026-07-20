import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveUpdateToast } from '../components/LiveUpdateToast';
import { MiniScheduleTable } from '../components/MiniScheduleTable';
import { MatchDetailModal } from '../components/MatchDetailModal';
import { ScheduleControls } from '../components/ScheduleControls';
import { StatusBar } from '../components/StatusBar';
import { TournamentSheets } from '../components/TournamentSheets';
import { TournamentClosingSummary } from '../components/TournamentClosingSummary';
import { WorkbookTabs, type WorkbookSheetId } from '../components/WorkbookTabs';
import { scheduleSections, type ScheduleSection } from '../data/schedule';
import { fetchBrowserLiveSchedule } from '../utils/browserLiveProvider';
import {
  mergeLiveSchedule,
  parseLiveSchedule,
  type LiveSchedule,
} from '../utils/liveSchedule';
import { flattenMatches, getKstDateKey, getLiveMatches, getMatchStartTime, getNextMatch } from '../utils/timeUtils';

const LIVE_SCHEDULE_URL = `${import.meta.env.BASE_URL}data/live-schedule.json`;
const LIVE_UPDATES_ENABLED = import.meta.env.VITE_LIVE_UPDATES_ENABLED === 'true';
const SHARE_TOAST_DURATION_MS = 2200;
const PAGE_JSON_REFRESH_MS = 5 * 60 * 1000;
const BROWSER_LIVE_ACTIVE_REFRESH_MS = 3 * 60 * 1000;
const BROWSER_LIVE_IDLE_REFRESH_MS = 30 * 60 * 1000;
const BROWSER_LIVE_ERROR_BACKOFF_MS = 10 * 60 * 1000;
const BROWSER_LIVE_WINDOW_BEFORE_MS = 30 * 60 * 1000;
const BROWSER_LIVE_WINDOW_AFTER_MS = 30 * 60 * 1000;

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

const countLiveQuality = (schedule: LiveSchedule | undefined) => {
  const matches = schedule?.matches ?? [];

  return {
    live: matches.filter((match) => match.status === 'live').length,
    finished: matches.filter((match) => match.status === 'finished').length,
    scored: matches.filter(
      (match) => typeof match.homeScore === 'number' || typeof match.awayScore === 'number',
    ).length,
  };
};

const shouldUseIncomingLiveSchedule = (
  incoming: LiveSchedule,
  current: LiveSchedule | undefined,
) => {
  const incomingQuality = countLiveQuality(incoming);
  const currentQuality = countLiveQuality(current);

  if (incomingQuality.live > 0) {
    return true;
  }

  if (incomingQuality.finished > currentQuality.finished || incomingQuality.scored > currentQuality.scored) {
    return true;
  }

  if (!current) {
    return true;
  }

  const incomingTime = new Date(incoming.sourceUpdatedAt ?? '').getTime();
  const currentTime = new Date(current.sourceUpdatedAt ?? '').getTime();
  const hasNoScoreDowngrade =
    incomingQuality.finished >= currentQuality.finished &&
    incomingQuality.scored >= currentQuality.scored;

  return (
    hasNoScoreDowngrade &&
    Number.isFinite(incomingTime) &&
    (!Number.isFinite(currentTime) || incomingTime >= currentTime)
  );
};

const isNearAnyMatchWindow = (sections: ScheduleSection[], now: Date) => {
  const nowTime = now.getTime();

  return sections.some((section) =>
    section.days.some((day) =>
      day.cells.some((scheduleCell) =>
        scheduleCell.matches.some((match) => {
          const startTime = getMatchStartTime(match);

          return (
            nowTime >= startTime - BROWSER_LIVE_WINDOW_BEFORE_MS &&
            nowTime <= startTime + 2 * 60 * 60 * 1000 + BROWSER_LIVE_WINDOW_AFTER_MS
          );
        }),
      ),
    ),
  );
};

export function SchedulePage() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [activeSheetId, setActiveSheetId] = useState<WorkbookSheetId>('all');
  const [liveSchedule, setLiveSchedule] = useState<LiveSchedule>();
  const [pageLiveUpdatedAt, setPageLiveUpdatedAt] = useState<string | null>(null);
  const [liveScheduleError, setLiveScheduleError] = useState(false);
  const [browserLiveUpdatedAt, setBrowserLiveUpdatedAt] = useState<string | null>(null);
  const [browserLiveError, setBrowserLiveError] = useState(false);
  const [browserLiveChecking, setBrowserLiveChecking] = useState(LIVE_UPDATES_ENABLED);
  const [manualLiveRefreshCount, setManualLiveRefreshCount] = useState(0);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const shareToastTimeoutRef = useRef<number | undefined>(undefined);
  const liveScheduleRef = useRef<LiveSchedule | undefined>(undefined);
  const hasCompletedInitialBrowserCheckRef = useRef(false);
  const pageLiveReloadRef = useRef<(() => void) | undefined>(undefined);
  const browserLiveRefreshRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    liveScheduleRef.current = liveSchedule;
  }, [liveSchedule]);

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
          if (
            LIVE_UPDATES_ENABLED &&
            !hasCompletedInitialBrowserCheckRef.current &&
            !liveScheduleRef.current
          ) {
            setLiveScheduleError(false);
            console.log(
              '[world-cup-schedule] page live schedule held until browser check',
              {
                source: parsed.source,
                sourceUpdatedAt: parsed.sourceUpdatedAt ?? 'unknown',
                matchCount: parsed.matches.length,
              },
            );
            return;
          }

          const currentSchedule = liveScheduleRef.current;
          const accepted = shouldUseIncomingLiveSchedule(parsed, currentSchedule);
          const nextSchedule = accepted ? parsed : currentSchedule;

          liveScheduleRef.current = nextSchedule;
          setLiveSchedule(nextSchedule);

          if (accepted) {
            setPageLiveUpdatedAt(parsed.sourceUpdatedAt);
          }

          setLiveScheduleError(false);
          console.log(
            '[world-cup-schedule] live schedule loaded',
            {
              source: parsed.source,
              sourceUpdatedAt: parsed.sourceUpdatedAt ?? 'unknown',
              matchCount: parsed.matches.length,
              accepted,
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

    pageLiveReloadRef.current = loadLiveSchedule;
    loadLiveSchedule();
    const intervalId = LIVE_UPDATES_ENABLED
      ? window.setInterval(loadLiveSchedule, PAGE_JSON_REFRESH_MS)
      : undefined;

    return () => {
      pageLiveReloadRef.current = undefined;
      controller.abort();
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    if (!LIVE_UPDATES_ENABLED) {
      hasCompletedInitialBrowserCheckRef.current = true;
      setBrowserLiveChecking(false);
      return undefined;
    }

    let timeoutId: number | undefined;
    let stopped = false;
    let inFlight = false;
    let lastHadError = false;
    const controller = new AbortController();

    const scheduleNextBrowserCheck = (delayMs: number) => {
      if (stopped) {
        return;
      }

      timeoutId = window.setTimeout(checkBrowserLiveSchedule, delayMs);
    };

    const getNextDelay = () => {
      if (lastHadError) {
        return BROWSER_LIVE_ERROR_BACKOFF_MS;
      }

      return isNearAnyMatchWindow(scheduleSections, new Date())
        ? BROWSER_LIVE_ACTIVE_REFRESH_MS
        : BROWSER_LIVE_IDLE_REFRESH_MS;
    };

    async function checkBrowserLiveSchedule() {
      if (stopped) {
        return;
      }

      if (document.hidden) {
        scheduleNextBrowserCheck(BROWSER_LIVE_IDLE_REFRESH_MS);
        return;
      }

      if (inFlight) {
        scheduleNextBrowserCheck(BROWSER_LIVE_ACTIVE_REFRESH_MS);
        return;
      }

      inFlight = true;
      setBrowserLiveChecking(true);

      try {
        const parsed = await fetchBrowserLiveSchedule(controller.signal);

        if (stopped) {
          return;
        }

        const accepted = shouldUseIncomingLiveSchedule(parsed, liveScheduleRef.current);

        if (accepted) {
          liveScheduleRef.current = parsed;
          setLiveSchedule(parsed);
          setBrowserLiveUpdatedAt(parsed.sourceUpdatedAt);
        }

        setBrowserLiveError(false);
        lastHadError = false;
        console.log(
          '[world-cup-schedule] browser live schedule checked',
          {
            source: parsed.source,
            sourceUpdatedAt: parsed.sourceUpdatedAt ?? 'unknown',
            matchCount: parsed.matches.length,
            accepted,
          },
        );
      } catch (error) {
        if (!controller.signal.aborted && !stopped) {
          setBrowserLiveError(true);
          lastHadError = true;
          console.warn('[world-cup-schedule] browser live schedule failed', error);
        }
      } finally {
        inFlight = false;

        if (!stopped) {
          hasCompletedInitialBrowserCheckRef.current = true;
          setBrowserLiveChecking(false);

          if (!liveScheduleRef.current) {
            pageLiveReloadRef.current?.();
          }
        }

        if (!stopped) {
          scheduleNextBrowserCheck(getNextDelay());
        }
      }
    }

    checkBrowserLiveSchedule();

    const handleVisibilityChange = () => {
      if (!document.hidden && !inFlight) {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }

        checkBrowserLiveSchedule();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    browserLiveRefreshRef.current = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      checkBrowserLiveSchedule();
    };

    return () => {
      stopped = true;
      controller.abort();
      browserLiveRefreshRef.current = undefined;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const todayKey = getKstDateKey(currentTime);
  const visibleSections = useMemo(
    () => mergeLiveSchedule(scheduleSections, liveSchedule),
    [liveSchedule],
  );
  const nextMatch = useMemo(() => getNextMatch(visibleSections, currentTime), [currentTime, visibleSections]);
  const liveMatches = useMemo(() => getLiveMatches(visibleSections, currentTime), [currentTime, visibleSections]);
  const visibleMatches = useMemo(() => flattenMatches(visibleSections), [visibleSections]);
  const completedMatchCount = useMemo(
    () => visibleMatches.filter((match) => match.status === 'finished').length,
    [visibleMatches],
  );
  const completedFinalMatch = useMemo(
    () => visibleMatches.find(
      (match) =>
        match.stage === 'final' &&
        match.status === 'finished' &&
        (match.winner === 'home' || match.winner === 'away'),
    ),
    [visibleMatches],
  );
  const selectedMatch = useMemo(
    () => selectedMatchId
      ? visibleMatches.find((match) => match.id === selectedMatchId)
      : undefined,
    [selectedMatchId, visibleMatches],
  );

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

  const handleRefreshLiveSchedule = useCallback(() => {
    const refresh = browserLiveRefreshRef.current;

    if (!refresh) {
      return;
    }

    setManualLiveRefreshCount((count) => count + 1);
    refresh();
  }, []);

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
      {LIVE_UPDATES_ENABLED ? (
        <LiveUpdateToast
          isChecking={browserLiveChecking}
          hasError={browserLiveError}
          updatedAt={browserLiveUpdatedAt}
          refreshToken={manualLiveRefreshCount}
        />
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
          archiveMode={!LIVE_UPDATES_ENABLED}
          archiveLoaded={Boolean(liveSchedule)}
          totalMatchCount={visibleMatches.length}
          completedMatchCount={completedMatchCount}
          currentTime={currentTime}
          nextMatch={nextMatch}
          liveMatches={liveMatches}
          liveScheduleUpdatedAt={pageLiveUpdatedAt}
          liveScheduleError={liveScheduleError}
          browserLiveUpdatedAt={browserLiveUpdatedAt}
          browserLiveError={browserLiveError}
          browserLiveChecking={browserLiveChecking}
          onRefreshLiveSchedule={handleRefreshLiveSchedule}
        />
        {!LIVE_UPDATES_ENABLED && completedFinalMatch ? (
          <TournamentClosingSummary finalMatch={completedFinalMatch} />
        ) : null}
        <ScheduleControls
          onCopyShareLink={handleCopyShareLink}
        />
        <WorkbookTabs activeSheetId={activeSheetId} onSheetChange={setActiveSheetId} />
        {activeSheetId === 'all' ? (
          <MiniScheduleTable
            sections={visibleSections}
            currentTime={currentTime}
            nextMatchId={nextMatch?.id}
            todayKey={todayKey}
            onOpenMatchDetail={(match) => setSelectedMatchId(match.id)}
          />
        ) : null}
        {activeSheetId !== 'all' ? (
          <TournamentSheets
            sections={visibleSections}
            currentTime={currentTime}
            activeTabId={activeSheetId}
            onOpenMatchDetail={(match) => setSelectedMatchId(match.id)}
          />
        ) : null}
        {selectedMatch ? (
          <MatchDetailModal
            match={selectedMatch}
            currentTime={currentTime}
            onClose={() => setSelectedMatchId(null)}
          />
        ) : null}
      </div>
    </main>
  );
}
