import { Link } from 'react-router-dom'
import { DOCTOR } from '../data/content'
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react"

const T = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '13.5px',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'color 0.2s',
  display: 'block',
  marginBottom: '10px'
}

export default function Footer() {
  const yr = new Date().getFullYear()

  // ✅ ICON STYLE
  const iconBox = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E2E8F0',
    transition: 'all 0.25s ease',
    cursor: 'pointer'
  }

  return (
    <footer style={{ background: '#0A1628', padding: '64px 5% 28px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          gap: '40px',
          marginBottom: '52px'
        }}>

          {/* Brand */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '14px'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg,#0B7B6F,#096358)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: '15px',
                fontWeight: '700',
                color: '#fff'
              }}>PR</div>

              <div style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: '16px',
                fontWeight: '700',
                color: '#fff'
              }}>
                {DOCTOR.name}
              </div>
            </div>

            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: '1.7',
              maxWidth: '240px',
              marginBottom: '20px'
            }}>
              {DOCTOR.tagline}. Trusted by {DOCTOR.patients} patients across Bengaluru since 2011.
            </p>

            {/* ✅ NEW PROFESSIONAL ICONS */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="https://www.facebook.com/drpraveenendocrinology" target="_blank" rel="noreferrer" style={iconBox}>
                <Facebook size={18} />
              </a>

              <a href="https://www.instagram.com/drpraveenmd" target="_blank" rel="noreferrer" style={iconBox}>
                <Instagram size={18} />
              </a>

              <a href="https://www.linkedin.com/in/dr-praveen-ramachandra" target="_blank" rel="noreferrer" style={iconBox}>
                <Linkedin size={18} />
              </a>

              <a href="https://youtube.com/@praveenramachandra9265?si=KiWVecHlYbutSx04" target="_blank" rel="noreferrer" style={iconBox}>
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div style={{
              fontSize: '10px',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '18px'
            }}>
              Quick Links
            </div>

            {[['/', 'Home'], ['/about', 'About Doctor'], ['/services', 'Our Services'], ['/clinics', 'Clinic Locations'], ['/queue', 'Book Token'], ['/blog', 'Health Tips'], ['/contact', 'Contact']]
              .map(([to, label]) => (
                <Link key={to} to={to} style={T}
                  onMouseEnter={e => e.currentTarget.style.color = '#0FA898'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  {label}
                </Link>
              ))}
          </div>

          {/* Services */}
          <div>
            <div style={{
              fontSize: '10px',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '18px'
            }}>
              Services
            </div>

            {['Diabetes Care', 'Thyroid Treatment', 'Obesity Management', 'PCOS / PCOD', 'Pediatric Endocrinology', 'Osteoporosis', 'Adrenal Disorders']
              .map(s => (
                <Link key={s} to="/services" style={T}
                  onMouseEnter={e => e.currentTarget.style.color = '#0FA898'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  {s}
                </Link>
              ))}
          </div>

          {/* Contact */}
          <div>
            <div style={{
              fontSize: '10px',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '18px'
            }}>
              Contact Us
            </div>

            {[
              DOCTOR.phone,
              `+91 ${DOCTOR.whatsapp.slice(2)} (WhatsApp)`,
              DOCTOR.email,
              'Yelahanka New Town, Bengaluru – 560064',
              'Mon – Sat: Multiple Slots Daily',
            ].map((text, i) => (
              <div key={i} style={{
                marginBottom: '12px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: '1.55'
              }}>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
            © {yr} {DOCTOR.name}. All rights reserved.
          </span>

          <span style={{ fontSize: '12px', color: '#0FA898', fontWeight: '600' }}>
            Designed & Built by Pranathi R N & Praveen D N
          </span>
        </div>
      </div>

      {/* ✅ HOVER EFFECT */}
      <style>{`
        a:hover svg {
          color: #0FA898;
        }
        a:hover {
          transform: translateY(-3px);
          background: rgba(15,168,152,0.15);
          border-color: rgba(15,168,152,0.4);
        }
      `}</style>
    </footer>
  )
}