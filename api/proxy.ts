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

    // 1. URL Configuration
    // UPDATED: Using 'razerstar' as the specific subdomain for this user.
    const origamiApiUrl = process.env.ORIGAMI_API_URL || 'https://razerstar.origami.ms/entities/api/instance_data/format/json';
    
    // 2. Credentials Configuration
    // Prioritize Environment Variables from Vercel
    const envUsername = process.env.ORIGAMI_USERNAME;
    const envToken = process.env.ORIGAMI_API_KEY || process.env.ORIGAMI_API_SECRET;

    // Fallback to hardcoded values (Updated to match your provided credentials)
    const finalUsername = (envUsername || 'bestjeansil@gmail.com').trim();
    const finalToken = (envToken || 'OGMI-NjkZZTczMJDKNJG-0MjCtNTM5NzI2OD-c4MjAwOTUxNJY5M-2U3MzI3ZDY4NDkZ-LTC3NDQzMjcw').trim();

    if (!finalToken) {
      console.error('Origami API credentials are not set.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Secrets.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Construct Request Body
    // Sending the token in multiple fields to ensure compatibility
    const origamiRequestBody = {
      ...clientRequestBody,
      username: finalUsername,
      token: finalToken,
      api_key: finalToken,
      api_secret: finalToken
    };

    // 4. Send Request
    const origamiResponse = await fetch(origamiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${finalToken}` 
      },
      body: JSON.stringify(origamiRequestBody),
    });

    if (!origamiResponse.ok) {
        const errorText = await origamiResponse.text();
        console.error(`Origami API error: ${origamiResponse.status} from ${origamiApiUrl}`, errorText);
        
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
    return new Response(JSON.stringify({ error: 'Internal Proxy Error', details: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}