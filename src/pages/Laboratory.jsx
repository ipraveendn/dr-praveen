import { Helmet } from 'react-helmet-async'
import { Phone } from 'lucide-react'
import { DOCTOR, WHATSAPP_MSG } from '../data/content'

const LAB_CONTACT = DOCTOR.whatsapp || '9686039505'

// Individual Tests
const TESTS = [
  { id: 1, name: 'Fasting Blood Sugar', price: 250, time: '2 hours', color: '#DC2626' },
  { id: 2, name: 'HbA1c Test', price: 400, time: '24 hours', color: '#2563EB' },
  { id: 3, name: 'Thyroid Profile (TSH)', price: 350, time: '24 hours', color: '#7C3AED' },
  { id: 4, name: 'Lipid Profile', price: 450, time: '24 hours', color: '#DB2777' },
  { id: 5, name: 'Liver Function Test', price: 500, time: '24 hours', color: '#EA580C' },
  { id: 6, name: 'Kidney Function Test', price: 450, time: '24 hours', color: '#0891B2' },
  { id: 7, name: 'Complete Blood Count', price: 300, time: '24 hours', color: '#DC2626' },
  { id: 8, name: 'Vitamin D Test', price: 350, time: '48 hours', color: '#F59E0B' },
]

// DiaplusKavach Packages organized by category
const PACKAGES = [
  // Specialized Endocrinology & Metabolic Packages
  {
    id: 1,
    name: 'DiaplusKavach Diabetes Gold',
    price: 1600,
    category: 'Specialized Endocrinology',
    parameters: 42,
    tests: ['HbA1c', 'TSH Ultra-Sensitive', 'Fasting Blood Sugar (FBS)', 'Cholesterol Total', 'Creatinine', 'CBC', 'Urine Examination'],
    color: '#DC2626',
    badge: 'DG',
    description: 'A targeted screen for diabetes management including blood sugar, thyroid, and metabolic markers'
  },
  {
    id: 2,
    name: 'DiaplusKavach Thyroid Package',
    price: 2550,
    category: 'Specialized Endocrinology',
    parameters: 5,
    tests: ['Anti TPO', 'TSH Receptor Antibody', 'Thyroid Profile (T3, T4, TSH)'],
    color: '#7C3AED',
    badge: 'TP',
    description: 'Advanced thyroid markers including Anti TPO and TSH Receptor Antibody for comprehensive thyroid evaluation'
  },
  {
    id: 3,
    name: 'DiaplusKavach Yuvarogya Female',
    price: 3250,
    category: 'Specialized Endocrinology',
    parameters: 69,
    tests: ['AMH (Anti-Müllerian Hormone)', 'Cortisol (Morning sample)', 'Iron Studies', 'Vitamin D', 'Vitamin B12', 'Thyroid (T3, T4, TSH)', 'LFT', 'KFT', 'Lipid Profile', 'FBS', 'CBC', 'Urine Routine'],
    color: '#DB2777',
    badge: 'YF',
    description: 'Comprehensive hormonal profile for women featuring AMH, Cortisol, and essential micronutrient analysis'
  },

  // Wellness & Family Packages
  {
    id: 4,
    name: 'DiaplusKavach Health Check-up Master',
    price: 2640,
    category: 'Wellness & Family',
    parameters: 67,
    tests: ['Vitamin D', 'B12', 'Thyroid (T3, T4, TSH)', 'HbA1c', 'Lipid Profile', 'KFT', 'LFT', 'CBC', 'Urine Routine', 'Fasting Blood Sugar'],
    color: '#F59E0B',
    badge: 'HM',
    description: 'A full-body screen including vitamin levels, thyroid, and complete metabolic panel'
  },
  {
    id: 5,
    name: 'DiaplusKavach Complete Wellness Package',
    price: 1750,
    category: 'Wellness & Family',
    parameters: 53,
    tests: ['Complete Wellness Screening', 'TSH', 'Lipid Profile', 'KFT', 'LFT', 'CBC', 'Urine Routine', 'FBS'],
    color: '#16A34A',
    badge: 'CW',
    description: 'Extended wellness screening covering thyroid, and body screen including vitamin D for two'
  },
  {
    id: 6,
    name: 'DiaplusKavach Total Care',
    price: 2550,
    category: 'Wellness & Family',
    parameters: 71,
    tests: ['Extensive wellness screening', 'TSH', 'Lipid Profile', 'KFT', 'LFT', 'CBC', 'Urine Routine', 'FBS', 'Ovarian Marker', 'Iron Studies', 'Calcium'],
    color: '#D97706',
    badge: 'TC',
    description: 'Comprehensive package for two with extended parameter coverage for complete health assessment'
  },

  // Specialized Care & Fever Screening
  {
    id: 7,
    name: 'DiaplusKavach HeartCare',
    price: 1550,
    category: 'Specialized Care',
    parameters: 12,
    tests: ['Advanced cardiac screening', 'Apolipoprotein A1', 'Apolipoprotein B', 'AB Ratio', 'Lipid Profile', 'FBS', 'HsCRP'],
    color: '#DC2626',
    badge: 'HC',
    description: 'Advanced cardiac screening including Apolipoprotein A1 and AB Ratio for heart health'
  },
  {
    id: 8,
    name: 'DiaplusKavach Anemia Package',
    price: 1350,
    category: 'Specialized Care',
    parameters: 40,
    tests: ['HB Electrophoresis', 'Iron Studies', 'Ferritin', 'Folic Acid', 'Vitamin B12', 'CBC'],
    color: '#7C3AED',
    badge: 'AP',
    description: 'Includes HB Electrophoresis and comprehensive iron studies for anemia diagnosis'
  },
  {
    id: 9,
    name: 'DiaplusKavach Fever Check Gold',
    price: 2450,
    category: 'Fever Screening',
    parameters: 45,
    tests: ['Comprehensive fever screening', 'Complete Blood Count', 'ESR', 'CRP', 'Dengue NS1', 'Malaria Antigen', 'Typhoid IgM'],
    color: '#EA580C',
    badge: 'FC',
    description: 'Comprehensive fever screening covering Dengue, Malaria, and Typhoid screening with inflammation markers'
  },
  {
    id: 10,
    name: 'DiaplusKavach Fever Screen',
    price: 1150,
    category: 'Fever Screening',
    parameters: 14,
    tests: ['Standard fever screen', 'Covering Dengue NS1', 'Malaria Antigen', 'Widal', 'CBC', 'ESR', 'Urine Routine'],
    color: '#F59E0B',
    badge: 'FS',
    description: 'Standard fever screening covering common fever-causing pathogens with routine blood tests'
  }
]

export default function Laboratory() {
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
              marginBottom: '48px',
              color: '#0A1628'
            }}>
              DiaplusKavach <em style={{ color: '#0B7B6F' }}>Diagnostic Packages</em>
            </h2>

            {/* Group packages by category */}
            {['Specialized Endocrinology', 'Wellness & Family', 'Specialized Care', 'Fever Screening'].map((category) => {
              const categoryPackages = PACKAGES.filter(pkg => pkg.category === category)
              return categoryPackages.length > 0 ? (
                <div key={category} style={{ marginBottom: '60px' }}>
                  {/* Category Heading */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '32px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #0B7B6F'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#0B7B6F'
                    }}></div>
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#0B7B6F'
                    }}>
                      {category}
                    </h3>
                  </div>

                  {/* Category Description */}
                  <p style={{
                    fontSize: '14px',
                    color: '#64748B',
                    marginBottom: '28px',
                    lineHeight: '1.6'
                  }}>
                    {category === 'Specialized Endocrinology' && 'Tailored for hormonal and metabolic health. These packages are designed for your clinic\'s core focus on hormonal and metabolic health.'}
                    {category === 'Wellness & Family' && 'Comprehensive wellness screening and preventative care packages for general health screening and family health management.'}
                    {category === 'Specialized Care' && 'Specialized diagnostic packages for cardiac, anemic, and other specific health concerns with targeted screening.'}
                    {category === 'Fever Screening' && 'Comprehensive fever screening packages covering common fever-causing pathogens with inflammation and infection markers.'}
                  </p>

                  {/* Packages Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '24px',
                    marginBottom: '20px'
                  }}>
                    {categoryPackages.map(pkg => (
                      <div 
                        key={pkg.id}
                        style={{
                          background: '#f8fafa',
                          borderRadius: '16px',
                          padding: '28px',
                          border: '1px solid #E2EEEC',
                          transition: 'all 0.3s',
                          color: '#0A1628',
                          position: 'relative'
                        }}
                      >
                        {/* Package Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: '#E6F4F2',
                          color: '#0B7B6F',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          letterSpacing: '0.5px'
                        }}>
                          {pkg.parameters} Parameters
                        </div>

                        {/* Professional Color Badge */}
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '12px',
                          background: pkg.color + '15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '16px',
                          fontWeight: '700',
                          fontSize: '20px',
                          color: pkg.color,
                          transition: 'all 0.3s'
                        }}>
                          {pkg.badge}
                        </div>
                        <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                          {pkg.name}
                        </h4>
                        <p style={{
                          fontSize: '13px',
                          color: '#64748B',
                          marginBottom: '16px',
                          lineHeight: '1.5',
                          minHeight: '40px'
                        }}>
                          {pkg.description}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#94A3B8',
                          marginBottom: '16px',
                          lineHeight: '1.6'
                        }}>
                          {pkg.tests.join(', ')}
                        </p>
                        <p style={{
                          fontSize: '28px',
                          fontWeight: '700',
                          color: '#0B7B6F'
                        }}>
                          ₹{pkg.price}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            })}

            {/* OR DIVIDER */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '48px'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#E2EEEC' }} />
              <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '600' }}>INDIVIDUAL TESTS ALSO AVAILABLE</span>
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
                  style={{
                    background: '#fff',
                    border: '1px solid #E2EEEC',
                    borderRadius: '12px',
                    padding: '16px',
                    transition: 'all 0.3s'
                  }}
                >
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

            {/* CONTACT FOR DETAILS */}
            <div style={{
              background: 'linear-gradient(135deg, #0A1628, #0F2040)',
              borderRadius: '16px',
              padding: '48px 40px',
              marginBottom: '40px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'rgba(15, 168, 152, 0.15)',
                color: '#0FA898',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '20px'
              }}>
                Available Diagnostic Packages
              </div>

              <h2 style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 'clamp(28px, 4vw, 36px)',
                marginBottom: '16px',
                color: '#fff',
                fontWeight: '700'
              }}>
                Enquire About <em style={{ color: '#0FA898', fontStyle: 'italic' }}>Our Packages</em>
              </h2>

              <p style={{
                fontSize: '15px',
                lineHeight: '1.8',
                color: 'rgba(255,255,255,0.75)',
                maxWidth: '620px',
                margin: '0 auto 32px'
              }}>
                The packages and individual tests listed above represent our available diagnostic offerings.
                For detailed information, package inclusions, or to schedule home sample collection,
                please contact our laboratory team.
              </p>

              <div style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '14px',
                padding: '32px 40px',
                minWidth: 'min(100%, 360px)'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)'
                }}>
                  Contact Laboratory Team
                </span>

                <a
                  href={`tel:+91${LAB_CONTACT}`}
                  style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: 'clamp(28px, 4vw, 34px)',
                    fontWeight: '700',
                    color: '#fff',
                    textDecoration: 'none',
                    letterSpacing: '0.5px'
                  }}
                >
                  +91 {LAB_CONTACT}
                </a>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <a
                    href={`tel:+91${LAB_CONTACT}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #0B7B6F, #096358)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                  <a
                    href={`https://wa.me/${LAB_CONTACT}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '14px',
                      textDecoration: 'none',
                      border: '1px solid rgba(255,255,255,0.18)',
                      transition: 'all 0.3s'
                    }}
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              <p style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.45)',
                marginTop: '24px',
                letterSpacing: '0.2px'
              }}>
                Available for package details and home sample collection scheduling
              </p>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section style={{ padding: '70px 5%', background: 'linear-gradient(180deg, #F8FAFA 0%, #F4FBFA 100%)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'rgba(11, 123, 111, 0.10)',
                color: '#0B7B6F',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '14px'
              }}>
                Trusted diagnostics, delivered with care
              </div>
              <h2 style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: '32px',
                marginBottom: '12px',
                color: '#0A1628'
              }}>
                Why Choose <em style={{ color: '#0B7B6F' }}>Our Laboratory</em>
              </h2>
              <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#64748B' }}>
                Precision-led testing, professional support, and a seamless experience from sample collection to report delivery.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '22px'
            }}>
              {[
                { title: 'NABL Accredited', desc: 'Certified laboratory processes that meet strict quality benchmarks.' },
                { title: 'Doctor Supervised', desc: 'Reports are reviewed and interpreted with clinical guidance.' },
                { title: 'Home Collection', desc: 'Convenient sample pickup at your doorstep with minimal effort.' },
                { title: 'Fast Reports', desc: 'Reliable turnaround time so you receive results promptly.' },
                { title: 'Secure Reports', desc: 'Encrypted access and privacy-focused report delivery.' },
                { title: 'Affordable Rates', desc: 'Competitive pricing with transparent diagnostics packages.' },
              ].map((benefit, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'left',
                  border: '1px solid rgba(11, 123, 111, 0.12)',
                  boxShadow: '0 12px 30px rgba(10, 22, 40, 0.05)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    marginBottom: '16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #E6F4F2 0%, #D7EFE9 100%)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#0B7B6F',
                    fontWeight: '800',
                    fontSize: '16px'
                  }}>
                    {i + 1}
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0A1628', marginBottom: '10px', letterSpacing: '0.3px' }}>
                    {benefit.title}
                  </h4>
                  <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.8', margin: 0 }}>{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEST PREPARATION TIPS */}
        <section style={{ padding: '70px 5%', background: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '36px', flexWrap: 'wrap' }}>
              <div style={{ maxWidth: '680px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  background: 'rgba(11, 123, 111, 0.10)',
                  color: '#0B7B6F',
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  marginBottom: '12px'
                }}>
                  Simple steps, better results
                </div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: '32px',
                  margin: 0,
                  color: '#0A1628'
                }}>
                  Test Preparation <em style={{ color: '#0B7B6F' }}>Tips</em>
                </h2>
              </div>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#F8FAFA',
                color: '#0B7B6F',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #E2EEEC'
              }}>
                Follow these to keep your test smooth and accurate.
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '22px'
            }}>
              {[
                { title: 'Night Before', tips: ['Get 8 hours of sleep', 'Avoid alcohol', 'Eat a light dinner'] },
                { title: 'Morning of Test', tips: ['Fast for 8-10 hours', 'Drink plain water', 'Wear loose sleeves'] },
                { title: 'After Collection', tips: ['Have a light breakfast', 'Drink plenty of water', 'Rest for 15 minutes'] },
                { title: 'Important Notes', tips: ['Bring any doctor note', 'List current medicines', 'Inform us about allergies'] },
              ].map((section, i) => (
                <div key={i} style={{
                  background: '#F8FAFA',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #E2EEEC',
                  boxShadow: '0 10px 24px rgba(10, 22, 40, 0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0B7B6F 0%, #0A1628 100%)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {i + 1}
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628', margin: 0 }}>
                      {section.title}
                    </h4>
                  </div>
                  <ul style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.8', paddingLeft: '0', margin: 0, listStyle: 'none' }}>
                    {section.tips.map((tip, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0B7B6F', marginTop: '7px', flexShrink: 0 }} />
                        <span>{tip}</span>
                      </li>
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
