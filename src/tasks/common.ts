export const validateLightIds = (data: any): string[] | undefined => {
    if (!Array.isArray(data)) return;

    const dataArray: any[] = data;
    if (!dataArray.every(item => couldBeLightId(item))) return;

    return dataArray;
};

const couldBeLightId = (data: any): boolean =>
    (typeof data === 'string') && !!data.match(/^[0-9]{1,6}$/);

export const validateTransitionTimeSeconds = (data: any): number | undefined => {
    if (typeof data !== 'number') return;
    if (isNaN(data) || !isFinite(data)) return;
    if (data < 0 || data > 60) return;

    return data;
};

export const validateIntervalSeconds = (data: any): number | undefined => {
    if (typeof data !== 'number') return;
    if (isNaN(data) || !isFinite(data)) return;
    if (data < 0 || data > 60) return;

    return data;
};
