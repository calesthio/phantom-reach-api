// GET /api/health — simple health check
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'phantom-reach-api',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/send-email', '/api/enrich', '/api/diagnostic/[slug]']
  });
}
