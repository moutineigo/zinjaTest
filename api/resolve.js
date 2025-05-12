export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    // URL展開
    const response = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
    const resolvedUrl = response.url;

    // Geocoding API で Place ID を取得
    const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(resolvedUrl)}&key=${process.env.GOOGLE_API_KEY}`);
    const geoData = await geoRes.json();

    if (geoData.status !== "OK") {
      return res.status(404).json({ error: "Place ID 取得失敗", detail: geoData });
    }

    const placeId = geoData.results[0].place_id;

    // Place Details API で詳細取得
    const detailRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&language=ja&key=${process.env.GOOGLE_API_KEY}`);
    const detailData = await detailRes.json();

    if (detailData.status !== "OK") {
      return res.status(500).json({ error: "詳細取得失敗", detail: detailData });
    }

    res.status(200).json({
      resolvedUrl,
      result: detailData.result
    });
  } catch (e) {
    res.status(500).json({ error: 'サーバー内部エラー', message: e.message });
  }
}
