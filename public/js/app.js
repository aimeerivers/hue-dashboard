let checkboxes = document.getElementsByClassName('on-off');
let sceneImages = document.getElementsByClassName('scene-image');

var onOff = function() {
  var roomId = this.getAttribute("data-room-id");
  var desiredState = this.checked;

  var onOffCall = new XMLHttpRequest();
  onOffCall.open("PUT", `/room/${roomId}/on/${desiredState}`, true);
  onOffCall.onreadystatechange = updateState;
  onOffCall.send();
};

var setScene = function() {
  var roomId = this.getAttribute("data-room-id");
  var sceneId = this.getAttribute("data-scene-id");

  var setSceneCall = new XMLHttpRequest();
  setSceneCall.open("PUT", `/room/${roomId}/scene/${sceneId}`, true);
  setSceneCall.onreadystatechange = updateState;
  setSceneCall.send();
};

for (var i = 0; i < checkboxes.length; i++) {
  checkboxes[i].addEventListener('change', onOff, false);
}

for (var i = 0; i < sceneImages.length; i++) {
  sceneImages[i].addEventListener('click', setScene, false);
}

var updateState = function() {
  var getStateCall = new XMLHttpRequest();
  getStateCall.open("GET", "/groups/state", true);
  getStateCall.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let response = JSON.parse(this.responseText);
      for(const groupId in response) {
        let group = response[groupId];
        let roomOnOff = document.getElementById("room-on-off-" + group.id);
        if(roomOnOff) roomOnOff.checked = group.state.any_on;
        let roomOverlay = document.getElementById("room-overlay-" + group.id);
        if(roomOverlay) roomOverlay.style.backgroundColor = group.colour;
      }
    }
  }
  getStateCall.send();
}

setInterval(updateState, 10000);
updateState();
