import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoadingScreen from './components/LoadingScreen'
import ScrollToTopButton, { ScrollToTopOnNav } from './components/ScrollToTop'

import FloatingActions from './components/FloatingActions'
import ChatBot from './components/ChatBot'

import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Clinics from './pages/Clinics'
import Queue from './pages/Queue'
import Track from './pages/Track'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import BlogDetail from './pages/BlogDetail'

import Login from './dashboard/Login'
import AdminDashboard from './dashboard/AdminDashboard'
import DoctorDashboard from './dashboard/DoctorDashboard'

import { logConnectionDiagnostics } from './utils/connectionChecker'

function CustomCursor() {
  useEffect(() => {
    // Only enable custom cursor on desktop (viewport width > 768px)
    const isMobile = window.innerWidth <= 768
    if (isMobile) return

    const cur = document.getElementById('cursor')
    const ring = document.getElementById('cursor-ring')
    if (!cur || !ring) return

    let rx = 0, ry = 0

    const move = e => {
      cur.style.left = e.clientX + 'px'
      cur.style.top = e.clientY + 'px'
      rx = e.clientX
      ry = e.clientY
    }

    const loop = () => {
      ring.style.left = rx + 'px'
      ring.style.top = ry + 'px'
      requestAnimationFrame(loop)
    }

    document.addEventListener('mousemove', move)
    const id = requestAnimationFrame(loop)

    return () => {
      document.removeEventListener('mousemove', move)
      cancelAnimationFrame(id)
    }
  }, [])

  return null
}

function Layout({ children }) {
  const { pathname } = useLocation()
  const isDash = ['/admin', '/doctor', '/login'].some(p => pathname.startsWith(p))

  const [chatOpen, setChatOpen] = useState(false)

  return (
    <>
      {!isDash && <Navbar />}

      {children}

      {!isDash && <Footer />}

      {/* ✅ NEW FLOATING SYSTEM */}
      {!isDash && (
        <>
          <ChatBot open={chatOpen} setOpen={setChatOpen} />
          <FloatingActions onChatOpen={() => setChatOpen(true)} />
        </>
      )}

      {!isDash && <ScrollToTopButton />}
    </>
  )
}

export default function App() {
  // Check backend connection on app load
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('[APP INIT] Checking backend connection...')
      logConnectionDiagnostics().catch(err => {
        console.error('[APP INIT] Connection check failed:', err)
      })
    }
  }, [])

  return (
    <BrowserRouter>
      <LoadingScreen />

      <div id="cursor" />
      <div id="cursor-ring" />
      <CustomCursor />

      <ScrollToTopOnNav />

      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/clinics" element={<Clinics />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/track" element={<Track />} />
          <Route path="/track/:id" element={<Track />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/doctor" element={<DoctorDashboard />} />

          <Route
            path="*"
            element={
              <div style={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '16px',
                paddingTop: '72px'
              }}>
                <div style={{ fontSize: '64px' }}>🔍</div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: '36px',
                  color: '#0A1628'
                }}>
                  Page Not Found
                </h2>
                <a href="/" className="btn-primary">← Back to Home</a>
              </div>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}