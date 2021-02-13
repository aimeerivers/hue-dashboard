let checkboxes = document.getElementsByClassName('on-off');
let rooms = document.getElementsByClassName('room');
let scenes = document.getElementsByClassName('scene');

var onOff = function() {
  var roomId = this.getAttribute("data-room-id");
  var desiredState = this.checked;

  var onOffCall = new XMLHttpRequest();
  onOffCall.open("PUT", `/room/${roomId}/on/${desiredState}`, true);
  onOffCall.send();
};

var setScene = function() {
  var roomId = this.getAttribute("data-room-id");
  var sceneId = this.getAttribute("data-scene-id");

  var setSceneCall = new XMLHttpRequest();
  setSceneCall.open("PUT", `/room/${roomId}/scene/${sceneId}`, true);
  setSceneCall.send();
};

for (var i = 0; i < checkboxes.length; i++) {
  checkboxes[i].addEventListener('change', onOff, false);
}

for (var i = 0; i < rooms.length; i++) {
  rooms[i].style.backgroundColor = rooms[i].getAttribute("data-colour");
}

for (var i = 0; i < scenes.length; i++) {
  scenes[i].style.borderColor = scenes[i].getAttribute("data-colour");
  scenes[i].addEventListener('click', setScene, false);
}
