import * as Conversions from "../conversions";

export const randomXY = () => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return Conversions.rgbToXy(r, g, b);
};
