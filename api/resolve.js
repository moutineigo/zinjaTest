export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    // URLを展開
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    const resolvedUrl = response.url;

    // place_id を URL から抽出（例: !1s[place_id]）
    const match = resolvedUrl.match(/!1s([^!]+)/);
    const placeId = match ? match[1] : null;

    if (!placeId) {
      return res.status(400).json({ error: 'Place ID 抽出失敗', resolvedUrl });
    }

    res.status(200).json({ resolvedUrl, placeId });

  } catch (e) {
    res.status(500).json({ error: 'Failed to resolve URL', details: e.message });
  }
}
