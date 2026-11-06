import React, { useState } from 'react';
import { getGeneratedTeamLogo, resolveTeamLogo } from '../utils/teamLogos';

interface TeamLogoProps {
  name: string;
  src?: string | null;
  className?: string;
  alt?: string;
}

/**
 * Renders a local SVG crest for the Saudi teams we ship artwork for, the
 * source logo when one exists, and a deterministic SVG initials badge as the
 * final fallback. Never shows a broken image or a random logo.
 */
export const TeamLogo: React.FC<TeamLogoProps> = ({ name, src, className = '', alt }) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolved = resolveTeamLogo(name, src);
  const finalSrc = failedSrc === resolved ? getGeneratedTeamLogo(name) : resolved;

  return (
    <img
      src={finalSrc}
      alt={alt ?? name}
      className={className}
      loading="lazy"
      onError={() => setFailedSrc(resolved)}
    />
  );
};
