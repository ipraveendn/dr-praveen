import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

const TESTS = [
  { id: 1, name: 'Fasting Blood Sugar', price: 250, time: '2 hours', icon: '🩸' },
  { id: 2, name: 'HbA1c Test', price: 400, time: '24 hours', icon: '📊' },
  { id: 3, name: 'Thyroid Profile (TSH)', price: 350, time: '24 hours', icon: '🔬' },
  { id: 4, name: 'Lipid Profile', price: 450, time: '24 hours', icon: '💓' },
  { id: 5, name: 'Liver Function Test', price: 500, time: '24 hours', icon: '🫘' },
  { id: 6, name: 'Kidney Function Test', price: 450, time: '24 hours', icon: '🫐' },
  { id: 7, name: 'Complete Blood Count', price: 300, time: '24 hours', icon: '🩸' },
  { id: 8, name: 'Vitamin D Test', price: 350, time: '48 hours', icon: '☀️' },
]

const PACKAGES = [
  {
    id: 1,
    name: 'Health Check-up Basic',
    price: 1200,
    tests: ['FBS', 'Lipid Profile', 'Liver Function'],
    icon: '💚'
  },
  {
    id: 2,
    name: 'Diabetes Complete',
    price: 1800,
    tests: ['FBS', 'HbA1c', 'Lipid Profile', 'Kidney Function'],
    icon: '💪'
  },
  {
    id: 3,
    name: 'Thyroid Complete',
    price: 1500,
    tests: ['TSH', 'T3', 'T4', 'Thyroid Antibodies'],
    icon: '🌟'
  },
  {
    id: 4,
    name: 'Annual Health Pack',
    price: 2500,
    tests: ['All routine tests', 'Vitamin D', 'Hormone panel', 'Complete Blood Count'],
    icon: '👑'
  }
]

export default function Laboratory() {
  const [selectedTests, setSelectedTests] = useState([])
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [collectionType, setCollectionType] = useState('home')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [reportAccess, setReportAccess] = useState('email')

  const toggleTest = (test) => {
    setSelectedTests(prev => 
      prev.some(t => t.id === test.id)
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    )
  }

  const selectPackage = (pkg) => {
    setSelectedPackage(pkg)
    setSelectedTests([])
  }

  const getTestsToDisplay = () => {
    if (selectedPackage) {
      return selectedPackage.tests.length + ' tests included'
    }
    return selectedTests.length > 0 ? `${selectedTests.length} tests selected` : 'No tests selected'
  }

  const getTotalPrice = () => {
    if (selectedPackage) return selectedPackage.price
    return selectedTests.reduce((sum, t) => sum + t.price, 0)
  }

  return (
    <>
      <Helmet>
        <title>Laboratory | Dr. Praveen Ramachandra</title>
      </Helmet>

      <div style={{ paddingTop: '72px' }}>
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg,#0A1628,#0F2040)',
          padding: '80px 5%',
          textAlign: 'center'
        }}>
          <div className="section-tag" style={{ justifyContent: 'center', color: '#0FA898' }}>
            DIAGNOSTIC TESTS
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 'clamp(36px,5vw,60px)',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '16px'
          }}>
            Advanced <em style={{ fontStyle: 'italic', color: '#0FA898' }}>Laboratory Services</em>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '15px',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: '1.7'
          }}>
            Complete diagnostic tests with home sample collection and online reports
          </p>
        </div>

        {/* MAIN CONTENT */}
        <section style={{ padding: '60px 5%', background: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* TEST PACKAGES */}
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: '32px',
              marginBottom: '36px',
              color: '#0A1628'
            }}>
              Popular <em style={{ color: '#0B7B6F' }}>Packages</em>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
              marginBottom: '60px'
            }}>
              {PACKAGES.map(pkg => (
                <div 
                  key={pkg.id}
                  onClick={() => selectPackage(pkg)}
                  style={{
                    background: selectedPackage?.id === pkg.id ? 'linear-gradient(135deg,#0B7B6F,#096358)' : '#f8fafa',
                    borderRadius: '16px',
                    padding: '28px',
                    border: selectedPackage?.id === pkg.id ? '2px solid #0B7B6F' : '1px solid #E2EEEC',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    color: selectedPackage?.id === pkg.id ? '#fff' : '#0A1628'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{pkg.icon}</div>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
                    {pkg.name}
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: selectedPackage?.id === pkg.id ? 'rgba(255,255,255,0.8)' : '#94A3B8',
                    marginBottom: '16px',
                    lineHeight: '1.6'
                  }}>
                    {pkg.tests.join(' • ')}
                  </p>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: selectedPackage?.id === pkg.id ? '#fff' : '#0B7B6F'
                  }}>
                    ₹{pkg.price}
                  </p>
                </div>
              ))}
            </div>

            {/* OR DIVIDER */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '48px'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#E2EEEC' }} />
              <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '600' }}>OR SELECT INDIVIDUAL TESTS</span>
              <div style={{ flex: 1, height: '1px', background: '#E2EEEC' }} />
            </div>

            {/* INDIVIDUAL TESTS */}
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '24px',
              color: '#0A1628'
            }}>
              Available Tests
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '40px'
            }}>
              {TESTS.map(test => (
                <div 
                  key={test.id}
                  onClick={() => toggleTest(test)}
                  style={{
                    background: selectedTests.some(t => t.id === test.id) ? '#E6F4F2' : '#fff',
                    border: selectedTests.some(t => t.id === test.id) ? '2px solid #0B7B6F' : '1px solid #E2EEEC',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={selectedTests.some(t => t.id === test.id)}
                    onChange={() => {}}
                    style={{ marginBottom: '8px', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{test.icon}</div>
                  <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#0A1628', marginBottom: '6px' }}>
                    {test.name}
                  </h5>
                  <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
                    Report in {test.time}
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#0B7B6F' }}>
                    ₹{test.price}
                  </p>
                </div>
              ))}
            </div>

            {/* BOOKING FORM */}
            <div style={{
              background: '#F8FAFA',
              borderRadius: '16px',
              padding: '40px',
              marginBottom: '40px',
              border: '1px solid #E2EEEC'
            }}>
              <h2 style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: '28px',
                marginBottom: '30px',
                color: '#0A1628'
              }}>
                Book Your Test
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '30px'
              }}>
                {/* LEFT: FORM */}
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0A1628' }}>
                      Your Phone Number *
                    </label>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #E2EEEC',
                        borderRadius: '10px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0A1628' }}>
                      Collection Address *
                    </label>
                    <textarea 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Where should we collect samples?"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #E2EEEC',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        minHeight: '80px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0A1628' }}>
                      Preferred Collection Date *
                    </label>
                    <input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #E2EEEC',
                        borderRadius: '10px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#0A1628' }}>
                      Report Access Method
                    </label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['email', 'portal', 'app'].map(method => (
                        <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input 
                            type="radio"
                            name="reportAccess"
                            value={method}
                            checked={reportAccess === method}
                            onChange={(e) => setReportAccess(e.target.value)}
                          />
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#0A1628' }}>
                            {method === 'email' ? '📧 Email' : method === 'portal' ? '🌐 Portal' : '📱 App'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    background: '#E6F4F2',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #0B7B6F',
                    fontSize: '13px',
                    color: '#0B7B6F',
                    lineHeight: '1.6'
                  }}>
                    <strong>💡 Pro Tip:</strong> Fast for 8-10 hours before blood collection for accurate results
                  </div>
                </div>

                {/* RIGHT: SUMMARY */}
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '28px',
                  border: '1px solid #E2EEEC',
                  height: 'fit-content'
                }}>
                  <h4 style={{ fontWeight: '700', color: '#0A1628', marginBottom: '20px', fontSize: '18px' }}>
                    Order Summary
                  </h4>

                  {selectedPackage ? (
                    <div style={{
                      background: '#F8FAFA',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <h5 style={{ fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>
                        {selectedPackage.icon} {selectedPackage.name}
                      </h5>
                      <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
                        {selectedPackage.tests.join(' • ')}
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#0B7B6F', marginTop: '12px' }}>
                        ₹{selectedPackage.price}
                      </p>
                    </div>
                  ) : selectedTests.length > 0 ? (
                    <div>
                      {selectedTests.map(test => (
                        <div key={test.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          marginBottom: '10px',
                          paddingBottom: '10px',
                          borderBottom: '1px solid #E2EEEC'
                        }}>
                          <span style={{ color: '#0A1628', fontWeight: '500' }}>{test.name}</span>
                          <span style={{ color: '#0B7B6F', fontWeight: '600' }}>₹{test.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      background: '#FEE2E2',
                      color: '#DC2626',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      marginBottom: '20px'
                    }}>
                      Please select tests or a package
                    </div>
                  )}

                  <div style={{
                    background: '#F8FAFA',
                    borderRadius: '10px',
                    padding: '16px',
                    marginTop: '20px',
                    borderTop: '1px solid #E2EEEC'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '13px'
                    }}>
                      <span style={{ color: '#64748B' }}>Sample Collection</span>
                      <span style={{ color: '#0B7B6F', fontWeight: '600' }}>FREE</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      fontSize: '13px'
                    }}>
                      <span style={{ color: '#64748B' }}>Home Delivery Report</span>
                      <span style={{ color: '#0B7B6F', fontWeight: '600' }}>FREE</span>
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg,#0A1628,#0F2040)',
                    borderRadius: '10px',
                    padding: '16px',
                    color: '#fff',
                    marginTop: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                      Total Amount
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0FA898' }}>
                      ₹{getTotalPrice()}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!phone || !address || !date) {
                        alert('Please fill all fields')
                        return
                      }
                      alert('Test appointment booked! You will receive confirmation via WhatsApp.')
                    }}
                    disabled={getTotalPrice() === 0}
                    style={{
                      width: '100%',
                      background: getTotalPrice() === 0 ? '#cbd5e1' : 'linear-gradient(135deg,#0B7B6F,#096358)',
                      color: '#fff',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: getTotalPrice() === 0 ? 'not-allowed' : 'pointer',
                      marginTop: '20px',
                      transition: 'all 0.3s'
                    }}
                  >
                    ✓ Book Test Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section style={{ padding: '60px 5%', background: '#F8FAFA' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '48px',
              color: '#0A1628'
            }}>
              Why Choose <em style={{ color: '#0B7B6F' }}>Our Laboratory</em>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px'
            }}>
              {[
                { icon: '🏥', title: 'NABL Accredited', desc: 'Certified laboratory with quality standards' },
                { icon: '👨‍⚕️', title: 'Doctor Supervised', desc: 'Reports interpreted by Dr. Praveen' },
                { icon: '🏠', title: 'Home Collection', desc: 'Sample collected at your doorstep' },
                { icon: '⚡', title: 'Fast Reports', desc: '24-48 hours turnaround time' },
                { icon: '🔐', title: 'Secure Reports', desc: 'Online portal with encrypted access' },
                { icon: '💰', title: 'Affordable Rates', desc: 'Best prices on all diagnostic tests' },
              ].map((benefit, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  border: '1px solid #E2EEEC',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{benefit.icon}</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0A1628', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    {benefit.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEST PREPARATION TIPS */}
        <section style={{ padding: '60px 5%', background: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: '32px',
              marginBottom: '36px',
              color: '#0A1628'
            }}>
              Test Preparation <em style={{ color: '#0B7B6F' }}>Tips</em>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              {[
                { icon: '🌙', title: 'Night Before', tips: ['Get 8 hours sleep', 'Avoid alcohol', 'Eat light dinner'] },
                { icon: '⏰', title: 'Morning of Test', tips: ['Fast for 8-10 hours', 'Drink plain water', 'Wear loose sleeves'] },
                { icon: '🥗', title: 'After Collection', tips: ['Have a light breakfast', 'Drink plenty water', 'Rest for 15 minutes'] },
                { icon: '📋', title: 'Important Notes', tips: ['Bring doctor note if any', 'List current medicines', 'Inform about allergies'] },
              ].map((section, i) => (
                <div key={i} style={{
                  background: '#F8FAFA',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #E2EEEC'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>{section.icon}</div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628', marginBottom: '12px' }}>
                    {section.title}
                  </h4>
                  <ul style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.8' }}>
                    {section.tips.map((tip, j) => (
                      <li key={j} style={{ marginBottom: '6px' }}>✓ {tip}</li>
                    ))}
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
