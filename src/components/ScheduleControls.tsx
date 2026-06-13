type ScheduleControlsProps = {
  isMiniView: boolean;
  onShowKorea: () => void;
  onToggleMiniView: () => void;
};

const buttonClassName =
  'border border-neutral-700 bg-white px-2 py-1 text-xs font-black leading-none text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';

const viewButtonClassName =
  'border-2 border-neutral-900 bg-neutral-900 px-4 py-1.5 text-sm font-black leading-none text-white hover:bg-[#2f5365] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';

export function ScheduleControls({
  isMiniView,
  onShowKorea,
  onToggleMiniView,
}: ScheduleControlsProps) {
  return (
    <div className="schedule-controls mx-auto flex w-full max-w-[980px] flex-wrap items-center justify-between gap-1 py-1">
      <button type="button" className={buttonClassName} onClick={onShowKorea}>
        한국 경기
      </button>
      <button type="button" className={viewButtonClassName} onClick={onToggleMiniView}>
        {isMiniView ? '🔍 Zoom In' : '🔎 Zoom Out'}
      </button>
    </div>
  );
}
