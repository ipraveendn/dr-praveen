import { useState, useRef, useEffect } from 'react'
import { CHATBOT_RESPONSES } from '../data/content'
import { Send, Bot, X } from "lucide-react"

export default function ChatBot({ open, setOpen }) {

  const [msgs, setMsgs] = useState([
    { role: 'bot', text: 'Hi! I am the DiaPlus assistant. How can I help you today?' }
  ])

  const [input, setInput] = useState('')
  const msgsRef = useRef(null)

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
    }
  }, [msgs])

  function getReply(msg) {
    const m = msg.toLowerCase()

    // Timings
    if (m.includes('time') || m.includes('timing') || m.includes('hours') || m.includes('open')) 
      return CHATBOT_RESPONSES.timings
    
    // Booking
    if (m.includes('book') || m.includes('appointment') || m.includes('token') || m.includes('slot')) 
      return CHATBOT_RESPONSES.book
    
    // Services
    if (m.includes('service') || m.includes('diabetes') || m.includes('thyroid') || m.includes('treatment') || m.includes('condition') || m.includes('pcos') || m.includes('obesity') || m.includes('hormone')) 
      return CHATBOT_RESPONSES.services
    
    // Location
    if (m.includes('location') || m.includes('address') || m.includes('where') || m.includes('clinic') || m.includes('direction')) 
      return CHATBOT_RESPONSES.location
    
    // Fee/Cost
    if (m.includes('fee') || m.includes('cost') || m.includes('price') || m.includes('charge') || m.includes('payment')) 
      return CHATBOT_RESPONSES.fee
    
    // Doctor
    if (m.includes('doctor') || m.includes('praveen') || m.includes('about') || m.includes('experience') || m.includes('qualification')) 
      return CHATBOT_RESPONSES.doctor

    return CHATBOT_RESPONSES.default
  }

  function send(text) {
    const msg = text || input.trim()
    if (!msg) return

    setMsgs(p => [...p, { role: 'user', text: msg }])
    setInput('')

    setTimeout(() => {
      setMsgs(p => [...p, { role: 'bot', text: getReply(msg) }])
    }, 500)
  }

  const suggestions = [
    'Clinic Timings',
    'Book Appointment',
    'Services',
    'Location',
    'Fees'
  ]

  const suggMap = {
    'Clinic Timings': 'What are the clinic timings?',
    'Book Appointment': 'How do I book an appointment?',
    'Services': 'What conditions do you treat?',
    'Location': 'Where is the clinic located?',
    'Fees': 'What is the consultation fee?'
  }

  if (!open) return null

  return (
    // ONLY CHANGE THIS PART

<div style={{
  position: 'fixed',
  bottom: '20px',
  right: '10px',
  width: 'calc(100% - 20px)',
  maxWidth: '320px',
      background: '#fff',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      zIndex: 500
    }}>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg,#0B7B6F,#096358)',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Bot size={18} color="#fff" />
        <span style={{ color: '#fff', fontWeight: '600' }}>
          DiaPlus Assistant
        </span>

        {/* ❗ CLOSE BUTTON FIX */}
        <button
          onClick={() => setOpen(false)}
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={16} color="#fff" />
        </button>
      </div>

      {/* MESSAGES */}
      <div ref={msgsRef} style={{
        height: '200px',
        overflowY: 'auto',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'bot' ? 'flex-start' : 'flex-end',
            background: m.role === 'bot' ? '#E6F4F2' : '#0B7B6F',
            color: m.role === 'bot' ? '#0A1628' : '#fff',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '13px'
          }}>
            {m.text}
          </div>
        ))}
      </div>

      {/* ✅ SUGGESTIONS FIX */}
      <div style={{
        padding: '0 12px 10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => send(suggMap[s])}
            style={{
              background: '#F8FAFA',
              border: '1px solid #E2EEEC',
              color: '#0B7B6F',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <div style={{
        display: 'flex',
        padding: '10px',
        borderTop: '1px solid #E2EEEC'
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type your question..."
          style={{
            flex: 1,
            border: '1px solid #E2EEEC',
            borderRadius: '8px',
            padding: '8px'
          }}
        />

        <button onClick={() => send()} style={{
          marginLeft: '6px',
          background: '#0B7B6F',
          border: 'none',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Send size={16} color="#fff" />
        </button>
      </div>

    </div>
  )
}