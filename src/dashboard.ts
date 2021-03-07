
import * as Conversions from './conversions';
import {Group, Groups} from './hue_api_types';

export type Room = Pick<Group, "id" | "name" | "state"> & {
  colour: string;
  brightness: number;
}

export const getRoomsFromGroups = (groups: Groups) => {
  const rooms: Room[] = [];

  for(const groupId in groups) {
    const group = groups[groupId];
    if(group.type == 'Room' || group.type == 'Zone') {
      let colour = "";
      let brightness = 0;
      if(group.state.any_on) {
        if(group.action.bri) {
          brightness = group.action.bri;
        }
        if(group.action.xy && group.action.bri) {
          colour = Conversions.xyBriToHex(group.action.xy[0], group.action.xy[1], group.action.bri);
        } else if(group.action.colormode == 'ct') {
          colour = Conversions.ctToHex(group.action.ct);
        }
      } else colour = "#000000";
      rooms.push({
        id: groupId,
        name: group.name,
        state: group.state,
        colour: colour,
        brightness: brightness,
      });
    }
  }

  return rooms;
};
