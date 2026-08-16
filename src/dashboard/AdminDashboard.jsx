import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLINICS } from '../data/content'
import { useAuth } from '../hooks/useAuth'
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

function normalizePatient(patient) {
  return {
    ...patient,
    tokenNumber: Number(patient.tokenNumber),
    status: String(patient.status || '').toUpperCase(),
  }
}

function buildQueueState(payload) {
  if (!payload || !Array.isArray(payload.patients)) return null

  const patients = payload.patients.map(normalizePatient)
  const waitingCount = patients.filter(p => p.status === 'WAITING').length
  const serving = patients.find(p => p.status === 'SERVING')

  return {
    currentToken: payload.currentToken ?? payload.currentServing ?? payload.nextServing ?? serving?.tokenNumber ?? null,
    waiting: payload.waiting ?? payload.waitingCount ?? waitingCount,
    estimatedTime: payload.estimatedTime || `${waitingCount * 5} mins`,
    patients,
  }
}

function applyCallNextResult(previousState, payload) {
  if (!previousState || !payload?.queuePatch) return null

  const previousCompleted = payload.queuePatch.previousCompleted
  const nextServing = payload.queuePatch.nextServing
  const nextPatient = payload.nextPatient ? normalizePatient(payload.nextPatient) : null

  const existingPatients = Array.isArray(previousState.patients) ? previousState.patients : []
  const patients = existingPatients.map(patient => {
    const tokenNumber = Number(patient.tokenNumber)

    if (previousCompleted && tokenNumber === Number(previousCompleted)) {
      return { ...patient, status: 'COMPLETED' }
    }

    if (nextServing && tokenNumber === Number(nextServing)) {
      return { ...(nextPatient || patient), tokenNumber, status: 'SERVING' }
    }

    return patient
  })

  return {
    ...previousState,
    currentToken: payload.currentToken ?? nextServing ?? null,
    waiting: payload.waiting ?? patients.filter(p => p.status === 'WAITING').length,
    estimatedTime: payload.estimatedTime || previousState.estimatedTime,
    patients,
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth('admin')

  // Top-level Dashboard Tab: 'queue' or 'appointments'
  const [activeTab, setActiveTab]             = useState('queue')

  // Queue state
  const [clinicId, setClinicId]               = useState('diaplus')
  const [showAdd, setShowAdd]                 = useState(false)
  const [form, setForm]                       = useState({ name: '', phone: '', reason: '' })
  const [adding, setAdding]                   = useState(false)
  const [queueData, setQueueData]             = useState(null)
  const [queueLoading, setQueueLoading]       = useState(true)
  const [completeLoading, setCompleteLoading] = useState(false)
  const [actionLoading, setActionLoading]     = useState(false)
  const [actionError, setActionError]         = useState('')

  // Appointments state
  const [appointments, setAppointments]       = useState([])
  const [apptLoading, setApptLoading]         = useState(false)
  const [apptError, setApptError]             = useState('')
  const [apptSuccess, setApptSuccess]         = useState('')
  const [apptFilterClinic, setApptFilterClinic] = useState('all')
  const [apptFilterDate, setApptFilterDate]   = useState('')
  const [apptFilterStatus, setApptFilterStatus] = useState('all')
  const [cancellingId, setCancellingId]       = useState(null)

  // Current date in IST (Asia/Kolkata)
  const todayIST = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())

  const formattedTodayIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date())

  // Admin Same-Day Manual Slot Booking State
  const [showAddTodayAppt, setShowAddTodayAppt]       = useState(false)
  const [apptClinic, setApptClinic]                   = useState('diaplus')
  const [todaySlotsData, setTodaySlotsData]           = useState(null)
  const [slotsLoading, setSlotsLoading]               = useState(false)
  const [slotsError, setSlotsError]                   = useState('')
  const [selectedSlot, setSelectedSlot]               = useState(null)
  const [manualApptForm, setManualApptForm]           = useState({
    name: '',
    phone: '',
    email: '',
    place: '',
    reason: '',
    customReason: '',
    consultationMode: 'IN_PERSON',
    paymentMethod: 'CASH'
  })
  const [bookingApptLoading, setBookingApptLoading]   = useState(false)
  const [manualApptSuccess, setManualApptSuccess]     = useState('')
  const [manualApptError, setManualApptError]         = useState('')

  // Track pending requests to avoid duplicates
  const pendingRequests = useRef({})
  const lastRefreshTime = useRef({})
  const lastMutationTime = useRef(null)

  // Fetch Today's Slot Availability from Backend
  const fetchTodaySlots = useCallback(async (clinicToFetch) => {
    const c = clinicToFetch || apptClinic
    setSlotsLoading(true)
    setSlotsError('')
    try {
      const response = await apiRequest(`/appointments/today-slots?clinic=${c}`)
      if (response && response.success && response.data) {
        setTodaySlotsData(response.data)
        // If current selected slot is no longer available in fresh data, deselect it
        setSelectedSlot(prev => {
          if (!prev) return null
          const match = response.data.slots.find(s => s.time24 === prev.time24)
          return (match && match.available) ? match : null
        })
      } else {
        setSlotsError(response?.message || "Failed to fetch today's slots.")
      }
    } catch (err) {
      console.error('[AdminDashboard] Fetch today slots error:', err)
      setSlotsError(err.data?.message || err.message || "Failed to fetch today's slots.")
    } finally {
      setSlotsLoading(false)
    }
  }, [apptClinic])

  useEffect(() => {
    if (showAddTodayAppt) {
      fetchTodaySlots(apptClinic)
    }
  }, [showAddTodayAppt, apptClinic, fetchTodaySlots])

  // Fetch Queue Data
  const refreshQueue = useCallback(async (forceRefresh = false) => {
    const cacheKey = `queue_${clinicId}`
    const now = Date.now()

    if (lastMutationTime.current && now - lastMutationTime.current < 3000 && !forceRefresh) {
      return
    }

    if (!forceRefresh && lastRefreshTime.current[cacheKey] && now - lastRefreshTime.current[cacheKey] < 200) {
      return
    }

    if (pendingRequests.current[cacheKey]) {
      return
    }

    pendingRequests.current[cacheKey] = true
    lastRefreshTime.current[cacheKey] = now

    try {
      const json = await apiRequest(`/queue?clinic=${clinicId}`)
      setQueueData(buildQueueState(json?.data ?? null))
    } catch (error) {
      console.error('[AdminDashboard] Queue fetch failed:', error)
      setQueueData(null)
    } finally {
      setQueueLoading(false)
      delete pendingRequests.current[cacheKey]
    }
  }, [clinicId])

  useEffect(() => {
    setQueueLoading(true)
    refreshQueue(true)
  }, [clinicId, refreshQueue])

  // Fetch Appointments Data
  const fetchAppointments = useCallback(async () => {
    setApptLoading(true)
    setApptError('')
    try {
      const params = new URLSearchParams()
      if (apptFilterClinic && apptFilterClinic !== 'all') {
        params.append('clinic', apptFilterClinic)
      }
      if (apptFilterDate) {
        params.append('date', apptFilterDate)
      }
      if (apptFilterStatus && apptFilterStatus !== 'all') {
        params.append('status', apptFilterStatus)
      }
      const query = params.toString() ? `?${params.toString()}` : ''
      const response = await apiRequest(`/appointments${query}`)
      if (response && response.success && Array.isArray(response.data)) {
        setAppointments(response.data)
      } else {
        setAppointments([])
      }
    } catch (err) {
      console.error('[AdminDashboard] Fetch appointments error:', err)
      setApptError(err.data?.message || err.message || 'Failed to fetch appointments.')
    } finally {
      setApptLoading(false)
    }
  }, [apptFilterClinic, apptFilterDate, apptFilterStatus])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Cancel Appointment Action
  async function handleCancelAppointment(id) {
    if (!id || cancellingId) return
    const confirmed = window.confirm('Are you sure you want to cancel this appointment? The 15-minute slot will be immediately freed.')
    if (!confirmed) return

    setCancellingId(id)
    setApptError('')
    setApptSuccess('')
    try {
      const response = await apiRequest(`/appointments/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({})
      })
      if (response && response.success) {
        setApptSuccess(`Appointment #${id.slice(0, 8)} has been cancelled and the slot is released.`)
        await fetchAppointments()
        if (showAddTodayAppt) {
          await fetchTodaySlots(apptClinic)
        }
      } else {
        setApptError(response?.message || 'Failed to cancel appointment.')
      }
    } catch (err) {
      console.error('[AdminDashboard] Cancel appointment error:', err)
      setApptError(err.data?.message || err.message || 'Failed to cancel appointment.')
    } finally {
      setCancellingId(null)
    }
  }

  // Admin Same-Day Manual Slot Booking Action
  async function handleManualBookAppointment() {
    if (bookingApptLoading) return
    if (!selectedSlot) {
      setManualApptError('Please select an available appointment slot from the grid.')
      return
    }
    if (!manualApptForm.name.trim()) {
      setManualApptError('Patient Full Name is required.')
      return
    }
    const cleanPhone = manualApptForm.phone.replace(/\D/g, '')
    if (cleanPhone.length !== 10) {
      setManualApptError('Please enter a valid 10-digit phone number.')
      return
    }
    const finalReason = manualApptForm.reason === 'Other' && manualApptForm.customReason.trim()
      ? manualApptForm.customReason.trim()
      : manualApptForm.reason
    if (!finalReason) {
      setManualApptError('Please select or specify a reason for visit.')
      return
    }

    setBookingApptLoading(true)
    setManualApptError('')
    setManualApptSuccess('')

    try {
      const requestBody = {
        clinic: apptClinic,
        consultationMode: manualApptForm.consultationMode,
        appointmentDate: todayIST,
        appointmentTime: selectedSlot.time24,
        name: manualApptForm.name.trim(),
        phone: cleanPhone,
        email: manualApptForm.email.trim() || undefined,
        place: manualApptForm.place.trim() || undefined,
        reason: finalReason,
        paymentMethod: manualApptForm.paymentMethod
      }

      const response = await apiRequest('/appointments/admin/book-today', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      if (response && response.success && response.data) {
        const refId = response.data.referenceId || response.data.appointmentId.slice(0, 8).toUpperCase()
        const successMsg = `Appointment #${refId} booked successfully for ${response.data.patientName} at ${response.data.appointmentTime12} (${response.data.clinic})!`
        setManualApptSuccess(successMsg)
        setApptSuccess(successMsg)

        // Reset form
        setManualApptForm({
          name: '',
          phone: '',
          email: '',
          place: '',
          reason: '',
          customReason: '',
          consultationMode: 'IN_PERSON',
          paymentMethod: 'CASH'
        })
        setSelectedSlot(null)

        // Refresh slot availability & appointment lists
        await fetchTodaySlots(apptClinic)
        await fetchAppointments()
      } else {
        throw new Error(response?.message || 'Failed to book appointment.')
      }
    } catch (err) {
      console.error('[AdminDashboard] Manual appointment booking error:', err)
      if (err.status === 409 || err.data?.code === 'SLOT_ALREADY_BOOKED') {
        setManualApptError('This slot was just booked. Please select another available slot.')
        setSelectedSlot(null)
        await fetchTodaySlots(apptClinic)
      } else {
        setManualApptError(err.data?.message || err.message || 'Failed to book appointment.')
      }
    } finally {
      setBookingApptLoading(false)
    }
  }

  const apiPatients = Array.isArray(queueData?.patients) ? queueData.patients : []
  const waiting     = apiPatients.filter(p => p.status === 'WAITING')
  const serving     = apiPatients.find(p => p.status === 'SERVING')
  const completed   = apiPatients.filter(p => p.status === 'COMPLETED')
  const revenue     = completed.length * 750

  async function addPatient() {
    if (!form.name || !form.phone || !form.reason) return
    setAdding(true)
    try {
      const response = await apiRequest('/queue/add', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, phone: form.phone, reason: form.reason, clinic: clinicId })
      })

      if (response?.data?.patients) {
        setQueueData(buildQueueState(response.data))
      } else {
        await refreshQueue(true)
      }
    } catch (error) {
      console.error('[AdminDashboard] Add patient failed:', error)
      setActionError(error?.message || 'Failed to add patient.')
    } finally {
      setForm({ name: '', phone: '', reason: '' })
      setShowAdd(false)
      setAdding(false)
    }
  }

  async function callNext() {
    if (waiting.length === 0 || actionLoading) {
      return
    }

    setActionLoading(true)
    setActionError('')
    lastMutationTime.current = Date.now()

    const nextPatient = waiting[0]
    const currentServing = serving
    const previousQueueData = queueData

    setQueueData(buildQueueState({
      ...queueData,
      currentToken: nextPatient.tokenNumber,
      patients: queueData.patients.map(p => {
        const tokenNumber = Number(p.tokenNumber)
        if (currentServing && tokenNumber === Number(currentServing.tokenNumber)) {
          return { ...p, status: 'COMPLETED' }
        }
        if (tokenNumber === Number(nextPatient.tokenNumber)) {
          return { ...p, status: 'SERVING' }
        }
        return p
      }),
    }))

    try {
      const response = await apiRequest('/queue/next', {
        method: 'POST',
        body: JSON.stringify({ clinic: clinicId })
      })

      if (response?.data?.patients && Array.isArray(response.data.patients)) {
        setQueueData(buildQueueState(response.data))
      } else if (response?.data?.queuePatch) {
        setQueueData(current => applyCallNextResult(current, response.data) || current)
      } else {
        await refreshQueue(true)
      }
    } catch (error) {
      console.error('[AdminDashboard] callNext error:', error)
      setActionError(error?.message || 'Failed to call next patient. Please try again.')
      setQueueData(previousQueueData)
      await refreshQueue(true)
    } finally {
      setActionLoading(false)
    }
  }

  async function markDone() {
    if (!serving?.tokenNumber || completeLoading) {
      return
    }

    setCompleteLoading(true)
    setActionError('')
    const servingTokenNumber = Number(serving.tokenNumber)
    lastMutationTime.current = Date.now()
    const previousQueueData = queueData

    setQueueData(buildQueueState({
      ...queueData,
      currentToken: null,
      patients: queueData.patients.map(p =>
        Number(p.tokenNumber) === servingTokenNumber ? { ...p, status: 'COMPLETED' } : p
      ),
    }))

    try {
      const response = await apiRequest(`/queue/complete/${servingTokenNumber}`, {
        method: 'PATCH',
        body: JSON.stringify({ clinic: clinicId })
      })

      if (response?.data?.patients && Array.isArray(response.data.patients)) {
        setQueueData(buildQueueState(response.data))
      } else {
        await refreshQueue(true)
      }
    } catch (error) {
      console.error('[AdminDashboard] Mark done failed with error:', error)
      setActionError(error?.message || 'Failed to mark patient as complete. Please try again.')
      setQueueData(previousQueueData)
      await refreshQueue(true)
    } finally {
      setCompleteLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #E2EEEC', borderRadius: '9px',
    fontSize: '14px', fontFamily: "'DM Sans',sans-serif",
    outline: 'none', boxSizing: 'border-box', background: '#F8FAFA',
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: '700', color: '#0B7B6F',
    textTransform: 'uppercase', letterSpacing: '0.8px',
    display: 'block', marginBottom: '8px',
  }

  // Calculate today's date & current time in IST (Asia/Kolkata)
  function isAppointmentExpired(appointmentDate, appointmentTime) {
    if (!appointmentDate) return true
    const now = new Date()
    const todayIST = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now)

    const currentTimeIST = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now)

    if (appointmentDate < todayIST) return true
    if (appointmentDate === todayIST) {
      if (!appointmentTime) return false
      return appointmentTime < currentTimeIST
    }
    return false
  }

  // Active / displayed appointments calculation
  const isDateFiltered = Boolean(apptFilterDate)

  const displayedAppointments = appointments.filter(a => {
    // If the user explicitly selects a date filter, show all appointments matching that date
    if (isDateFiltered) return true
    // If user explicitly filters for COMPLETED or CANCELLED status, show them
    if (apptFilterStatus === 'COMPLETED' || apptFilterStatus === 'CANCELLED') return true
    // In default active/upcoming view, exclude expired appointments
    return !isAppointmentExpired(a.appointmentDate, a.appointmentTime)
  })

  // Scheduled count represents currently active upcoming appointments (or scheduled on selected date)
  const scheduledCount = appointments.filter(a => {
    const isScheduledStatus = a.status === 'CONFIRMED' || a.status === 'PENDING'
    if (!isScheduledStatus) return false
    if (isDateFiltered) return true
    return !isAppointmentExpired(a.appointmentDate, a.appointmentTime)
  }).length

  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length
  const cancelledCount = appointments.filter(a => a.status === 'CANCELLED').length
  const totalBookingsCount = isDateFiltered ? appointments.length : displayedAppointments.length

  return (
    <>
      <SEOMeta pageKey="admin" />
      <div style={{ minHeight: '100vh', background: '#F0F4F4', fontFamily: "'DM Sans',sans-serif" }}>

        {/* ── HEADER ── */}
        <div style={{
          background: '#0A1628', padding: '0 20px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'linear-gradient(135deg,#0B7B6F,#096358)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Cormorant Garamond',serif", fontWeight: '700',
              color: '#fff', fontSize: '13px', flexShrink: 0,
            }}>PR</div>
            <div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', lineHeight: '1.2' }}>Admin Dashboard</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Healthcare Operations</div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeTab === 'queue' && (
              <div style={{ display: 'flex', gap: '6px', marginRight: '6px' }}>
                {CLINICS.map(c => (
                  <button key={c.id} onClick={() => setClinicId(c.id)} style={{
                    padding: '6px 12px', borderRadius: '7px',
                    border: `1.5px solid ${clinicId === c.id ? '#0B7B6F' : 'rgba(255,255,255,0.15)'}`,
                    background: clinicId === c.id ? '#0B7B6F' : 'transparent',
                    color: '#fff', fontSize: '11px', fontWeight: '600',
                    cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                  }}>
                    {c.id === 'diaplus' ? 'Diaplus' : 'Thyroplus'}
                  </button>
                ))}
              </div>
            )}
            <button onClick={logout} style={{
              padding: '6px 12px', borderRadius: '7px',
              border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'rgba(255,255,255,0.6)',
              fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            }}>Logout</button>
          </div>
        </div>

        {/* ── SUB-HEADER TABS (Queue vs Appointments) ── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E2EEEC', padding: '0 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '24px' }}>
            <button
              onClick={() => setActiveTab('queue')}
              style={{
                background: 'none', border: 'none',
                padding: '16px 0',
                borderBottom: activeTab === 'queue' ? '3px solid #0B7B6F' : '3px solid transparent',
                color: activeTab === 'queue' ? '#0B7B6F' : '#64748B',
                fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <span>🚶 Live Queue Manager</span>
              <span style={{ fontSize: '11px', background: activeTab === 'queue' ? '#E6F4F2' : '#F1F5F9', color: activeTab === 'queue' ? '#0B7B6F' : '#64748B', padding: '2px 8px', borderRadius: '12px' }}>
                {waiting.length} waiting
              </span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              style={{
                background: 'none', border: 'none',
                padding: '16px 0',
                borderBottom: activeTab === 'appointments' ? '3px solid #0B7B6F' : '3px solid transparent',
                color: activeTab === 'appointments' ? '#0B7B6F' : '#64748B',
                fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <span>📅 Scheduled Appointments</span>
              <span style={{ fontSize: '11px', background: activeTab === 'appointments' ? '#E6F4F2' : '#F1F5F9', color: activeTab === 'appointments' ? '#0B7B6F' : '#64748B', padding: '2px 8px', borderRadius: '12px' }}>
                {scheduledCount} active
              </span>
            </button>
          </div>
        </div>

        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

          {/* ════════════════════════════════════════════════ */}
          {/* TAB 1: LIVE QUEUE MANAGEMENT (Preserved 100%)    */}
          {/* ════════════════════════════════════════════════ */}
          {activeTab === 'queue' && (
            <div>
              {actionError && (
                <div style={{
                  background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C',
                  borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px',
                }}>
                  {actionError}
                </div>
              )}

              {/* Stats Grid */}
              <div className="admin-stats" style={{
                display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                gap: '12px', marginBottom: '20px',
              }}>
                {[
                  { label: 'Currently Serving', val: queueLoading ? '...' : (queueData?.currentToken ?? 0), color: '#0A1628' },
                  { label: 'Patients Waiting',  val: queueLoading ? '...' : (queueData?.waiting ?? waiting.length), color: '#F59E0B' },
                  { label: 'Completed Today',   val: completed.length, color: '#0B7B6F' },
                  { label: 'Revenue Today',     val: `₹${revenue.toLocaleString()}`, color: '#0B7B6F' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: '#fff', borderRadius: '12px', padding: '16px 14px',
                    border: '1px solid #E2EEEC', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '30px', fontWeight: '700', color: s.color, lineHeight: '1' }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Main Queue Section */}
              <div className="admin-main" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>

                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Now Consulting Card */}
                  <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E2EEEC' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>Now Consulting</div>
                    {serving ? (
                      <div>
                        <div style={{
                          background: 'linear-gradient(135deg,#E6F4F2,#EFF7F6)',
                          borderRadius: '10px', padding: '14px', marginBottom: '14px',
                          borderLeft: '4px solid #0B7B6F',
                        }}>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0B7B6F', fontFamily: "'Cormorant Garamond',serif" }}>
                            #{String(serving.tokenNumber).padStart(2, '0')}
                          </div>
                          <div style={{ fontWeight: '700', color: '#0A1628', marginTop: '4px', fontSize: '14px' }}>{serving.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{serving.reason ?? serving.phone}</div>
                          <div style={{ fontSize: '11px', color: '#0B7B6F', fontWeight: '700', marginTop: '4px' }}>{serving.consultationMode || 'N/A'}</div>
                        </div>
                        <button onClick={markDone} disabled={completeLoading} style={{
                          width: '100%', background: '#0B7B6F', color: '#fff',
                          border: 'none', borderRadius: '9px', padding: '11px',
                          fontSize: '13px', fontWeight: '700',
                          cursor: completeLoading ? 'not-allowed' : 'pointer',
                          fontFamily: "'DM Sans',sans-serif", opacity: completeLoading ? 0.7 : 1,
                        }}>
                          {completeLoading ? 'Completing...' : 'Mark Complete'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', padding: '16px 0' }}>No active consultation</div>
                    )}
                  </div>

                  {/* Call Next Button */}
                  <button onClick={callNext} disabled={waiting.length === 0 || actionLoading} style={{
                    background: waiting.length > 0 ? 'linear-gradient(135deg,#0B7B6F,#096358)' : '#E2EEEC',
                    color: waiting.length > 0 ? '#fff' : '#94A3B8',
                    border: 'none', borderRadius: '12px', padding: '16px',
                    fontSize: '14px', fontWeight: '700',
                    cursor: waiting.length > 0 && !actionLoading ? 'pointer' : 'not-allowed',
                    boxShadow: waiting.length > 0 ? '0 4px 16px rgba(11,123,111,0.25)' : 'none',
                    fontFamily: "'DM Sans',sans-serif", transition: '0.2s',
                    opacity: actionLoading ? 0.7 : 1,
                  }}>
                    {actionLoading ? 'Calling next...' : 'Call Next Patient'}
                  </button>

                  {/* Actions Group: Live Queue vs Scheduled Appointment */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Add Patient Toggle (Live Queue) */}
                    <button onClick={() => { setShowAdd(!showAdd); if (!showAdd) setShowAddTodayAppt(false); }} style={{
                      background: '#fff', color: '#0B7B6F',
                      border: '1.5px solid #B2DDD8', borderRadius: '12px',
                      padding: '13px', fontSize: '13px', fontWeight: '700',
                      cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                    }}>
                      {showAdd ? '✕ Cancel Live Queue Entry' : '+ Add Patient Manually (Live Queue)'}
                    </button>

                    {/* Add Today's Appointment Toggle (15-Min Slot) */}
                    <button onClick={() => {
                      const nextState = !showAddTodayAppt;
                      setShowAddTodayAppt(nextState);
                      if (nextState) {
                        setShowAdd(false);
                        setApptClinic(clinicId);
                        fetchTodaySlots(clinicId);
                      }
                    }} style={{
                      background: showAddTodayAppt ? 'linear-gradient(135deg,#0B7B6F,#096358)' : '#E6F4F2',
                      color: showAddTodayAppt ? '#fff' : '#0B7B6F',
                      border: '1.5px solid #0B7B6F', borderRadius: '12px',
                      padding: '13px', fontSize: '13px', fontWeight: '700',
                      cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: showAddTodayAppt ? '0 4px 12px rgba(11,123,111,0.2)' : 'none',
                      transition: 'all 0.2s'
                    }}>
                      <span>📅</span>
                      <span>{showAddTodayAppt ? "✕ Close Today's Appointment Booking" : "+ Add Today's Appointment"}</span>
                    </button>
                  </div>

                  {/* 1. Live Queue Manual Entry Form */}
                  {showAdd && (
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E2EEEC' }}>
                      <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '14px', marginBottom: '12px' }}>Add to Live Waiting Queue</div>
                      {[
                        { label: 'Patient Name', key: 'name', type: 'text', ph: 'Full name' },
                        { label: 'Phone Number', key: 'phone', type: 'tel', ph: '10-digit number' },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: '14px' }}>
                          <label style={labelStyle}>{f.label}</label>
                          <input
                            type={f.type} placeholder={f.ph}
                            value={form[f.key]}
                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            maxLength={f.key === 'phone' ? 10 : undefined}
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = '#0B7B6F'}
                            onBlur={e => e.target.style.borderColor = '#E2EEEC'}
                          />
                        </div>
                      ))}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Reason</label>
                        <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} style={{ ...inputStyle }}>
                          <option value="">Select reason...</option>
                          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <button onClick={addPatient} disabled={adding} style={{
                        width: '100%', background: '#0B7B6F', color: '#fff',
                        border: 'none', borderRadius: '9px', padding: '11px',
                        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                        fontFamily: "'DM Sans',sans-serif", opacity: adding ? 0.7 : 1,
                      }}>
                        {adding ? 'Adding...' : 'Add to Queue'}
                      </button>
                    </div>
                  )}

                  {/* 2. Admin Same-Day Manual Slot Booking Interface */}
                  {showAddTodayAppt && (
                    <div style={{
                      background: '#fff',
                      borderRadius: '14px',
                      padding: '20px',
                      border: '1.5px solid #B2DDD8',
                      boxShadow: '0 4px 20px rgba(11,123,111,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2EEEC', paddingBottom: '12px' }}>
                        <div>
                          <div style={{ fontWeight: '800', color: '#0A1628', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📅</span> Schedule Today's Appointment
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            Assign a 15-min slot for <strong style={{ color: '#0B7B6F' }}>TODAY ({formattedTodayIST})</strong>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '10px', fontWeight: '700', background: '#E6F4F2', color: '#0B7B6F',
                          padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.5px'
                        }}>
                          Asia/Kolkata (IST)
                        </span>
                      </div>

                      {/* Success Alert */}
                      {manualApptSuccess && (
                        <div style={{
                          background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                          borderRadius: '9px', padding: '10px 14px', fontSize: '12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <span>✓ {manualApptSuccess}</span>
                          <button onClick={() => setManualApptSuccess('')} style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                        </div>
                      )}

                      {/* Error Alert */}
                      {manualApptError && (
                        <div style={{
                          background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C',
                          borderRadius: '9px', padding: '10px 14px', fontSize: '12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <span>⚠️ {manualApptError}</span>
                          <button onClick={() => setManualApptError('')} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                        </div>
                      )}

                      {/* Step 1: Clinic Selection */}
                      <div>
                        <label style={labelStyle}>Step 1: Select Clinic</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {[
                            { id: 'diaplus', name: 'DiaPlus Clinic' },
                            { id: 'thyroplus', name: 'ThyroPlus Clinic' }
                          ].map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                if (apptClinic !== c.id) {
                                  setApptClinic(c.id)
                                  setSelectedSlot(null)
                                  setManualApptError('')
                                  fetchTodaySlots(c.id)
                                }
                              }}
                              style={{
                                padding: '10px 8px',
                                borderRadius: '9px',
                                border: `1.5px solid ${apptClinic === c.id ? '#0B7B6F' : '#E2EEEC'}`,
                                background: apptClinic === c.id ? '#0B7B6F' : '#F8FAFA',
                                color: apptClinic === c.id ? '#fff' : '#0A1628',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontFamily: "'DM Sans',sans-serif",
                                transition: 'all 0.2s'
                              }}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Step 2 & 3: Slot Grid with Live Availability */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ ...labelStyle, marginBottom: 0 }}>Step 2: Select 15-Min Available Slot</label>
                          <button
                            type="button"
                            onClick={() => fetchTodaySlots(apptClinic)}
                            disabled={slotsLoading}
                            style={{
                              background: 'none', border: 'none', color: '#0B7B6F',
                              fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            {slotsLoading ? '⏳ Refreshing...' : '🔄 Refresh Slots'}
                          </button>
                        </div>

                        {slotsError && (
                          <div style={{ color: '#DC2626', fontSize: '11px', marginBottom: '8px' }}>{slotsError}</div>
                        )}

                        {slotsLoading && !todaySlotsData ? (
                          <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '12px', background: '#F8FAFA', borderRadius: '9px' }}>
                            ⏳ Loading today's slot availability...
                          </div>
                        ) : todaySlotsData?.isClosed ? (
                          <div style={{
                            background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '10px',
                            padding: '18px 16px', textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '24px', marginBottom: '6px' }}>🌴</div>
                            <div style={{ fontWeight: '800', color: '#92400E', fontSize: '13px', marginBottom: '3px' }}>
                              Sunday Holiday — Clinic Closed
                            </div>
                            <div style={{ color: '#B45309', fontSize: '11px', lineHeight: '1.4' }}>
                              {todaySlotsData.message || 'The clinic is closed on Sundays. Same-day appointments cannot be scheduled today.'}
                            </div>
                          </div>
                        ) : todaySlotsData ? (
                          <div>
                            {/* Stats Badge */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '11px' }}>
                              <span style={{ color: '#065F46', background: '#D1FAE5', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                ✓ {todaySlotsData.availableCount} Available
                              </span>
                              <span style={{ color: '#991B1B', background: '#FEE2E2', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                ● {todaySlotsData.bookedCount} Booked
                              </span>
                              <span style={{ color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                Total: {todaySlotsData.totalSlots} Slots
                              </span>
                            </div>

                            {/* Slot Grid */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))',
                              gap: '6px',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              padding: '4px',
                              border: '1px solid #E2EEEC',
                              borderRadius: '9px',
                              background: '#F8FAFA'
                            }}>
                              {todaySlotsData.slots.map(slot => {
                                const isSelected = selectedSlot?.time24 === slot.time24
                                const isAvailable = slot.available
                                const isBooked = slot.isBooked
                                const isPast = slot.isPast

                                return (
                                  <button
                                    key={slot.time24}
                                    type="button"
                                    disabled={!isAvailable}
                                    onClick={() => {
                                      if (isAvailable) {
                                        setSelectedSlot(slot)
                                        setManualApptError('')
                                      }
                                    }}
                                    title={isBooked ? 'Slot is already booked' : isPast ? 'Slot has already passed' : 'Click to select this slot'}
                                    style={{
                                      padding: '8px 4px',
                                      borderRadius: '8px',
                                      border: `1.5px solid ${isSelected ? '#0B7B6F' : isAvailable ? '#A7F3D0' : '#E2E8F0'}`,
                                      background: isSelected
                                        ? 'linear-gradient(135deg,#0B7B6F,#096358)'
                                        : isAvailable
                                          ? '#FFFFFF'
                                          : '#F1F5F9',
                                      color: isSelected
                                        ? '#FFFFFF'
                                        : isAvailable
                                          ? '#065F46'
                                          : '#94A3B8',
                                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                                      opacity: isAvailable ? 1 : 0.65,
                                      fontFamily: "'DM Sans',sans-serif",
                                      textAlign: 'center',
                                      boxShadow: isSelected ? '0 2px 8px rgba(11,123,111,0.3)' : 'none',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <div style={{ fontSize: '11px', fontWeight: '700' }}>{slot.time12}</div>
                                    <div style={{
                                      fontSize: '9px',
                                      fontWeight: '700',
                                      marginTop: '2px',
                                      color: isSelected ? '#E6F4F2' : isBooked ? '#DC2626' : isPast ? '#94A3B8' : '#0B7B6F',
                                      textTransform: 'uppercase'
                                    }}>
                                      {isSelected ? '✓ Selected' : isBooked ? 'Booked' : isPast ? 'Past' : 'Open'}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Step 4 & 5: Patient Details & Confirmation */}
                      {selectedSlot ? (
                        <div style={{ borderTop: '1px solid #E2EEEC', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Selected Slot Highlight Card */}
                          <div style={{
                            background: '#E6F4F2', border: '1px solid #B2DDD8', borderRadius: '10px',
                            padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Selected Slot</div>
                              <div style={{ fontWeight: '800', color: '#0A1628', fontSize: '14px', marginTop: '2px' }}>
                                {selectedSlot.time12} · {apptClinic === 'diaplus' ? 'DiaPlus' : 'ThyroPlus'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>Date: TODAY ({todayIST})</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedSlot(null)}
                              style={{ background: 'none', border: '1px solid #0B7B6F', color: '#0B7B6F', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              Change Slot
                            </button>
                          </div>

                          <label style={labelStyle}>Step 3: Patient Information</label>

                          <div>
                            <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Patient Full Name *</label>
                            <input
                              type="text"
                              placeholder="Full name of patient"
                              value={manualApptForm.name}
                              onChange={e => setManualApptForm(p => ({ ...p, name: e.target.value }))}
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Phone Number (10 digits) *</label>
                            <input
                              type="tel"
                              placeholder="10-digit mobile number"
                              maxLength={10}
                              value={manualApptForm.phone}
                              onChange={e => setManualApptForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                              style={inputStyle}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Email (Optional)</label>
                              <input
                                type="email"
                                placeholder="patient@example.com"
                                value={manualApptForm.email}
                                onChange={e => setManualApptForm(p => ({ ...p, email: e.target.value }))}
                                style={{ ...inputStyle, padding: '9px 12px', fontSize: '13px' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Place / City (Optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. Bangalore"
                                value={manualApptForm.place}
                                onChange={e => setManualApptForm(p => ({ ...p, place: e.target.value }))}
                                style={{ ...inputStyle, padding: '9px 12px', fontSize: '13px' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Reason for Visit *</label>
                            <select
                              value={manualApptForm.reason}
                              onChange={e => setManualApptForm(p => ({ ...p, reason: e.target.value }))}
                              style={{ ...inputStyle, padding: '9px 12px' }}
                            >
                              <option value="">Select reason for visit...</option>
                              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {manualApptForm.reason === 'Other' && (
                              <input
                                type="text"
                                placeholder="Specify custom reason"
                                value={manualApptForm.customReason}
                                onChange={e => setManualApptForm(p => ({ ...p, customReason: e.target.value }))}
                                style={{ ...inputStyle, marginTop: '8px', padding: '9px 12px' }}
                              />
                            )}
                          </div>

                          {/* Consultation Mode */}
                          <div>
                            <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Consultation Mode</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setManualApptForm(p => ({ ...p, consultationMode: 'IN_PERSON' }))}
                                style={{
                                  padding: '9px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${manualApptForm.consultationMode === 'IN_PERSON' ? '#0B7B6F' : '#E2EEEC'}`,
                                  background: manualApptForm.consultationMode === 'IN_PERSON' ? '#E6F4F2' : '#F8FAFA',
                                  color: manualApptForm.consultationMode === 'IN_PERSON' ? '#0B7B6F' : '#64748B',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                🏥 In-Person
                              </button>
                              <button
                                type="button"
                                onClick={() => setManualApptForm(p => ({ ...p, consultationMode: 'ONLINE' }))}
                                style={{
                                  padding: '9px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${manualApptForm.consultationMode === 'ONLINE' ? '#1D4ED8' : '#E2EEEC'}`,
                                  background: manualApptForm.consultationMode === 'ONLINE' ? '#EFF6FF' : '#F8FAFA',
                                  color: manualApptForm.consultationMode === 'ONLINE' ? '#1D4ED8' : '#64748B',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                💻 Online Video
                              </button>
                            </div>
                          </div>

                          {/* Payment Method */}
                          <div>
                            <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Payment Method</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setManualApptForm(p => ({ ...p, paymentMethod: 'CASH' }))}
                                style={{
                                  padding: '9px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${manualApptForm.paymentMethod === 'CASH' ? '#0B7B6F' : '#E2EEEC'}`,
                                  background: manualApptForm.paymentMethod === 'CASH' ? '#E6F4F2' : '#F8FAFA',
                                  color: manualApptForm.paymentMethod === 'CASH' ? '#0B7B6F' : '#64748B',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                💵 Cash at Clinic
                              </button>
                              <button
                                type="button"
                                onClick={() => setManualApptForm(p => ({ ...p, paymentMethod: 'ONLINE_UPI' }))}
                                style={{
                                  padding: '9px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${manualApptForm.paymentMethod === 'ONLINE_UPI' ? '#0B7B6F' : '#E2EEEC'}`,
                                  background: manualApptForm.paymentMethod === 'ONLINE_UPI' ? '#E6F4F2' : '#F8FAFA',
                                  color: manualApptForm.paymentMethod === 'ONLINE_UPI' ? '#0B7B6F' : '#64748B',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                📱 Online / UPI
                              </button>
                            </div>
                          </div>

                          {/* Confirmation Summary Box */}
                          <div style={{
                            background: '#F8FAFA', border: '1px solid #E2EEEC', borderRadius: '10px',
                            padding: '12px 14px', fontSize: '12px'
                          }}>
                            <div style={{ fontWeight: '700', color: '#0A1628', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Booking Summary:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', color: '#475569' }}>
                              <strong>Patient:</strong> <span>{manualApptForm.name || '—'} {manualApptForm.phone ? `(${manualApptForm.phone})` : ''}</span>
                              <strong>Clinic:</strong> <span>{apptClinic === 'diaplus' ? 'DiaPlus Endocrinology' : 'ThyroPlus Endocrinology'}</span>
                              <strong>Date:</strong> <span>TODAY ({formattedTodayIST})</span>
                              <strong>Time:</strong> <span style={{ fontWeight: '700', color: '#0B7B6F' }}>{selectedSlot.time12}</span>
                              <strong>Mode:</strong> <span>{manualApptForm.consultationMode === 'ONLINE' ? '💻 Online Video' : '🏥 In-Person'}</span>
                              <strong>Payment:</strong> <span>{manualApptForm.paymentMethod === 'ONLINE_UPI' ? '📱 Online / UPI' : '💵 Cash'}</span>
                              <strong>Reason:</strong> <span>{manualApptForm.reason === 'Other' ? (manualApptForm.customReason || 'Other') : (manualApptForm.reason || '—')}</span>
                            </div>
                          </div>

                          {/* Book Appointment Action Button */}
                          <button
                            type="button"
                            onClick={handleManualBookAppointment}
                            disabled={bookingApptLoading}
                            style={{
                              width: '100%', background: 'linear-gradient(135deg,#0B7B6F,#096358)', color: '#fff',
                              border: 'none', borderRadius: '10px', padding: '13px',
                              fontSize: '14px', fontWeight: '700', cursor: bookingApptLoading ? 'not-allowed' : 'pointer',
                              fontFamily: "'DM Sans',sans-serif", opacity: bookingApptLoading ? 0.7 : 1,
                              boxShadow: '0 4px 14px rgba(11,123,111,0.25)',
                              transition: 'all 0.2s'
                            }}
                          >
                            {bookingApptLoading ? '⏳ Booking Appointment...' : `Confirm & Book Slot (${selectedSlot.time12})`}
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center', padding: '14px', background: '#F8FAFA',
                          borderRadius: '9px', color: '#64748B', fontSize: '12px', border: '1px dashed #CBD5E1'
                        }}>
                          👆 Please click an <strong style={{ color: '#0B7B6F' }}>OPEN</strong> slot above to continue with booking.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Queue List */}
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2EEEC', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2EEEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '14px' }}>Queue Management ({clinicId === 'diaplus' ? 'DiaPlus' : 'ThyroPlus'})</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{waiting.length} waiting · {completed.length} done</div>
                  </div>

                  <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
                    {queueLoading ? (
                      <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                        <div>📍 Loading queue data...</div>
                      </div>
                    ) : apiPatients.length === 0 ? (
                      <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No patients in queue today</div>
                    ) : apiPatients.map(p => {
                      const pStatus = String(p.status || '').toUpperCase()
                      const isServing = pStatus === 'SERVING'
                      const isCompleted = pStatus === 'COMPLETED'
                      const isWaiting = pStatus === 'WAITING'

                      return (
                        <div key={p.tokenNumber} style={{
                          padding: '14px 20px', borderBottom: '1px solid #F0F4F4',
                          display: 'flex', alignItems: 'center', gap: '14px',
                          background: isServing ? '#E6F4F2' : '#fff',
                          transition: 'background-color 0.3s ease',
                        }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                            background: isServing ? 'linear-gradient(135deg,#0B7B6F,#096358)' : isCompleted ? '#E2EEEC' : '#E6F4F2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', color: isServing ? '#fff' : '#0B7B6F', fontSize: '13px',
                            transition: 'background-color 0.3s ease',
                          }}>
                            {String(p.tokenNumber).padStart(2, '0')}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.reason ?? ''}{p.phone ? ` · ${p.phone}` : ''}
                            </div>
                            <div style={{ fontSize: '10px', color: '#0B7B6F', fontWeight: '700', marginTop: '2px' }}>{p.consultationMode || 'N/A'}</div>
                          </div>
                          <span style={{
                            padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', flexShrink: 0,
                            background: isServing ? '#0B7B6F' : isCompleted ? '#E2EEEC' : '#FEF3C7',
                            color: isServing ? '#fff' : isCompleted ? '#64748B' : '#92400E',
                            transition: 'all 0.3s ease',
                          }}>
                            {isServing ? '🟢 Serving' : isCompleted ? '✓ Done' : '⏳ Waiting'}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Summary Footer */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid #E2EEEC', background: '#F8FAFA', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                    {[
                      { label: 'Avg Wait', val: waiting.length > 0 ? `${waiting.length * 10}m` : '0m' },
                      { label: 'Completion Rate', val: apiPatients.length > 0 ? `${Math.round((completed.length / apiPatients.length) * 100)}%` : '0%' },
                      { label: 'Revenue', val: `₹${revenue.toLocaleString()}` },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0B7B6F' }}>{s.val}</div>
                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════ */}
          {/* TAB 2: APPOINTMENTS SYSTEM INTEGRATION           */}
          {/* ════════════════════════════════════════════════ */}
          {activeTab === 'appointments' && (
            <div>
              {/* Status Alert Banners */}
              {apptSuccess && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✓ {apptSuccess}</span>
                  <button onClick={() => setApptSuccess('')} style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                </div>
              )}

              {apptError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⚠️ {apptError}</span>
                  <button onClick={() => setApptError('')} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                </div>
              )}

              {/* Appointment Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #E2EEEC', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Total Bookings</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628' }}>{totalBookingsCount}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #E2EEEC', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Scheduled</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0B7B6F' }}>{scheduledCount}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #E2EEEC', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Completed</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#10B981' }}>{completedCount}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #E2EEEC', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Cancelled</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#EF4444' }}>{cancelledCount}</div>
                </div>
              </div>

              {/* Filters Bar */}
              <div style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', border: '1px solid #E2EEEC', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
                  <label style={labelStyle}>Filter by Clinic</label>
                  <select
                    value={apptFilterClinic}
                    onChange={e => setApptFilterClinic(e.target.value)}
                    style={{ ...inputStyle, padding: '9px 12px' }}
                  >
                    <option value="all">All Clinics</option>
                    <option value="diaplus">DiaPlus Clinic</option>
                    <option value="thyroplus">ThyroPlus Clinic</option>
                  </select>
                </div>

                <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
                  <label style={labelStyle}>Filter by Date</label>
                  <input
                    type="date"
                    value={apptFilterDate}
                    onChange={e => setApptFilterDate(e.target.value)}
                    style={{ ...inputStyle, padding: '8px 12px' }}
                  />
                </div>

                <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
                  <label style={labelStyle}>Filter by Status</label>
                  <select
                    value={apptFilterStatus}
                    onChange={e => setApptFilterStatus(e.target.value)}
                    style={{ ...inputStyle, padding: '9px 12px' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="CONFIRMED">Scheduled (Confirmed)</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginTop: 'auto' }}>
                  <button
                    onClick={() => {
                      setApptFilterClinic('all')
                      setApptFilterDate('')
                      setApptFilterStatus('all')
                    }}
                    style={{
                      background: 'none', border: '1px solid #CBD5E1', borderRadius: '8px',
                      padding: '9px 14px', fontSize: '12px', color: '#64748B', cursor: 'pointer'
                    }}
                  >
                    Reset
                  </button>
                  <button
                    onClick={fetchAppointments}
                    style={{
                      background: '#0B7B6F', color: '#fff', border: 'none', borderRadius: '8px',
                      padding: '9px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('queue')
                      setShowAddTodayAppt(true)
                      setShowAdd(false)
                      fetchTodaySlots(apptClinic)
                    }}
                    style={{
                      background: 'linear-gradient(135deg,#0B7B6F,#096358)', color: '#fff', border: 'none', borderRadius: '8px',
                      padding: '9px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 2px 8px rgba(11,123,111,0.2)'
                    }}
                  >
                    <span>📅</span>
                    <span>+ Add Today's Appointment</span>
                  </button>
                </div>
              </div>

              {/* Appointments List / Table */}
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2EEEC', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2EEEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFA' }}>
                  <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '14px' }}>Appointments Schedule</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Showing {displayedAppointments.length} appointments</div>
                </div>

                {apptLoading ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                    <div>🔄 Loading appointments...</div>
                  </div>
                ) : displayedAppointments.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                    <div>No appointments found for the selected criteria.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E2EEEC', color: '#64748B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#F8FAFA' }}>
                          <th style={{ padding: '12px 16px' }}>Patient</th>
                          <th style={{ padding: '12px 16px' }}>Date & Time</th>
                          <th style={{ padding: '12px 16px' }}>Clinic</th>
                          <th style={{ padding: '12px 16px' }}>Mode</th>
                          <th style={{ padding: '12px 16px' }}>Payment</th>
                          <th style={{ padding: '12px 16px' }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedAppointments.map((appt) => {
                          const isCancelled = appt.status === 'CANCELLED'
                          const isCompleted = appt.status === 'COMPLETED'
                          const isScheduled = appt.status === 'CONFIRMED' || appt.status === 'PENDING'

                          return (
                            <tr key={appt.id} style={{ borderBottom: '1px solid #F0F4F4', opacity: isCancelled ? 0.6 : 1, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFA'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: '700', color: '#0A1628' }}>{appt.patientName}</div>
                                <div style={{ fontSize: '11px', color: '#64748B' }}>
                                  {appt.phone}{appt.email ? ` · ${appt.email}` : ''}{appt.place ? ` (${appt.place})` : ''}
                                </div>
                                <div style={{ fontSize: '11px', color: '#0B7B6F', marginTop: '2px' }}>{appt.reason}</div>
                                <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px', fontFamily: 'monospace' }}>ID: {appt.id.slice(0, 8)}...</div>
                              </td>

                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: '700', color: '#0A1628' }}>{appt.appointmentTime12 || appt.appointmentTime}</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>{appt.appointmentDate}</div>
                              </td>

                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ fontWeight: '600', color: '#0A1628' }}>{appt.clinic}</span>
                              </td>

                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                                  background: appt.consultationMode === 'ONLINE' ? '#EFF6FF' : '#E6F4F2',
                                  color: appt.consultationMode === 'ONLINE' ? '#1D4ED8' : '#0B7B6F'
                                }}>
                                  {appt.consultationMode === 'ONLINE' ? '💻 Online' : '🏥 In-Person'}
                                </span>
                              </td>

                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                                  {appt.paymentMethod === 'ONLINE' ? '📱 Online UPI' : '💵 Cash at Clinic'}
                                </span>
                              </td>

                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                                  background: isCancelled ? '#FEE2E2' : isCompleted ? '#D1FAE5' : '#E6F4F2',
                                  color: isCancelled ? '#991B1B' : isCompleted ? '#065F46' : '#0B7B6F'
                                }}>
                                  {isCancelled ? '✕ Cancelled' : isCompleted ? '✓ Completed' : '● Scheduled'}
                                </span>
                              </td>

                              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                {isScheduled ? (
                                  <button
                                    onClick={() => handleCancelAppointment(appt.id)}
                                    disabled={cancellingId === appt.id}
                                    style={{
                                      background: 'none', border: '1px solid #FECACA', borderRadius: '6px',
                                      color: '#DC2626', padding: '5px 10px', fontSize: '11px', fontWeight: '700',
                                      cursor: cancellingId === appt.id ? 'not-allowed' : 'pointer',
                                      opacity: cancellingId === appt.id ? 0.6 : 1
                                    }}
                                  >
                                    {cancellingId === appt.id ? 'Cancelling...' : 'Cancel'}
                                  </button>
                                ) : (
                                  <span style={{ color: '#CBD5E1', fontSize: '12px' }}>—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <style>{`
          @media (max-width: 768px) {
            .admin-stats { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
            .admin-stats > div { padding: 14px 12px !important; }
            .admin-stats > div > div:first-child { font-size: 9px !important; margin-bottom: 4px !important; }
            .admin-stats > div > div:last-child { font-size: 24px !important; }
            .admin-main { grid-template-columns: 1fr !important; gap: 14px !important; }
            input, select, textarea { font-size: 16px !important; }
          }
        `}</style>
      </div>
    </>
  )
}
