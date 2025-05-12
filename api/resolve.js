export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    // 1. 短縮URLを展開
    const response = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
    const resolvedUrl = response.url;

    // 2. 緯度・経度を URL 中の @lat,lng 形式から抽出
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

    // 3. Place Search API で周辺の POI を検索（神社など）
    const placeSearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=300&type=point_of_interest&keyword=神社&key=${apiKey}&language=ja`;
    const placeSearchRes = await fetch(placeSearchUrl);
    const placeSearchData = await placeSearchRes.json();

    if (placeSearchData.status !== "OK") {
      return res.status(500).json({
        error: "Place Search API 失敗",
        detail: placeSearchData
      });
    }

    const firstPlace = placeSearchData.results[0];
    if (!firstPlace) {
      return res.status(404).json({ error: '該当スポットが見つかりませんでした' });
    }

    const placeId = firstPlace.place_id;

    // 4. Place Details API で詳細情報を取得
    const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=ja`;
    const placeDetailsRes = await fetch(placeDetailsUrl);
    const placeDetailsData = await placeDetailsRes.json();

    if (placeDetailsData.status !== "OK") {
      return res.status(500).json({
        error: "Place Details API 失敗",
        detail: placeDetailsData
      });
    }

    const result = placeDetailsData.result;

    // 5. 出力
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
