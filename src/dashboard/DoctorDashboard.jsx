import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLINICS, DOCTOR } from '../data/content'
import { useAuth } from '../hooks/useAuth'
import { apiRequest } from '../utils/api'

export default function DoctorDashboard() {
  const nav = useNavigate()
  
  // Protect route with authentication - requires 'doctor' role
  const { logout, isAuthenticated } = useAuth('doctor')
  
  const [clinic, setClinic]     = useState('diaplus')
  const [queueData, setQueueData] = useState(null)
  const [queueLoading, setQueueLoading] = useState(true)
  const [completeLoading, setCompleteLoading] = useState(false)
  const today = new Date().toDateString()

  const normalizeQueuePayload = (payload) => {
    if (!payload) return null
    const nextPayload = { ...payload }
    if (Array.isArray(nextPayload.patients)) {
      nextPayload.patients = nextPayload.patients.map((p) => {
        // Keep status as-is from backend: WAITING, SERVING, COMPLETED (uppercase)
        const s = String(p.status || '').toUpperCase()
        return { ...p, status: s }
      })
    }
    return nextPayload
  }

  useEffect(() => {
    let mounted = true
    let intervalId = null

    const fetchQueue = async () => {
      try {
        console.log('[DoctorDashboard] Polling queue for clinic:', clinic)
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
    intervalId = setInterval(fetchQueue, 2000) // 2 second polling for faster updates

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [clinic])

  async function markDone(tokenNumber) {
    if (!tokenNumber) {
      console.log('[DoctorDashboard] markDone -> no tokenNumber provided')
      return
    }
    if (completeLoading) {
      console.log('[DoctorDashboard] markDone -> already in progress')
      return
    }
    
    console.log('[DoctorDashboard] ============ MARK DONE STARTED ============')
    console.log('[DoctorDashboard] markDone -> tokenNumber:', tokenNumber)
    console.log('[DoctorDashboard] markDone -> clinic:', clinic)
    console.log('[DoctorDashboard] markDone -> token in localStorage:', !!localStorage.getItem('token'))
    
    setCompleteLoading(true)
    try {
      const endpoint = `/queue/complete/${tokenNumber}`
      const payload = { clinic }
      
      console.log('[DoctorDashboard] markDone -> API CALL STARTING')
      console.log('[DoctorDashboard] markDone -> endpoint:', endpoint)
      console.log('[DoctorDashboard] markDone -> payload:', payload)
      
      const json = await apiRequest(endpoint, { 
        method: 'PATCH', 
        body: JSON.stringify(payload) 
      })
      
      console.log('[DoctorDashboard] markDone -> API SUCCESS')
      console.log('[DoctorDashboard] markDone -> full response:', json)
      console.log('[DoctorDashboard] markDone -> response.success:', json?.success)
      console.log('[DoctorDashboard] markDone -> response.data:', json?.data)

      const payload_response = json?.data ?? null
      console.log('[DoctorDashboard] markDone -> payload exists:', !!payload_response)
      console.log('[DoctorDashboard] markDone -> payload.patients is array:', Array.isArray(payload_response?.patients))
      console.log('[DoctorDashboard] markDone -> payload.patients length:', payload_response?.patients?.length)
      
      if (payload_response && Array.isArray(payload_response.patients)) {
        console.log('[DoctorDashboard] markDone -> normalizing patients')
        const normalized = payload_response.patients.map((p) => {
          const s = String(p.status || '').toUpperCase()
          console.log(`[DoctorDashboard] Token #${p.tokenNumber}: status = ${s}`)
          return { ...p, status: s }
        })

        const newData = {
          currentToken: payload_response.currentToken ?? null,
          waiting: payload_response.waiting ?? 0,
          estimatedTime: payload_response.estimatedTime ?? '0 mins',
          patients: normalized,
        }
        console.log('[DoctorDashboard] markDone -> setting queue data:', newData)
        setQueueData(newData)
        console.log('[DoctorDashboard] ============ MARK DONE SUCCESS ============')
      } else {
        console.log('[DoctorDashboard] markDone -> payload is invalid, forcing refresh')
        const refresh = await apiRequest(`/queue?clinic=${clinic}`)
        console.log('[DoctorDashboard] markDone -> refresh response:', refresh?.data)
        setQueueData(normalizeQueuePayload(refresh?.data ?? null))
      }
    } catch (e) {
      console.error('[DoctorDashboard] ============ MARK DONE FAILED ============')
      console.error('[DoctorDashboard] markDone error:', e)
      console.error('[DoctorDashboard] markDone error status:', e?.status)
      console.error('[DoctorDashboard] markDone error data:', e?.data)
      console.error('[DoctorDashboard] markDone error message:', e?.message)
      
      if (e?.status === 401) {
        console.error('[CRITICAL] Authentication failed - token invalid or expired')
      }
      
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

  // logout function provided by useAuth hook

  const apiPatients = Array.isArray(queueData?.patients) ? queueData.patients : []
  const serving = apiPatients.find(p => p.status === 'SERVING') ?? null
  const waiting = apiPatients.filter(p => p.status === 'WAITING')
  const completed = apiPatients.filter(p => p.status === 'COMPLETED')
  const revenue   = completed.length * 500

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFA', fontFamily: "'DM Sans',sans-serif" }}>

      {/* Topbar */}
      <div style={{ background: 'linear-gradient(135deg,#0B7B6F,#096358)', padding: '0 5%', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontWeight: '700', color: '#fff', fontSize: '14px' }}>PR</div>
          <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Doctor Dashboard</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{DOCTOR.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none' }}>← Website</a>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans',sans-serif" }}> Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 5%' }}>

        {/* Clinic tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {CLINICS.map(c => (
            <button key={c.id} onClick={() => setClinic(c.id)} style={{
              padding: '10px 20px', borderRadius: '30px', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '600',
              background: clinic === c.id ? '#0B7B6F' : '#fff',
              color: clinic === c.id ? '#fff' : '#64748B',
              border: `2px solid ${clinic === c.id ? '#0B7B6F' : '#E2EEEC'}`,
              transition: 'all 0.2s',
            }}>{c.id === 'diaplus' ? ' Diaplus' : ' Thyroplus'}</button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            ['CURRENTLY SERVING', queueLoading ? '...' : (queueData?.currentToken ?? (serving?.tokenNumber ?? 0)), '#0B7B6F'],
            ['COMPLETED',         completed.length,                                 '#10B981'],
            ['PATIENTS WAITING',  queueLoading ? '...' : (queueData?.waiting ?? 0), '#F59E0B'],
            ['REVENUE TODAY',   `₹${revenue.toLocaleString()}`, '#C9A84C'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E2EEEC', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: '700', color, lineHeight: '1' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Current patient */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #E2EEEC', boxShadow: '0 4px 24px rgba(11,123,111,0.08)', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>CURRENT PATIENT</div>

          {serving ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#E6F4F2,#B2DDD8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', fontWeight: '700', color: '#0B7B6F', flexShrink: 0 }}>
                  #{String(serving.tokenNumber).padStart(2,'0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#0A1628', fontFamily: "'Cormorant Garamond',serif" }}>{serving.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}> {serving.phone}</div>
                </div>
                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>🔔 Now Consulting</span>
              </div>
              <div style={{ background: '#F8FAFA', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #E2EEEC' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Reason for Visit</div>
                <div style={{ fontSize: '15px', color: '#0A1628', fontWeight: '600' }}>{serving.reason}</div>
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
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}></div>
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>No active consultation</div>
              <div style={{ fontSize: '13px' }}>Use "Call Next" from Admin panel to start</div>
            </div>
          )}
        </div>

        {/* Waiting list */}
        {waiting.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2EEEC', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2EEEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0A1628' }}>Patients Waiting</div>
              <span style={{ background: '#E6F4F2', color: '#0B7B6F', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{waiting.length} waiting</span>
            </div>
            {waiting.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: i < waiting.length - 1 ? '1px solid #F8FAFA' : 'none' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '22px', fontWeight: '700', color: '#0B7B6F', width: '40px' }}>#{String(p.tokenNumber).padStart(2,'0')}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0A1628' }}>{p.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{p.reason}</div>
                </div>
                <span style={{ fontSize: '11px', color: '#0B7B6F', fontWeight: '600' }}>~{(i + 1) * 10} mins wait</span>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div style={{ background: 'linear-gradient(135deg,#0A1628,#0F2040)', borderRadius: '20px', padding: '28px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '20px' }}> My Summary Today</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px' }}>
            {[
              ['Total Patients',      apiPatients.length, '#fff'],
              ['Consultations Done',  completed.length,          '#10B981'],
              ['Still Waiting',       waiting.length,            '#F59E0B'],
              ['Revenue Today',       `₹${revenue.toLocaleString()}`, '#C9A84C'],
              ['Avg Queue Wait',      `${waiting.length * 10}m`, 'rgba(255,255,255,0.7)'],
              ['Completion Rate',     apiPatients.length > 0 ? `${Math.round((completed.length / apiPatients.length)*100)}%` : '0%', '#0FA898'],
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
  )
}