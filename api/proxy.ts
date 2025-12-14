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

    // Use the Origami Endpoint
    const origamiApiUrl = 'https://mganim.origami.ms/entities/api/instance_data/format/json';
    
    // Explicitly use the credentials provided to ensure immediate fix
    // Using trim() to remove any accidental whitespace from copy-pasting
    const origamiUsername = 'bestjeansil@gmail.com'.trim();
    const origamiApiSecret = 'OGMI-NjkZZTczMJDKNJG-0MjCtNTM5NzI2OD-c4MjAwOTUxNJY5M-2U3MzI3ZDY4NDkZ-LTC3NDQzMjcw'.trim();

    if (!origamiApiSecret) {
      console.error('Origami API credentials are not set.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Secrets.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const origamiRequestBody = {
      ...clientRequestBody,
      username: origamiUsername,
      api_secret: origamiApiSecret,
      // Adding 'token' as an alias for api_secret just in case the endpoint expects it
      token: origamiApiSecret 
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
        
        let errorJson;
        try {
            errorJson = JSON.parse(errorText);
        } catch (e) {
            errorJson = { message: errorText };
        }

        return new Response(JSON.stringify({ error: errorJson }), {
            status: origamiResponse.status,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const data = await origamiResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
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