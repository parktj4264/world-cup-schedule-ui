type ScheduleControlsProps = {
  onCopyShareLink: () => void;
  onShowKorea: () => void;
};

const buttonClassName =
  'border border-neutral-700 bg-white px-2 py-1 text-xs font-black leading-none text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';

export function ScheduleControls({
  onCopyShareLink,
  onShowKorea,
}: ScheduleControlsProps) {
  return (
    <div className="schedule-controls mx-auto flex w-full max-w-[980px] flex-wrap items-center gap-1 py-1">
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className={buttonClassName} onClick={onShowKorea}>
          한국 경기
        </button>
        <button type="button" className={buttonClassName} onClick={onCopyShareLink}>
          공유 링크 복사
        </button>
      </div>
    </div>
  );
}
