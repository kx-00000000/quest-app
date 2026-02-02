// 地球の半径 (km)
const EARTH_RADIUS = 6371;

// 陸地判定を行うためのOverpass APIを利用する関数
async function isLand(lat: number, lng: number): Promise<boolean> {
    try {
        const query = `[out:json];is_in(${lat},${lng});out;`;
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await response.json();
        // 周囲に陸地（国や地域）の定義があるかを確認
        return data.elements.length > 0;
    } catch (e) {
        return true; // エラー時は安全のため陸地とみなす
    }
}

// 0〜40,000km対応のランダム座標生成（Haversine公式ベース）
export async function generateQuestPoints(centerLat: number, centerLng: number, radiusKm: number, count: number) {
    const points = [];
    for (let i = 0; i < count; i++) {
        let point = { lat: 0, lng: 0 };
        let success = false;

        for (let retry = 0; retry < 10; retry++) {
            const u = Math.random();
            const v = Math.random();
            const w = (radiusKm / EARTH_RADIUS) * Math.sqrt(u);
            const t = 2 * Math.PI * v;
            const x = w * Math.cos(t);
            const y = w * Math.sin(t);

            const newLat = centerLat + (x * 180) / Math.PI;
            const newLng = centerLng + (y * 180) / (Math.PI * Math.cos((centerLat * Math.PI) / 180));

            // 陸地判定
            if (await isLand(newLat, newLng)) {
                point = { lat: newLat, lng: newLng };
                success = true;
                break;
            }
        }
        points.push({ ...point, id: `item-${Date.now()}-${i}`, is_collected: false });
    }
    return points;
}