// POST /api/send-email
// Sends outreach email via SendGrid
// Body: { to, toName, subject, htmlBody, textBody, fromName, fromEmail, replyTo }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple API secret check
  const authHeader = req.headers['x-api-secret'];
  if (authHeader !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    to,
    toName,
    subject,
    htmlBody,
    textBody,
    fromName = 'Ishan Bhatt',
    fromEmail = 'ishan@celesthio.com',
    replyTo = 'ishan@celesthio.com'
  } = req.body;

  if (!to || !subject || (!htmlBody && !textBody)) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, and htmlBody or textBody' });
  }

  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: { email: to, name: toName || '' },
      from: { email: fromEmail, name: fromName },
      replyTo: replyTo,
      subject: subject,
      ...(textBody && { text: textBody }),
      ...(htmlBody && { html: htmlBody }),
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    };

    const response = await sgMail.send(msg);

    return res.status(200).json({
      success: true,
      messageId: response[0]?.headers?.['x-message-id'] || 'sent',
      statusCode: response[0]?.statusCode
    });
  } catch (error) {
    console.error('SendGrid error:', error?.response?.body || error.message);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error?.response?.body?.errors || error.message
    });
  }
}
