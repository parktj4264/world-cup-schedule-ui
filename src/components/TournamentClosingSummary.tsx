import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Match } from '../data/schedule';
import {
  TOURNAMENT_AWARDS,
  TOURNAMENT_CREDIT_SOURCES,
} from '../data/tournamentCredits';
import { FlagIcon } from './FlagIcon';
import { TournamentStatisticsDialog } from './TournamentStatisticsDialog';

type TournamentClosingSummaryProps = {
  finalMatch: Match;
  matches: Match[];
};

const CELEBRATION_STORAGE_KEY = 'world-cup-2026-closing-celebration-seen-v1';
const CELEBRATION_DURATION_MS = 2_100;
let hasSeenCelebrationInMemory = false;

const CELEBRATION_PARTICLES = Array.from({ length: 24 }, (_, index) => ({
  left: `${5 + ((index * 37) % 91)}%`,
  delay: `${(index % 8) * 45}ms`,
  duration: `${1_300 + (index % 5) * 120}ms`,
  drift: `${((index % 7) - 3) * 18}px`,
  turn: `${180 + (index % 6) * 72}deg`,
}));

const TrophyIcon = ({ className = '' }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeLinecap="square"
    strokeLinejoin="miter"
    strokeWidth="1.7"
    viewBox="0 0 32 32"
  >
    <path d="M10 4h12v5c0 6-2.4 9-6 9s-6-3-6-9V4Z" />
    <path d="M10 7H5v2c0 4 2.1 6 6.2 6M22 7h5v2c0 4-2.1 6-6.2 6M16 18v5M11 28h10M13 23h6v5" />
  </svg>
);

const CelebrationOverlay = ({ runId }: { runId: number }) => (
  <div key={runId} className="champion-celebration" aria-hidden="true">
    {CELEBRATION_PARTICLES.map((particle, index) => (
      <span
        key={index}
        className="champion-celebration-particle"
        style={
          {
            '--particle-left': particle.left,
            '--particle-delay': particle.delay,
            '--particle-duration': particle.duration,
            '--particle-drift': particle.drift,
            '--particle-turn': particle.turn,
          } as CSSProperties
        }
      />
    ))}
  </div>
);

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

export function TournamentClosingSummary({ finalMatch, matches }: TournamentClosingSummaryProps) {
  const [openDialog, setOpenDialog] = useState<'awards' | 'statistics' | null>(null);
  const [isCelebrating, setCelebrating] = useState(false);
  const [celebrationRun, setCelebrationRun] = useState(0);
  const celebrationTimeoutRef = useRef<number | undefined>(undefined);
  const awardsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const statisticsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const modalDialogRef = useRef<HTMLElement | null>(null);
  const modalCloseRef = useRef<HTMLButtonElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const winnerSide = finalMatch.winner === 'home'
    ? 'home'
    : finalMatch.winner === 'away'
      ? 'away'
      : undefined;

  const startCelebration = useCallback(() => {
    if (prefersReducedMotion) {
      return;
    }

    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current);
    }

    setCelebrationRun((run) => run + 1);
    setCelebrating(true);
    celebrationTimeoutRef.current = window.setTimeout(() => {
      setCelebrating(false);
    }, CELEBRATION_DURATION_MS);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
      setCelebrating(false);
      return;
    }

    let hasSeenCelebration = hasSeenCelebrationInMemory;

    try {
      hasSeenCelebration = window.localStorage.getItem(CELEBRATION_STORAGE_KEY) === '1';
    } catch {
      // Fall back to the in-memory marker when storage is unavailable.
    }

    if (hasSeenCelebration) {
      return;
    }

    hasSeenCelebrationInMemory = true;

    try {
      window.localStorage.setItem(CELEBRATION_STORAGE_KEY, '1');
    } catch {
      // The in-memory marker still prevents repeated playback in this page session.
    }

    startCelebration();
  }, [finalMatch.id, prefersReducedMotion, startCelebration]);

  useEffect(() => () => {
    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!openDialog) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const fallbackTrigger = openDialog === 'awards'
      ? awardsTriggerRef.current
      : statisticsTriggerRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      && document.activeElement !== document.body
      ? document.activeElement
      : fallbackTrigger;
    const focusFrame = window.requestAnimationFrame(() => modalCloseRef.current?.focus());

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpenDialog(null);
        return;
      }

      if (event.key !== 'Tab' || !modalDialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        modalDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusableElements[0];
      const last = focusableElements.at(-1);

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [openDialog]);

  if (!winnerSide) {
    return null;
  }

  const champion = winnerSide === 'home' ? finalMatch.home : finalMatch.away;
  const championFlag = winnerSide === 'home' ? finalMatch.homeFlag : finalMatch.awayFlag;
  const scoreLabel = typeof finalMatch.homeScore === 'number' && typeof finalMatch.awayScore === 'number'
    ? `${finalMatch.home} ${finalMatch.homeScore}–${finalMatch.awayScore} ${finalMatch.away}`
    : `${finalMatch.home}–${finalMatch.away}`;

  return (
    <>
      {isCelebrating ? <CelebrationOverlay runId={celebrationRun} /> : null}
      <section
        className={[
          'tournament-closing-summary',
          isCelebrating ? 'tournament-closing-summary-celebrating' : '',
        ].filter(Boolean).join(' ')}
        aria-labelledby="tournament-champion-heading"
      >
        <div className="tournament-closing-trophy">
          <TrophyIcon className="tournament-closing-trophy-icon" />
        </div>
        <div className="tournament-closing-copy">
          <div className="tournament-closing-eyebrow">2026 WORLD CHAMPIONS</div>
          <h2 id="tournament-champion-heading" className="tournament-closing-title">
            <FlagIcon
              teamName={champion}
              fallback={championFlag}
              className="tournament-closing-flag"
            />
            <span>{champion} 우승</span>
          </h2>
          <div className="tournament-closing-score">결승 · {scoreLabel}</div>
        </div>
        <div className="tournament-closing-actions">
          <button
            ref={awardsTriggerRef}
            type="button"
            className="tournament-closing-button tournament-closing-button-primary"
            onClick={() => setOpenDialog('awards')}
          >
            수상자 보기
          </button>
          <button
            ref={statisticsTriggerRef}
            type="button"
            className="tournament-closing-button tournament-closing-button-primary"
            onClick={() => setOpenDialog('statistics')}
          >
            통계 보기
          </button>
          {!prefersReducedMotion ? (
            <button
              type="button"
              className="tournament-closing-button"
              onClick={startCelebration}
            >
              축하 다시보기
            </button>
          ) : null}
        </div>
      </section>

      {openDialog === 'awards' ? (
        <div
          className="tournament-awards-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpenDialog(null);
            }
          }}
        >
          <section
            ref={modalDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tournament-awards-heading"
            className="tournament-awards-dialog"
          >
            <header className="tournament-awards-header">
              <div>
                <div className="tournament-awards-eyebrow">2026 TOURNAMENT HONOURS</div>
                <h2 id="tournament-awards-heading" className="tournament-awards-title">
                  대회 수상자
                </h2>
              </div>
              <button
                ref={modalCloseRef}
                type="button"
                className="tournament-awards-close"
                onClick={() => setOpenDialog(null)}
              >
                닫기
              </button>
            </header>

            <div className="tournament-awards-grid">
              {TOURNAMENT_AWARDS.map((award) => (
                <article key={award.id} className="tournament-award-card">
                  <a
                    className="tournament-award-photo-link"
                    href={award.photoSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${award.recipient} 사진 원본과 라이선스 보기`}
                  >
                    <img
                      className="tournament-award-photo"
                      src={award.photoUrl}
                      alt={award.photoAlt}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </a>
                  <div className="tournament-award-content">
                    <div className="tournament-award-heading-row">
                      <TrophyIcon className="tournament-award-icon" />
                      <div>
                        <div className="tournament-award-label">{award.label}</div>
                        <div className="tournament-award-english-label">
                          {award.englishLabel}
                        </div>
                      </div>
                    </div>
                    <div className="tournament-award-recipient">{award.recipient}</div>
                    <div className="tournament-award-english-recipient">
                      {award.englishRecipient}
                    </div>
                    <div className="tournament-award-team">
                      <FlagIcon
                        teamName={award.team}
                        fallback={award.teamFlag}
                        className="tournament-award-flag"
                      />
                      <span>{award.team}</span>
                    </div>
                    <div className="tournament-award-detail">{award.detail}</div>
                  </div>
                </article>
              ))}
            </div>

            <footer className="tournament-awards-sources">
              <span>수상 정보 출처</span>
              {TOURNAMENT_CREDIT_SOURCES.map((source) => (
                <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              ))}
              <span className="tournament-awards-photo-credit-label">사진</span>
              {TOURNAMENT_AWARDS.map((award) => (
                <a
                  key={award.photoSourceUrl}
                  href={award.photoSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {award.englishRecipient} · {award.photoCredit} · {award.photoLicense}
                </a>
              ))}
            </footer>
          </section>
        </div>
      ) : null}

      {openDialog === 'statistics' ? (
        <TournamentStatisticsDialog
          matches={matches}
          dialogRef={modalDialogRef}
          closeRef={modalCloseRef}
          onClose={() => setOpenDialog(null)}
        />
      ) : null}
    </>
  );
}
