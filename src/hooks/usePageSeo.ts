import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
}

export function usePageSeo({ title, description, canonicalPath }: SeoProps) {
  useEffect(() => {
    // 1. Update Title
    const fullTitle = title.includes('kolstream') ? title : `${title} – kolstream`;
    document.title = fullTitle;

    // 2. Update Meta Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);

      let twitterDesc = document.querySelector('meta[name="twitter:description"]');
      if (twitterDesc) twitterDesc.setAttribute('content', description);
    }

    // 3. Update OG Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', fullTitle);

    // 4. Update Canonical Link
    if (typeof window !== 'undefined') {
      const canonicalUrl = canonicalPath
        ? `${window.location.origin}${canonicalPath}`
        : `${window.location.origin}${window.location.pathname}`;

      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonicalUrl);

      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);
    }
  }, [title, description, canonicalPath]);
}
