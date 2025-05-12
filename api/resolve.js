export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    // 1. 短縮URLを展開
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
    });
    const resolvedUrl = response.url;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'APIキーが未設定です' });
    }

    // 2. 展開されたURLから Place ID を取得（Find Place API 使用）
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(resolvedUrl)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    const findRes = await fetch(findPlaceUrl);
    const findData = await findRes.json();

    if (findData.status !== "OK") {
      return res.status(500).json({ error: 'Place ID 取得失敗', details: findData });
    }

    const placeId = findData.candidates[0].place_id;

    // 3. Place ID から詳細情報取得（Place Details API）
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=ja`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (detailsData.status !== "OK") {
      return res.status(500).json({ error: 'Place Details 取得失敗', details: detailsData });
    }

    const result = detailsData.result;
    const name = result.name || "";
    const address = result.formatted_address || "";
    const comps = result.address_components || [];
    const pref = (comps.find(c => c.types.includes("administrative_area_level_1")) || {}).long_name || "";
    const city = (comps.find(c => c.types.includes("locality") || c.types.includes("administrative_area_level_2")) || {}).long_name || "";

    res.status(200).json({
      resolvedUrl,
      placeId,
      name,
      address,
      pref,
      city,
    });
  } catch (e) {
    res.status(500).json({ error: '全体処理失敗', message: e.message });
  }
}
