// GET /api/diagnostic/[slug]
// Serves a branded diagnostic page for a prospect
// Query: ?data=base64encodedJSON (prospect data)
// OR fetches from Airtable if slug matches a record

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  // If data is passed as base64-encoded query param
  let prospectData;
  if (req.query.data) {
    try {
      prospectData = JSON.parse(Buffer.from(req.query.data, 'base64').toString('utf-8'));
    } catch (e) {
      return res.status(400).json({ error: 'Invalid data parameter' });
    }
  } else {
    // Fallback: use slug as business name for display
    prospectData = {
      businessName: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      signals: {},
      painHypotheses: []
    };
  }

  const {
    businessName = 'Your Business',
    phone = '',
    website = '',
    city = '',
    googleRating = null,
    reviewCount = null,
    priorityScore = 0,
    signals = {},
    painHypotheses = [],
    researchNotes = ''
  } = prospectData;

  // Generate the diagnostic HTML
  const html = generateDiagnosticHTML({
    businessName, phone, website, city,
    googleRating, reviewCount, priorityScore,
    signals, painHypotheses, researchNotes
  });

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}

function generateDiagnosticHTML(data) {
  const scoreColor = data.priorityScore >= 65 ? '#e74c3c' : data.priorityScore >= 45 ? '#f39c12' : '#27ae60';
  const scoreLabel = data.priorityScore >= 65 ? 'Needs Attention' : data.priorityScore >= 45 ? 'Room to Improve' : 'Looking Good';

  const signalBars = Object.entries(data.signals).map(([name, score]) => {
    const barColor = score >= 70 ? '#e74c3c' : score >= 40 ? '#f39c12' : '#27ae60';
    return `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
          <span>${name}</span>
          <span style="color: ${barColor}; font-weight: 600;">${score}/100</span>
        </div>
        <div style="background: #f0f0f0; border-radius: 8px; height: 8px; overflow: hidden;">
          <div style="background: ${barColor}; width: ${score}%; height: 100%; border-radius: 8px; transition: width 1s ease;"></div>
        </div>
      </div>
    `;
  }).join('');

  const painCards = data.painHypotheses.map((pain, i) => `
    <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border-left: 4px solid ${i === 0 ? '#e74c3c' : i === 1 ? '#f39c12' : '#3498db'}; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
      <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #2c3e50;">
        ${pain.title || `Finding #${i + 1}`}
      </div>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
        ${pain.description || ''}
      </p>
      ${pain.cost ? `<div style="background: #fff5f5; padding: 8px 12px; border-radius: 6px; font-size: 13px; color: #c0392b;">
        <strong>Estimated impact:</strong> ${pain.cost}
      </div>` : ''}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Presence Diagnostic — ${data.businessName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f8f9fa; color: #2c3e50; }
    .container { max-width: 680px; margin: 0 auto; padding: 24px 16px; }
    .header { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; margin-bottom: 24px; color: white; }
    .score-ring { width: 120px; height: 120px; border-radius: 50%; border: 8px solid ${scoreColor}; display: flex; align-items: center; justify-content: center; margin: 20px auto; background: rgba(255,255,255,0.1); }
    .score-number { font-size: 36px; font-weight: 700; color: ${scoreColor}; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #2c3e50; }
    .cta-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 32px; text-align: center; color: white; margin-top: 32px; }
    .cta-button { display: inline-block; background: white; color: #667eea; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px; margin-top: 16px; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin-bottom: 8px;">Digital Presence Diagnostic</div>
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">${data.businessName}</h1>
      <div style="font-size: 14px; opacity: 0.8;">${data.city || ''}</div>
      <div class="score-ring">
        <span class="score-number">${data.priorityScore}</span>
      </div>
      <div style="font-size: 16px; font-weight: 600; color: ${scoreColor};">${scoreLabel}</div>
      <div style="font-size: 13px; opacity: 0.7; margin-top: 4px;">Out of 100 (lower is better)</div>
    </div>

    ${signalBars ? `
    <div class="section">
      <div class="section-title">Signal Breakdown</div>
      <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        ${signalBars}
      </div>
    </div>
    ` : ''}

    ${painCards ? `
    <div class="section">
      <div class="section-title">What We Found</div>
      ${painCards}
    </div>
    ` : ''}

    <div class="cta-box">
      <div style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Want to fix these?</div>
      <p style="font-size: 14px; opacity: 0.9; line-height: 1.6;">
        We help ${data.city || 'local'} trades businesses plug revenue leaks with AI-powered tools — no contracts, no setup fees, just results.
      </p>
      <a href="mailto:ishan@celesthio.com?subject=Diagnostic followup — ${encodeURIComponent(data.businessName)}" class="cta-button">
        Let's Talk →
      </a>
    </div>

    <div class="footer">
      <p>This diagnostic was generated by Celesthio AI Labs based on publicly available information.</p>
      <p style="margin-top: 8px;">Questions? Reply to the email that sent you here or contact ishan@celesthio.com</p>
    </div>
  </div>
</body>
</html>`;
}
