
import {createCanvas} from 'canvas';

export const drawSceneColours = (sceneColours: string[]) => {
  if(sceneColours.length == 0) sceneColours = ["#ffd6b5"];
  const canvas = createCanvas(144, 144);
  const ctx = canvas.getContext('2d');
  const grd = ctx.createLinearGradient(0, 0, 200, 200);
  for(let index = 0; index < sceneColours.length - 1; index++) {
    grd.addColorStop(index/sceneColours.length, sceneColours[index]);
  }
  grd.addColorStop(1, sceneColours[sceneColours.length - 1]);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 144, 144);
  return canvas;
}
