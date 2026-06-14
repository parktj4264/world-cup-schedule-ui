import { useEffect, useState } from 'react';
import { getTeamFlagSrc } from '../utils/flagAssets';

type FlagIconProps = {
  teamName: string;
  fallback?: string;
  className?: string;
};

export function FlagIcon({ teamName, fallback, className = '' }: FlagIconProps) {
  const flagSrc = getTeamFlagSrc(teamName);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [flagSrc]);

  if (flagSrc && !hasImageError) {
    return (
      <img
        src={flagSrc}
        alt={`${teamName} 국기`}
        className={['schedule-flag-icon', className].filter(Boolean).join(' ')}
        loading="lazy"
        decoding="async"
        onError={() => setHasImageError(true)}
      />
    );
  }

  if (!fallback) {
    return null;
  }

  return (
    <span className={['schedule-flag-emoji', className].filter(Boolean).join(' ')} aria-label={`${teamName} 국기`}>
      {fallback}
    </span>
  );
}
