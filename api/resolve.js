export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    const response = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
    const resolvedUrl = response.url;

    const match = resolvedUrl.match(/@([-.\d]+),([-.\d]+)/);
    if (!match) return res.status(400).json({ error: 'URLに緯度経度が含まれていません', resolvedUrl });

    const lat = match[1];
    const lng = match[2];

    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}&language=ja`
    );
    const geoData = await geoRes.json();

    if (geoData.status !== "OK") {
      return res.status(500).json({ error: "Geocoding API 失敗", detail: geoData });
    }

    // 「神社」「施設名」などを優先
    const result = geoData.results.find(r =>
      r.types.includes("premise") ||
      r.types.includes("point_of_interest") ||
      r.types.includes("establishment")
    ) || geoData.results[0]; // なければ先頭

    res.status(200).json({
      resolvedUrl,
      lat,
      lng,
      result
    });
  } catch (e) {
    res.status(500).json({ error: 'サーバー内部エラー', message: e.message });
  }
}
