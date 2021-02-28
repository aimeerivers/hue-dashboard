let checkboxes = document.getElementsByClassName('on-off');
let roomOverlays = document.getElementsByClassName('room-overlay');
let sceneImages = document.getElementsByClassName('scene-image');

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

for (var i = 0; i < roomOverlays.length; i++) {
  roomOverlays[i].style.backgroundColor = roomOverlays[i].getAttribute("data-colour");
}

for (var i = 0; i < sceneImages.length; i++) {
  sceneImages[i].addEventListener('click', setScene, false);
}
