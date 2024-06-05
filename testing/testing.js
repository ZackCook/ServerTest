// JavaScript Document
//const io = require('socket.io');

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

  speedSlider.oninput = function () {
    speedLabel.innerHTML = `Speed: ${this.value}`;
  };

  forwardButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Forward";
    //socket.emit();
    console.log("fwd");
  };

  forwardButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
  };

  cruiseButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Cruise";
    console.log("crs");
  };

  leftButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Left";
    //socket.emit();
  };

  leftButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
  };

  rightButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Right";
    //socket.emit();
  };

  rightButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
  };

  stopButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    //socket.emit();
  };

  reverseButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Reverse";
    //socket.emit();
  };

  reverseButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
  };

  LEDOnButton.onmousedown = function () {
    LEDLabel.innerHTML = "LED State: ON(1)";
  };

  LEDOffButton.onmousedown = function () {
    LEDLabel.innerHTML = "LED State: OFF(0)";
  };
});
