// JavaScript Document
//const io = require("socket.io-client");
const socket = io();

document.addEventListener("DOMContentLoaded", () => {
  //const socket = io();
  const speedSlider = document.getElementById("speedSlider");
  const speedLabel = document.getElementById("speedLabel");
  const forwardButton = document.getElementById("forwardButton");
  const cruiseButton = document.getElementById("cruiseButton");
  const leftButton = document.getElementById("leftButton");
  const rightButton = document.getElementById("rightButton");
  const stopButton = document.getElementById("stopButton");
  const reverseButton = document.getElementById("reverseButton");
  const movementLabel = document.getElementById("movementLabel");
  const LEDOnButton = document.getElementById("LEDOnButton");
  const LEDOffButton = document.getElementById("LEDOffButton");
  const LEDLabel = document.getElementById("LEDLabel");
  const activeClientDropdown = document.getElementById("activeClientDropdown");

  function addClientOption() {}

  speedSlider.oninput = function () {
    speedLabel.innerHTML = `Speed: ${this.value}`;
    logTimestamp(`SPEED:${this.value}`);
    //SEND SPEED
  };

  forwardButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Forward";
    //socket.emit();
    logTimestamp("FORWARD");
  };

  forwardButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    logTimestamp("STOP");
  };

  cruiseButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Cruise";
    logTimestamp("CRUISE");
  };

  leftButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Left";
    //socket.emit();
    logTimestamp("LEFT");
  };

  leftButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    logTimestamp("STOP");
    //ensure rover state is changed
  };

  rightButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Right";
    //socket.emit();
    logTimestamp("RIGHT");
  };

  rightButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    logTimestamp("STOP");
    //ensure rover state is changed
  };

  stopButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    //socket.emit();
    logTimestamp("STOP");
  };

  reverseButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Reverse";
    //socket.emit();
    logTimestamp("REVERSE");
  };

  reverseButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    logTimestamp("STOP");
    //ensure rover state has changed
  };

  LEDOnButton.onmousedown = function () {
    LEDLabel.innerHTML = "LED State: ON(1)";
    logTimestamp("LED:1");
  };

  LEDOffButton.onmousedown = function () {
    LEDLabel.innerHTML = "LED State: OFF(0)";
    logTimestamp("LED:0");
  };
});

socket.on("connect", () => {
  console.log(`Connected to server @ ${getCurrentDateTime()}`);
  //send verification
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

socket.on("updateClientMap", () => {});

function getCurrentDateTime() {
  return new Date().toISOString();
}

function logTimestamp(s) {
  console.log(`${s} @: ${getCurrentDateTime()}`);
}
