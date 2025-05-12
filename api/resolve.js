export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    // 1. 短縮URLを展開
    const response = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
    const resolvedUrl = response.url;

    // 2. 緯度・経度を抽出
    const match = resolvedUrl.match(/@([-.\d]+),([-.\d]+)/);
    if (!match) {
      return res.status(400).json({
        error: 'URLに緯度経度が含まれていません',
        resolvedUrl
      });
    }

    const lat = match[1];
    const lng = match[2];
    const apiKey = process.env.GOOGLE_API_KEY;

    // 3. Geocoding API の呼び出し
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=ja`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (geoData.status !== "OK") {
      return res.status(500).json({
        error: "Geocoding API 失敗",
        detail: geoData
      });
    }

    // POIなどのtype優先を除き、先頭の結果をそのまま使う
    const result = geoData.results[0];

    res.status(200).json({
      resolvedUrl,
      lat,
      lng,
      result
    });
  } catch (e) {
    res.status(500).json({
      error: 'サーバー内部エラー',
      message: e.message
    });
  }
}
