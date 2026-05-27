import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

const MEDICINES = [
  { id: 1, name: 'Insulin Pen', category: 'Diabetes', price: 1200, image: '💉', stock: true },
  { id: 2, name: 'Metformin', category: 'Diabetes', price: 450, image: '💊', stock: true },
  { id: 3, name: 'Levothyroxine', category: 'Thyroid', price: 350, image: '💊', stock: true },
  { id: 4, name: 'Vitamin D3', category: 'Supplements', price: 200, image: '🟢', stock: true },
  { id: 5, name: 'Calcium Citrate', category: 'Bone Health', price: 280, image: '⚪', stock: true },
  { id: 6, name: 'Multivitamin', category: 'Supplements', price: 320, image: '🟡', stock: true },
]

export default function Pharmacy() {
  const [step, setStep] = useState(1)
  const [prescription, setPrescription] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [expressDelivery, setExpressDelivery] = useState(false)
  const [notes, setNotes] = useState('')

  const addMedicine = (med) => {
    const existing = medicines.find(m => m.id === med.id)
    if (existing) {
      setMedicines(medicines.map(m => 
        m.id === med.id ? { ...m, quantity: m.quantity + 1 } : m
      ))
    } else {
      setMedicines([...medicines, { ...med, quantity: 1, customQuantity: 1 }])
    }
  }

  const updateQuantity = (medId, quantity) => {
    if (quantity === 0) {
      setMedicines(medicines.filter(m => m.id !== medId))
    } else {
      setMedicines(medicines.map(m => 
        m.id === medId ? { ...m, customQuantity: quantity } : m
      ))
    }
  }

  const removeMedicine = (medId) => {
    setMedicines(medicines.filter(m => m.id !== medId))
  }

  const totalPrice = medicines.reduce((sum, m) => sum + (m.price * m.customQuantity), 0)
  const deliveryCharge = expressDelivery ? 50 : (totalPrice > 500 ? 0 : 30)
  const finalTotal = totalPrice + deliveryCharge

  return (
    <>
      <Helmet>
        <title>Pharmacy | Dr. Praveen Ramachandra</title>
      </Helmet>

      <div style={{ paddingTop: '72px' }}>
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg,#0A1628,#0F2040)',
          padding: '80px 5%',
          textAlign: 'center'
        }}>
          <div className="section-tag" style={{ justifyContent: 'center', color: '#0FA898' }}>
            MEDICINE DELIVERY
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 'clamp(36px,5vw,60px)',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '16px'
          }}>
            Online <em style={{ fontStyle: 'italic', color: '#0FA898' }}>Pharmacy</em>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '15px',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: '1.7'
          }}>
            Upload your prescription and get medicines delivered to your doorstep
          </p>
        </div>

        {/* MAIN CONTENT */}
        <section style={{ padding: '60px 5%', background: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* PROGRESS STEPS */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '48px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '120px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: step >= s ? '#0B7B6F' : '#E2EEEC',
                    color: step >= s ? '#fff' : '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}>
                    {s}
                  </div>
                  <span style={{ fontSize: '12px', color: step >= s ? '#0A1628' : '#94A3B8', fontWeight: '500' }}>
                    {['Prescription', 'Select', 'Details', 'Review'][s-1]}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: UPLOAD PRESCRIPTION */}
            {step === 1 && (
              <div style={{
                background: '#F8FAFA',
                borderRadius: '20px',
                padding: '40px',
                border: '2px dashed #0B7B6F',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
                <h3 style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: '24px',
                  marginBottom: '12px',
                  color: '#0A1628'
                }}>
                  Upload Your Prescription
                </h3>
                <p style={{ color: '#64748B', marginBottom: '30px', lineHeight: '1.6' }}>
                  Upload a photo or PDF of your prescription. Our pharmacists will verify and prepare your medicines.
                </p>
                
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setPrescription(e.target.files[0].name)
                      setStep(2)
                    }
                  }}
                  style={{
                    display: 'none'
                  }}
                  id="prescFile"
                />
                
                <label htmlFor="prescFile" style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg,#0B7B6F,#096358)',
                  color: '#fff',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '15px',
                  marginBottom: '20px'
                }}>
                  📱 Upload File
                </label>

                {prescription && (
                  <div style={{
                    background: '#E6F4F2',
                    padding: '16px',
                    borderRadius: '10px',
                    marginTop: '20px',
                    color: '#0B7B6F',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    ✓ {prescription} uploaded
                  </div>
                )}

                <div style={{
                  marginTop: '30px',
                  padding: '20px',
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #E2EEEC',
                  fontSize: '13px',
                  color: '#64748B',
                  lineHeight: '1.7'
                }}>
                  <strong style={{ color: '#0A1628' }}>📌 No prescription?</strong><br/>
                  You can also select medicines from our catalog below or upload later. Browse available medicines and add to your order.
                </div>

                <div style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={() => setStep(2)} style={{
                    background: '#fff',
                    border: '2px solid #0B7B6F',
                    color: '#0B7B6F',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    Skip & Browse
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SELECT MEDICINES */}
            {step === 2 && (
              <div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: '28px',
                  marginBottom: '30px',
                  color: '#0A1628'
                }}>
                  Available Medicines
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '20px',
                  marginBottom: '40px'
                }}>
                  {MEDICINES.map(med => (
                    <div key={med.id} style={{
                      border: '1px solid #E2EEEC',
                      borderRadius: '16px',
                      padding: '20px',
                      background: '#fff',
                      textAlign: 'center',
                      transition: 'all 0.3s',
                      boxShadow: medicines.some(m => m.id === med.id) ? '0 4px 16px rgba(11,123,111,0.1)' : 'none',
                      borderColor: medicines.some(m => m.id === med.id) ? '#0B7B6F' : '#E2EEEC'
                    }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{med.image}</div>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>
                        {med.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '12px' }}>
                        {med.category}
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: '#0B7B6F', marginBottom: '16px' }}>
                        ₹{med.price}
                      </p>
                      <button onClick={() => addMedicine(med)} style={{
                        background: '#0B7B6F',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        width: '100%'
                      }}>
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>

                {medicines.length > 0 && (
                  <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A1628', marginBottom: '20px' }}>
                      Selected Medicines ({medicines.length})
                    </h3>
                    <div style={{ background: '#F8FAFA', borderRadius: '12px', padding: '20px' }}>
                      {medicines.map(med => (
                        <div key={med.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingBottom: '16px',
                          borderBottom: '1px solid #E2EEEC',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>
                              {med.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                              ₹{med.price} each
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                              background: '#fff',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              border: '1px solid #E2EEEC'
                            }}>
                              <button onClick={() => updateQuantity(med.id, med.customQuantity - 1)} style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: '#0B7B6F'
                              }}>−</button>
                              <span style={{ fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>
                                {med.customQuantity}
                              </span>
                              <button onClick={() => updateQuantity(med.id, med.customQuantity + 1)} style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: '#0B7B6F'
                              }}>+</button>
                            </div>
                            <button onClick={() => removeMedicine(med.id)} style={{
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setStep(1)} style={{
                    background: '#fff',
                    border: '2px solid #E2EEEC',
                    color: '#0A1628',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    Back
                  </button>
                  <button onClick={() => setStep(3)} disabled={medicines.length === 0} style={{
                    background: medicines.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg,#0B7B6F,#096358)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: medicines.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DELIVERY DETAILS */}
            {step === 3 && (
              <div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: '28px',
                  marginBottom: '30px',
                  color: '#0A1628'
                }}>
                  Delivery Details
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '30px',
                  marginBottom: '30px'
                }}>
                  {/* LEFT: FORM */}
                  <div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0A1628' }}>
                        Complete Address *
                      </label>
                      <textarea 
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter your complete delivery address with landmark"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #E2EEEC',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          minHeight: '100px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0A1628' }}>
                        Special Notes (Optional)
                      </label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="E.g., Store in cool place, allergic to..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #E2EEEC',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          minHeight: '80px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={expressDelivery}
                          onChange={(e) => setExpressDelivery(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: '600', color: '#0A1628' }}>
                          🚀 Express Delivery (Within 2 Hours) - ₹50
                        </span>
                      </label>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#0A1628' }}>
                        Payment Method *
                      </label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {['online', 'cash'].map(method => (
                          <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name="payment"
                              value={method}
                              checked={paymentMethod === method}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{
                              fontWeight: '600',
                              color: paymentMethod === method ? '#0B7B6F' : '#64748B'
                            }}>
                              {method === 'online' ? '💳 Pay Online' : '💰 Cash on Delivery'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: SUMMARY */}
                  <div style={{
                    background: '#F8FAFA',
                    borderRadius: '16px',
                    padding: '24px',
                    height: 'fit-content',
                    border: '1px solid #E2EEEC'
                  }}>
                    <h4 style={{ fontWeight: '700', color: '#0A1628', marginBottom: '16px' }}>
                      Order Summary
                    </h4>
                    {medicines.map(med => (
                      <div key={med.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        marginBottom: '10px',
                        color: '#64748B'
                      }}>
                        <span>{med.name} × {med.customQuantity}</span>
                        <span>₹{med.price * med.customQuantity}</span>
                      </div>
                    ))}
                    <div style={{
                      borderTop: '1px solid #E2EEEC',
                      paddingTop: '12px',
                      marginTop: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        marginBottom: '8px',
                        color: '#64748B'
                      }}>
                        <span>Subtotal</span>
                        <span>₹{totalPrice}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        marginBottom: '12px',
                        color: '#64748B'
                      }}>
                        <span>Delivery {deliveryCharge === 0 ? '(Free)' : ''}</span>
                        <span>₹{deliveryCharge}</span>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#0A1628',
                      borderTop: '1px solid #E2EEEC',
                      paddingTop: '12px'
                    }}>
                      <span>Total</span>
                      <span>₹{finalTotal}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setStep(2)} style={{
                    background: '#fff',
                    border: '2px solid #E2EEEC',
                    color: '#0A1628',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    Back
                  </button>
                  <button onClick={() => setStep(4)} disabled={!deliveryAddress} style={{
                    background: !deliveryAddress ? '#cbd5e1' : 'linear-gradient(135deg,#0B7B6F,#096358)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: !deliveryAddress ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}>
                    Review →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {step === 4 && (
              <div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: '28px',
                  marginBottom: '30px',
                  color: '#0A1628'
                }}>
                  Confirm Your Order
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '30px'
                }}>
                  {/* LEFT: DETAILS */}
                  <div>
                    <div style={{
                      background: '#F8FAFA',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '20px',
                      border: '1px solid #E2EEEC'
                    }}>
                      <h4 style={{ fontWeight: '700', color: '#0A1628', marginBottom: '16px' }}>
                        📦 Medicines
                      </h4>
                      {medicines.map(med => (
                        <div key={med.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          marginBottom: '12px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid #E2EEEC'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#0A1628' }}>{med.name}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Qty: {med.customQuantity}</div>
                          </div>
                          <div style={{ fontWeight: '700', color: '#0B7B6F' }}>
                            ₹{med.price * med.customQuantity}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      background: '#F8FAFA',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '20px',
                      border: '1px solid #E2EEEC'
                    }}>
                      <h4 style={{ fontWeight: '700', color: '#0A1628', marginBottom: '16px' }}>
                        📍 Delivery Address
                      </h4>
                      <p style={{ color: '#64748B', lineHeight: '1.6', fontSize: '14px' }}>
                        {deliveryAddress}
                      </p>
                    </div>

                    <div style={{
                      background: '#F8FAFA',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid #E2EEEC'
                    }}>
                      <h4 style={{ fontWeight: '700', color: '#0A1628', marginBottom: '16px' }}>
                        💳 Payment
                      </h4>
                      <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '600' }}>
                        {paymentMethod === 'online' ? '💳 Pay Online' : '💰 Cash on Delivery'}
                      </p>
                      {expressDelivery && (
                        <p style={{ color: '#0B7B6F', fontSize: '14px', marginTop: '12px', fontWeight: '600' }}>
                          🚀 Express Delivery
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: FINAL SUMMARY */}
                  <div style={{
                    background: 'linear-gradient(135deg,#0A1628,#0F2040)',
                    borderRadius: '16px',
                    padding: '32px',
                    color: '#fff',
                    height: 'fit-content'
                  }}>
                    <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                      Order Total
                    </h4>

                    <div style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px',
                      border: '1px solid rgba(15,200,184,0.3)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        fontSize: '14px'
                      }}>
                        <span>Medicines</span>
                        <span>₹{totalPrice}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        fontSize: '14px'
                      }}>
                        <span>Delivery</span>
                        <span>₹{deliveryCharge}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '18px',
                        fontWeight: '700',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        <span>Total</span>
                        <span style={{ color: '#0FA898' }}>₹{finalTotal}</span>
                      </div>
                    </div>

                    <button onClick={() => {
                      alert('Order placed successfully! You will receive a WhatsApp notification with delivery details.')
                      setStep(1)
                      setMedicines([])
                      setDeliveryAddress('')
                      setPrescription(null)
                    }} style={{
                      width: '100%',
                      background: '#0FA898',
                      color: '#0A1628',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}>
                      ✓ Confirm Order
                    </button>

                    <button onClick={() => setStep(3)} style={{
                      width: '100%',
                      background: 'transparent',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      marginTop: '12px'
                    }}>
                      ← Back to Details
                    </button>

                    <div style={{
                      marginTop: '24px',
                      padding: '16px',
                      background: 'rgba(15,200,184,0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,200,184,0.3)',
                      fontSize: '12px',
                      lineHeight: '1.6'
                    }}>
                      <strong>✓ Safe & Secure</strong><br/>
                      Your prescription will be verified by our pharmacist. Genuine medicines guaranteed.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section style={{ padding: '60px 5%', background: '#F8FAFA' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '48px',
              color: '#0A1628'
            }}>
              Why Choose Our <em style={{ color: '#0B7B6F' }}>Pharmacy</em>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              {[
                { icon: '✓', title: 'Verified Medicines', desc: 'All medicines are verified & genuine' },
                { icon: '🏥', title: 'Doctor Approved', desc: 'Prescribed by Dr. Praveen himself' },
                { icon: '🚚', title: 'Fast Delivery', desc: 'Same-day or express delivery available' },
                { icon: '💳', title: 'Safe Payment', desc: 'Multiple payment options available' },
                { icon: '🔒', title: 'Privacy Protected', desc: 'Your medical data is completely secure' },
                { icon: '📞', title: 'Support 24/7', desc: 'Chat with pharmacist anytime' },
              ].map((benefit, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '28px',
                  textAlign: 'center',
                  border: '1px solid #E2EEEC',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>{benefit.icon}</div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>
                    {benefit.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
