import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLINICS } from '../data/content'
import { useAuth } from '../hooks/useAuth'
import { apiRequest } from '../utils/api'

const REASONS = ['Diabetes Checkup','Thyroid Consultation','Hormone Imbalance','Obesity/Weight','PCOS / PCOD','Gestational Diabetes','Pediatric Endocrinology','Osteoporosis','Adrenal Disorder','Pituitary Disorder','General Consultation','Other']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth('admin')

  const [clinicId, setClinicId]               = useState('diaplus')
  const [showAdd, setShowAdd]                 = useState(false)
  const [form, setForm]                       = useState({ name: '', phone: '', reason: '' })
  const [adding, setAdding]                   = useState(false)
  const [queueData, setQueueData]             = useState(null)
  const [queueLoading, setQueueLoading]       = useState(true)
  const [completeLoading, setCompleteLoading] = useState(false)
  const [actionLoading, setActionLoading]     = useState(false)
  
  // Track pending requests to avoid duplicates
  const pendingRequests = useRef({})
  const lastRefreshTime = useRef({})

  const refreshQueue = useCallback(async (forceRefresh = false) => {
    const cacheKey = `queue_${clinicId}`
    const now = Date.now()
    
    // Debounce: don't refresh if we just refreshed (within 200ms)
    if (!forceRefresh && lastRefreshTime.current[cacheKey] && now - lastRefreshTime.current[cacheKey] < 200) {
      console.log('[AdminDashboard] Skipping refresh - cache fresh')
      return
    }
    
    // Prevent duplicate requests
    if (pendingRequests.current[cacheKey]) {
      console.log('[AdminDashboard] Duplicate request prevented for', cacheKey)
      return
    }

    pendingRequests.current[cacheKey] = true
    lastRefreshTime.current[cacheKey] = now

    try {
      console.log('[AdminDashboard] Fetching queue for clinic:', clinicId)
      const json = await apiRequest(`/queue?clinic=${clinicId}`)
      setQueueData(json?.data ?? null)
      console.log('[AdminDashboard] Queue data updated:', json?.data)
    } catch (error) {
      console.error('[AdminDashboard] Queue fetch failed:', error)
      setQueueData(null)
    } finally {
      setQueueLoading(false)
      delete pendingRequests.current[cacheKey]
    }
  }, [clinicId])

  // Load initial queue data on clinic change
  useEffect(() => {
    console.log('[AdminDashboard] Clinic changed to:', clinicId)
    setQueueLoading(true)
    refreshQueue(true)
  }, [clinicId, refreshQueue])

  const apiPatients = Array.isArray(queueData?.patients) ? queueData.patients : []
  const waiting     = apiPatients.filter(p => p.status === 'WAITING')
  const serving     = apiPatients.find(p => p.status === 'SERVING')
  const completed   = apiPatients.filter(p => p.status === 'COMPLETED')
  const revenue     = completed.length * 500

  async function addPatient() {
    if (!form.name || !form.phone || !form.reason) return
    setAdding(true)
    try {
      console.log('[AdminDashboard] Adding patient:', form)
      const response = await apiRequest('/queue/add', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, phone: form.phone, reason: form.reason, clinic: clinicId })
      })
      console.log('[AdminDashboard] Patient added successfully, response:', response)
      
      // Update queue with response data if available
      if (response?.data?.patients) {
        console.log('[AdminDashboard] Updating queue from add response')
        setQueueData({
          currentToken: response.data.currentToken || queueData?.currentToken,
          waiting: response.data.patients.filter(p => p.status === 'WAITING').length,
          estimatedTime: response.data.estimatedTime || '0 mins',
          patients: response.data.patients
        })
      } else {
        // Fallback: refresh queue if response doesn't have patients
        await refreshQueue(true)
      }
    } catch (error) {
      console.error('[AdminDashboard] Add patient failed:', error)
    } finally {
      setForm({ name: '', phone: '', reason: '' })
      setShowAdd(false)
      setAdding(false)
    }
  }

  async function callNext() {
    if (waiting.length === 0 || actionLoading) {
      console.log('[AdminDashboard] callNext -> Conditions not met. Waiting:', waiting.length, 'Loading:', actionLoading)
      return
    }
    
    console.log('[AdminDashboard] ============ CALL NEXT STARTED ============')
    console.log('[AdminDashboard] callNext -> clinic:', clinicId)
    console.log('[AdminDashboard] callNext -> waiting count:', waiting.length)
    console.log('[AdminDashboard] callNext -> token in localStorage:', !!localStorage.getItem('token'))
    
    setActionLoading(true)
    
    // OPTIMISTIC UPDATE
    const nextPatient = waiting[0]
    const currentServing = serving
    console.log('[AdminDashboard] callNext -> OPTIMISTIC UPDATE')
    console.log('[AdminDashboard] callNext -> next patient:', nextPatient.tokenNumber)
    console.log('[AdminDashboard] callNext -> current serving:', currentServing?.tokenNumber)
    
    const optimisticData = {
      ...queueData,
      patients: queueData.patients.map(p => {
        if (p.tokenNumber === currentServing?.tokenNumber) {
          console.log(`[AdminDashboard] Token #${p.tokenNumber}: SERVING -> COMPLETED (optimistic)`)
          return { ...p, status: 'COMPLETED' }
        }
        if (p.tokenNumber === nextPatient.tokenNumber) {
          console.log(`[AdminDashboard] Token #${p.tokenNumber}: WAITING -> SERVING (optimistic)`)
          return { ...p, status: 'SERVING' }
        }
        return p
      }),
      currentToken: nextPatient.tokenNumber
    }
    setQueueData(optimisticData)
    
    try {
      console.log('[AdminDashboard] callNext -> API CALL STARTING')
      console.log('[AdminDashboard] callNext -> endpoint: /queue/next')
      console.log('[AdminDashboard] callNext -> payload:', { clinic: clinicId })
      
      const response = await apiRequest('/queue/next', { 
        method: 'POST', 
        body: JSON.stringify({ clinic: clinicId }) 
      })
      
      console.log('[AdminDashboard] callNext -> API SUCCESS')
      console.log('[AdminDashboard] callNext -> response:', response)
      
      // Update state with server response
      if (response?.data?.patients && Array.isArray(response.data.patients)) {
        console.log('[AdminDashboard] callNext -> updating state from server response')
        const newData = {
          currentToken: response.data.nextServing || null,
          waiting: response.data.patients.filter(p => p.status === 'WAITING').length,
          estimatedTime: response.data.estimatedTime || '0 mins',
          patients: response.data.patients
        }
        console.log('[AdminDashboard] callNext -> new state:', newData)
        setQueueData(newData)
        console.log('[AdminDashboard] ============ CALL NEXT SUCCESS ============')
      } else {
        console.log('[AdminDashboard] callNext -> response missing patients array, refreshing')
        await refreshQueue(true)
      }
    } catch (error) {
      console.error('[AdminDashboard] ============ CALL NEXT FAILED ============')
      console.error('[AdminDashboard] callNext error:', error)
      console.error('[AdminDashboard] callNext error status:', error?.status)
      console.error('[AdminDashboard] callNext error data:', error?.data)
      console.error('[AdminDashboard] callNext error message:', error?.message)
      
      if (error?.status === 401) {
        console.error('[CRITICAL] Authentication failed - token invalid or expired')
      }
      
      console.log('[AdminDashboard] callNext -> forcing refresh due to error')
      await refreshQueue(true)
    } finally {
      setActionLoading(false)
    }
  }

  async function markDone() {
    if (!serving?.tokenNumber || completeLoading) {
      console.log('[AdminDashboard] markDone -> Conditions not met. Serving:', serving?.tokenNumber, 'Loading:', completeLoading)
      return
    }
    
    console.log('[AdminDashboard] ============ MARK DONE STARTED ============')
    console.log('[AdminDashboard] markDone -> serving token:', serving.tokenNumber)
    console.log('[AdminDashboard] markDone -> clinic:', clinicId)
    console.log('[AdminDashboard] markDone -> token in localStorage:', !!localStorage.getItem('token'))
    
    setCompleteLoading(true)
    const servingTokenNumber = serving.tokenNumber
    
    // OPTIMISTIC UPDATE
    console.log('[AdminDashboard] markDone -> OPTIMISTIC UPDATE')
    console.log(`[AdminDashboard] Token #${servingTokenNumber}: SERVING -> COMPLETED (optimistic)`)
    const optimisticData = {
      ...queueData,
      patients: queueData.patients.map(p => 
        p.tokenNumber === servingTokenNumber ? { ...p, status: 'COMPLETED' } : p
      ),
      currentToken: null
    }
    setQueueData(optimisticData)
    
    try {
      console.log('[AdminDashboard] markDone -> API CALL STARTING')
      console.log('[AdminDashboard] markDone -> endpoint: /queue/complete/' + servingTokenNumber)
      console.log('[AdminDashboard] markDone -> payload:', { clinic: clinicId })
      
      const response = await apiRequest(`/queue/complete/${servingTokenNumber}`, {
        method: 'PATCH',
        body: JSON.stringify({ clinic: clinicId })
      })
      
      console.log('[AdminDashboard] markDone -> API SUCCESS')
      console.log('[AdminDashboard] markDone -> response:', response)
      
      // Update state with server response (confirms database persistence)
      if (response?.data?.patients && Array.isArray(response.data.patients)) {
        console.log('[AdminDashboard] markDone -> updating state from server response')
        const newData = {
          currentToken: response.data.currentServing || null,
          waiting: response.data.waitingCount || 0,
          estimatedTime: response.data.estimatedTime || '0 mins',
          patients: response.data.patients
        }
        console.log('[AdminDashboard] markDone -> new state:', newData)
        setQueueData(newData)
        console.log('[AdminDashboard] ============ MARK DONE SUCCESS ============')
      } else {
        console.log('[AdminDashboard] markDone -> response missing patients array, refreshing')
        await refreshQueue(true)
      }
    } catch (error) {
      console.error('[AdminDashboard] ============ MARK DONE FAILED ============')
      console.error('[AdminDashboard] Mark done failed with error:', error);
      console.error('[AdminDashboard] Error status:', error?.status);
      console.error('[AdminDashboard] Error data:', error?.data);
      console.error('[AdminDashboard] Error message:', error?.message);
      
      // Check if it's a 401 (not authenticated)
      if (error?.status === 401) {
        console.error('[CRITICAL AUTH ERROR] Not authenticated - token may be invalid or expired');
      }
      
      // REVERT optimistic update on error - refresh to get actual state
      console.log('[AdminDashboard] markDone -> forcing refresh due to error')
      await refreshQueue(true)
    } finally {
      setCompleteLoading(false)
    }
  }

  async function removePatient(tokenNumber) {
    // Not yet supported by backend — no-op
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

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F4', fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{
        background: '#0A1628', padding: '0 20px', height: '60px',
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
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Queue Management</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
          <button onClick={logout} style={{
            padding: '6px 12px', borderRadius: '7px',
            border: '1.5px solid rgba(255,255,255,0.15)',
            background: 'transparent', color: 'rgba(255,255,255,0.6)',
            fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
          }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

       
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

        {/* ── MAIN GRID ── */}
        <div className="admin-main" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Now Consulting */}
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

            {/* Call Next */}
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

            {/* Add Patient Toggle */}
            <button onClick={() => setShowAdd(!showAdd)} style={{
              background: '#fff', color: '#0B7B6F',
              border: '1.5px solid #B2DDD8', borderRadius: '12px',
              padding: '13px', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            }}>
              {showAdd ? 'Cancel' : '+ Add Patient Manually'}
            </button>

            {showAdd && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E2EEEC' }}>
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
          </div>

          {/* RIGHT — Queue list */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2EEEC', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2EEEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '14px' }}>Queue Management</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>{waiting.length} waiting · {completed.length} done</div>
            </div>

            <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
              {queueLoading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                  <div>📍 Loading queue data...</div>
                </div>
              ) : apiPatients.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No patients yet today</div>
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
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', flexShrink: 0,
                    background: isServing ? '#0B7B6F' : isCompleted ? '#E2EEEC' : '#FEF3C7',
                    color: isServing ? '#fff' : isCompleted ? '#64748B' : '#92400E',
                    transition: 'all 0.3s ease',
                  }}>
                    {isServing ? '🟢 Serving' : isCompleted ? '✓ Done' : '⏳ Waiting'}
                  </span>
                  {isWaiting && (
                    <button onClick={() => console.log('Remove not yet implemented')} style={{
                      background: 'none', border: '1px solid #E2EEEC', borderRadius: '6px',
                      color: '#94A3B8', cursor: 'pointer', fontSize: '11px',
                      padding: '3px 8px', fontFamily: "'DM Sans',sans-serif", flexShrink: 0,
                    }}>Remove</button>
                  )}
                </div>
              )})}
            </div>

            {/* Summary */}
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
  )
}
