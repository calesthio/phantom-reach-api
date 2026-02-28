// GET /api/health — simple health check
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'phantom-reach-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/send-email', '/api/enrich', '/api/diagnostic/[slug]']
  });
}
