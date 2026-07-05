import { useState } from 'react'
import { Helmet } from 'react-helmet-async'

export default function Pharmacy() {
  const [prescription, setPrescription] = useState(null)
  const [notes, setNotes] = useState('')
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
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 0' }}>
              <div style={{
                background: '#F8FAFA',
                borderRadius: '24px',
                border: '1px solid #E2EEEC',
                padding: '40px'
              }}>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: '32px',
                  marginBottom: '16px',
                  color: '#0A1628'
                }}>
                  Prescription-based home medicine delivery
                </h2>
                <p style={{
                  color: '#64748B',
                  lineHeight: '1.8',
                  marginBottom: '24px',
                  fontSize: '15px'
                }}>
                  Upload your prescription or request medication customization. Our pharmacy team will review your request and arrange delivery of your medicines to your home.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  marginBottom: '28px'
                }}>
                  {[
                    { title: 'Home delivery', text: 'Medicines delivered directly to your address.' },
                    { title: 'Fast delivery', text: 'Quick support for urgent prescription needs.' },
                    { title: 'Same-day service', text: 'Available after prescription review.' },
                    { title: 'Flexible payment', text: 'Online and cash payment options available.' }
                  ].map((item, index) => (
                    <div key={index} style={{
                      background: '#fff',
                      borderRadius: '16px',
                      border: '1px solid #E2EEEC',
                      padding: '20px'
                    }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#0A1628', fontWeight: '700' }}>
                        {item.title}
                      </h3>
                      <p style={{ color: '#64748B', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: '24px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 0.9fr',
                    gap: '24px',
                    alignItems: 'stretch'
                  }}>
                    <div style={{
                      background: '#fff',
                      borderRadius: '20px',
                      border: '1px solid #E2EEEC',
                      padding: '30px'
                    }}>
                      <h3 style={{ fontSize: '20px', marginBottom: '14px', color: '#0A1628', fontWeight: '700' }}>
                        Upload prescription
                      </h3>
                      <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.75', marginBottom: '22px' }}>
                        Upload a clear photo or PDF of your prescription so our pharmacy team can verify it and prepare the delivery.
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
                        padding: '14px 26px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '14px'
                      }}>
                        Upload prescription
                      </label>
                      {prescription && (
                        <div style={{
                          marginTop: '18px',
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
                      padding: '30px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <h3 style={{ fontSize: '20px', marginBottom: '14px', color: '#0A1628', fontWeight: '700' }}>
                          Request customization
                        </h3>
                        <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.75', marginBottom: '16px' }}>
                          Share your preferred brand, dosage requirement, or any special instruction and we will assist with the order.
                        </p>
                      </div>
                      <div style={{ fontWeight: '700', color: '#0B7B6F', fontSize: '14px' }}>
                        Need urgent help? Call the hospital at <a href="tel:08041675151" style={{ color: '#0B7B6F', textDecoration: 'none' }}>08041675151</a>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#fff',
                    borderRadius: '20px',
                    border: '1px solid #E2EEEC',
                    padding: '30px'
                  }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '14px', color: '#0A1628', fontWeight: '700' }}>
                      Write a note
                    </h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any special instruction, preferred brand, or request for home delivery"
                      style={{
                        width: '100%',
                        minHeight: '140px',
                        padding: '18px',
                        border: '1px solid #E2EEEC',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        color: '#0A1628',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      onClick={() => {
                        setRequestError('')
                        if (!prescription && !notes.trim()) {
                          setRequestError('Please upload a prescription or provide a note for your request.')
                          setRequestStatus('')
                          return
                        }
                        setRequestStatus('Your request has been submitted. Our pharmacy team will contact you soon to arrange home delivery.')
                      }}
                      style={{
                        background: '#0B7B6F',
                        color: '#fff',
                        border: 'none',
                        padding: '14px 28px',
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
                    <div style={{ color: '#B91C1C', fontSize: '14px' }}>
                      {requestError}
                    </div>
                  )}

                  {requestStatus && (
                    <div style={{
                      padding: '18px',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: '14px',
                      color: '#0B7B6F',
                      fontSize: '14px'
                    }}>
                      {requestStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

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
