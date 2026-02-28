export default function Home() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: '60px 20px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Phantom Reach API</h1>
      <p style={{ color: '#666', marginTop: 12 }}>Backend services for Phantom Reach prospecting platform.</p>
      <div style={{ marginTop: 32, fontSize: 14, color: '#999' }}>
        <p>Endpoints:</p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
          <li>POST /api/send-email</li>
          <li>POST /api/enrich</li>
          <li>GET /api/diagnostic/[slug]</li>
          <li>GET /api/health</li>
        </ul>
      </div>
    </div>
  );
}
