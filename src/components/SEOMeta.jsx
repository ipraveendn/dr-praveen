/**
 * SEO Meta Component
 * 
 * Reusable React component for adding complete SEO metadata to pages.
 * Includes: title, description, OpenGraph, Twitter cards, canonical URLs, noindex.
 * 
 * Usage:
 * import SEOMeta from '@/components/SEOMeta'
 * 
 * <SEOMeta 
 *   pageKey="home"
 *   title="Optional override"
 *   description="Optional override"
 *   image="Optional image URL"
 * />
 */

import { Helmet } from 'react-helmet-async'
import {
  generatePageSEO,
  generateOpenGraphTags,
  generateTwitterCardTags,
  generateStructuredData,
  SITE_URL,
} from '../utils/seoConfig'

export default function SEOMeta({
  pageKey,
  title,
  description,
  image,
  keywords,
  canonical,
  path,
  structuredData = 'LocalBusiness',
  children,
}) {
  // Generate base SEO data
  const seo = generatePageSEO(pageKey, {
    title,
    description,
    image,
    keywords,
    canonical,
    path,
  })

  // Generate OpenGraph tags
  const ogTags = generateOpenGraphTags(seo)

  // Generate Twitter Card tags
  const twitterTags = generateTwitterCardTags(seo)

  // Generate structured data
  const schema = generateStructuredData(structuredData)

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords && <meta name="keywords" content={seo.keywords} />}
      <link rel="canonical" href={seo.canonical} />
      
      {/* Noindex if needed (for protected pages) */}
      {seo.noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* OpenGraph Tags */}
      {Object.entries(ogTags).map(([key, value]) => (
        <meta key={key} property={key} content={value} />
      ))}
      
      {/* Twitter Card Tags */}
      {Object.entries(twitterTags).map(([key, value]) => (
        <meta key={key} name={key} content={value} />
      ))}
      
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#0B7B6F" />
      <meta name="msapplication-TileColor" content="#0B7B6F" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>

      {/* Additional children (custom scripts, meta tags, etc.) */}
      {children}
    </Helmet>
  )
}
