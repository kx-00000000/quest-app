export const formatQuestDistance = (meters: number): string => {
    if (meters < 1000) {
        // 1km未満: m単位、整数、3桁カンマ
        return `${Math.floor(meters).toLocaleString('ja-JP')} m`;
    } else {
        // 1km以上: km単位、小数点第1位、3桁カンマ
        const km = meters / 1000;
        return `${km.toLocaleString('ja-JP', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} km`;
    }
};
