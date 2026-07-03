import { useState, useEffect } from 'react'
import { CLINICS, DOCTOR } from '../data/content'
import { apiRequest } from '../utils/api'
import { createPaymentOrder, verifyPayment, simulateRazorpayPayment } from '../utils/payment'
import SEOMeta from '../components/SEOMeta'

const REASONS = ['Diabetes Checkup','Thyroid Consultation','Hormone Imbalance','Obesity/Weight','PCOS / PCOD','Gestational Diabetes','Pediatric Endocrinology','Osteoporosis','Adrenal Disorder','Pituitary Disorder','General Consultation','Other']

function LiveQueue({ data }) {
  if (!data) return <p>Loading queue...</p>;

  return (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 4px 24px rgba(11,123,111,0.08)', border: '1px solid #E2EEEC', marginTop: '48px' }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Live Queue</h2>
      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>Current status of the queue</p>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '28px' }}>
        <div style={{ flex: 1, background: '#F8FAFA', borderRadius: '14px', padding: '24px', border: '1px solid #E2EEEC' }}>
          <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Currently Serving</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '48px', fontWeight: '800', color: '#0B7B6F', lineHeight: '1' }}>#{String(data.currentToken).padStart(2, '0')}</div>
        </div>
        <div style={{ flex: 1, background: '#F8FAFA', borderRadius: '14px', padding: '24px', border: '1px solid #E2EEEC' }}>
          <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Waiting</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '48px', fontWeight: '800', color: '#0A1628', lineHeight: '1' }}>{data.waiting}</div>
        </div>
      </div>

      <div>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', fontWeight: '700', color: '#0A1628', marginBottom: '12px' }}>Upcoming Tokens</h3>
        {data.patients.filter(p => p.status === 'WAITING').map((patient, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #E2EEEC', fontSize: '14px' }}>
            <span style={{ color: '#0A1628', fontWeight: '700' }}>#{String(patient.tokenNumber).padStart(2, '0')}</span>
            <span style={{ color: '#64748B', fontWeight: '500' }}>{patient.name}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ color: '#0B7B6F', fontWeight: '600' }}>{patient.clinic}</span>
              <span style={{ color: '#64748B', fontSize: '11px', fontWeight: '500' }}>{patient.consultationMode || 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Queue() {
  const [step, setStep]     = useState(1)
  const [clinic, setClinic] = useState('')
  const [form, setForm]     = useState({ name: '', phone: '', email: '', place: '', doctor: 'Dr. Praveen Ramachandra', reason: '' })
  const [consultationMode, setConsultationMode] = useState('') // 'IN_PERSON' or 'ONLINE'
  const [token, setToken]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [queueData, setQueueData] = useState(null);
  
  // Payment states
  const [paymentOrder, setPaymentOrder] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'processing', 'success', 'failed'

  async function fetchQueueData() {
    try {
      const data = await apiRequest("/queue");
      setQueueData(data.data);
    } catch (error) {
      console.error("Failed to fetch queue data:", error);
    }
  }

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Prefill reason from query param (service) if provided
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const svc = params.get('service')
      if (svc) setForm(f => ({ ...f, reason: svc }))
    } catch (e) {
      // ignore
    }
  }, [])

  /**
   * Create payment order before showing payment screen
   */
  async function createOrder() {
    if (!form.name || !form.phone || !form.reason) { setError('Please fill all fields'); return }
    if (form.phone.length < 10) { setError('Enter a valid 10-digit phone number'); return }
    
    setLoading(true); setError('')
    try {
      const orderData = await createPaymentOrder(500) // ₹500 consultation fee
      setPaymentOrder(orderData)
      setStep(5) // Go to payment screen (moved one step due to consultation mode)
    } catch (e) {
      console.error('[CREATE ORDER ERROR]', e)
      setError(e.message || 'Failed to create order. Please try again.')
    }
    setLoading(false)
  }

  /**
   * Simulate payment and verify with backend
   */
  async function processPayment() {
    console.log('\n[PAYMENT FLOW] ===== STARTING PAYMENT PROCESS =====')
    setPaymentStatus('processing')
    setError('')
    setLoading(true)
    
    try {
      // Simulate Razorpay payment (1-2 second delay, 10% failure rate)
      console.log('[PAYMENT FLOW] Step 1: Calling simulateRazorpayPayment()')
      const paymentDetails = await simulateRazorpayPayment(paymentOrder.orderId)
      console.log('[PAYMENT FLOW] Step 2: Payment simulation complete. Details:', paymentDetails)
      
      // Verify payment with backend
      console.log('[PAYMENT FLOW] Step 3: Calling verifyPayment() with details:', paymentDetails)
      const verifyResult = await verifyPayment(paymentDetails)
      console.log('[PAYMENT FLOW] Step 4: Verify payment response:', verifyResult)
      
      if (verifyResult.success) {
        console.log('[PAYMENT FLOW] Step 5: Payment verified successfully. Setting status to success.')
        setPaymentStatus('success')
        // Proceed to token generation after 1.5 second delay to show success message
        console.log('[PAYMENT FLOW] Step 6: Scheduling generateToken() to run in 1500ms...')
        const timeoutId = setTimeout(() => {
          console.log('[PAYMENT FLOW] Step 7: Timeout fired! Calling generateToken() now.')
          generateToken()
        }, 1500)
        console.log('[PAYMENT FLOW] Step 6b: Timeout scheduled with ID:', timeoutId)
      } else {
        console.error('[PAYMENT FLOW] Payment verification returned success=false:', verifyResult)
        setPaymentStatus('failed')
        setError(verifyResult.message || 'Payment verification failed. Please try again.')
        setLoading(false)
      }
    } catch (e) {
      console.error('[PAYMENT ERROR] Exception in processPayment():', e)
      console.error('[PAYMENT ERROR] Error name:', e.name)
      console.error('[PAYMENT ERROR] Error message:', e.message)
      console.error('[PAYMENT ERROR] Error stack:', e.stack)
      setPaymentStatus('failed')
      setError(e.message || 'Payment processing failed. Please try again.')
      setLoading(false)
    }
  }

  /**
   * Retry failed payment
   */
  function retryPayment() {
    setPaymentStatus(null)
    setError('')
    setLoading(false)
  }

  /**
   * Generate token after successful payment
   */
  async function generateToken() {
    console.log('\n[TOKEN FLOW] ===== STARTING TOKEN GENERATION =====')
    console.log('[TOKEN FLOW] Current form data:', form)
    console.log('[TOKEN FLOW] Current clinic:', clinic)
    
    setLoading(true)
    setError('')
    try {
      // Call backend API to generate token
      console.log('[TOKEN FLOW] Step 1: Preparing API request to /queue/add')
      const requestBody = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        place: form.place,
        reason: form.reason,
        clinic: clinic,
        consultationMode: consultationMode,
        trackingUrl: `${window.location.origin}/track?phone=${form.phone}`
      }
      console.log('[TOKEN FLOW] Step 2: Request body prepared:', requestBody)
      
      console.log('[TOKEN FLOW] Step 3: Calling apiRequest("/queue/add") ...')
      const result = await apiRequest('/queue/add', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      console.log('[TOKEN FLOW] Step 4: API response received:', result)

      if (!result || !result.success) {
        console.error('[TOKEN FLOW] ERROR: API returned failed status or null result')
        console.error('[TOKEN FLOW] Response:', result)
        const errorMsg = result?.message || 'Failed to generate token. Please try again.'
        setError(errorMsg)
        setLoading(false)
        return
      }

      console.log('[TOKEN FLOW] Step 5: Extracting token number from result...')
      const tokenNum = result.data?.tokenNumber
      console.log('[TOKEN FLOW] Step 6: Token number extracted:', tokenNum)
      
      if (!tokenNum) {
        console.error('[TOKEN FLOW] ERROR: tokenNumber not found in response. Full response:', result)
        setError('Invalid response from server. Please try again.')
        setLoading(false)
        return
      }
      
      console.log('[TOKEN FLOW] Step 7: Setting token state to:', tokenNum)
      setToken(tokenNum)
      
      console.log('[TOKEN FLOW] Step 8: Moving to step 6 (success screen)')
      setStep(6) // Final success screen
      
      console.log('[TOKEN FLOW] ===== TOKEN GENERATION COMPLETE =====\n')
    } catch (e) {
      console.error('[TOKEN GENERATION ERROR] Exception caught:', e)
      console.error('[TOKEN GENERATION ERROR] Error name:', e.name)
      console.error('[TOKEN GENERATION ERROR] Error message:', e.message)
      console.error('[TOKEN GENERATION ERROR] Error status:', e.status)
      console.error('[TOKEN GENERATION ERROR] Error data:', e.data)
      console.error('[TOKEN GENERATION ERROR] Error stack:', e.stack)
      const errorMsg = e.data?.message || e.message || 'Something went wrong. Please try again.'
      setError(errorMsg)
    }
    setLoading(false)
  }

  const clinicObj = CLINICS.find(c => c.id === clinic)

  return (
    <>
      <SEOMeta pageKey="queue" />
      <div style={{ paddingTop: '72px', minHeight: '100vh', background: '#F8FAFA' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0A1628,#0F2040)', padding: '60px 5%', textAlign: 'center' }}>
          <div className="section-tag" style={{ justifyContent: 'center', color: '#0FA898' }}>QUEUE SYSTEM</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: '700', color: '#fff' }}>
            Skip the Wait — <em style={{ fontStyle: 'italic', color: '#0FA898' }}>Book Your Token</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '12px' }}>Walk in at the right time. No more crowding at reception.</p>
        </div>

        {/* Progress */}
        {step < 6 && (
          <div style={{ background: '#fff', borderBottom: '1px solid #E2EEEC', padding: '16px 5%', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
            {['Choose Clinic','Consultation Mode','Your Details','Confirm','Payment'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step > i + 1 ? '#0B7B6F' : step === i + 1 ? '#0B7B6F' : '#E2EEEC', color: step >= i + 1 ? '#fff' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>{step > i + 1 ? '✓' : i + 1}</div>
                <span style={{ fontSize: '13px', fontWeight: step === i + 1 ? '700' : '400', color: step === i + 1 ? '#0A1628' : '#64748B' }}>{s}</span>
                {i < 4 && <span style={{ color: '#E2EEEC', fontSize: '16px' }}>›</span>}
              </div>
            ))}
          </div>
        )}

        <div style={{ maxWidth: '560px', margin: '48px auto', padding: '0 5%' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 4px 24px rgba(11,123,111,0.08)', border: '1px solid #E2EEEC' }}>

            {/* Step 1 — Choose Clinic */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Choose Your Clinic</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>Select where you would like to visit Dr. Praveen</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {CLINICS.map(c => (
                    <div key={c.id} onClick={() => { setClinic(c.id); setStep(2); }}
                      style={{ border: `2px solid ${clinic === c.id ? '#0B7B6F' : '#E2EEEC'}`, borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', background: clinic === c.id ? '#E6F4F2' : '#fff' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#0B7B6F'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = clinic === c.id ? '#0B7B6F' : '#E2EEEC'}
                    >
                      <div style={{ fontWeight: '700', color: '#0A1628', marginBottom: '4px' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>{c.address}</div>
                      <div style={{ fontSize: '12px', color: '#0B7B6F', fontWeight: '600' }}> {c.timings.join(' · ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Consultation Mode */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Consultation Mode</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>Choose how you'd like to consult</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div onClick={() => { setConsultationMode('IN_PERSON'); setStep(3); }}
                    style={{ border: `2px solid ${consultationMode === 'IN_PERSON' ? '#0B7B6F' : '#E2EEEC'}`, borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', background: consultationMode === 'IN_PERSON' ? '#E6F4F2' : '#fff' }}>
                    <div style={{ fontWeight: '700', color: '#0A1628', marginBottom: '4px' }}>In-Person Consultation</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Visit the clinic for face-to-face consultation</div>
                  </div>
                  <div onClick={() => { setConsultationMode('ONLINE'); setStep(3); }}
                    style={{ border: `2px solid ${consultationMode === 'ONLINE' ? '#0B7B6F' : '#E2EEEC'}`, borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', background: consultationMode === 'ONLINE' ? '#E6F4F2' : '#fff' }}>
                    <div style={{ fontWeight: '700', color: '#0A1628', marginBottom: '4px' }}>Online Consultation</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Consult via video/phone</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Details */}
            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Your Details</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>Clinic: <strong style={{ color: '#0B7B6F' }}>{clinicObj?.name}</strong></p>
                {[
                  { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Enter your full name' },
                  { label: 'Phone Number *', key: 'phone', type: 'tel', placeholder: '10-digit mobile number' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'Enter your email address' },
                  { label: 'Place', key: 'place', type: 'text', placeholder: 'Enter your city or town' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key]} maxLength={f.key === 'phone' ? 10 : undefined}
                      onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                      style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2EEEC', borderRadius: '10px', fontSize: '14px', fontFamily: "'DM Sans',sans-serif", outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#0B7B6F'}
                      onBlur={e => e.target.style.borderColor = '#E2EEEC'}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0B7B6F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Reason for Visit *</label>
                  <select value={form.reason} onChange={e => setForm(p => ({...p, reason: e.target.value}))}
                    style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2EEEC', borderRadius: '10px', fontSize: '14px', fontFamily: "'DM Sans',sans-serif", outline: 'none', background: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#0B7B6F'}
                    onBlur={e => e.target.style.borderColor = '#E2EEEC'}
                  >
                    <option value="">Select reason...</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</p>}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
                  <button onClick={() => { if (!form.name || !form.phone || !form.reason) { setError('Please fill all fields'); return; } setError(''); setStep(4); }} className="btn-primary" style={{ flex: 2 }}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 4 — Confirm */}
            {step === 4 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: '700', color: '#0A1628', marginBottom: '24px' }}>Confirm Details</h2>
                {[
                  ['Clinic', clinicObj?.name], 
                  ['Name', form.name], 
                  ['Phone', form.phone], 
                  form.email && ['Email', form.email], 
                  form.place && ['Place', form.place], 
                  ['Reason', form.reason], 
                  ['Doctor', form.doctor]
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #E2EEEC', fontSize: '14px' }}>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>{label}</span>
                    <span style={{ color: '#0A1628', fontWeight: '700' }}>{val}</span>
                  </div>
                ))}
                <p style={{ color: '#64748B', fontSize: '13px', margin: '20px 0', lineHeight: '1.6' }}> You will receive an SMS with your token number and a live tracking link on <strong>{form.phone}</strong></p>
                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>⚠️ {error}</p>}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(3)} className="btn-secondary" style={{ flex: 1 }}>← Edit</button>
                  <button onClick={createOrder} disabled={loading} className="btn-primary" style={{ flex: 2, opacity: loading ? 0.7 : 1 }}>
                    {loading ? '⏳ Processing...' : ' Proceed to Payment'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5 — Payment */}
            {step === 5 && paymentOrder && !token && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '26px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>Confirm Payment</h2>
                  <p style={{ color: '#64748B', fontSize: '14px' }}>Consultation Fee</p>
                </div>

                {/* Amount */}
                <div style={{ background: '#F8FAFA', borderRadius: '14px', padding: '24px', marginBottom: '24px', border: '1px solid #E2EEEC' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Amount to Pay</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '48px', fontWeight: '800', color: '#0B7B6F', lineHeight: '1' }}>₹{paymentOrder.amount}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>Order ID: {paymentOrder.orderId}</div>
                </div>

                {/* Status Messages */}
                {paymentStatus === 'processing' && (
                  <div style={{ background: '#E6F4F2', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #0B7B6F' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0B7B6F', marginBottom: '8px' }}>⏳ Processing Payment...</div>
                    <div style={{ fontSize: '12px', color: '#0A1628', marginBottom: '12px' }}>Securely processing your payment. Please do not close this page.</div>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0B7B6F', animation: 'pulse 1.4s infinite' }} />
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0B7B6F', animation: 'pulse 1.4s infinite 0.2s' }} />
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0B7B6F', animation: 'pulse 1.4s infinite 0.4s' }} />
                    </div>
                    <style>{`
                      @keyframes pulse {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 1; }
                      }
                    `}</style>
                  </div>
                )}

                {paymentStatus === 'success' && (
                  <div style={{ background: '#E6F4F2', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #0B7B6F' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0B7B6F', marginBottom: '4px' }}>✓ Payment Successful!</div>
                    <div style={{ fontSize: '12px', color: '#0A1628', marginTop: '4px' }}>Generating your token...</div>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #DC2626' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#DC2626', marginBottom: '4px' }}>✗ Payment Failed</div>
                    <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '4px', marginBottom: '12px' }}>{error || 'Payment could not be processed. Please try again.'}</div>
                    <div style={{ fontSize: '11px', color: '#7F1D1D', fontStyle: 'italic' }}>This is a mock payment. In production, contact support if issues persist.</div>
                  </div>
                )}

                {/* Action Buttons */}
                {!paymentStatus && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setStep(4); setPaymentOrder(null); }} className="btn-secondary" style={{ flex: 1 }}>← Cancel</button>
                    <button onClick={processPayment} disabled={loading} className="btn-primary" style={{ flex: 2, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                      {loading ? ' Processing...' : ' Pay Now'}
                    </button>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setStep(4); setPaymentOrder(null); setPaymentStatus(null); }} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
                    <button onClick={retryPayment} className="btn-primary" style={{ flex: 2 }}>Retry Payment</button>
                  </div>
                )}

                {paymentStatus === 'processing' && (
                  <div style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', padding: '16px' }}>
                    <p>Your payment is being processed securely...</p>
                    <p style={{ fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>This may take a few moments</p>
                  </div>
                )}

                {paymentStatus === 'success' && (
                  <div style={{ textAlign: 'center', color: '#0B7B6F', fontSize: '13px', padding: '16px' }}>
                    <p>Your payment has been confirmed. Creating your token...</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 6 — Success */}
            {step === 6 && token && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: 'linear-gradient(135deg,#0B7B6F,#096358)', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Your Queue Token</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '80px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>#{String(token).padStart(2,'0')}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '8px' }}>{clinicObj?.name}</div>
                </div>
                <div style={{ background: '#E6F4F2', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: '#0A1628', fontWeight: '600' }}> SMS sent to {form.phone}</p>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Your token number and live tracking link have been sent.</p>
                </div>
                <a href={`/track?phone=${form.phone}`} className="btn-primary" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', textDecoration: 'none' }}> Track My Position Live</a>
                <button onClick={() => { setStep(1); setToken(null); setPaymentOrder(null); setPaymentStatus(null); setForm({ name:'',phone:'',doctor:'Dr. Praveen Ramachandra',reason:'',email:'',place:'' }); setClinic(''); setConsultationMode(''); }} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Book Another Token</button>
              </div>
            )}
          </div>
          <LiveQueue data={queueData} />
        </div>
      </div>
    </>
  )
}
