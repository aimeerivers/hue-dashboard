export function rgbToXy(red: number, green: number, blue: number) {
  if (red > 0.04045) {
    red = Math.pow((red + 0.055) / (1.0 + 0.055), 2.4);
  }
  else red = (red / 12.92);

  if (green > 0.04045) {
    green = Math.pow((green + 0.055) / (1.0 + 0.055), 2.4);
  }
  else green = (green / 12.92);

  if (blue > 0.04045) {
    blue = Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4);
  }
  else blue = (blue / 12.92);

  var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
  var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
  var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;
  var x = X / (X + Y + Z);
  var y = Y / (X + Y + Z);
  return new Array(x,y);
}

function rgbToHex(red: number, green: number, blue: number) {
  let r = Math.round(red).toString(16);
  let g = Math.round(green).toString(16);
  let b = Math.round(blue).toString(16);

  if (r.length < 2) r = "0" + r;
  if (g.length < 2) g = "0" + g;
  if (b.length < 2) b = "0" + b;
  return `#${r}${g}${b}`;
}

export function xyBriToHex(x: number, y: number, bri: number) {
  let rgb = xyBriToRgb(x, y, bri);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function xyBriToRgb(x: number, y: number, bri: number) {
  let z = 1.0 - x - y;
  let Y = bri / 255.0; // Brightness of lamp
  let X = (Y / y) * x;
  let Z = (Y / y) * z;
  let r = X * 1.612 - Y * 0.203 - Z * 0.302;
  let g = -X * 0.509 + Y * 1.412 + Z * 0.066;
  let b = X * 0.026 - Y * 0.072 + Z * 0.962;
  r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
  g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
  b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
  let maxValue = Math.max(r,g,b);
  r /= maxValue;
  g /= maxValue;
  b /= maxValue;

  r = Math.round(r * 255); if(r < 0) r = 0; if(r > 255) r = 255;
  g = Math.round(g * 255); if(g < 0) g = 0; if(g > 255) g = 255;
  b = Math.round(b * 255); if(b < 0) b = 0; if(b > 255) b = 255;

  return {r: r, g: g, b: b};
}

export function ctToHex(ct: number) {
  let rgb = ctToRgb(ct);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function ctToRgb(ct: number) {
  let kelvin = (10 ** 6) / ct / 100;
  let r, g, b;

  // Red
  if(kelvin <= 66) {
    r = 255;
  } else {
    r = kelvin - 60;
    r = 329.698727446 * (r ** -0.1332047592);
  }

  // Green
  if(kelvin <= 66) {
    g = kelvin;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
  } else {
    g = kelvin - 60;
    g = 288.1221695283 * (g ** -0.0755148492);
  }

  // Blue
  if(kelvin >= 66) {
    b = 255;
  } else {
    if(kelvin <= 19) {
      b = 0;
    } else {
      b = kelvin - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
    }
  }

  r = Math.round(r); if(r < 0) r = 0; if(r > 255) r = 255;
  g = Math.round(g); if(g < 0) g = 0; if(g > 255) g = 255;
  b = Math.round(b); if(b < 0) b = 0; if(b > 255) b = 255;

  return {r: r, g: g, b: b};
}

