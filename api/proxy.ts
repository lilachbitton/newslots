export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const clientRequestBody = await request.json();

    // Use the Origami Endpoint from your previous configuration
    const origamiApiUrl = 'https://mganim.origami.ms/entities/api/instance_data/format/json';
    
    // Credentials from Environment Variables
    const origamiUsername = process.env.ORIGAMI_USERNAME || 'api'; // Default fallback
    const origamiApiSecret = process.env.ORIGAMI_API_SECRET;

    if (!origamiApiSecret) {
      console.error('Origami API credentials are not set on the server.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Secrets.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const origamiRequestBody = {
      ...clientRequestBody,
      username: origamiUsername,
      api_secret: origamiApiSecret,
    };

    const origamiResponse = await fetch(origamiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(origamiRequestBody),
    });

    if (!origamiResponse.ok) {
        const errorText = await origamiResponse.text();
        console.error(`Origami API error: ${origamiResponse.status}`, errorText);
        return new Response(JSON.stringify({ error: `Origami Error: ${origamiResponse.status}` }), {
            status: origamiResponse.status,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const data = await origamiResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0', // Live data, do not cache heavily
      },
    });

  } catch (error) {
    console.error('Proxy internal error:', error);
    return new Response(JSON.stringify({ error: 'Internal Proxy Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}