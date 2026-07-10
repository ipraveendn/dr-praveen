import { useState } from 'react'
import { Helmet } from 'react-helmet-async'

export default function Pharmacy() {
  const [prescription, setPrescription] = useState(null)
  const [details, setDetails] = useState('')
  const [requestStatus, setRequestStatus] = useState('')
  const [requestError, setRequestError] = useState('')

  return (
    <>
      <Helmet>
        <title>Pharmacy | Dr. Praveen Ramachandra</title>
      </Helmet>

      <div style={{ paddingTop: '72px' }}>
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg,#0A1628,#0F2040)',
          padding: '80px 5%',
          textAlign: 'center'
        }}>
          <div className="section-tag" style={{ justifyContent: 'center', color: '#0FA898' }}>
            PHARMACY SERVICE
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 'clamp(36px,5vw,60px)',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '16px'
          }}>
            Pharmacy
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '15px',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: '1.7'
          }}>
            Upload your prescription or request medication customization, and our pharmacy team will arrange home delivery of your medicines.
          </p>
        </div>

        {/* MAIN CONTENT */}
        <section style={{ padding: '60px 5%', background: '#fff' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{
              background: 'linear-gradient(135deg, #F8FAFA 0%, #FFFFFF 100%)',
              border: '1px solid #E2EEEC',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 10px 30px rgba(10, 22, 40, 0.05)'
            }}>
              <div style={{ maxWidth: '760px', marginBottom: '32px' }}>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: '32px',
                  marginBottom: '14px',
                  color: '#0A1628'
                }}>
                  Reliable pharmacy service for your home
                </h2>
                <p style={{
                  color: '#64748B',
                  lineHeight: '1.8',
                  fontSize: '15px',
                  margin: 0
                }}>
                  Upload your prescription or request medication customization. Our team will review your request and arrange delivery of your medicines to your home with care and discretion.
                </p>
              </div>

              <div className="pharmacy-grid" style={{
                display: 'grid',
                gap: '24px',
                alignItems: 'stretch'
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '20px',
                  border: '1px solid #E2EEEC',
                  padding: '28px'
                }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#0A1628', fontWeight: '700' }}>
                    Upload prescription
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.75', marginBottom: '18px' }}>
                    Send a clear photo or PDF of your prescription and we will help prepare your medicine request for home delivery.
                  </p>
                  <input
                    type="file"
                    id="prescription-upload"
                    accept="image/*,.pdf"
                    onChange={(e) => setPrescription(e.target.files[0]?.name || null)}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="prescription-upload" style={{
                    display: 'inline-block',
                    background: '#0B7B6F',
                    color: '#fff',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}>
                    Upload prescription
                  </label>
                  {prescription && (
                    <div style={{
                      marginTop: '16px',
                      color: '#0A1628',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      Selected file: {prescription}
                    </div>
                  )}
                </div>

                <div style={{
                  background: '#fff',
                  borderRadius: '20px',
                  border: '1px solid #E2EEEC',
                  padding: '28px'
                }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#0A1628', fontWeight: '700' }}>
                    Enter your details below
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.75', marginBottom: '18px' }}>
                    Name, phone number and any additional information for our pharmacy team.
                  </p>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Enter your details below (name, phone number)"
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '14px',
                      border: '1px solid #E2EEEC',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      color: '#0A1628',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ color: '#64748B', fontSize: '14px' }}>
                  Home delivery • Fast delivery • Same-day availability • Online and cash payment
                </div>
                <button
                  onClick={() => {
                    setRequestError('')
                    if (!prescription && !details.trim()) {
                      setRequestError('Please upload a prescription or provide your contact details.')
                      setRequestStatus('')
                      return
                    }
                    setRequestStatus('Your request has been submitted. Our pharmacy team will contact you soon to arrange home delivery.')
                  }}
                  style={{
                    background: '#0B7B6F',
                    color: '#fff',
                    border: 'none',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Submit request
                </button>
              </div>

              {requestError && (
                <div style={{ marginTop: '16px', color: '#B91C1C', fontSize: '14px' }}>
                  {requestError}
                </div>
              )}

              {requestStatus && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '12px',
                  color: '#0B7B6F',
                  fontSize: '14px'
                }}>
                  {requestStatus}
                </div>
              )}
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

        {/* BENEFITS SECTION */}
        <section style={{ padding: '60px 5%', background: '#F8FAFA' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '48px',
              color: '#0A1628'
            }}>
              Why Choose Our <em style={{ color: '#0B7B6F' }}>Pharmacy</em>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              {[
                { title: 'Verified medicines', desc: 'All medicines are verified and genuine.' },
                { title: 'Doctor approved', desc: 'Prescriptions reviewed by our medical team.' },
                { title: 'Fast delivery', desc: 'Same-day and express delivery options available.' },
                { title: 'Secure payment', desc: 'Multiple secure payment options supported.' },
                { title: 'Privacy protected', desc: 'Your medical data is handled with confidence.' },
                { title: 'Reliable support', desc: 'Pharmacy support is available for any questions.' },
              ].map((benefit, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '28px',
                  border: '1px solid #E2EEEC',
                  transition: 'all 0.3s'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628', marginBottom: '12px' }}>
                    {benefit.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
