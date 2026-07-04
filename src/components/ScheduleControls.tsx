export type ScheduleViewMode = 'mini' | 'tournament-sheets';

type ScheduleControlsProps = {
  viewMode: ScheduleViewMode;
  onCopyShareLink: () => void;
  onShowKorea: () => void;
  onViewModeChange: (viewMode: ScheduleViewMode) => void;
};

const buttonClassName =
  'border border-neutral-700 bg-white px-2 py-1 text-xs font-black leading-none text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';

const viewButtonBaseClassName =
  'border-2 border-neutral-900 px-3 py-1.5 text-xs font-black leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:text-sm';

const viewOptions: { label: string; mode: ScheduleViewMode }[] = [
  { label: '전체 일정', mode: 'mini' },
  { label: '토너먼트 시트', mode: 'tournament-sheets' },
];

export function ScheduleControls({
  viewMode,
  onCopyShareLink,
  onShowKorea,
  onViewModeChange,
}: ScheduleControlsProps) {
  return (
    <div className="schedule-controls mx-auto flex w-full max-w-[980px] flex-wrap items-center justify-between gap-1 py-1">
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className={buttonClassName} onClick={onShowKorea}>
          한국 경기
        </button>
        <button type="button" className={buttonClassName} onClick={onCopyShareLink}>
          공유 링크 복사
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1">
        {viewOptions.map((option) => {
          const isActive = option.mode === viewMode;

          return (
            <button
              key={option.mode}
              type="button"
              className={[
                viewButtonBaseClassName,
                isActive
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-900 hover:bg-neutral-100',
              ].join(' ')}
              aria-pressed={isActive}
              onClick={() => onViewModeChange(option.mode)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
