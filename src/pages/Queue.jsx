import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { CLINICS } from '../data/content'
import { apiRequest } from '../utils/api'
import SEOMeta from '../components/SEOMeta'

const REASONS = [
  'Diabetes Checkup',
  'Thyroid Consultation',
  'Hormone Imbalance',
  'Obesity/Weight',
  'PCOS / PCOD',
  'Gestational Diabetes',
  'Pediatric Endocrinology',
  'Osteoporosis',
  'Adrenal Disorder',
  'Pituitary Disorder',
  'General Consultation',
  'Other'
]

function getNext7DaysIST() {
  const dates = []
  const now = new Date()

  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d)

    const dayLabel = i === 0 ? 'Today' : new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short'
    }).format(d)

    const dateLabel = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short'
    }).format(d)

    const rawWeekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short'
    }).format(d)
    const isSunday = rawWeekday === 'Sun'
    const isHoliday = isSunday

    dates.push({
      dateStr,
      dayLabel,
      dateLabel,
      isToday: i === 0,
      isSunday,
      isHoliday,
      isClosed: isHoliday
    })
  }
  return dates
}

function LiveQueue({ data }) {
  if (!data) return null

  return (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 4px 24px rgba(11,123,111,0.08)', border: '1px solid #E2EEEC', marginTop: '48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '26px', fontWeight: '700', color: '#0A1628', margin: 0 }}>Live Clinic Queue</h2>
        <span style={{ fontSize: '11px', background: '#E6F4F2', color: '#0B7B6F', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>● Live Updates</span>
      </div>
      <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '24px' }}>Real-time walk-in and today's consultation status</p>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: '#F8FAFA', borderRadius: '14px', padding: '20px', border: '1px solid #E2EEEC', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Currently Serving</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '40px', fontWeight: '800', color: '#0B7B6F', lineHeight: '1' }}>
            {data.currentToken ? `#${String(data.currentToken).padStart(2, '0')}` : '—'}
          </div>
        </div>
        <div style={{ flex: 1, background: '#F8FAFA', borderRadius: '14px', padding: '20px', border: '1px solid #E2EEEC', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Patients Waiting</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '40px', fontWeight: '800', color: '#0A1628', lineHeight: '1' }}>
            {data.waiting ?? 0}
          </div>
        </div>
      </div>

      {Array.isArray(data.patients) && data.patients.filter(p => p.status === 'WAITING').length > 0 && (
        <div>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '18px', fontWeight: '700', color: '#0A1628', marginBottom: '12px' }}>Upcoming in Queue</h3>
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {data.patients.filter(p => p.status === 'WAITING').map((patient, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E2EEEC', fontSize: '13px' }}>
                <span style={{ color: '#0A1628', fontWeight: '700' }}>#{String(patient.tokenNumber).padStart(2, '0')}</span>
                <span style={{ color: '#64748B', fontWeight: '500' }}>{patient.name}</span>
                <span style={{ color: '#0B7B6F', fontWeight: '600' }}>{patient.clinic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Queue() {
  const [step, setStep] = useState(1)
  const [clinic, setClinic] = useState('')
  const [consultationMode, setConsultationMode] = useState('') // 'IN_PERSON' or 'ONLINE'
  const [form, setForm] = useState({ name: '', phone: '', email: '', place: '', doctor: 'Dr. Praveen Ramachandra', reason: '' })
  
  // Date & Slot states
  const [bookingDates] = useState(() => getNext7DaysIST())
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null) // { time24, time12, period }
  const [availability, setAvailability] = useState(null) // { totalSlots, availableCount, bookedCount, slots: [] }
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [qrCodeSrc, setQrCodeSrc] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')

  // Booking completion state
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [queueData, setQueueData] = useState(null)

  const UPI_PAYMENTS = {
    diaplus: {
      pa: 'paytmqr64bh34@ptys',
      pn: 'DiaPlus Clinic'
    },
    thyroplus: {
      pa: 'BHARATPE09895931868@yesbankltd',
      pn: 'ThyroPlus Clinic'
    }
  }

  // Pre-fill reason from query parameter (service) if provided
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const svc = params.get('service')
      if (svc) setForm(f => ({ ...f, reason: svc }))
    } catch {
      // ignore
    }
  }, [])

  // QR Code generator for UPI payment
  useEffect(() => {
    const clinicId = clinic || 'diaplus'
    const payment = UPI_PAYMENTS[clinicId] || UPI_PAYMENTS.diaplus
    const upiData = `upi://pay?pa=${payment.pa}&pn=${encodeURIComponent(payment.pn)}&cu=INR`

    setQrLoading(true)
    setQrError('')
    QRCode.toDataURL(upiData, { width: 260, margin: 2 })
      .then(setQrCodeSrc)
      .catch(err => {
        console.error('[QR CODE ERROR]', err)
        setQrError('Unable to generate the QR code. Please refresh the page.')
      })
      .finally(() => setQrLoading(false))
  }, [clinic])

  // Live queue polling
  async function fetchQueueData() {
    try {
      const data = await apiRequest('/queue')
      setQueueData(data.data)
    } catch (error) {
      console.error('Failed to fetch queue data:', error)
    }
  }

  useEffect(() => {
    fetchQueueData()
    const interval = setInterval(fetchQueueData, 10000)
    return () => clearInterval(interval)
  }, [])

  // Fetch slot availability when clinic or date changes
  const fetchAvailability = useCallback(async (targetClinic, targetDate) => {
    if (!targetClinic || !targetDate) return

    // Central Sunday check: Do not fetch or display slots for Sundays
    const dateObj = bookingDates.find(d => d.dateStr === targetDate)
    if (dateObj?.isHoliday || dateObj?.isSunday) {
      setAvailability({
        clinic: targetClinic,
        date: targetDate,
        isClosed: true,
        isHoliday: true,
        isSunday: true,
        slots: [],
        totalSlots: 0,
        availableCount: 0,
        bookedCount: 0,
        message: 'The clinic is closed on Sundays (Holiday). Please select an alternate date.'
      })
      setSlotsLoading(false)
      setSlotsError('')
      return
    }

    setSlotsLoading(true)
    setSlotsError('')
    try {
      const response = await apiRequest(`/appointments/availability?clinic=${targetClinic}&date=${targetDate}`)
      if (response && response.success && response.data) {
        setAvailability(response.data)
      } else {
        setSlotsError(response?.message || 'Failed to load time slots.')
      }
    } catch (err) {
      console.error('[AVAILABILITY FETCH ERROR]', err)
      const msg = err.data?.message || err.message || 'Unable to load slot availability.'
      setSlotsError(msg)
    } finally {
      setSlotsLoading(false)
    }
  }, [bookingDates])

  useEffect(() => {
    if (clinic && selectedDate) {
      fetchAvailability(clinic, selectedDate)
    }
  }, [clinic, selectedDate, fetchAvailability])

  function handleScreenshotSelect(event) {
    const file = event.target.files?.[0]
    if (file) setPaymentScreenshot(file)
  }

  function isPaymentReady() {
    if (paymentMethod === 'cash') return true
    return paymentScreenshot !== null
  }

  // Submit appointment booking
  async function bookAppointment() {
    if (loading) return

    if (!clinic || !consultationMode || !selectedDate || !selectedSlot || !form.name || !form.phone) {
      setError('Please complete all required fields before confirming.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const requestBody = {
        clinic,
        consultationMode,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot.time24,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        place: form.place.trim() || undefined,
        reason: form.reason || 'General Consultation',
        paymentMethod: paymentMethod === 'online' ? 'ONLINE' : 'CASH'
      }

      console.log('[BOOKING REQUEST] Submitting appointment:', requestBody)

      const result = await apiRequest('/appointments/book', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      console.log('[BOOKING RESPONSE] Received:', result)

      if (result && result.success && result.data) {
        setConfirmedBooking(result.data)
        setStep(7) // Move to confirmation screen
      } else {
        throw new Error(result?.message || 'Failed to book appointment.')
      }
    } catch (err) {
      console.error('[BOOKING ERROR]', err)
      const errorMsg = err.data?.message || err.message || 'Something went wrong while booking. Please try again.'
      setError(errorMsg)

      // If slot conflict (409), refresh availability and send user back to slot selection
      if (err.status === 409 || err.data?.code === 'SLOT_ALREADY_BOOKED') {
        setSelectedSlot(null)
        fetchAvailability(clinic, selectedDate)
        setStep(5)
      }
    } finally {
      setLoading(false)
    }
  }

  const clinicObj = CLINICS.find(c => c.id === clinic)
  const stepLabels = ['Clinic', 'Mode', 'Details', 'Date', 'Time Slot', 'Payment']

  return (
    <>
      <SEOMeta pageKey="queue" />

      {/* Global In-Flight Modal Loader */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(10, 22, 40, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '36px 32px',
            maxWidth: '380px', width: '100%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(11, 123, 111, 0.25)',
            border: '1px solid #E2EEEC'
          }}>
            <div style={{
              width: '52px', height: '52px', margin: '0 auto 20px',
              border: '4px solid #E2EEEC', borderTopColor: '#0B7B6F',
              borderRadius: '50%', animation: 'bookingSpin 0.8s linear infinite'
            }} />
            <h3 style={{
              fontFamily: "'Cormorant Garamond',serif", fontSize: '24px',
              fontWeight: '700', color: '#0A1628', marginBottom: '10px'
            }}>
              Confirming Appointment
            </h3>
            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Securing your 15-minute slot. Please do not refresh or leave this page.
            </p>
          </div>
        </div>
      )}

      <div style={{ paddingTop: '72px', minHeight: '100vh', background: '#F8FAFA' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0A1628,#0F2040)', padding: '60px 5%', textAlign: 'center' }}>
          <div className="section-tag" style={{ justifyContent: 'center', color: '#0FA898' }}>APPOINTMENT SYSTEM</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: '700', color: '#fff' }}>
            Book Your <em style={{ fontStyle: 'italic', color: '#0FA898' }}>Doctor Appointment</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '12px', fontSize: '15px' }}>
            Choose your clinic, consultation mode, and 15-minute time slot with Dr. Praveen Ramachandra.
          </p>
        </div>

        {/* Progress Bar (Steps 1 to 6) */}
        {step < 7 && (
          <div className="queue-progress" style={{ background: '#fff', borderBottom: '1px solid #E2EEEC', padding: '14px 5%', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
            {stepLabels.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="queue-step-circle" style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: step > i + 1 ? '#0B7B6F' : step === i + 1 ? '#0B7B6F' : '#E2EEEC',
                  color: step >= i + 1 ? '#fff' : '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '700'
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="queue-step-label" style={{
                  fontSize: '12px',
                  fontWeight: step === i + 1 ? '700' : '500',
                  color: step === i + 1 ? '#0A1628' : '#64748B'
                }}>
                  {s}
                </span>
                {i < stepLabels.length - 1 && <span style={{ color: '#CBD5E1', fontSize: '14px' }}>›</span>}
              </div>
            ))}
          </div>
        )}

        <div className="queue-container" style={{ maxWidth: '580px', margin: '40px auto', padding: '0 5%' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 4px 24px rgba(11,123,111,0.08)', border: '1px solid #E2EEEC' }}>

            {/* Step 1 — Choose Clinic */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Select Clinic</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Where would you like to consult Dr. Praveen Ramachandra?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {CLINICS.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setClinic(c.id)
                        setSelectedSlot(null) // reset selected slot if clinic changed
                        setStep(2)
                      }}
                      style={{
                        border: `2px solid ${clinic === c.id ? '#0B7B6F' : '#E2EEEC'}`,
                        borderRadius: '14px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: clinic === c.id ? '#E6F4F2' : '#fff'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#0B7B6F'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = clinic === c.id ? '#0B7B6F' : '#E2EEEC'}
                    >
                      <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '16px', marginBottom: '4px' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>{c.address}</div>
                      <div style={{ fontSize: '12px', color: '#0B7B6F', fontWeight: '600' }}>
                        🕒 {c.id === 'diaplus' ? '1:00 PM – 4:30 PM · 8:30 PM – 10:30 PM' : '6:30 PM – 8:00 PM'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Consultation Mode */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Consultation Mode</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Select how you prefer to attend your appointment</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    onClick={() => { setConsultationMode('IN_PERSON'); setStep(3); }}
                    style={{
                      border: `2px solid ${consultationMode === 'IN_PERSON' ? '#0B7B6F' : '#E2EEEC'}`,
                      borderRadius: '14px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: consultationMode === 'IN_PERSON' ? '#E6F4F2' : '#fff'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#0B7B6F'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = consultationMode === 'IN_PERSON' ? '#0B7B6F' : '#E2EEEC'}
                  >
                    <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '16px', marginBottom: '4px' }}>🏥 In-Person Consultation</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Visit {clinicObj?.name || 'the clinic'} for direct doctor consultation</div>
                  </div>

                  <div
                    onClick={() => { setConsultationMode('ONLINE'); setStep(3); }}
                    style={{
                      border: `2px solid ${consultationMode === 'ONLINE' ? '#0B7B6F' : '#E2EEEC'}`,
                      borderRadius: '14px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: consultationMode === 'ONLINE' ? '#E6F4F2' : '#fff'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#0B7B6F'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = consultationMode === 'ONLINE' ? '#0B7B6F' : '#E2EEEC'}
                  >
                    <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '16px', marginBottom: '4px' }}>💻 Online Video / Phone Consultation</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Consult Dr. Praveen Ramachandra remotely from the comfort of your home</div>
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <button onClick={() => setStep(1)} className="btn-secondary" style={{ width: '100%' }}>← Back to Clinic</button>
                </div>
              </div>
            )}

            {/* Step 3 — Patient Details */}
            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Patient Details</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
                  Clinic: <strong style={{ color: '#0B7B6F' }}>{clinicObj?.name}</strong> · Mode: <strong style={{ color: '#0B7B6F' }}>{consultationMode === 'ONLINE' ? 'Online' : 'In-Person'}</strong>
                </p>

                {[
                  { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Enter your full name' },
                  { label: 'Phone Number *', key: 'phone', type: 'tel', placeholder: '10-digit mobile number' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'Enter your email address' },
                  { label: 'Place / City', key: 'place', type: 'text', placeholder: 'Enter your city or town' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      maxLength={f.key === 'phone' ? 10 : undefined}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2EEEC', borderRadius: '10px', fontSize: '14px', fontFamily: "'DM Sans',sans-serif", outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#0B7B6F'}
                      onBlur={e => e.target.style.borderColor = '#E2EEEC'}
                    />
                  </div>
                ))}

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Reason for Visit *</label>
                  <select
                    value={form.reason}
                    onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2EEEC', borderRadius: '10px', fontSize: '14px', fontFamily: "'DM Sans',sans-serif", outline: 'none', background: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#0B7B6F'}
                    onBlur={e => e.target.style.borderColor = '#E2EEEC'}
                  >
                    <option value="">Select reason...</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</p>}

                <div className="action-row" style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
                  <button
                    onClick={() => {
                      if (!form.name.trim() || !form.phone.trim() || !form.reason) {
                        setError('Please fill in your name, phone number, and reason for visit.')
                        return
                      }
                      if (form.phone.replace(/\D/g, '').length < 10) {
                        setError('Please enter a valid 10-digit phone number.')
                        return
                      }
                      setError('')
                      // Auto-select first non-holiday date if none selected yet
                      if (!selectedDate && bookingDates.length > 0) {
                        const firstOpen = bookingDates.find(d => !d.isHoliday)
                        if (firstOpen) {
                          setSelectedDate(firstOpen.dateStr)
                        } else {
                          setSelectedDate(bookingDates[0].dateStr)
                        }
                      }
                      setStep(4)
                    }}
                    className="btn-primary"
                    style={{ flex: 2 }}
                  >
                    Select Date →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 — Select Date */}
            {step === 4 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Select Date</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>Choose from the next 7 calendar days</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                  {bookingDates.map(d => {
                    const isSelected = selectedDate === d.dateStr
                    const isClosed = d.isHoliday || d.isSunday
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        disabled={isClosed}
                        onClick={() => {
                          if (!isClosed) {
                            setSelectedDate(d.dateStr)
                            setSelectedSlot(null) // reset slot on date switch
                            setError('')
                          }
                        }}
                        title={isClosed ? 'Clinic is closed on Sundays (Holiday)' : `Select ${d.dayLabel}, ${d.dateLabel}`}
                        style={{
                          padding: '14px 10px',
                          borderRadius: '12px',
                          border: isClosed ? '1.5px dashed #CBD5E1' : `2px solid ${isSelected ? '#0B7B6F' : '#E2EEEC'}`,
                          background: isClosed ? '#F8FAFC' : (isSelected ? '#E6F4F2' : '#fff'),
                          cursor: isClosed ? 'not-allowed' : 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s',
                          opacity: isClosed ? 0.65 : 1
                        }}
                        onMouseEnter={e => { if (!isSelected && !isClosed) e.currentTarget.style.borderColor = '#0B7B6F' }}
                        onMouseLeave={e => { if (!isSelected && !isClosed) e.currentTarget.style.borderColor = isClosed ? '#CBD5E1' : '#E2EEEC' }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: '700', color: isClosed ? '#94A3B8' : (isSelected ? '#0B7B6F' : '#64748B'), textTransform: 'uppercase', marginBottom: '4px' }}>
                          {d.dayLabel}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: isClosed ? '#94A3B8' : (isSelected ? '#0B7B6F' : '#0A1628') }}>
                          {d.dateLabel}
                        </div>
                        {isClosed && (
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#DC2626', marginTop: '4px', background: '#FEE2E2', padding: '2px 4px', borderRadius: '4px' }}>
                            Holiday / Closed
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</p>}

                <div className="action-row" style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(3)} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
                  <button
                    onClick={() => {
                      if (!selectedDate) {
                        setError('Please select an appointment date.')
                        return
                      }
                      const dateObj = bookingDates.find(d => d.dateStr === selectedDate)
                      if (dateObj?.isHoliday || dateObj?.isSunday) {
                        setError('The clinic is closed on Sundays (Holiday). Please select an open date.')
                        return
                      }
                      setError('')
                      setStep(5)
                    }}
                    className="btn-primary"
                    style={{ flex: 2 }}
                  >
                    Select Time Slot →
                  </button>
                </div>
              </div>
            )}

            {/* Step 5 — Select Time Slot */}
            {step === 5 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', margin: 0 }}>Select Time Slot</h2>
                  {!availability?.isClosed && (
                    <button
                      type="button"
                      onClick={() => fetchAvailability(clinic, selectedDate)}
                      style={{ background: 'none', border: 'none', color: '#0B7B6F', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      🔄 Refresh Slots
                    </button>
                  )}
                </div>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '18px' }}>
                  {clinicObj?.name} · <strong>{bookingDates.find(d => d.dateStr === selectedDate)?.dateLabel || selectedDate}</strong> (15-min slots)
                </p>

                {slotsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                    <div style={{
                      width: '36px', height: '36px', margin: '0 auto 12px',
                      border: '3px solid #E2EEEC', borderTopColor: '#0B7B6F',
                      borderRadius: '50%', animation: 'bookingSpin 0.8s linear infinite'
                    }} />
                    <div style={{ fontSize: '13px' }}>Loading live slot availability...</div>
                  </div>
                ) : availability?.isClosed ? (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌴</div>
                    <div style={{ fontWeight: '700', color: '#92400E', fontSize: '16px', marginBottom: '4px' }}>Clinic Closed on Sundays</div>
                    <div style={{ color: '#B45309', fontSize: '13px', marginBottom: '16px' }}>{availability.message || 'No appointment slots are available on Sundays (Holiday).'}</div>
                    <button onClick={() => setStep(4)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>← Choose Another Date</button>
                  </div>
                ) : slotsError ? (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px', color: '#B91C1C', fontSize: '13px', marginBottom: '20px' }}>
                    {slotsError}
                  </div>
                ) : availability && availability.slots ? (
                  <div>
                    {/* Slot Availability Legend */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', color: '#64748B' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px solid #0B7B6F', background: '#fff' }} /> Available
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0B7B6F' }} /> Selected
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F1F5F9', border: '1px solid #CBD5E1' }} /> Booked / Past
                      </span>
                    </div>

                    {/* Slots Grid grouped by Period */}
                    {['Afternoon', 'Evening'].map(period => {
                      const periodSlots = availability.slots.filter(s => s.period === period || (!s.period && period === 'Evening'))
                      if (periodSlots.length === 0) return null

                      return (
                        <div key={period} style={{ marginBottom: '20px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                            {period} Slots
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '8px' }}>
                            {periodSlots.map(slot => {
                              const isSelected = selectedSlot?.time24 === slot.time24
                              const isAvailable = slot.available

                              return (
                                <button
                                  key={slot.time24}
                                  type="button"
                                  disabled={!isAvailable}
                                  onClick={() => setSelectedSlot(slot)}
                                  style={{
                                    padding: '10px 6px',
                                    borderRadius: '10px',
                                    border: isSelected
                                      ? '2px solid #0B7B6F'
                                      : isAvailable
                                        ? '1.5px solid #CBD5E1'
                                        : '1px solid #E2E8F0',
                                    background: isSelected
                                      ? '#0B7B6F'
                                      : isAvailable
                                        ? '#fff'
                                        : '#F8FAFC',
                                    color: isSelected
                                      ? '#fff'
                                      : isAvailable
                                        ? '#0A1628'
                                        : '#94A3B8',
                                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                                    fontSize: '13px',
                                    fontWeight: isSelected || isAvailable ? '700' : '400',
                                    textAlign: 'center',
                                    transition: 'all 0.15s',
                                    position: 'relative'
                                  }}
                                  onMouseEnter={e => {
                                    if (isAvailable && !isSelected) {
                                      e.currentTarget.style.borderColor = '#0B7B6F'
                                      e.currentTarget.style.background = '#E6F4F2'
                                    }
                                  }}
                                  onMouseLeave={e => {
                                    if (isAvailable && !isSelected) {
                                      e.currentTarget.style.borderColor = '#CBD5E1'
                                      e.currentTarget.style.background = '#fff'
                                    }
                                  }}
                                >
                                  <div>{slot.time12}</div>
                                  {!isAvailable && (
                                    <div style={{ fontSize: '9px', marginTop: '2px', color: '#94A3B8' }}>
                                      {slot.isBooked ? 'Booked' : 'Past'}
                                    </div>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    {selectedSlot && (
                      <div style={{ background: '#E6F4F2', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', border: '1px solid #B2DDD8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#0B7B6F', fontWeight: '700', textTransform: 'uppercase' }}>Selected Slot</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0A1628' }}>
                            {selectedSlot.time12} · {bookingDates.find(d => d.dateStr === selectedDate)?.dateLabel || selectedDate}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#0B7B6F', fontWeight: '600' }}>
                          {clinicObj?.name}
                        </div>
                      </div>
                    )}

                    <div className="action-row" style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setStep(4)} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
                      <button
                        onClick={() => {
                          if (!selectedSlot) {
                            setError('Please select an appointment time slot.')
                            return
                          }
                          setError('')
                          setStep(6)
                        }}
                        disabled={!selectedSlot}
                        className="btn-primary"
                        style={{
                          flex: 2,
                          opacity: !selectedSlot ? 0.6 : 1,
                          cursor: !selectedSlot ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Proceed to Payment →
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Step 6 — Payment Method */}
            {step === 6 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Payment Method</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Choose your payment mode to confirm booking</p>

                {/* Booking Summary Box */}
                <div style={{ background: '#F8FAFA', border: '1px solid #E2EEEC', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                  <div style={{ fontWeight: '700', color: '#0A1628', marginBottom: '8px', fontSize: '13px' }}>Appointment Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: '13px', color: '#64748B' }}>
                    <strong>Doctor:</strong> <span>Dr. Praveen Ramachandra</span>
                    <strong>Clinic:</strong> <span>{clinicObj?.name}</span>
                    <strong>Date & Time:</strong> <span>{bookingDates.find(d => d.dateStr === selectedDate)?.dateLabel || selectedDate} at {selectedSlot?.time12}</span>
                    <strong>Mode:</strong> <span>{consultationMode === 'ONLINE' ? 'Online Consultation' : 'In-Person Consultation'}</span>
                    <strong>Patient:</strong> <span>{form.name} ({form.phone})</span>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div
                      onClick={() => setPaymentMethod('cash')}
                      style={{
                        border: `2px solid ${paymentMethod === 'cash' ? '#0B7B6F' : '#E2EEEC'}`,
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        background: paymentMethod === 'cash' ? '#E6F4F2' : '#fff',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '6px' }}>💵</div>
                      <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '14px' }}>Pay Cash at Clinic</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Pay upon arrival</div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('online')}
                      style={{
                        border: `2px solid ${paymentMethod === 'online' ? '#0B7B6F' : '#E2EEEC'}`,
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        background: paymentMethod === 'online' ? '#E6F4F2' : '#fff',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '6px' }}>📱</div>
                      <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '14px' }}>Pay Online via UPI</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Scan QR & Upload Screenshot</div>
                    </div>
                  </div>

                  {/* QR Code section for Online Payment */}
                  {paymentMethod === 'online' && (
                    <div style={{ background: '#F8FAFA', borderRadius: '14px', padding: '24px', border: '1px solid #E2EEEC', textAlign: 'center', marginBottom: '20px' }}>
                      <div style={{ fontWeight: '700', color: '#0A1628', marginBottom: '6px', fontSize: '15px' }}>Scan UPI QR Code to Pay</div>
                      <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '16px' }}>
                        Scan using GPay, PhonePe, Paytm, or any UPI app
                      </p>

                      <div style={{
                        width: '200px', height: '200px', margin: '0 auto 16px',
                        background: '#fff', padding: '10px', borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        {qrLoading ? (
                          <div style={{ color: '#64748B', fontSize: '12px' }}>Generating QR code...</div>
                        ) : qrError ? (
                          <div style={{ color: '#dc2626', fontSize: '12px', padding: '10px' }}>{qrError}</div>
                        ) : (
                          <img
                            src={qrCodeSrc}
                            alt="UPI QR Code"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#0B7B6F', fontWeight: '700', marginBottom: '16px' }}>
                        UPI ID: {clinicObj?.id === 'thyroplus' ? 'BHARATPE09895931868@yesbankltd' : 'paytmqr64bh34@ptys'}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                          Upload Payment Screenshot *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotSelect}
                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2EEEC', fontSize: '12px' }}
                        />
                        {paymentScreenshot && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#0B7B6F', fontWeight: '600' }}>
                            ✓ {paymentScreenshot.name} attached
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</p>}

                <div className="action-row" style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(5)} className="btn-secondary" style={{ flex: 1 }} disabled={loading}>← Back</button>
                  <button
                    onClick={bookAppointment}
                    disabled={loading || !isPaymentReady()}
                    className="btn-primary"
                    style={{
                      flex: 2,
                      opacity: loading || !isPaymentReady() ? 0.65 : 1,
                      cursor: loading || !isPaymentReady() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 7 — Success / Confirmation Screen */}
            {step === 7 && confirmedBooking && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg,#0B7B6F,#096358)',
                  borderRadius: '20px',
                  padding: '32px 24px',
                  color: '#fff',
                  marginBottom: '24px',
                  boxShadow: '0 8px 30px rgba(11,123,111,0.2)'
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '12px' }}>
                    ✓
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Appointment Confirmed
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: '800', lineHeight: '1.1', marginBottom: '8px' }}>
                    {confirmedBooking.appointmentTime12}
                  </div>
                  <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>
                    {confirmedBooking.appointmentDate}
                  </div>
                </div>

                <div style={{ background: '#F8FAFA', borderRadius: '14px', padding: '20px', border: '1px solid #E2EEEC', textAlign: 'left', marginBottom: '24px' }}>
                  {[
                    ['Reference ID', confirmedBooking.appointmentId],
                    ['Doctor', 'Dr. Praveen Ramachandra'],
                    ['Clinic', confirmedBooking.clinic],
                    ['Patient Name', confirmedBooking.patientName],
                    ['Phone', confirmedBooking.phone],
                    ['Consultation Mode', confirmedBooking.consultationMode === 'ONLINE' ? 'Online Consultation' : 'In-Person Consultation'],
                    ['Payment Method', confirmedBooking.paymentMethod === 'ONLINE' ? 'Paid Online via UPI' : 'Pay Cash at Clinic'],
                    ['Reason', confirmedBooking.reason]
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2EEEC', fontSize: '13px' }}>
                      <span style={{ color: '#64748B', fontWeight: '500' }}>{label}</span>
                      <span style={{ color: '#0A1628', fontWeight: '700', maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#E6F4F2', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: '#0B7B6F', lineHeight: '1.6' }}>
                  Please arrive 10 minutes before your scheduled slot. If you need to reschedule or cancel, please contact the clinic with your Reference ID.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setConfirmedBooking(null)
                    setSelectedSlot(null)
                    setSelectedDate('')
                    setPaymentMethod('cash')
                    setPaymentScreenshot(null)
                    setForm({ name: '', phone: '', doctor: 'Dr. Praveen Ramachandra', reason: '', email: '', place: '' })
                    setClinic('')
                    setConsultationMode('')
                  }}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Book Another Appointment
                </button>
              </div>
            )}

          </div>

          {/* Live Queue widget underneath */}
          <LiveQueue data={queueData} />
        </div>

        <style>{`
          @keyframes bookingSpin {
            to { transform: rotate(360deg); }
          }

          .queue-container { max-width: 580px; }

          @media (max-width: 480px) {
            .queue-container .btn-primary, .queue-container .btn-secondary { width: 100% !important; }
            .queue-container .btn-primary[style] { flex: none !important; }
            .queue-container img[alt*="QR"] { width: 160px !important; height: 160px !important; }
            .queue-container input[type="file"] { width: 100% !important; }
          }

          .queue-progress { flex-wrap: wrap; gap: 8px; }
          .queue-progress .queue-step-label { display: inline-block; margin-right: 6px; }

          .action-row { display: flex; gap: 10px; }
          @media (max-width: 480px) {
            .action-row { flex-direction: column; }
            .action-row .btn-primary, .action-row .btn-secondary { width: 100% !important; flex: none !important; }
            .queue-progress { padding: 8px 6px !important; }
            .queue-progress .queue-step-circle { width: 22px !important; height: 22px !important; font-size: 10px !important; }
            .queue-progress .queue-step-label { font-size: 11px !important; }
          }
        `}</style>
      </div>
    </>
  )
}
