import { useEffect } from 'react';

export function useSEO({ title, description, canonical }) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // OG tags
    const setOG = (prop, val) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (el) el.content = val;
    };
    setOG('og:title', title);
    setOG('og:description', description);
    if (canonical) setOG('og:url', canonical);
  }, [title, description, canonical]);
}
