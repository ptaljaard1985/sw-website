exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const API_KEY = process.env.MAILERLITE_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const { email, name } = data;

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
  }

  const SIIP_GROUP_ID = '84731331148252747';

  const payload = {
    email,
    fields: {},
    groups: [SIIP_GROUP_ID],
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
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return {
      statusCode: response.status,
      body: JSON.stringify({ error: result.message || 'Subscription failed' }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to connect to email service' }) };
  }
};
