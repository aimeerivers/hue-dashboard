
import * as Conversions from './conversions';
import {Group, Groups} from './hue_api_types';

export const getRoomsFromGroups = (groups: Groups) => {
  const rooms: Partial<Group>[] = [];

  for(const groupId in groups) {
    const group = groups[groupId];
    if(group.type == 'Room' || group.type == 'Zone') {
      let colour = "";
      if(group.state.any_on) {
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
        colour: colour
      });
    }
  }

  return rooms;
};
