// server.js
class Client {
  #type;
  #name;
  #id;
  #ipaddr;

  constructor(type, mac) {
    this.#name = null;
    this.#type = type;
    this.#id = null;
    this.#ipaddr = null;
  }

  get name() {
    return this.#name;
  }

  set name(n) {
    //TODO: verify string
    this.#name = n;
  }

  get type() {
    return this.#type;
  }

  set type(t) {
    //DO NOT USE OUTSIDE OF DEBUGGING
    this.#type = t;
  }

  get id() {
    return this.#id;
  }

  set id(i) {
    this.#id = i;
  }

  get ipaddr() {
    return this.#ipaddr;
  }

  set ipaddr(i) {
    //DO NOT USE OUTSIDE OF DEBUGGING
    //TODO: verify valid IP address
    this.#ipaddr = i;
  }

  logClient() {
    console.log(`Mofos Info: ID=${this.#id}, Type=${this.#type}, IP=${this.#ipaddr}, Name=${this.name}`);
  }
} //end Client class

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

console.log(`Starting server`);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Client maps and connected client data
// Clients(map) serves as master lsit of all connected clients
// Each subsequent client type will have their own map, tracking just that client type
//
let clients = new Map();
let rovers = new Map();
let pads = new Map();
let dummies = new Map();
let debugs = new Map();
let connectedRovers = rovers.length;
let connectedPads = pads.length;
let connectedDummies = dummies.length;
let connectedDebugs = debugs.length;

let totalConnections = clients.length;
let interfaceConnected = false; //becomes true when client type interface connects, assists in logic allowing only a single interface client

//Acceptable client types, interface is also a client but since it a special case where only a single connection of that type is allowed at a time, it is not included in the list
//interface connection and validation logic takes place in seprate if statement case

/*
  Client Type Bank

  Dummy: 
    can recieve ping/pong, connection/disconnect commands only
    Telemetry = {[name,ip,time connected]}
    
  Rover:
    rover, non-specialized  
    telemetry package = {[]}

  Pad:
    launchpad, standalone
    telemetry package = {[]}

  Debug:
    can recieve and send all command types, 
    transmits a dummy telemetry package
    used for testing purposes without needing to connect several client types
    LIKELY TO BE REMOVED IN FUTURE, SECURITY RISK
  
*/
let acceptableClientTypes = ["dummy", "rover", "pad"];

let acceptableCmdTypes = ["ping", "move", "LED", "hold", "abort", "setCount", "setPitch", "setYaw", "homeAxes", "speed", "startCount", "padMode"];

io.on("connection", (socket) => {
  console.log(`Mofo tryna connect: ${socket.id}`);

  socket.on("verification", (data) => {
    console.log(`Verification data received from client ${socket.id}: ${data}`);
    if (data.id && data.type) {
      // Only allow one interface client
      if (data.type === "interface") {
        if (interfaceConnected) {
          //if an interface is already connected, kick that mofo
          socket.disconnect();
          console.log(`Client ${socket.id} kicked: mofo thought he can run shit around here(Interface already connected)`);
          return;
        } else {
          interfaceConnected = true;
        }
      } //end interface verification

      //create CLient instance for storing in relevant Map(s)
      const client = new Client(data.type, data.id, socket.handshake.address);

      switch (data) {
        case "dummy":
          dummies.set(socket.id, client);
          client.name = `${client.type}` + `${dummies.length() + 1}`;
          break;
        case "rover":
          client.name = `${client.type}` + `${rover.length() + 1}`;
          break;
        case "pad":
          client.name = `${client.type}` + `${pad.length() + 1}`;
          break;
      }

      //add client to general client map once all 4 atrubutes have been set and the client has been added to specific type client map(switch statement)
      clients.set(socket.id, client);
      console.log(`Mofo ${socket.id} verified successfully, logging that mofo`);
      client.logClient();

      //send updated client list to  the interface
    } else {
      //kick if no cases are satisfied
      socket.disconnect();
      console.log(`OPS lOCATED, DE-OPPING ID:${socket.id}`);
    }
  });

  // Handle 'telemetry' event
  socket.on("telemetry", (data) => {
    console.log(`Telemetry data received from client ${socket.id}: ${data}`);
    // Handle telemetry data as needed
  });

  // Handle command request events
  socket.on("cmdReq", (data) => {
    console.log(`Command request received from interface client ${socket.id}: ${JSON.stringify(data)}`);
    const { destID, cmdType, cmdMagnitude } = data;

    //! vvvvv----VERIFY COMMAND TYPE AND MAGNITUDE?????----vvvvvvvvv
    if (clients.has(destID)) {
      const cmdExe = {
        cmdType: cmdType,
        cmdMagnitude: cmdMagnitude,
      };

      io.to(destID).emit("cmdExe", cmdExe);

      console.log(`Command sent to client ${destID}: ${JSON.stringify(cmdExe)}`);
    } else {
      console.log(`Invalid destination socket ID: ${destID}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`MOFO: ${socket.id} kicked cus ${reason}`);
    //remove from client map
    clients.delete(socket.id);
    console.log("mofo deleted off the map");
  });

  // Add more event handlers as needed
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
