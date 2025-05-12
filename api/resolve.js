// /api/resolve.js
export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing URL" });
  }

  try {
    // 短縮URLを展開
    const response = await fetch(targetUrl, { method: "GET", redirect: "follow" });
    const resolvedUrl = response.url;

    // Google Maps Place ID 検索
    const apiKey = process.env.GOOGLE_API_KEY;
    const placeIdRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(resolvedUrl)}&inputtype=textquery&key=${apiKey}&language=ja`
    );
    const placeIdData = await placeIdRes.json();

    if (placeIdData.status !== "OK" || !placeIdData.candidates?.[0]?.place_id) {
      return res.status(500).json({ error: "Place ID 取得失敗", detail: placeIdData });
    }

    const placeId = placeIdData.candidates[0].place_id;

    // 詳細取得
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=ja`
    );
    const detailsData = await detailsRes.json();

    if (detailsData.status !== "OK") {
      return res.status(500).json({ error: "詳細取得失敗", detail: detailsData });
    }

    return res.status(200).json({
      resolvedUrl,
      result: detailsData.result,
    });
  } catch (e) {
    return res.status(500).json({ error: "内部エラー", detail: e.message });
  }
}
