import { Link } from 'react-router-dom'
import { CLINICS } from '../data/content'
import {
  MapPin,
  Clock,
  Calendar,
  Phone,
  Navigation
} from "lucide-react";

import clinicImg from "../assets/images/clinic.jpg";
import thyroplusImg from "../assets/images/thyroplus logo.jpeg";
import diaplusImg from "../assets/images/diapluslogo.jpg";

export default function ClinicsCard() {
  return (
    <section style={{ padding: '80px', marginTop: '-40px', background: '#F8FAFA' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{
          textAlign: 'center',
          marginBottom: '56px'
        }}>
          <div className="section-tag" style={{ justifyContent: 'center' }}>
            CLINIC LOCATIONS
          </div>

          <h2 className="section-h2">
            Book at Your <em>Nearest Clinic</em>
          </h2>

          <p style={{
            color: '#64748B',
            fontSize: '15px',
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: '1.7'
          }}>
            Two convenient locations in Yelahanka.
          </p>
        </div>

        {/* GRID */}
        <div
          className="clinic-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: '28px'
          }}
        >
          {CLINICS.map((c) => (
            <div
              key={c.id}
              style={{
                borderRadius: '22px',
                overflow: 'hidden',
                border: '1px solid #E2EEEC',
                background: '#fff'
              }}
            >

              {/* 🔥 IMAGE ADDED (TOP) */}
              <img
                src={c.id === 'thyroplus' ? thyroplusImg : c.id === 'diaplus' ? diaplusImg : clinicImg}
                alt={c.name}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover'
                }}
              />

              {/* TOP */}
              <div style={{ background: c.color, padding: '22px' }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#fff'
                }}>
                  {c.name}
                </div>

                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  {c.spec}
                </div>
              </div>

              {/* BODY */}
              <div style={{ padding: '24px' }}>

                <Row icon={<MapPin size={18} />} text={c.address} />
                <Row icon={<Clock size={18} />} text={c.timings.join(' · ')} />
                <Row icon={<Calendar size={18} />} text={c.days} />
                <Row icon={<Phone size={18} />} text={c.phone} />

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '16px'
                }}>
                  <Link to="/queue" className="btn-primary" style={{ flex: 1 }}>
                    Book
                  </Link>

                  <a
                    href={c.maps}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      width: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #E2EEEC',
                      borderRadius: '10px'
                    }}
                  >
                    <Navigation size={18} />
                  </a>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>

      {/* RESPONSIVE */}
      <style>{`
        @media (max-width: 900px) {
          .clinic-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </section>
  )
}

/* SAME ROW */
function Row({ icon, text }) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '14px'
    }}>
      <div style={{
        width: '34px',
        height: '34px',
        borderRadius: '9px',
        background: '#E6F4F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>

      <div style={{
        fontSize: '13px',
        color: '#64748B'
      }}>
        {text}
      </div>
    </div>
  )
}