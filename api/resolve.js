export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    const apiKey = process.env.GOOGLE_API_KEY;
    res.status(200).json({ resolvedUrl: response.url, apiKey });
  } catch (e) {
    res.status(500).json({ error: 'Failed to resolve URL', details: e.message });
  }
}
