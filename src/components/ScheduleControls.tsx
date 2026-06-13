type ScheduleControlsProps = {
  isMiniView: boolean;
  onGoToToday: () => void;
  onGoToNextMatch: () => void;
  onShowKorea: () => void;
  onToggleMiniView: () => void;
};

const buttonClassName =
  'border border-neutral-700 bg-white px-2 py-1 text-xs font-black leading-none text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';

export function ScheduleControls({
  isMiniView,
  onGoToToday,
  onGoToNextMatch,
  onShowKorea,
  onToggleMiniView,
}: ScheduleControlsProps) {
  return (
    <div className="schedule-controls mx-auto flex w-full max-w-[980px] flex-wrap items-center gap-1 py-1">
      <button type="button" className={buttonClassName} onClick={onGoToToday}>
        오늘로 이동
      </button>
      <button type="button" className={buttonClassName} onClick={onGoToNextMatch}>
        다음 경기로 이동
      </button>
      <button type="button" className={buttonClassName} onClick={onShowKorea}>
        한국 경기
      </button>
      <button type="button" className={buttonClassName} onClick={onToggleMiniView}>
        {isMiniView ? '자세히 보기' : '미니 보기'}
      </button>
    </div>
  );
}
