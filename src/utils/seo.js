import { Helmet } from 'react-helmet-async';

/**
 * SEOHead — renders react-helmet-async Helmet with unique page metadata.
 * Works with react-snap (pre-render) and JS crawlers (Google).
 */
export function SEOHead({ title, description, canonical }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical && <meta property="og:url" content={canonical} />}
    </Helmet>
  );
}

/** Backwards-compat hook — pages that called useSEO() as a hook now need
 *  to render the returned element: const seo = useSEO(...); return <>{seo}...</>
 *  New pages should use <SEOHead /> directly.
 */
export function useSEO(props) {
  return <SEOHead {...props} />;
}
