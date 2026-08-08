import { useParams, Link } from 'react-router-dom'
import { generateMedicineSlug, getMedicineBySlug, getAllMedicines } from '../utils/medicineSlug'
import { pharmacyCatalog } from '../data/medicines'
import SEOMeta from '../components/SEOMeta'
import { useEffect } from 'react'

export default function MedicineDetail() {
  const { slug } = useParams()
  const result = getMedicineBySlug(slug, pharmacyCatalog)
  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!result) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        paddingTop: '72px',
        padding: '72px 5% 0'
      }}>
        <div style={{ fontSize: '64px' }}>🔍</div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: '36px',
          color: '#0A1628'
        }}>
          Medicine not found
        </h2>
        <p style={{ color: '#64748B', marginBottom: '24px' }}>
          The medicine you're looking for doesn't exist or has been discontinued.
        </p>
        <Link to="/pharmacy" style={{
          display: 'inline-block',
          background: '#0B7B6F',
          color: '#fff',
          padding: '12px 28px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '700',
          fontSize: '14px'
        }}>
          Back to Pharmacy
        </Link>
      </div>
    )
  }

  const { medicine, category } = result
  const allMedicines = getAllMedicines(pharmacyCatalog)
  const medicineIndex = allMedicines.findIndex(m => m.slug === slug)
  const prevMedicine = medicineIndex > 0 ? allMedicines[medicineIndex - 1] : null
  const nextMedicine = medicineIndex < allMedicines.length - 1 ? allMedicines[medicineIndex + 1] : null

  // SEO Meta tags
  const pageTitle = `${medicine.name} | ${category} | Dr. Praveen's Pharmacy`
  const pageDescription = `${medicine.name} - ${medicine.details}. Available through Dr. Praveen Ramachandra's pharmacy service. Get home delivery of ${medicine.name}.`
  const canonicalUrl = `https://drpraveenramachandra.com/pharmacy/${slug}`

  return (
    <>
      <SEOMeta 
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={canonicalUrl}
      />
      
      {/* Structured Data - Product */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": medicine.name,
          "description": medicine.details,
          "category": category,
          "brand": {
            "@type": "Brand",
            "name": "Dr. Praveen Ramachandra Pharmacy"
          }
        })}
      </script>

      <div style={{ paddingTop: '72px' }}>
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg,#0A1628,#0F2040)',
          padding: '60px 5%',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{
              color: '#0FA898',
              fontSize: '13px',
              fontWeight: '700',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              {category}
            </div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '16px',
              margin: '0 0 16px'
            }}>
              {medicine.name}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '18px',
              margin: '0'
            }}>
              {medicine.details}
            </p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <section style={{ padding: '60px 5%', background: '#fff' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Medicine Details Card */}
            <div style={{
              background: 'linear-gradient(135deg, #F8FAFA 0%, #FFFFFF 100%)',
              border: '1px solid #E2EEEC',
              borderRadius: '24px',
              padding: '40px',
              marginBottom: '40px',
              boxShadow: '0 10px 30px rgba(10, 22, 40, 0.05)'
            }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '24px',
                  color: '#0A1628',
                  marginBottom: '12px',
                  fontWeight: '700'
                }}>
                  About {medicine.name}
                </h2>
                <p style={{
                  color: '#525962',
                  lineHeight: '1.8',
                  fontSize: '16px',
                  margin: '0'
                }}>
                  <strong>{medicine.name}</strong> is available through our pharmacy service. We provide reliable home delivery of this medicine as part of our comprehensive pharmacy solutions.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginTop: '32px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    color: '#0A1628',
                    marginBottom: '8px',
                    fontWeight: '700'
                  }}>
                    Product
                  </h3>
                  <p style={{
                    color: '#525962',
                    fontSize: '15px',
                    margin: '0',
                    lineHeight: '1.6'
                  }}>
                    {medicine.name}
                  </p>
                </div>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    color: '#0A1628',
                    marginBottom: '8px',
                    fontWeight: '700'
                  }}>
                    Composition
                  </h3>
                  <p style={{
                    color: '#525962',
                    fontSize: '15px',
                    margin: '0',
                    lineHeight: '1.6'
                  }}>
                    {medicine.details}
                  </p>
                </div>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    color: '#0A1628',
                    marginBottom: '8px',
                    fontWeight: '700'
                  }}>
                    Category
                  </h3>
                  <p style={{
                    color: '#525962',
                    fontSize: '15px',
                    margin: '0'
                  }}>
                    {category}
                  </p>
                </div>
              </div>

              <div style={{
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #E2EEEC'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  color: '#0A1628',
                  marginBottom: '12px',
                  fontWeight: '700'
                }}>
                  Request this medicine
                </h3>
                <p style={{
                  color: '#525962',
                  fontSize: '15px',
                  lineHeight: '1.8',
                  margin: '0 0 16px'
                }}>
                  Upload your prescription or provide your contact details, and our pharmacy team will arrange home delivery of {medicine.name}.
                </p>
                <Link to="/pharmacy" style={{
                  display: 'inline-block',
                  background: '#0B7B6F',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}>
                  Go to Pharmacy
                </Link>
              </div>
            </div>

            {/* Navigation */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: prevMedicine ? '1fr 1fr' : '1fr',
              gap: '16px',
              marginTop: '40px'
            }}>
              {prevMedicine && (
                <Link to={`/pharmacy/${prevMedicine.slug}`} style={{
                  display: 'block',
                  padding: '16px 20px',
                  background: '#F8FAFA',
                  border: '1px solid #E2EEEC',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#0A1628',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}>
                  ← {prevMedicine.name}
                </Link>
              )}
              {nextMedicine && (
                <Link to={`/pharmacy/${nextMedicine.slug}`} style={{
                  display: 'block',
                  padding: '16px 20px',
                  background: '#F8FAFA',
                  border: '1px solid #E2EEEC',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#0A1628',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  textAlign: 'right'
                }}>
                  {nextMedicine.name} →
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
