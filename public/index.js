document.addEventListener("DOMContentLoaded", () => {
  const ws = new WebSocket("ws://localhost:3000"); // Replace with your server address

  const activeClientDropdown = document.getElementById("activeClientDropdown");
  let activeClient = null;

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
  const kickButton = document.getElementById("kickButton");

  speedSlider.oninput = function () {
    speedLabel.innerHTML = `Speed: ${this.value}`;
    logTimestamp(`SPEED:${this.value}`);
    sendCmdReq(activeClient, "SPD", this.value);
  };

  forwardButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Forward";
    logTimestamp("FORWARD");
    sendCmdReq(activeClient, "MOV", "forward");
  };

  forwardButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    logTimestamp("STOP");
    sendCmdReq(activeClient, "MOV", "stop");
  };

  cruiseButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Cruise";
    logTimestamp("CRUISE");
    sendCmdReq(activeClient, "MOV", "cruise");
  };

  leftButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Left";
    logTimestamp("LEFT");
    sendCmdReq(activeClient, "MOV", "left");
  };

  leftButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    logTimestamp("STOP");
    sendCmdReq(activeClient, "MOV", "stop");
  };

  rightButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Right";
    logTimestamp("RIGHT");
    sendCmdReq(activeClient, "MOV", "right");
  };

  rightButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    logTimestamp("STOP");
    sendCmdReq(activeClient, "MOV", "stop");
  };

  stopButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    logTimestamp("STOP");
    sendCmdReq(activeClient, "MOV", "stop");
  };

  reverseButton.onmousedown = function () {
    movementLabel.innerHTML = "Movement State: Reverse";
    logTimestamp("REVERSE");
    sendCmdReq(activeClient, "MOV", "reverse");
  };

  reverseButton.onmouseup = function () {
    movementLabel.innerHTML = "Movement State: Stopped";
    logTimestamp("STOP");
    sendCmdReq(activeClient, "MOV", "stop");
  };

  LEDOnButton.onmousedown = function () {
    LEDLabel.innerHTML = "LED State: ON(1)";
    logTimestamp("LED:1");
    sendCmdReq(activeClient, "LED", 1);
  };

  LEDOffButton.onmousedown = function () {
    LEDLabel.innerHTML = "LED State: OFF(0)";
    logTimestamp("LED:0");
    sendCmdReq(activeClient, "LED", 0);
  };

  activeClientDropdown.onchange = function () {
    activeClient = this.value;
    console.log(`active client: ${activeClient}`);
  };

  kickButton.onmousedown = function () {
    console.log("kicking active client");
    const remoteKick = {
      type: "kick",
      id: activeClient,
    };
    ws.send(JSON.stringify(remoteKick));
  };

  ws.addEventListener("open", (event) => {
    console.log(`Connected to server @ ${getCurrentDateTime()}`);
    // Send verification
    const verify = {
      type: "verification",
      clientType: "interface",
    };
    ws.send(JSON.stringify(verify));
  });

  ws.addEventListener("close", (event) => {
    console.log("Disconnected from server");
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    console.log(`Message from server: ${event.data}`);

    if (message.type === "intUpdate") {
      console.log("Updating client dropdown");
      updateClientDropdown(message.clients);
    }
  });

  function getCurrentDateTime() {
    return new Date().toISOString();
  }

  function logTimestamp(s) {
    console.log(`${s} @: ${getCurrentDateTime()}`);
  }

  function updateClientDropdown(clients) {
    activeClientDropdown.innerHTML = "";
    clients.forEach((client) => {
      const option = document.createElement("option");
      option.value = client.cid;
      option.text = `${client.cname}:${client.ctype}`;
      activeClientDropdown.add(option);
    });
    if (clients.length === 1) {
      activeClientDropdown.selectedIndex = 0; // Automatically select the single option if only one client
      activeClient = clients[0].cid; // Set the activeClient to the single option's value
      console.log(`Active client automatically selected: ${activeClient}`);
    } //end if (clients.length === 1)
  } //end updateClientDropdown()

  /* ************************************************
   * sendCmdReq(d,t,m) ---returns---> void
   * This function takes 3 parameters and uses them to build a cmdReq object
   * This cmdReq is then sent to the server for parsing
   *
   * @param: d - destination
   * - desired destination client
   *
   * @param t - type
   * - Type of command to be executed
   *
   * @param m - magnitude
   * - Magnitude of command to be executed,
   ******************************************************/
  function sendCmdReq(d, t, m) {
    const cmdReq = {
      type: "cmdReq",
      destID: d,
      cmdType: t,
      cmdMagnitude: m,
    };

    ws.send(JSON.stringify(cmdReq));
    logTimestamp(`Command sent: ${JSON.stringify(cmdReq)}`);
  }
});
