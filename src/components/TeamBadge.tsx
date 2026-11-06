import React, { useState } from 'react';
import { getTeamLogoSvg } from '../utils/teamLogos';

interface TeamBadgeProps {
  name: string;
  logo?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean;
}

const SIZE_CLASSES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14'
};

const TEXT_CLASSES = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base'
};

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  name,
  logo,
  className = '',
  size = 'md',
  priority = false
}) => {
  const [imgError, setImgError] = useState(false);
  const svgFallback = getTeamLogoSvg(name);

  // Use primary logo if provided and hasn't errored; otherwise use our authentic SVG vector badge
  const activeSrc = !imgError && logo ? logo : svgFallback;

  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const textCls = TEXT_CLASSES[size] || TEXT_CLASSES.md;

  if (activeSrc) {
    return (
      <img
        src={activeSrc}
        alt={name}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setImgError(true)}
        className={`${sizeCls} object-contain shrink-0 drop-shadow-sm ${className}`}
      />
    );
  }

  // Graceful fallback with clean team initials box in brand styling
  const initials = name ? name.trim().slice(0, 2) : 'FC';

  return (
    <div
      className={`${sizeCls} bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center font-black text-[var(--accent-primary)] font-display-num shrink-0 rounded-[2px] ${textCls} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};
