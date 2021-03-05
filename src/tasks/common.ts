export const validateLightIds = (data: any): string[] | undefined => {
    if (!Array.isArray(data)) return;

    const dataArray: any[] = data;
    if (!dataArray.every(item => couldBeLightId(item))) return;

    return dataArray;
};

const couldBeLightId = (data: any): boolean =>
    (typeof data === 'string') && !!data.match(/^[0-9]{1,6}$/);

export const validateTransitionTimeSeconds = (data: any) => validateNumber(data, { min: 0, max: 60 });

export const validateIntervalSeconds = (data: any) => validateNumber(data, { min: 0, max: 60 });

export const validateIterations = (data: any): number | null | undefined => {
    if (data === undefined) return null;
    if (data === null) return null;

    return validateNumber(data, { min: 0, max: undefined });
};

const validateNumber = (data: any, opts: { min?: number; max?: number }): number | undefined => {
    if (typeof data !== 'number') return;
    if (isNaN(data) || !isFinite(data)) return;

    if (opts.min !== undefined && data < opts.min) return;
    if (opts.max !== undefined && data > opts.max) return;

    return data;
};
