//SimpleJSClient.js
const WebSocket = require("ws");

// Replace with your server address and port
const serverAddress = "ws://localhost:3000";

// Create a new WebSocket connection to the server
const socket = new WebSocket(serverAddress);
let serverSideID = null;

socket.on("open", () => {
  console.log("Connecting to server");
  //send verification
  verify = {
    type: "verification",
    clientType: "dummy",
  };
  socket.send(JSON.stringify(verify));
});

socket.on("message", (data) => {
  console.log(`Message from server: ${JSON.stringify(data.toString())}`);
  const msg = JSON.parse(data);
  //console.log(data);
  if (msg.type === "assignedID") {
    serverSideID = msg.id;
    console.log(`serverID received: ${serverSideID}`);
  } //end assignedID
});

socket.on("close", () => {
  console.log("Disconnected from the WebSocket server");
});

socket.on("error", (error) => {
  console.error("WebSocket error:", error);
});
