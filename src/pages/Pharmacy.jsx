import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../utils/api'
import SEOMeta from '../components/SEOMeta'
import { pharmacyCatalog } from '../data/medicines'
import { generateMedicineSlug } from '../utils/medicineSlug'

export default function Pharmacy() {
  const [prescriptionFile, setPrescriptionFile] = useState(null)
  const [details, setDetails] = useState('')
  const [requestStatus, setRequestStatus] = useState('')
  const [requestError, setRequestError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [medicineSearch, setMedicineSearch] = useState('')

  const filteredCatalog = pharmacyCatalog.map((category) => {
    const lowerQuery = medicineSearch.trim().toLowerCase()
    if (!lowerQuery) return category
    const filteredItems = category.items.filter((item) => {
      return item.name.toLowerCase().includes(lowerQuery) || item.details.toLowerCase().includes(lowerQuery)
    })
    return { ...category, items: filteredItems }
  }).filter((category) => category.items.length > 0)

  const handleSubmit = async () => {
    setRequestError('')
    if (!prescriptionFile && !details.trim()) {
      setRequestError('Please upload a prescription or enter your name and phone number.')
      setRequestStatus('')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      if (prescriptionFile) formData.append('prescription', prescriptionFile)
      if (details.trim()) formData.append('customization', details.trim())
      await apiRequest('/pharmacy/request', { method: 'POST', body: formData })
      setRequestStatus('Your request has been submitted. Our pharmacy team will contact you soon to arrange home delivery.')
      const input = document.getElementById('prescription-upload')
      if (input) input.value = ''
      setPrescriptionFile(null)
      setDetails('')
    } catch (error) {
      setRequestStatus('')
      setRequestError(error.message || 'Unable to submit your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SEOMeta pageKey="pharmacy" structuredData="MedicalBusiness" />
      <div style={{ paddingTop: '72px' }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg,#0A1628,#0F2040)', padding: '80px 5%', textAlign: 'center' }}>
          <div className="section-tag" style={{ justifyContent: 'center', color: '#0FA898' }}>PHARMACY SERVICE</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(36px,5vw,60px)', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Pharmacy</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', maxWidth: '640px', margin: '0 auto', lineHeight: '1.7' }}>
            Upload your prescription and share your contact details, and our pharmacy team will arrange home delivery of your medicines.
          </p>
        </div>

        {/* MAIN CONTENT */}
        <section style={{ padding: '60px 5%', background: '#fff' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #F8FAFA 0%, #FFFFFF 100%)', border: '1px solid #E2EEEC', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(10, 22, 40, 0.05)' }}>
              <div style={{ maxWidth: '760px', marginBottom: '32px' }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', marginBottom: '14px', color: '#0A1628' }}>Reliable pharmacy service for your home</h2>
                <p style={{ color: '#64748B', lineHeight: '1.8', fontSize: '15px', margin: 0 }}>
                  Upload your prescription and provide your contact details. Our team will review your request and arrange delivery of your medicines to your home with care and discretion.
                </p>
              </div>

              <div className="pharmacy-grid" style={{ display: 'grid', gap: '24px', alignItems: 'stretch' }}>
                <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2EEEC', padding: '28px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#0A1628', fontWeight: '700' }}>Upload prescription</h3>
                  <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.75', marginBottom: '18px' }}>
                    Send a clear photo or PDF of your prescription and we will help prepare your medicine request for home delivery.
                  </p>
                  <input type="file" id="prescription-upload" accept="image/*,.pdf" onChange={(e) => setPrescriptionFile(e.target.files[0] || null)} style={{ display: 'none' }} />
                  <label htmlFor="prescription-upload" style={{ display: 'inline-block', background: '#0B7B6F', color: '#fff', padding: '14px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Upload prescription</label>
                  {prescriptionFile && <div style={{ marginTop: '16px', color: '#0A1628', fontSize: '14px', lineHeight: '1.6' }}>Selected file: {prescriptionFile.name}</div>}
                </div>

                <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2EEEC', padding: '28px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#0A1628', fontWeight: '700' }}>Enter your details</h3>
                  <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={'Name:\nPhone number:'} style={{ width: '100%', minHeight: '120px', padding: '14px', border: '1px solid #E2EEEC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', color: '#0A1628', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ color: '#64748B', fontSize: '14px' }}>Home delivery • Fast delivery • Same-day availability • Online and cash payment</div>
                <button onClick={handleSubmit} disabled={submitting} style={{ background: '#0B7B6F', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit request'}
                </button>
              </div>

              {requestError && <div style={{ marginTop: '16px', color: '#B91C1C', fontSize: '14px' }}>{requestError}</div>}
              {requestStatus && <div style={{ marginTop: '16px', padding: '16px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', color: '#0B7B6F', fontSize: '14px' }}>{requestStatus}</div>}
            </div>
          </div>
        </section>

        <style>{`
          .pharmacy-grid { grid-template-columns: 1.1fr 0.9fr; }
          @media (max-width: 768px) {
            .pharmacy-grid { grid-template-columns: 1fr !important; gap: 16px; }
            .pharmacy-grid > div { padding: 20px !important; }
            .pharmacy-grid textarea { min-height: 140px !important; }
          }
        `}</style>

        {/* MEDICINE CATALOG SECTION */}
        <section style={{ padding: '70px 5%', background: '#F8FAFA' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <p style={{ color: '#0B7B6F', letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: '14px', margin: '0 0 12px' }}>Premium Pharmacy Catalog</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(40px, 4vw, 54px)', lineHeight: '1.05', color: '#0A1628', margin: '0 auto 18px', maxWidth: '760px' }}>
                Discover medicines, supplements, and therapy support products that meet every care need.
              </h2>
              <p style={{ textAlign: 'center', color: '#525962', maxWidth: '760px', margin: '0 auto', lineHeight: '1.8', fontSize: '16px' }}>
                Search by medicine name or ingredient and explore curated categories for patients seeking high-quality pharmacy delivery.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
              <div style={{ width: '100%', maxWidth: '640px' }}>
                <input type="search" value={medicineSearch} onChange={(e) => setMedicineSearch(e.target.value)} placeholder="Search medicines, ingredients, or categories..." style={{ width: '100%', padding: '18px 22px', borderRadius: '14px', border: '1px solid #D8E5E3', fontSize: '15px', color: '#0A1628', outline: 'none', boxShadow: '0 12px 30px rgba(11, 123, 111, 0.08)', background: '#fff' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {filteredCatalog.map((category, index) => (
                <div key={index} style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FCFB 100%)', borderRadius: '24px', border: '1px solid rgba(11, 123, 111, 0.12)', padding: '28px', boxShadow: '0 20px 50px rgba(11, 123, 111, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '22px', margin: 0, color: '#0A1628', letterSpacing: '-0.02em' }}>{category.title}</h3>
                      <div style={{ fontSize: '13px', color: '#567C73', marginTop: '8px' }}>{category.items.length} product{category.items.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ padding: '8px 14px', borderRadius: '999px', background: '#E9FFFA', color: '#0B7B6F', fontSize: '13px', fontWeight: 700 }}>{category.title.split(' ')[0]}</div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {category.items.map((item, itemIndex) => {
                      const medicineSlug = generateMedicineSlug(item.name)
                      return (
                        <li key={itemIndex} style={{ padding: '18px 0', borderBottom: itemIndex !== category.items.length - 1 ? '1px solid rgba(11, 123, 111, 0.08)' : 'none' }}>
                          <Link to={`/pharmacy/${medicineSlug}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ width: '10px', height: '10px', marginTop: '8px', borderRadius: '50%', background: '#0B7B6F', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628', marginBottom: '4px', transition: 'color 0.3s ease' }}>{item.name}</div>
                              <div style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5' }}>{item.details}</div>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
