import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/clinics', label: 'Clinics' },
  { to: '/pharmacy', label: 'Pharmacy' },
  { to: '/laboratory', label: 'Lab' },
  { to: '/queue', label: 'Book Token' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        height: '72px',
        padding: '0 5%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none',
        borderBottom: scrolled ? '1px solid #E2EEEC' : 'none',
      }}>

        {/* BRAND */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          minWidth: 0,          /* prevents flex overflow */
          overflow: 'hidden',
        }}>
          <div className="nav-logo">PR</div>

          <div className="nav-text" style={{ minWidth: 0 }}>
            <div className="nav-name">Dr. Praveen Ramachandra</div>
            <div className="nav-sub">ENDOCRINOLOGY SPECIALIST</div>
          </div>
        </Link>

        {/* DESKTOP LINKS */}
        <ul className="nav-links">
          {links.map(l => (
            <li key={l.to}>
              <Link to={l.to} className={pathname === l.to ? 'active' : ''}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* HAMBURGER */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="menu-btn" aria-label="Menu">
          <span style={{ transform: menuOpen ? 'rotate(45deg) translate(4px,4px)' : 'none', transition: '0.2s' }}/>
          <span style={{ opacity: menuOpen ? 0 : 1, transition: '0.2s' }}/>
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(4px,-4px)' : 'none', transition: '0.2s' }}/>
        </button>

      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu">

          {/* HEADER ROW */}
          <div className="mobile-header">
            <div className="mobile-logo">PR</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0A1628', lineHeight: '1.2' }}>
                Dr. Praveen Ramachandra
              </div>
              <div style={{ fontSize: '10px', color: '#0B7B6F', letterSpacing: '1.2px', marginTop: '2px' }}>
                ENDOCRINOLOGY SPECIALIST
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                fontSize: '22px', color: '#64748B', cursor: 'pointer', lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* DIVIDER */}
          <div style={{ height: '1px', background: '#E2EEEC', marginBottom: '28px' }} />

          {/* LINKS */}
          <div className="mobile-links">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  color: pathname === l.to ? '#0B7B6F' : '#0A1628',
                  background: pathname === l.to ? '#E6F4F2' : 'transparent',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontWeight: pathname === l.to ? '700' : '500',
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* BOTTOM CTA */}
          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #E2EEEC' }}>
            <Link
              to="/queue"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', textAlign: 'center',
                background: 'linear-gradient(135deg,#0B7B6F,#096358)',
                color: '#fff', borderRadius: '12px',
                padding: '14px', fontWeight: '700',
                fontSize: '15px', textDecoration: 'none',
              }}
            >
              Book Appointment
            </Link>
          </div>

        </div>
      )}

      <style>{`

        .nav-logo {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 50%;
          background: #0B7B6F;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .nav-name {
          font-size: 15px;
          font-weight: 700;
          color: #0A1628;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-sub {
          font-size: 10px;
          color: #0B7B6F;
          letter-spacing: 1.4px;
          white-space: nowrap;
        }

        /* DESKTOP LINKS */
        .nav-links {
          display: flex;
          gap: 4px;
          list-style: none;
          margin: 0;
          padding: 0;
          flex-shrink: 0;
        }

        .nav-links a {
          color: #64748B;
          font-size: 13px;
          padding: 7px 13px;
          border-radius: 8px;
          text-decoration: none;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }

        .nav-links a.active,
        .nav-links a:hover {
          color: #0B7B6F;
          background: #E6F4F2;
        }

        /* HAMBURGER */
        .menu-btn {
          background: none;
          border: none;
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
          flex-shrink: 0;
        }

        .menu-btn span {
          display: block;
          width: 22px;
          height: 2px;
          background: #0A1628;
          border-radius: 2px;
        }

        /* MOBILE MENU OVERLAY */
        .mobile-menu {
          position: fixed;
          inset: 0;
          background: white;
          z-index: 1001;
          padding: 20px 24px 28px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .mobile-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .mobile-logo {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 50%;
          background: #0B7B6F;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .mobile-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 17px;
          flex: 1;
        }

        .mobile-links a {
          text-decoration: none;
          display: block;
        }

        /* MOBILE BREAKPOINT */
        @media (max-width: 900px) {
          .nav-links { display: none !important; }
          .menu-btn  { display: flex !important; }

          .nav-name {
            font-size: 13px;
            max-width: 180px;
          }

          .nav-sub {
            font-size: 9px;
            letter-spacing: 1px;
          }
        }

        @media (min-width: 901px) {
          .menu-btn { display: none !important; }
        }

      `}</style>
    </>
  )
}