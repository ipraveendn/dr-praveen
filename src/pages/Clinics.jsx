import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { CLINICS, DOCTOR } from '../data/content'

import {
  MapPin,
  Landmark,
  Clock,
  CalendarDays,
  Phone
} from 'lucide-react'

export default function Clinics() {

  const ICONS = {
    address: <MapPin size={16} />,
    landmark: <Landmark size={16} />,
    timings: <Clock size={16} />,
    days: <CalendarDays size={16} />,
    phone: <Phone size={16} />,
  }

  return (
    <>
      <Helmet><title>Clinic Locations | {DOCTOR.name}</title></Helmet>

      <div style={{ paddingTop: '72px' }}>

        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg,#0A1628,#0F2040)',
          padding: '80px 5%',
          textAlign: 'center'
        }}>
          <div className="section-tag" style={{ justifyContent: 'center', color: '#0FA898' }}>LOCATIONS</div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 'clamp(36px,5vw,60px)',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '16px'
          }}>
            Our <em style={{ fontStyle: 'italic', color: '#0FA898' }}>Clinic Locations</em>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
            Two convenient locations in Yelahanka, Bengaluru
          </p>
        </div>

        {/* SECTION */}
        <section style={{ padding: '80px 5%', background: '#fff' }}>
          <div style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px'
          }}>

            {CLINICS.map((c) => (
              <div key={c.id} id={c.id} className="clinic-card" style={{
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid #E2EEEC',
                boxShadow: '0 4px 24px rgba(11,123,111,0.08)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr'
              }}>

                {/* LEFT */}
                <div className="clinic-left" style={{
                  background: c.color,
                  padding: '48px 40px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: '72px',
                      fontWeight: '700',
                      color: 'rgba(255,255,255,0.1)',
                      marginBottom: '-20px'
                    }}>
                      {c.num}
                    </div>

                    <h2 style={{
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#fff',
                      marginBottom: '8px'
                    }}>
                      {c.name}
                    </h2>

                    <p style={{
                      color: 'rgba(255,255,255,0.65)',
                      fontSize: '14px',
                      marginBottom: '28px'
                    }}>
                      {c.spec}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {c.chips?.map(ch => (
                        <span key={ch} style={{
                          background: 'rgba(255,255,255,0.15)',
                          color: '#fff',
                          padding: '5px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '32px', flexWrap: 'wrap' }}>
                    <Link to="/queue" style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      border: '1.5px solid rgba(255,255,255,0.3)',
                      textDecoration: 'none'
                    }}>
                      Book Appointment
                    </Link>

                    <a href={c.maps} target="_blank" rel="noreferrer" style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      textDecoration: 'none'
                    }}>
                      Get Directions
                    </a>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="clinic-right" style={{ background: '#fff', padding: '40px' }}>
                  {[
                    { key: 'address', label: 'Full Address', text: c.address },
                    { key: 'landmark', label: 'Landmark', text: c.landmark },
                    { key: 'timings', label: 'Timings', text: Array.isArray(c.timings) ? c.timings.join(' · ') : '' },
                    { key: 'days', label: 'Working Days', text: c.days },
                    { key: 'phone', label: 'Phone', text: c.phone },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: 'flex',
                      gap: '14px',
                      marginBottom: '20px',
                      padding: '16px',
                      background: '#F8FAFA',
                      borderRadius: '12px',
                      border: '1px solid #E2EEEC'
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        minWidth: '36px',
                        borderRadius: '10px',
                        background: '#E6F4F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0B7B6F'
                      }}>
                        {ICONS[row.key]}
                      </div>

                      <div>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: '#0B7B6F',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px'
                        }}>
                          {row.label}
                        </div>
                        <div style={{
                          fontSize: '13.5px',
                          color: '#0A1628',
                          fontWeight: '500',
                          lineHeight: '1.5'
                        }}>
                          {row.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}

          </div>
        </section>

      </div>

      {/* ── MOBILE ONLY ── */}
      <style>{`
        @media (max-width: 768px) {

          /* Stack card vertically */
          .clinic-card {
            grid-template-columns: 1fr !important;
            border-radius: 20px !important;
          }

          /* ── LEFT PANEL: compact hero banner ── */
          .clinic-left {
            padding: 28px 20px 24px !important;
            border-radius: 0 !important;
          }

          /* Big number watermark: smaller */
          .clinic-left > div > div:first-child {
            font-size: 48px !important;
            margin-bottom: -12px !important;
          }

          /* Clinic name */
          .clinic-left > div > h2 {
            font-size: 22px !important;
            margin-bottom: 4px !important;
          }

          /* Specialty */
          .clinic-left > div > p {
            font-size: 13px !important;
            margin-bottom: 16px !important;
          }

          /* Chip tags: wrap tightly */
          .clinic-left > div > div {
            gap: 6px !important;
          }

          .clinic-left > div > div span {
            font-size: 11px !important;
            padding: 4px 10px !important;
          }

          /* Buttons row */
          .clinic-left > div:last-child {
            margin-top: 20px !important;
            flex-direction: row !important;
            gap: 8px !important;
          }

          .clinic-left > div:last-child a {
            flex: 1 !important;
            text-align: center !important;
            padding: 10px 12px !important;
            font-size: 12px !important;
            border-radius: 10px !important;
          }

          /* ── RIGHT PANEL: info rows ── */
          .clinic-right {
            padding: 20px 16px !important;
            background: #F8FAFA !important;
          }

          /* Each info row */
          .clinic-right > div {
            padding: 12px !important;
            margin-bottom: 10px !important;
            gap: 12px !important;
            border-radius: 12px !important;
            background: #fff !important;
          }

          /* Icon box */
          .clinic-right > div > div:first-child {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            border-radius: 8px !important;
          }

          /* Label */
          .clinic-right > div > div:last-child > div:first-child {
            font-size: 9px !important;
            margin-bottom: 2px !important;
          }

          /* Value text */
          .clinic-right > div > div:last-child > div:last-child {
            font-size: 13px !important;
            line-height: 1.4 !important;
          }
        }
      `}</style>
    </>
  )
}