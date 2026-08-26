// Vercel serverless function: returns Luke's current TikTok + Instagram follower counts.
// The site reads this from /api/followers and updates the numbers automatically.
// If a platform blocks the request, that value is returned as null and the site
// keeps the fallback number that's hard-coded in the HTML.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function tiktokCount() {
  try {
    const r = await fetch('https://www.tiktok.com/@luketaleno', {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
    });
    const html = await r.text();
    const m = html.match(/"followerCount":(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  } catch (e) {
    return null;
  }
}

async function instagramCount() {
  try {
    const r = await fetch(
      'https://www.instagram.com/api/v1/users/web_profile_info/?username=luketaleno',
      { headers: { 'User-Agent': UA, 'x-ig-app-id': '936619743392459' } }
    );
    const j = await r.json();
    const c = j && j.data && j.data.user && j.data.user.edge_followed_by
      ? j.data.user.edge_followed_by.count
      : null;
    return c || null;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const [tiktok, instagram] = await Promise.all([tiktokCount(), instagramCount()]);
  // Cache at the edge for 1 hour; keep serving the last value while revalidating.
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ tiktok, instagram, updated: new Date().toISOString() });
}
