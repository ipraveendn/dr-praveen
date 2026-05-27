import { useState } from 'react'
import { MessageCircle, Phone, X } from 'lucide-react'
import { DOCTOR, WHATSAPP_MSG } from '../data/content'

export default function FloatingActions({ onChatOpen }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      zIndex: 500
    }}>

      {/* OPTIONS */}
      {open && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '14px',
          alignItems: 'flex-end'
        }}>

          {/* Chat */}
          <button
            onClick={() => {
              onChatOpen()
              setOpen(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#0A1628',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '30px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
            }}
          >
            <MessageCircle size={18} />
            Chat Assistant
          </button>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${DOCTOR.whatsapp}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#25D366',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '30px',
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(37,211,102,0.3)'
            }}
          >
            <Phone size={18} />
            WhatsApp
          </a>
        </div>
      )}

      {/* MAIN BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: open
            ? '#0A1628'
            : 'linear-gradient(135deg,#0B7B6F,#096358)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(11,123,111,0.4)',
          transition: 'all 0.25s ease'
        }}
      >
        {open ? <X size={26} color="#fff" /> : <MessageCircle size={26} color="#fff" />}
      </button>

    </div>
  )
}