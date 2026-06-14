import { useEffect } from 'react';
import type { Match } from '../data/schedule';
import { getMatchDetailStatusLabel, hasScore } from '../utils/matchDisplay';
import { formatKstDateTime } from '../utils/timeUtils';
import { FlagIcon } from './FlagIcon';

type MatchDetailModalProps = {
  match: Match;
  onClose: () => void;
};

const formatUpdatedAt = (updatedAt: string | undefined) => {
  if (!updatedAt) {
    return undefined;
  }

  const date = new Date(updatedAt);

  return Number.isFinite(date.getTime()) ? `${formatKstDateTime(date)} KST` : undefined;
};

const ScorerList = ({ title, scorers }: { title: string; scorers?: string[] }) => {
  if (!scorers || scorers.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="text-[11px] font-black text-neutral-600">{title}</div>
      <div className="mt-1 text-[13px] font-bold leading-snug text-neutral-950">
        {scorers.join(', ')}
      </div>
    </div>
  );
};

export function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const kickoffTime = `${formatKstDateTime(new Date(match.kickoff))} KST`;
  const updatedAt = formatUpdatedAt(match.sourceUpdatedAt);
  const hasScorers = Boolean(match.homeScorers?.length || match.awayScorers?.length);
  const isScorelessFinishedMatch = hasScore(match) && match.homeScore === 0 && match.awayScore === 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-3 py-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-detail-title"
        className="w-full max-w-[420px] border-2 border-neutral-900 bg-white p-4 font-poster text-neutral-950"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-2">
          <div>
            <div className="text-[11px] font-black text-neutral-600">
              {match.group} {match.round}
            </div>
            <h2 id="match-detail-title" className="mt-1 text-[18px] font-black leading-tight">
              경기 상세
            </h2>
          </div>
          <button
            type="button"
            className="border border-neutral-800 bg-white px-2 py-1 text-xs font-black leading-none text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <div className="py-3 text-center text-[16px] font-black leading-snug">
          <FlagIcon teamName={match.home} fallback={match.homeFlag} className="mr-1" />
          {match.home}
          {hasScore(match) ? <span className="mx-2">{match.homeScore}</span> : null}
          <span className="mx-1">:</span>
          {hasScore(match) ? <span className="mx-2">{match.awayScore}</span> : null}
          {match.away}
          <FlagIcon teamName={match.away} fallback={match.awayFlag} className="ml-1" />
        </div>

        <div className="grid grid-cols-[88px_1fr] gap-y-2 border-y border-neutral-300 py-3 text-[13px]">
          <div className="font-black text-neutral-600">상태</div>
          <div className="font-bold">{getMatchDetailStatusLabel(match)}</div>
          <div className="font-black text-neutral-600">경기 시간</div>
          <div className="font-bold">{kickoffTime}</div>
          {updatedAt ? (
            <>
              <div className="font-black text-neutral-600">최근 확인</div>
              <div className="font-bold">{updatedAt}</div>
            </>
          ) : null}
        </div>

        {hasScorers ? (
          <div className="grid gap-3 pt-3">
            <ScorerList title={match.home} scorers={match.homeScorers} />
            <ScorerList title={match.away} scorers={match.awayScorers} />
          </div>
        ) : isScorelessFinishedMatch ? (
          <div className="pt-3 text-[12px] font-bold text-neutral-600">득점자 정보 없음</div>
        ) : null}
      </section>
    </div>
  );
}
