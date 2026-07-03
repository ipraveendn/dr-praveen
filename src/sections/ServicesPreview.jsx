import { Link } from 'react-router-dom'
import { useState } from 'react'
import { SERVICES } from '../data/content'

const TABS = ['All','diabetes','thyroid','hormones','pediatric','bone']

export default function ServicesPreview() {
  const [tab, setTab] = useState('All')

  const filtered =
    tab === 'All'
      ? SERVICES.slice(0, 6)
      : SERVICES.filter(s => s.cat === tab).slice(0, 6)

  return (
    <section style={{ padding: '60px 5%', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="section-tag" style={{ justifyContent: 'center' }}>
            CONDITIONS WE TREAT
          </div>
          <h2 className="section-h2">
            Comprehensive <em>Endocrinology Care</em>
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '8px' }}>
            Diabetes, thyroid, hormones, pediatric & bone health
          </p>
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '32px'
        }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                border: `1.5px solid ${tab === t ? '#0B7B6F' : '#E2EEEC'}`,
                background: tab === t ? '#0B7B6F' : '#fff',
                color: tab === t ? '#fff' : '#64748B',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                textTransform: 'capitalize',
                transition: '0.2s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="services-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: '16px'
        }}>
          {filtered.map((s) => {
            const Icon = s.icon
            return (
              <Link key={s.name} to={`/queue?service=${encodeURIComponent(s.name)}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  border: '1px solid #E2EEEC',
                  borderRadius: '16px',
                  padding: '20px',
                  background: '#F8FAFA',
                  transition: '0.2s',
                  color: 'inherit'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    background: '#E6F4F2',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={20} color="#0B7B6F" />
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0A1628', marginBottom: '4px' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                    {s.desc}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link
            to="/services"
            style={{
              color: '#0B7B6F',
              fontWeight: '700',
              fontSize: '14px',
              textDecoration: 'none',
              border: '1.5px solid #B2DDD8',
              padding: '10px 24px',
              borderRadius: '10px',
              display: 'inline-block',
            }}
          >
            View All Services →
          </Link>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .services-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
        }

        @media (max-width: 500px) {
          .services-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}