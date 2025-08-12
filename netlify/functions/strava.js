// netlify/functions/strava.js
// Returns your most recent Strava activity via refresh-token flow.

export async function handler(event) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
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
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Missing Strava env vars' })
        };
      }
  
      // 1) Get short-lived access token
      const tokenRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id,
          client_secret,
          refresh_token,
          grant_type: 'refresh_token'
        })
      });
  
      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'token exchange failed', details: text }) };
      }
  
      const { access_token } = await tokenRes.json();
  
      // 2) Fetch most recent activity
      const actRes = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=1', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
  
      if (!actRes.ok) {
        const text = await actRes.text();
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'fetch activities failed', details: text }) };
      }
  
      const activities = await actRes.json();
      const a = activities?.[0] || null;
  
      // Return just the fields we actually use
      const latest = a
        ? {
            name: a.name,
            distance: a.distance,              // meters
            moving_time: a.moving_time,        // seconds
            type: a.type || a.sport_type || 'Run',
            start_date: a.start_date,          // UTC
            start_date_local: a.start_date_local // local per your Strava profile
          }
        : null;
  
      return { statusCode: 200, headers, body: JSON.stringify({ latest }) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'server error', details: String(err) }) };
    }
  }
  