import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { SERVICES } from '../data/content'

const TABS = ['All','diabetes','thyroid','hormones','pediatric','bone']
const TAB_LABELS = { 
  All:'All Conditions', 
  diabetes:'Diabetes', 
  thyroid:'Thyroid', 
  hormones:'Hormones', 
  pediatric:'Pediatric', 
  bone:'Bone Health' 
}

export default function Services() {
  const [tab, setTab] = useState('All')
  const filtered = tab === 'All' ? SERVICES : SERVICES.filter(s => s.cat === tab)

  return (
    <>
      <Helmet><title>Services | Dr. Praveen Ramachandra</title></Helmet>

      <div style={{ paddingTop: '72px' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#0A1628,#0F2040)',
          padding: '80px 5%',
          textAlign: 'center'
        }}>
          <div className="section-tag" style={{ justifyContent: 'center', color: '#0FA898', fontSize: '11px', letterSpacing: '1.5px' }}>
            CONDITIONS WE TREAT
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 'clamp(36px,5vw,60px)',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '16px',
            lineHeight: '1.15'
          }}>
            Comprehensive <em style={{ fontStyle: 'italic', color: '#0FA898' }}>
              Endocrinology Care
            </em>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '15px',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: '1.7'
          }}>
            Evidence-based treatment for all hormone and metabolic disorders across all age groups.
          </p>
        </div>

        {/* Content */}
        <section style={{ padding: '60px 5%', background: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '48px'
            }}>
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '30px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: `1.5px solid ${tab === t ? '#0B7B6F' : '#E2EEEC'}`,
                    background: tab === t ? '#0B7B6F' : '#fff',
                    color: tab === t ? '#fff' : '#475569',
                    transition: 'all 0.2s',
                    fontFamily: "'DM Sans',sans-serif"
                  }}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            {/* ✅ FIXED GRID */}
            <div className="services-grid" style={{
              display: 'grid',
              gap: '16px'
            }}>
              {filtered.map((s, i) => {
                const Icon = s.icon || null

                return (
                  <div
                    key={s.name}
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '24px 20px',
                      border: '1px solid #E2EEEC',
                      cursor: 'pointer',
                      transition: 'all 0.25s',
                      animation: `fadeUp 0.4s ${i * 0.03}s both`
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 16px 48px rgba(11,123,111,0.14)'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.borderColor = '#B2DDD8'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.borderColor = '#E2EEEC'
                    }}
                  >

                    {/* Icon */}
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '14px',
                      background: '#E6F4F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px'
                    }}>
                      {Icon && <Icon size={22} color="#0B7B6F" />}
                    </div>

                    {/* Title */}
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#0A1628',
                      marginBottom: '8px',
                      fontFamily: "'DM Sans',sans-serif"
                    }}>
                      {s.name}
                    </div>

                    {/* Description */}
                    <div style={{
                      fontSize: '13px',
                      color: '#64748B',
                      lineHeight: '1.7',
                      marginBottom: '16px'
                    }}>
                      {s.desc}
                    </div>

                    {/* CTA */}
                    <Link to={`/queue?service=${encodeURIComponent(s.name)}`} style={{
                      fontSize: '12.5px',
                      color: '#0B7B6F',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}>
                      Book Appointment →
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            <div style={{
              textAlign: 'center',
              marginTop: '60px',
              padding: '48px',
              background: 'linear-gradient(135deg,#E6F4F2,#EFF7F6)',
              borderRadius: '24px'
            }}>
              <h3 style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: '32px',
                fontWeight: '700',
                color: '#0A1628',
                marginBottom: '12px'
              }}>
                Not sure which condition you have?
              </h3>

              <p style={{
                color: '#64748B',
                marginBottom: '24px',
                fontSize: '15px',
                lineHeight: '1.7'
              }}>
                Book a consultation and Dr. Praveen will diagnose and guide you.
              </p>

              <Link to="/queue" className="btn-primary">
                Book Consultation Now →
              </Link>
            </div>

          </div>
        </section>
      </div>

      {/* ✅ GRID FIX + ANIMATION */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px) }
          to { opacity: 1; transform: translateY(0) }
        }

        .services-grid {
          grid-template-columns: repeat(4,1fr);
        }

        @media (max-width: 1100px) {
          .services-grid {
            grid-template-columns: repeat(3,1fr);
          }
        }

        @media (max-width: 900px) {
          .services-grid {
            grid-template-columns: repeat(2,1fr);
          }
        }

        @media (max-width: 500px) {
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}