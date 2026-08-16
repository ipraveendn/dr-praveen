import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLINICS, DOCTOR } from '../data/content'
import { useAuth } from '../hooks/useAuth'
import { apiRequest } from '../utils/api'
import SEOMeta from '../components/SEOMeta'

export default function DoctorDashboard() {
  const nav = useNavigate()

  // Protect route with authentication - requires 'doctor' role
  const { logout, isAuthenticated } = useAuth('doctor')

  const [clinic, setClinic]           = useState('diaplus')
  const [queueData, setQueueData]     = useState(null)
  const [queueLoading, setQueueLoading] = useState(true)
  const [completeLoading, setCompleteLoading] = useState(false)
  const lastMutationTime = useRef(null)

  // Appointments state
  const [appointments, setAppointments] = useState([])
  const [apptLoading, setApptLoading]   = useState(false)
  const [apptError, setApptError]       = useState('')
  const [apptFilterTab, setApptFilterTab] = useState('today') // 'today', 'upcoming', 'all'

  const normalizeQueuePayload = (payload) => {
    if (!payload) return null
    const nextPayload = { ...payload }
    if (Array.isArray(nextPayload.patients)) {
      nextPayload.patients = nextPayload.patients.map((p) => {
        const s = String(p.status || '').toUpperCase()
        return { ...p, status: s }
      })
    }
    return nextPayload
  }

  // Queue Polling (Preserved 100%)
  useEffect(() => {
    let mounted = true
    let intervalId = null

    const fetchQueue = async () => {
      if (lastMutationTime.current && Date.now() - lastMutationTime.current < 3000) {
        return
      }

      try {
        const json = await apiRequest(`/queue?clinic=${clinic}`)
        if (!mounted) return
        setQueueData(normalizeQueuePayload(json?.data ?? null))
      } catch {
        if (!mounted) return
        setQueueData(null)
      } finally {
        if (!mounted) return
        setQueueLoading(false)
      }
    }

    fetchQueue()
    intervalId = setInterval(fetchQueue, 2000)

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [clinic])

  // Fetch Doctor Appointments for the active clinic
  const fetchAppointments = useCallback(async () => {
    setApptLoading(true)
    setApptError('')
    try {
      const response = await apiRequest(`/appointments?clinic=${clinic}`)
      if (response && response.success && Array.isArray(response.data)) {
        setAppointments(response.data)
      } else {
        setAppointments([])
      }
    } catch (err) {
      console.error('[DoctorDashboard] Fetch appointments error:', err)
      setApptError(err.data?.message || err.message || 'Unable to load scheduled appointments.')
    } finally {
      setApptLoading(false)
    }
  }, [clinic])

  useEffect(() => {
    fetchAppointments()
    const interval = setInterval(fetchAppointments, 15000) // Poll appointments every 15s
    return () => clearInterval(interval)
  }, [fetchAppointments])

  async function markDone(tokenNumber) {
    if (!tokenNumber || completeLoading) {
      return
    }

    setCompleteLoading(true)
    const previousQueueData = queueData

    try {
      const endpoint = `/queue/complete/${tokenNumber}`
      const payload = { clinic }

      lastMutationTime.current = Date.now()

      const json = await apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })

      const payload_response = json?.data ?? null

      if (payload_response && Array.isArray(payload_response.patients)) {
        const normalized = payload_response.patients.map((p) => {
          const s = String(p.status || '').toUpperCase()
          return { ...p, status: s }
        })

        const newData = {
          currentToken: payload_response.currentToken || payload_response.currentServing || null,
          waiting: payload_response.waiting || payload_response.waitingCount || 0,
          estimatedTime: payload_response.estimatedTime || '0 mins',
          patients: normalized,
        }

        setQueueData(newData)
      } else {
        const refresh = await apiRequest(`/queue?clinic=${clinic}`)
        setQueueData(normalizeQueuePayload(refresh?.data ?? null))
      }
    } catch (e) {
      console.error('[DoctorDashboard] markDone error:', e)
      setQueueData(previousQueueData)
      try {
        const refresh = await apiRequest(`/queue?clinic=${clinic}`)
        setQueueData(normalizeQueuePayload(refresh?.data ?? null))
      } catch (refreshError) {
        console.error('[DoctorDashboard] markDone refresh fallback failed:', refreshError)
      }
    } finally {
      setCompleteLoading(false)
    }
  }

  const apiPatients = Array.isArray(queueData?.patients) ? queueData.patients : []
  const serving = apiPatients.find(p => p.status === 'SERVING') ?? null
  const waiting = apiPatients.filter(p => p.status === 'WAITING')
  const completed = apiPatients.filter(p => p.status === 'COMPLETED')
  const revenue   = completed.length * 750

  // Calculate today's date & time in IST YYYY-MM-DD
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

  const todayIST = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())

  // Filter appointments for Doctor view
  const todayAppointments = appointments.filter(a => a.appointmentDate === todayIST && a.status !== 'CANCELLED' && !isAppointmentExpired(a.appointmentDate, a.appointmentTime))
  const upcomingAppointments = appointments.filter(a => a.status !== 'CANCELLED' && !isAppointmentExpired(a.appointmentDate, a.appointmentTime))
  
  const displayedAppointments = apptFilterTab === 'today'
    ? todayAppointments
    : apptFilterTab === 'upcoming'
      ? upcomingAppointments
      : appointments

  return (
    <>
      <SEOMeta pageKey="doctor" />
      <div style={{ minHeight: '100vh', background: '#F8FAFA', fontFamily: "'DM Sans',sans-serif" }}>

        {/* Topbar */}
        <div style={{ background: 'linear-gradient(135deg,#0B7B6F,#096358)', padding: '0 5%', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontWeight: '700', color: '#fff', fontSize: '14px' }}>PR</div>
            <div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Doctor Dashboard</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{DOCTOR.name} · {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a href="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none' }}>← Website</a>
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans',sans-serif" }}> Logout</button>
          </div>
        </div>

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 5%' }}>

          {/* Clinic selection tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {CLINICS.map(c => (
                <button key={c.id} onClick={() => setClinic(c.id)} style={{
                  padding: '10px 20px', borderRadius: '30px', cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '600',
                  background: clinic === c.id ? '#0B7B6F' : '#fff',
                  color: clinic === c.id ? '#fff' : '#64748B',
                  border: `2px solid ${clinic === c.id ? '#0B7B6F' : '#E2EEEC'}`,
                  transition: 'all 0.2s',
                }}>{c.id === 'diaplus' ? '🏥 DiaPlus Clinic' : '🏥 ThyroPlus Clinic'}</button>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: '#0B7B6F', fontWeight: '700', background: '#E6F4F2', padding: '6px 14px', borderRadius: '20px' }}>
              ● Live Sync Active
            </div>
          </div>

          {/* Live Queue Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '24px' }}>
            {[
              ['CURRENTLY SERVING', queueLoading ? '...' : (queueData?.currentToken ?? (serving?.tokenNumber ?? 0)), '#0B7B6F'],
              ['COMPLETED',         completed.length,                                 '#10B981'],
              ['PATIENTS WAITING',  queueLoading ? '...' : (queueData?.waiting ?? 0), '#F59E0B'],
              ['TODAY APPOINTMENTS', todayAppointments.length,                         '#0B7B6F'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E2EEEC', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: '700', color, lineHeight: '1' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Current Queue Patient */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #E2EEEC', boxShadow: '0 4px 24px rgba(11,123,111,0.08)', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>CURRENT QUEUE PATIENT</div>

            {serving ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#E6F4F2,#B2DDD8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', fontWeight: '700', color: '#0B7B6F', flexShrink: 0 }}>
                    #{String(serving.tokenNumber).padStart(2,'0')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0A1628', fontFamily: "'Cormorant Garamond',serif" }}>{serving.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{serving.phone}</div>
                    <div style={{ fontSize: '12px', color: '#0B7B6F', fontWeight: '700', marginTop: '4px' }}>{serving.consultationMode || 'In-Person'}</div>
                  </div>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>🔔 Now Consulting</span>
                </div>
                <div style={{ background: '#F8FAFA', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #E2EEEC' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Reason for Visit</div>
                  <div style={{ fontSize: '15px', color: '#0A1628', fontWeight: '600' }}>{serving.reason || 'General Consultation'}</div>
                </div>
                <button
                  onClick={() => markDone(serving.tokenNumber)}
                  disabled={completeLoading || !serving}
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '10px', cursor: completeLoading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: '700', width: '100%', opacity: completeLoading ? 0.7 : 1 }}
                >
                  {completeLoading ? 'Completing...' : '✓ Mark Consultation Done'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>No active queue consultation</div>
                <div style={{ fontSize: '13px' }}>Reception will call the next patient when ready</div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* DOCTOR APPOINTMENTS SECTION                      */}
          {/* ════════════════════════════════════════════════ */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #E2EEEC', boxShadow: '0 4px 24px rgba(11,123,111,0.08)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>SCHEDULED APPOINTMENTS</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', fontWeight: '700', color: '#0A1628', margin: 0 }}>
                  Doctor's Appointment Calendar
                </h3>
              </div>

              {/* Appointment View Switcher */}
              <div style={{ display: 'flex', gap: '6px', background: '#F8FAFA', padding: '4px', borderRadius: '10px', border: '1px solid #E2EEEC' }}>
                {[
                  { id: 'today', label: `Today (${todayAppointments.length})` },
                  { id: 'upcoming', label: `Upcoming (${upcomingAppointments.length})` },
                  { id: 'all', label: `All (${appointments.length})` },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setApptFilterTab(t.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '7px',
                      border: 'none',
                      background: apptFilterTab === t.id ? '#0B7B6F' : 'transparent',
                      color: apptFilterTab === t.id ? '#fff' : '#64748B',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {apptError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px' }}>
                {apptError}
              </div>
            )}

            {apptLoading ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                <div>🔄 Loading scheduled appointments...</div>
              </div>
            ) : displayedAppointments.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                <div>No appointments found for this view.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {displayedAppointments.map((appt) => {
                  const isCancelled = appt.status === 'CANCELLED'
                  const isToday = appt.appointmentDate === todayIST

                  return (
                    <div
                      key={appt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 18px',
                        borderRadius: '12px',
                        border: '1px solid #E2EEEC',
                        background: isToday ? '#F0FAF8' : '#fff',
                        opacity: isCancelled ? 0.6 : 1,
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          background: isToday ? '#0B7B6F' : '#E6F4F2',
                          color: isToday ? '#fff' : '#0B7B6F',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          flexShrink: 0
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', lineHeight: '1' }}>
                            {appt.appointmentTime12?.split(' ')[0]}
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                            {appt.appointmentTime12?.split(' ')[1]}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '15px' }}>
                            {appt.patientName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>
                            {appt.phone} · {appt.appointmentDate}
                          </div>
                          <div style={{ fontSize: '12px', color: '#0B7B6F', fontWeight: '600', marginTop: '2px' }}>
                            {appt.reason}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                          background: appt.consultationMode === 'ONLINE' ? '#EFF6FF' : '#E6F4F2',
                          color: appt.consultationMode === 'ONLINE' ? '#1D4ED8' : '#0B7B6F'
                        }}>
                          {appt.consultationMode === 'ONLINE' ? '💻 Online' : '🏥 In-Person'}
                        </span>

                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                          background: isCancelled ? '#FEE2E2' : appt.status === 'COMPLETED' ? '#D1FAE5' : '#E6F4F2',
                          color: isCancelled ? '#991B1B' : appt.status === 'COMPLETED' ? '#065F46' : '#0B7B6F'
                        }}>
                          {isCancelled ? 'Cancelled' : appt.status === 'COMPLETED' ? 'Completed' : 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Waiting list */}
          {waiting.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2EEEC', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2EEEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0A1628' }}>Patients in Queue</div>
                <span style={{ background: '#E6F4F2', color: '#0B7B6F', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{waiting.length} waiting</span>
              </div>
              {waiting.map((p, i) => (
                <div key={p.id || p.tokenNumber} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: i < waiting.length - 1 ? '1px solid #F8FAFA' : 'none' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '22px', fontWeight: '700', color: '#0B7B6F', width: '40px' }}>#{String(p.tokenNumber).padStart(2,'0')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0A1628' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{p.reason}</div>
                    <div style={{ fontSize: '11px', color: '#0B7B6F', fontWeight: '700', marginTop: '2px' }}>{p.consultationMode || 'In-Person'}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#0B7B6F', fontWeight: '600' }}>~{(i + 1) * 10} mins wait</span>
                </div>
              ))}
            </div>
          )}

          {/* Doctor Summary Footer */}
          <div style={{ background: 'linear-gradient(135deg,#0A1628,#0F2040)', borderRadius: '20px', padding: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>Daily Clinical Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px' }}>
              {[
                ['Queue Patients',      apiPatients.length, '#fff'],
                ['Consultations Done',  completed.length,          '#10B981'],
                ['Still Waiting',       waiting.length,            '#F59E0B'],
                ['Appointments Today',  todayAppointments.length,  '#0FA898'],
                ['Revenue Today',       `₹${revenue.toLocaleString()}`, '#C9A84C'],
                ['Queue Completion',    apiPatients.length > 0 ? `${Math.round((completed.length / apiPatients.length)*100)}%` : '0%', '#0FA898'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color, lineHeight: '1' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}