const ALLOWED_ORIGINS = [
  'https://simplewealth.co.za',
  'https://new.simplewealth.co.za',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsHeaders(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) {
    return { ...CORS_HEADERS, 'Access-Control-Allow-Origin': origin };
  }
  return CORS_HEADERS;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const headers = corsHeaders(origin);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Origin check
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  const API_KEY = process.env.MAILERLITE_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const { email, name, group } = data;

  // Honeypot check — silently accept to not tip off bots
  if (data.website) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  // Email validation
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email) || email.length > 254) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'A valid email is required' }) };
  }

  // Input length limits
  if (name && (typeof name !== 'string' || name.length > 200)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name is too long' }) };
  }

  const GROUPS = {
    siip: '84731331148252747',
    newsletter: '84731160014357766',
  };

  const groupId = GROUPS[group] || GROUPS.siip;

  const payload = {
    email,
    fields: {},
    groups: [groupId],
  };

  if (name) {
    payload.fields.name = name;
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok || response.status === 200 || response.status === 201) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify({ error: result.message || 'Subscription failed' }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to connect to email service' }) };
  }
};
