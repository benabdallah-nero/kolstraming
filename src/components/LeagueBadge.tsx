import React, { useState } from 'react';
import { getLeagueBrand } from '../utils/leagueLogos';
import { Trophy } from 'lucide-react';

interface LeagueBadgeProps {
  competition?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export const LeagueBadge: React.FC<LeagueBadgeProps> = ({
  competition,
  size = 'sm',
  showName = false,
  className = ''
}) => {
  const brand = getLeagueBrand(competition);
  const [hasError, setHasError] = useState(false);

  const sizeDimensions = {
    xs: { img: 'w-4 h-4', box: 'w-4 h-4 text-[9px]' },
    sm: { img: 'w-5 h-5', box: 'w-5 h-5 text-[10px]' },
    md: { img: 'w-7 h-7', box: 'w-7 h-7 text-xs' },
    lg: { img: 'w-9 h-9', box: 'w-9 h-9 text-sm' }
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}>
      {brand && !hasError ? (
        <img
          src={brand.logoUri}
          alt={brand.name}
          className={`${sizeDimensions.img} object-contain shrink-0 drop-shadow-sm select-none transition-transform hover:scale-105`}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <div
          className={`${sizeDimensions.box} rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent-primary)] font-display-num font-bold shrink-0`}
          title={competition || 'بطولة'}
        >
          <Trophy className="w-3 h-3 text-[var(--accent-primary)]" />
        </div>
      )}

      {showName && (
        <span className="font-display-ar text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
          {brand?.name || competition}
        </span>
      )}
    </div>
  );
};
