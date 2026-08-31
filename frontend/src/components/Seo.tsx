import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

function setMetaTag(selector: string, attributes: Record<string, string>, force = true) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      element?.setAttribute(key, value);
    });
    document.head.appendChild(element);
    return;
  }

  if (force) {
    Object.entries(attributes).forEach(([key, value]) => {
      element?.setAttribute(key, value);
    });
  }
}

export function Seo({
  title,
  description,
  path,
  noindex = false,
  ogTitle,
  ogDescription,
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const siteUrl = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
    const url = `${siteUrl}${path}`;

    document.title = title;

    const canonical = document.head.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', url);
    if (!canonical.parentNode) {
      document.head.appendChild(canonical);
    }

    setMetaTag('meta[name="description"]', { name: 'description', content: description });
    setMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow',
    });
    setMetaTag('meta[property="og:title"]', { property: 'og:title', content: ogTitle || title });
    setMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: ogDescription || description,
    });
    setMetaTag('meta[property="og:url"]', { property: 'og:url', content: url });
    setMetaTag('meta[property="twitter:title"]', { property: 'twitter:title', content: ogTitle || title });
    setMetaTag('meta[property="twitter:description"]', {
      property: 'twitter:description',
      content: ogDescription || description,
    });
    setMetaTag('meta[property="twitter:url"]', { property: 'twitter:url', content: url });

    if (structuredData) {
      let script = document.head.querySelector('script[data-seo-jsonld]') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', 'true');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    return () => {
      const robots = document.head.querySelector('meta[name="robots"]');
      if (robots) {
        robots.setAttribute('content', 'index, follow');
      }
    };
  }, [title, description, path, noindex, ogTitle, ogDescription, structuredData]);

  return null;
}
