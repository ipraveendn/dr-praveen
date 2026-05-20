/**
 * SEO Configuration & Utilities
 * 
 * Provides shared SEO metadata for all pages.
 * Includes dynamic metadata generation, OpenGraph, Twitter cards, structured data.
 */

const SITE_URL = import.meta.env.PROD 
  ? 'https://drpraveenramachandra.com'
  : 'http://localhost:5173'

const DOCTOR = {
  name: 'Dr. Praveen Ramachandra',
  tagline: 'Expert Endocrinologist & Hormone Specialist',
  phone: '+91 9845 067 222',
  email: 'drpraveendoctor@gmail.com',
  location: 'Yelahanka, Bengaluru',
  specialties: ['Diabetes', 'Thyroid', 'Hormones', 'PCOS', 'Obesity'],
}

/**
 * Page metadata configurations
 */
export const SEO_PAGES = {
  home: {
    title: `${DOCTOR.name} | Endocrinology Specialist Bengaluru`,
    description: `${DOCTOR.name} — Expert care for Diabetes, Thyroid, PCOS and Hormonal disorders in ${DOCTOR.location}. 15+ years experience.`,
    path: '/',
    image: `${SITE_URL}/og-home.png`,
    keywords: 'endocrinologist Yelahanka, diabetes doctor Bengaluru, thyroid specialist, PCOS treatment, hormonal disorders',
    type: 'website',
  },
  queue: {
    title: 'Book Appointment Online | Dr. Praveen Ramachandra',
    description: 'Book your consultation with Dr. Praveen. Real-time queue tracking, flexible clinic booking, instant confirmation. Available in Yelahanka.',
    path: '/queue',
    image: `${SITE_URL}/og-queue.png`,
    keywords: 'appointment booking Yelahanka, online doctor consultation, queue booking, Dr Praveen appointment',
    type: 'website',
  },
  track: {
    title: 'Track Your Appointment | Dr. Praveen Ramachandra',
    description: 'Track your appointment status in real-time. View queue position, waiting time, and consultation updates.',
    path: '/track',
    image: `${SITE_URL}/og-track.png`,
    keywords: 'appointment tracking, consultation status, queue position, real-time updates',
    type: 'website',
  },
  admin: {
    title: 'Admin Dashboard | Dr. Praveen Ramachandra',
    description: 'Receptionist dashboard for managing patient queue, appointments, and clinic operations.',
    path: '/admin',
    image: null,
    keywords: 'admin dashboard, patient management, queue management',
    type: 'website',
    noindex: true, // Don't index dashboard
  },
  doctor: {
    title: 'Doctor Dashboard | Dr. Praveen Ramachandra',
    description: 'Doctor consultation interface for managing patient appointments and consultations.',
    path: '/doctor',
    image: null,
    keywords: 'doctor dashboard, consultation management',
    type: 'website',
    noindex: true, // Don't index dashboard
  },
}

/**
 * Generate Helmet metadata for a page
 * @param {string} pageKey - Key from SEO_PAGES
 * @param {object} options - Override options
 * @returns {object} Helmet-compatible metadata
 */
export function generatePageSEO(pageKey, options = {}) {
  const page = SEO_PAGES[pageKey] || {}
  const title = options.title || page.title
  const description = options.description || page.description
  const url = `${SITE_URL}${options.path || page.path}`
  const image = options.image || page.image || `${SITE_URL}/og-default.png`
  
  return {
    title,
    description,
    url,
    image,
    keywords: options.keywords || page.keywords,
    noindex: options.noindex || page.noindex || false,
    canonical: options.canonical || url,
  }
}

/**
 * Generate OpenGraph meta tags
 * @param {object} seo - SEO metadata object from generatePageSEO
 * @returns {object} OpenGraph meta tag object
 */
export function generateOpenGraphTags(seo) {
  return {
    'og:title': seo.title,
    'og:description': seo.description,
    'og:url': seo.url,
    'og:type': seo.type || 'website',
    'og:image': seo.image,
    'og:site_name': `${DOCTOR.name} - Endocrinologist`,
    'og:locale': 'en_US',
  }
}

/**
 * Generate Twitter Card meta tags
 * @param {object} seo - SEO metadata object from generatePageSEO
 * @returns {object} Twitter Card meta tag object
 */
export function generateTwitterCardTags(seo) {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': seo.title,
    'twitter:description': seo.description,
    'twitter:image': seo.image,
    'twitter:site': '@DrPraveenMD',
    'twitter:creator': '@DrPraveenMD',
  }
}

/**
 * Render meta tags for Helmet
 * Converts plain objects to JSX meta elements
 * 
 * @param {object} tags - Meta tag key-value pairs
 * @returns {array} Array of meta objects for Helmet
 */
export function renderMetaTags(tags) {
  return Object.entries(tags).map(([property, content]) => ({
    property,
    content,
  }))
}

/**
 * Generate structured data (JSON-LD) for SEO
 * @param {string} type - Type of structured data (Organization, LocalBusiness, etc.)
 * @returns {object} Structured data object
 */
export function generateStructuredData(type = 'LocalBusiness') {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    name: DOCTOR.name,
    description: DOCTOR.tagline,
    url: SITE_URL,
    telephone: DOCTOR.phone,
    email: DOCTOR.email,
    image: `${SITE_URL}/og-home.png`,
    logo: `${SITE_URL}/logo.svg`,
    sameAs: [
      'https://www.facebook.com/drpraveenendocrinology',
      'https://www.instagram.com/drpraveenmd',
    ],
  }

  if (type === 'LocalBusiness') {
    return {
      ...baseData,
      '@type': 'LocalBusiness',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Yelahanka, Bengaluru',
        addressLocality: 'Bengaluru',
        addressRegion: 'KA',
        postalCode: '560064',
        addressCountry: 'IN',
      },
      areaServed: ['Yelahanka', 'Bengaluru', 'Karnataka'],
      priceRange: '₹500-₹2000',
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '18:00',
      },
    }
  }

  if (type === 'MedicalBusiness') {
    return {
      ...baseData,
      '@type': 'MedicalBusiness',
      medicalSpecialty: 'Endocrinology',
      knowsAbout: DOCTOR.specialties,
    }
  }

  return baseData
}

/**
 * Generate breadcrumb structured data
 * @param {array} breadcrumbs - Array of {name, url} objects
 * @returns {object} Breadcrumb structured data
 */
export function generateBreadcrumbs(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined,
    })),
  }
}

/**
 * Export all utilities for use in React components
 */
export default {
  SITE_URL,
  DOCTOR,
  SEO_PAGES,
  generatePageSEO,
  generateOpenGraphTags,
  generateTwitterCardTags,
  renderMetaTags,
  generateStructuredData,
  generateBreadcrumbs,
}
