import { ZoomControls } from './ZoomControls';

type ScheduleControlsProps = {
  zoom: number;
  isCaptureMode: boolean;
  isMiniView: boolean;
  onGoToToday: () => void;
  onGoToNextMatch: () => void;
  onShowKorea: () => void;
  onToggleMiniView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToWidth: () => void;
  onToggleCaptureMode: () => void;
};

const buttonClassName =
  'border border-neutral-700 bg-white px-2 py-1 text-xs font-black leading-none text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';

export function ScheduleControls({
  zoom,
  isCaptureMode,
  isMiniView,
  onGoToToday,
  onGoToNextMatch,
  onShowKorea,
  onToggleMiniView,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToWidth,
  onToggleCaptureMode,
}: ScheduleControlsProps) {
  return (
    <div className="schedule-controls mx-auto flex w-full max-w-[980px] flex-wrap items-center justify-between gap-2 py-1">
      <div className="flex flex-wrap items-center gap-1">
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
        <button type="button" className={buttonClassName} onClick={onToggleCaptureMode}>
          {isCaptureMode ? '캡처 모드 OFF' : '캡처 모드'}
        </button>
      </div>

      {isMiniView ? null : (
        <ZoomControls
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetZoom={onResetZoom}
          onFitToWidth={onFitToWidth}
        />
      )}
    </div>
  );
}
