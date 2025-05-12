export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    const response = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
    const resolvedUrl = response.url;

    // 拡張版：複数の座標表現に対応
    const extractLatLngFromUrl = (url) => {
      let match = url.match(/@([-.\d]+),([-.\d]+)/);
      if (match) return [match[1], match[2]];
      match = url.match(/!3d([-.\d]+)!4d([-.\d]+)/);
      if (match) return [match[1], match[2]];
      return [null, null];
    };

    const [lat, lng] = extractLatLngFromUrl(resolvedUrl);
    if (!lat || !lng) {
      return res.status(400).json({
        error: '緯度経度をURLから抽出できませんでした',
        resolvedUrl
      });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=ja`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (geoData.status !== "OK") {
      return res.status(500).json({
        error: "Geocoding API 失敗",
        detail: geoData
      });
    }

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
