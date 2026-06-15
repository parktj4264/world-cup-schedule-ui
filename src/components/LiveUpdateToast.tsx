import { useEffect, useRef, useState } from 'react';

type LiveUpdateToastProps = {
  isChecking: boolean;
  hasError: boolean;
  updatedAt?: string | null;
};

type ToastState = 'checking' | 'done' | 'error';

const DONE_TOAST_DURATION_MS = 1600;
const ERROR_TOAST_DURATION_MS = 2800;

export function LiveUpdateToast({ isChecking, hasError, updatedAt }: LiveUpdateToastProps) {
  const [toastState, setToastState] = useState<ToastState | null>(() => (isChecking ? 'checking' : null));
  const toastStateRef = useRef<ToastState | null>(toastState);
  const hasShownInitialCheckRef = useRef(isChecking);
  const wasCheckingRef = useRef(isChecking);
  const hideTimeoutRef = useRef<number | undefined>(undefined);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }
  };

  const showToast = (nextState: ToastState | null, durationMs?: number) => {
    clearHideTimeout();
    toastStateRef.current = nextState;
    setToastState(nextState);

    if (nextState && durationMs) {
      hideTimeoutRef.current = window.setTimeout(() => {
        toastStateRef.current = null;
        setToastState(null);
      }, durationMs);
    }
  };

  useEffect(() => () => {
    clearHideTimeout();
  }, []);

  useEffect(() => {
    if (hasError) {
      showToast('error', ERROR_TOAST_DURATION_MS);
      wasCheckingRef.current = isChecking;
      return;
    }

    if (isChecking && !hasShownInitialCheckRef.current) {
      hasShownInitialCheckRef.current = true;
      showToast('checking');
      wasCheckingRef.current = true;
      return;
    }

    if (wasCheckingRef.current && !isChecking && toastStateRef.current === 'checking') {
      showToast('done', DONE_TOAST_DURATION_MS);
    }

    wasCheckingRef.current = isChecking;
  }, [hasError, isChecking, updatedAt]);

  if (!toastState) {
    return null;
  }

  const isError = toastState === 'error';
  const isDone = toastState === 'done';

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'live-update-toast pointer-events-none fixed left-1/2 top-14 z-40 -translate-x-1/2 border-2 bg-white px-4 py-2 text-[12px] font-black text-neutral-950',
        isError ? 'border-red-700' : isDone ? 'border-green-700' : 'border-blue-800',
      ].join(' ')}
    >
      <span className="inline-flex items-center whitespace-nowrap">
        {toastState === 'checking' ? '최신 경기 스코어 정보를 확인하고 있어요' : null}
        {toastState === 'done' ? '최신 정보 확인 완료' : null}
        {toastState === 'error' ? '기존 정보를 유지합니다' : null}
      </span>
    </div>
  );
}
