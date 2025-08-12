// netlify/functions/strava.js
// Returns your most recent Strava activity using the refresh-token flow.

export async function handler(event) {
    // CORS for your site (adjust if you host elsewhere)
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
  
      // 1) exchange refresh token -> short-lived access token
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
  
      const tokenData = await tokenRes.json();
      const access_token = tokenData.access_token;
  
      // 2) fetch most recent activity
      const actRes = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=1',
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
  
      if (!actRes.ok) {
        const text = await actRes.text();
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'fetch activities failed', details: text }) };
      }
  
      const activities = await actRes.json();
      const latest = activities?.[0] || null;
  
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ latest })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'server error', details: String(err) })
      };
    }
  }
  