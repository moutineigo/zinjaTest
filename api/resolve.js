export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    // 展開
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow'
    });
    const resolvedUrl = response.url;

    // 環境変数
    const apiKey = process.env.GOOGLE_API_KEY;

    // Place ID を取得（Find Place API 使用）
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(resolvedUrl)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    const placeRes = await fetch(findPlaceUrl);
    const placeData = await placeRes.json();

    if (!placeData.candidates?.[0]?.place_id) {
      return res.status(500).json({ error: 'Place ID 取得失敗', detail: placeData });
    }

    const placeId = placeData.candidates[0].place_id;

    // 詳細取得
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=ja`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (detailsData.status !== "OK") {
      return res.status(500).json({ error: 'Place Details取得失敗', detail: detailsData });
    }

    const result = detailsData.result;
    const name = result.name || '';
    const address = result.formatted_address || '';
    const comps = result.address_components || [];

    const pref = (comps.find(c => c.types.includes("administrative_area_level_1")) || {}).long_name || "";
    const city = (comps.find(c => c.types.includes("locality") || c.types.includes("administrative_area_level_2")) || {}).long_name || "";

    res.status(200).json({ name, address, pref, city, resolvedUrl });
  } catch (e) {
    res.status(500).json({ error: 'エラー発生', details: e.message });
  }
}
