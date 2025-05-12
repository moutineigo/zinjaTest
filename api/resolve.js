export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    const response = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
    const resolvedUrl = response.url;

    const match = resolvedUrl.match(/@([-.\d]+),([-.\d]+)/);
    if (!match) return res.status(400).json({ error: '緯度経度がURLに含まれていません', resolvedUrl });

    const lat = match[1];
    const lng = match[2];
    const apiKey = process.env.GOOGLE_API_KEY;

    // 1. Place Search API で近くのスポット（神社など）を取得
    const placeSearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=100&keyword=神社&key=${apiKey}&language=ja`;
    const placeSearchRes = await fetch(placeSearchUrl);
    const placeSearchData = await placeSearchRes.json();

    if (placeSearchData.status !== "OK") {
      return res.status(500).json({ error: "Place Search API 失敗", detail: placeSearchData });
    }

    const placeId = placeSearchData.results[0].place_id;

    // 2. Place Details API で詳細情報を取得
    const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=ja`;
    const placeDetailsRes = await fetch(placeDetailsUrl);
    const placeDetailsData = await placeDetailsRes.json();

    if (placeDetailsData.status !== "OK") {
      return res.status(500).json({ error: "Place Details API 失敗", detail: placeDetailsData });
    }

    const result = placeDetailsData.result;

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
