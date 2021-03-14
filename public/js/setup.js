const findBridgeButton = document.getElementById('findBridge');
const findBridgeError = document.getElementById('findBridgeError');
const findBridgeSuccess = document.getElementById('findBridgeSuccess');

findBridgeButton.addEventListener('click', () => {
  findBridgeButton.style.display = 'none';
  var findBridgeCall = new XMLHttpRequest();
  findBridgeCall.open("GET", "/setup/findBridge", true);

  findBridgeCall.onreadystatechange = function() {
    if (this.readyState == XMLHttpRequest.DONE) {
      if (this.status == 200 || this.status == 304) {
        findBridgeSuccess.style.display = 'block';
      }
      if (this.status == 400) {
        findBridgeButton.style.display = 'block';
        findBridgeError.style.display = 'block';
      }
    }
  }
  findBridgeCall.send();
});
