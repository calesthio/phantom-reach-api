// POST /api/enrich
// Enriches a business/person using Apollo.io
// Body: { businessName, city, state, ownerName, domain }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['x-api-secret'];
  if (authHeader !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { businessName, city, state, ownerName, domain } = req.body;

  if (!businessName) {
    return res.status(400).json({ error: 'Missing required field: businessName' });
  }

  const results = {};

  try {
    // Step 1: Search for the organization
    const orgSearchBody = {
      q_organization_name: businessName,
      organization_locations: city && state ? [`${city}, ${state}`] : undefined,
      per_page: 3
    };

    const orgResponse = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.APOLLO_API_KEY
      },
      body: JSON.stringify(orgSearchBody)
    });

    const orgData = await orgResponse.json();
    const org = orgData?.organizations?.[0] || orgData?.accounts?.[0];

    if (org) {
      results.organization = {
        name: org.name,
        domain: org.primary_domain || org.domain,
        phone: org.phone,
        industry: org.industry,
        employeeCount: org.estimated_num_employees,
        annualRevenue: org.annual_revenue_printed,
        linkedinUrl: org.linkedin_url,
        city: org.city,
        state: org.state,
        country: org.country
      };
    }

    // Step 2: Search for people at the organization (owner/decision maker)
    const peopleSearchBody = {
      q_organization_name: businessName,
      person_titles: ownerName ? [ownerName] : ['owner', 'president', 'founder', 'CEO', 'manager'],
      organization_locations: city && state ? [`${city}, ${state}`] : undefined,
      per_page: 5
    };

    if (domain) {
      peopleSearchBody.q_organization_domains = domain;
    }

    const peopleResponse = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.APOLLO_API_KEY
      },
      body: JSON.stringify(peopleSearchBody)
    });

    const peopleData = await peopleResponse.json();
    const people = peopleData?.people || [];

    results.contacts = people.map(p => ({
      name: p.name,
      title: p.title,
      email: p.email,
      phone: p.phone_numbers?.[0]?.sanitized_number,
      linkedinUrl: p.linkedin_url,
      city: p.city,
      state: p.state
    }));

    results.primaryContact = results.contacts[0] || null;

    return res.status(200).json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Apollo error:', error.message);
    return res.status(500).json({
      error: 'Enrichment failed',
      details: error.message
    });
  }
}
