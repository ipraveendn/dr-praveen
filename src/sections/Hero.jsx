import { Link } from 'react-router-dom'
import { DOCTOR } from '../data/content'
import DNA3D from '../components/DNA3D'

export default function Hero() {
  return (
    <section style={{
      minHeight: '100vh',
      padding: '100px 5% 80px',
      background: 'linear-gradient(135deg,#ffffff 0%,#f4faf9 100%)',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',

      /* 🔥 FIX FOR RIGHT GAP */
      width: '100%',
      maxWidth: '100vw',
    }}>

      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        right: '0',   /* 🔥 FIXED (was -10%) */
        top: '10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle,#E6F4F2 0%,transparent 75%)',
        opacity: 0.7,
      }}/>

      {/* MOBILE BACKGROUND DNA */}
      <div className="hero-bg-dna">
        <DNA3D />
      </div>

      <div className="hero-grid" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '58% 42%',
        gap: '20px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
      }}>

        {/* LEFT */}
        <div>

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(11,123,111,0.06)',
            border: '1px solid rgba(11,123,111,0.12)',
            fontSize: '12px',
            fontWeight: '500',
            color: '#0B7B6F',
            marginBottom: '16px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#0FA898'
            }} />
            Trusted Endocrinologist in Bengaluru
          </div>

          {/* CARD */}
          <div className="hero-card" style={{
            background: 'linear-gradient(135deg, rgba(11,123,111,0.08), rgba(11,123,111,0.02))',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 20px 60px rgba(11,123,111,0.08)',
            border: '1px solid rgba(11,123,111,0.12)'
          }}>

            {/* HEADING */}
            <h1 style={{
              fontFamily: "'Cormorant Garamond',serif",
              lineHeight: '1.08',
              letterSpacing: '-1px',
              marginBottom: '16px',
              color: '#0A1628',
            }}>
              <span style={{ display: 'block', fontSize: 'clamp(34px,4vw,50px)', fontWeight: '600' }}>
                Precision Care for
              </span>

              <span style={{
                display: 'block',
                color: '#0B7B6F',
                fontStyle: 'italic',
                fontSize: 'clamp(42px,5vw,64px)',
                fontWeight: '700'
              }}>
                Diabetes, Thyroid
              </span>

              <span style={{ display: 'block', fontSize: 'clamp(34px,4vw,50px)', fontWeight: '600' }}>
                & Hormonal Health
              </span>
            </h1>

            {/* LINE */}
            <div style={{
              width: '50px',
              height: '3px',
              background: '#0B7B6F',
              borderRadius: '2px',
              marginBottom: '16px'
            }}/>

            {/* STATS (UNCHANGED) */}
            <div style={{
              display: 'flex',
              gap: '16px',
              fontSize: '13px',
              color: '#0A1628',
              marginBottom: '14px',
              flexWrap: 'wrap'
            }}>
              <span>⭐ 4.7 Rating</span>
              <span>• 13+ Years Experience</span>
              <span>• 2 Clinics</span>
            </div>

            {/* QUAL */}
            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#0B7B6F',
              marginBottom: '10px'
            }}>
              {DOCTOR.quals}
            </div>

            {/* DESC */}
            <p style={{
              color: '#64748B',
              fontSize: '15px',
              lineHeight: '1.7',
              marginBottom: '26px',
              maxWidth: '480px'
            }}>
              {DOCTOR.shortBio}
            </p>

            {/* CTA */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/services" className="btn-primary">View Services</Link>
              <Link to="/queue" className="btn-secondary">Book Appointment</Link>
            </div>

          </div>
        </div>

        {/* RIGHT */}
        <div className="hero-right" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{ width: '440px', height: '520px', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, rgba(11,123,111,0.35), transparent 70%)',
              filter: 'blur(60px)',
            }}/>
            <DNA3D />
          </div>
        </div>

      </div>

      {/* MOBILE FIX */}
      <style>{`
        html, body {
          overflow-x: hidden;
        }

        @media (max-width: 900px) {

          .hero-grid {
            grid-template-columns: 1fr !important;
          }

          .hero-right {
            display: none !important;
          }

          .hero-bg-dna {
            position: absolute;
            inset: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0.25;
            pointer-events: none;
            z-index: 0;
          }

          .hero-card {
            background: rgba(255,255,255,0.5) !important;
            backdrop-filter: blur(5px) !important;
          }
        }

        @media (min-width: 901px) {
          .hero-bg-dna {
            display: none;
          }
        }
      `}</style>

    </section>
  )
}