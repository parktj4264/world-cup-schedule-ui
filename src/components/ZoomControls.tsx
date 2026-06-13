type ZoomControlsProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToWidth: () => void;
};

const buttonClassName =
  'border border-neutral-700 bg-white px-2 py-1 text-xs font-black leading-none text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToWidth,
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-1" aria-label="표 확대 축소">
      <button type="button" className={buttonClassName} onClick={onZoomOut} aria-label="축소">
        -
      </button>
      <button type="button" className={`${buttonClassName} min-w-14`} onClick={onResetZoom}>
        {zoom}%
      </button>
      <button type="button" className={buttonClassName} onClick={onZoomIn} aria-label="확대">
        +
      </button>
      <button type="button" className={buttonClassName} onClick={onFitToWidth}>
        전체 보기
      </button>
    </div>
  );
}
