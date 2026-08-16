import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { CLINICS, DOCTOR } from '../data/content'
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

  // Payment states (Option A preserved)
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

  const fetchAvailability = useCallback(async (targetClinic, targetDate) => {
    if (!targetClinic || !targetDate) return

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

      const result = await apiRequest('/appointments/book', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      console.log('[BOOKING RESPONSE] Received:', result)

      if (result && result.success && result.data) {
        setConfirmedAppointment(result.data)
        setStep(7)
      } else {
        setError(result?.message || 'Unable to confirm appointment. Please try again.')
      }
    } catch (err) {
      console.error('[BOOKING ERROR]', err)
      const msg = err.data?.message || err.message || 'Booking failed. Please check slot availability and try again.'
      setError(msg)
      if (err.data?.code === 'SLOT_ALREADY_BOOKED') {
        setSelectedSlot(null)
        fetchAvailability(clinic, selectedDate)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleClinicChange(newClinic) {
    setClinic(newClinic)
    setSelectedSlot(null)
    setError('')
  }

  const clinicObj = CLINICS.find(c => c.id === clinic)

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFA', minHeight: '100vh' }}>
      <SEOMeta
        title="Book Appointment & Live Token Queue — Dr. Praveen Ramakrishnan"
        description="Book your Endocrinology appointment with Dr. Praveen Ramakrishnan at DiaPlus or ThyroPlus clinics, or track your live queue token in real time."
        path="/queue"
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="section-label" style={{ display: 'inline-block', marginBottom: '8px' }}>
            Appointments & Token Tracker
          </span>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '42px', fontWeight: '700', color: '#0A1628', marginBottom: '12px' }}>
            Book Consultation
          </h1>
          <p style={{ color: '#64748B', fontSize: '16px', maxWidth: '520px', margin: '0 auto' }}>
            Schedule an in-person or online video consultation with Dr. Praveen Ramakrishnan
          </p>
        </div>

        <div style={{ display: 'flex', background: '#E2EEEC', borderRadius: '14px', padding: '4px', marginBottom: '36px', maxWidth: '420px', margin: '0 auto 36px' }}>
          <button
            onClick={() => setActiveTab('book')}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '11px', border: 'none',
              background: activeTab === 'book' ? '#0B7B6F' : 'transparent',
              color: activeTab === 'book' ? '#fff' : '#64748B',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: "'DM Sans',sans-serif"
            }}
          >
            📅 Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('track')}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '11px', border: 'none',
              background: activeTab === 'track' ? '#0B7B6F' : 'transparent',
              color: activeTab === 'track' ? '#fff' : '#64748B',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: "'DM Sans',sans-serif"
            }}
          >
            🎫 Live Token Tracker
          </button>
        </div>

        {activeTab === 'book' && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 4px 24px rgba(11,123,111,0.08)', border: '1px solid #E2EEEC' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', left: '20px', right: '20px', height: '2px', background: '#E2EEEC', zIndex: 0 }} />
              <div style={{ position: 'absolute', top: '16px', left: '20px', width: `${((step - 1) / 6) * 100}%`, height: '2px', background: '#0B7B6F', zIndex: 0, transition: 'width 0.3s' }} />

              {['Clinic', 'Mode', 'Details', 'Date', 'Time Slot', 'Payment', 'Confirmed'].map((sName, idx) => {
                const sNum = idx + 1
                const isPassed = step > sNum
                const isCurrent = step === sNum

                return (
                  <div key={sName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: isPassed ? '#0B7B6F' : isCurrent ? '#0B7B6F' : '#fff',
                      border: `2px solid ${isPassed || isCurrent ? '#0B7B6F' : '#CBD5E1'}`,
                      color: isPassed || isCurrent ? '#fff' : '#94A3B8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '700',
                      transition: 'all 0.2s'
                    }}>
                      {isPassed ? '✓' : sNum}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: isCurrent ? '700' : '500', color: isCurrent ? '#0B7B6F' : '#94A3B8', marginTop: '6px', textAlign: 'center' }}>
                      {sName}
                    </span>
                  </div>
                )
              })}
            </div>

            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Select Clinic Location</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Choose which clinic location you would like to visit</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {CLINICS.map(c => {
                    const isSelected = clinic === c.id
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleClinicChange(c.id)}
                        style={{
                          border: `2px solid ${isSelected ? '#0B7B6F' : '#E2EEEC'}`,
                          borderRadius: '16px',
                          padding: '24px 20px',
                          cursor: 'pointer',
                          background: isSelected ? '#E6F4F2' : '#fff',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        {isSelected && (
                          <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#0B7B6F', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>
                            ✓
                          </span>
                        )}
                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>{c.id === 'diaplus' ? '🏥' : '🩺'}</div>
                        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', fontWeight: '700', color: '#0A1628', marginBottom: '4px' }}>{c.name}</h3>
                        <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '12px' }}>{c.timing}</p>
                        <div style={{ display: 'inline-block', background: isSelected ? '#0B7B6F' : '#F1F5F9', color: isSelected ? '#fff' : '#64748B', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px' }}>
                          {c.id === 'diaplus' ? 'Afternoon & Evening Slots' : 'Evening Slots'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</p>}

                <div className="action-row" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (!clinic) {
                        setError('Please select a clinic location.')
                        return
                      }
                      setError('')
                      setStep(2)
                    }}
                    className="btn-primary"
                    style={{ width: '100%' }}
                  >
                    Continue to Consultation Mode →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Consultation Mode</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Choose how you would like to consult with Dr. Praveen</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { id: 'IN_PERSON', title: 'In-Person Consultation', icon: '🏥', desc: `Visit ${clinicObj?.name || 'the clinic'} in person at your scheduled time slot.` },
                    { id: 'ONLINE', title: 'Online Video Consultation', icon: '💻', desc: 'Consult Dr. Praveen securely via a high-definition video call from home.' },
                  ].map(m => {
                    const isSelected = consultationMode === m.id
                    return (
                      <div
                        key={m.id}
                        onClick={() => setConsultationMode(m.id)}
                        style={{
                          border: `2px solid ${isSelected ? '#0B7B6F' : '#E2EEEC'}`,
                          borderRadius: '16px',
                          padding: '24px 20px',
                          cursor: 'pointer',
                          background: isSelected ? '#E6F4F2' : '#fff',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>{m.icon}</div>
                        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', fontWeight: '700', color: '#0A1628', marginBottom: '6px' }}>{m.title}</h3>
                        <p style={{ color: '#64748B', fontSize: '13px', lineHeight: '1.5' }}>{m.desc}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="action-row" style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
                  <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2 }}>Enter Patient Details →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Patient Details</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Please provide the patient's contact and consultation information</p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Patient Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2EEEC', borderRadius: '10px', fontSize: '14px', fontFamily: "'DM Sans',sans-serif", outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#0B7B6F'}
                    onBlur={e => e.target.style.borderColor = '#E2EEEC'}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Phone Number (10 digits) *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2EEEC', borderRadius: '10px', fontSize: '14px', fontFamily: "'DM Sans',sans-serif", outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#0B7B6F'}
                    onBlur={e => e.target.style.borderColor = '#E2EEEC'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2EEEC', borderRadius: '10px', fontSize: '14px', fontFamily: "'DM Sans',sans-serif", outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#0B7B6F'}
                      onBlur={e => e.target.style.borderColor = '#E2EEEC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Place / City (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore"
                      value={form.place}
                      onChange={e => setForm(p => ({ ...p, place: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2EEEC', borderRadius: '10px', fontSize: '14px', fontFamily: "'DM Sans',sans-serif", outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#0B7B6F'}
                      onBlur={e => e.target.style.borderColor = '#E2EEEC'}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Reason for Visit *</label>
                  <select
                    value={form.reason}
                    onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2EEEC', borderRadius: '10px', fontSize: '14px', fontFamily: "'DM Sans',sans-serif", outline: 'none', background: '#fff' }}
                  >
                    <option value="">Select reason...</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="action-row" style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
                  <button
                    onClick={() => {
                      if (!form.name.trim() || !form.phone.trim() || !form.reason) {
                        setError('Please fill in required fields.')
                        return
                      }
                      if (form.phone.replace(/\D/g, '').length < 10) {
                        setError('Please enter a valid 10-digit phone number.')
                        return
                      }
                      setError('')
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

            {step === 4 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Select Date</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>Choose from the next 7 calendar days (Sundays are clinic holidays)</p>

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
                            setSelectedSlot(null)
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
                        <span style={{ fontSize: '12px', color: '#0B7B6F', fontWeight: '700' }}>✓ Ready</span>
                      </div>
                    )}
                  </div>
                ) : null}

                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</p>}

                <div className="action-row" style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(4)} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
                  <button
                    onClick={() => {
                      if (!selectedSlot) {
                        setError('Please select an available time slot.')
                        return
                      }
                      setError('')
                      setStep(6)
                    }}
                    disabled={!selectedSlot}
                    className="btn-primary"
                    style={{ flex: 2, opacity: selectedSlot ? 1 : 0.6, cursor: selectedSlot ? 'pointer' : 'not-allowed' }}
                  >
                    Proceed to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* Step 6 — Payment & Final Confirmation (Payment Option A) */}
            {step === 6 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Payment & Confirm</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>Review your booking and select payment method</p>

                {/* Summary Card */}
                <div style={{ background: '#F8FAFA', borderRadius: '14px', padding: '18px', border: '1px solid #E2EEEC', marginBottom: '20px' }}>
                  {[
                    ['Clinic', clinicObj?.name],
                    ['Mode', consultationMode === 'ONLINE' ? 'Online Consultation' : 'In-Person Consultation'],
                    ['Date', bookingDates.find(d => d.dateStr === selectedDate)?.dateLabel || selectedDate],
                    ['Time Slot', selectedSlot?.time12],
                    ['Patient Name', form.name],
                    ['Phone', form.phone],
                    ['Reason', form.reason],
                    ['Doctor', form.doctor]
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2EEEC', fontSize: '13px' }}>
                      <span style={{ color: '#64748B', fontWeight: '500' }}>{label}</span>
                      <span style={{ color: '#0A1628', fontWeight: '700' }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Option Selector */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                    Payment Options
                  </label>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {['cash', 'online'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        style={{
                          flex: '1 1 140px',
                          padding: '14px',
                          borderRadius: '12px',
                          border: paymentMethod === method ? '2px solid #0B7B6F' : '1px solid #E2EEEC',
                          background: paymentMethod === method ? '#E6F4F2' : '#fff',
                          color: '#0A1628',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '13px',
                          textAlign: 'center'
                        }}
                      >
                        {method === 'cash' ? '💵 Pay at Clinic' : '📱 Pay Online (UPI QR)'}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'cash' && (
                    <div style={{ background: '#F8FAFA', borderRadius: '12px', padding: '16px', border: '1px solid #E2EEEC', marginBottom: '16px' }}>
                      <p style={{ fontSize: '13px', color: '#0A1628', fontWeight: '700', marginBottom: '4px' }}>Pay Cash at Clinic</p>
                      <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>
                        Please pay the consultation fee at reception when you arrive for your scheduled appointment.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'online' && (
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E2EEEC', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#0B7B6F', fontWeight: '700', marginBottom: '4px' }}>Scan & Pay with Any UPI App</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>Google Pay, PhonePe, Paytm, BHIM</div>
                      </div>

                      <div style={{ display: 'grid', justifyItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '200px', height: '200px', borderRadius: '16px', background: '#fff', border: '1px solid #E2EEEC', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
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
                        <div style={{ fontSize: '13px', color: '#0B7B6F', fontWeight: '700' }}>
                          UPI ID: {clinicObj?.id === 'thyroplus' ? 'BHARATPE09895931868@yesbankltd' : 'paytmqr64bh34@ptys'}
                        </div>
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
        )}

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
    </div>
  )
}
