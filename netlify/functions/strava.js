// netlify/functions/strava.js
// Returns your most recent *Run* on Strava (not just any activity).
// Also tries to include map.summary_polyline (from the detailed activity).

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const client_id = process.env.STRAVA_CLIENT_ID;
    const client_secret = process.env.STRAVA_CLIENT_SECRET;
    const refresh_token = process.env.STRAVA_REFRESH_TOKEN;

    if (!client_id || !client_secret || !refresh_token) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Strava env vars' }) };
    }

    // 1) Exchange refresh token -> short-lived access token
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id,
        client_secret,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'token exchange failed', details: text }) };
    }
    const { access_token } = await tokenRes.json();

    // 2) Get a small batch of recent activities and pick the most recent "Run"
    const actRes = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!actRes.ok) {
      const text = await actRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'activities fetch failed', details: text }) };
    }

    const activities = await actRes.json();
    const latestRun = Array.isArray(activities)
      ? activities.find(a => a?.type === 'Run')
      : null;

    if (!latestRun) {
      // No recent runs found (maybe the last 10 were rides, swims, etc.)
      return { statusCode: 200, headers, body: JSON.stringify({ latest: null }) };
    }

    // 3) (Optional but recommended) Fetch detailed activity to ensure we have a polyline
    try {
      const detRes = await fetch(`https://www.strava.com/api/v3/activities/${latestRun.id}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (detRes.ok) {
        const det = await detRes.json();
        // Attach the detailed map (if present) onto the object we return
        latestRun.map = det?.map || latestRun.map || null;
      }
      // If not ok, we just return the summary object; some activities (treadmill) won't have GPS anyway.
    } catch {
      // swallow detail fetch errors; not critical
    }

    // 4) Return the most recent Run (with map.summary_polyline if available)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ latest: latestRun }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server error', details: String(err) }) };
  }
}
