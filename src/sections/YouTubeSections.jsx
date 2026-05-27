export default function YouTubeSection() {
  return (
    <section style={{
      padding: '90px 5%',
      background: '#ffffff'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>

        <div className="section-tag">HEALTH VIDEOS</div>

        <h2 className="section-h2">
          Visit <em>Diaplus Clinic</em> YouTube Channel
        </h2>

        <p style={{
          color: '#64748B',
          marginBottom: '30px'
        }}>
          Watch expert health tips and diabetes care videos by Dr. Praveen.
        </p>

        {/* BUTTON */}
        <a
          href="https://youtube.com/@praveenramachandra9265?si=KiWVecHlYbutSx04"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            background: '#FF0000',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '30px',
            textDecoration: 'none',
            fontWeight: '600',
            boxShadow: '0 10px 25px rgba(255,0,0,0.3)'
          }}
        >
          ▶ Visit YouTube Channel
        </a>

        {/* EMBED ONE VIDEO */}
        <div style={{ marginTop: '40px' }}>
          <iframe
            width="100%"
            height="400"
            src="https://www.youtube.com/embed?listType=user_uploads&list=diaplusclinicbengaluru"
            frameBorder="0"
            allowFullScreen
            style={{ borderRadius: '20px' }}
          />
        </div>

      </div>
    </section>
  )
}