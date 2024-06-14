const express = require("express");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const os = require("os");

const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const server = app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
  logServerIP();
});

const wss = new WebSocket.Server({ server });

let validClientTypes = ["dummy", "rover", "pad", "interface", "recon", "simple"];
let clients = new Map();
//let wsToID = new Map();
let user = null; //user interface Client instance

wss.on("connection", (ws, req) => {
  console.log(`Client attempting to connect IPaddr: ${extractIPv4(req.socket.remoteAddress)}`);

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    let incoming; //variable for storage of incomeing message to be parsed
    const incomingIP = req.socket.remoteAddress; //get the ip of the incoming client

    //!THIS TRY CATCH BLOCK MAY NOT BE WORKING, DEBUG
    try {
      incoming = JSON.parse(message);
      console.log(`incoming: ${JSON.stringify(incoming)}`);
    } catch (err) {
      console.error("invalid JSON message recieved, raw contents: ", message);
    }

    if (incoming.type === "verification") {
      handleVerification(ws, incomingIP, incoming);
    } //end verification

    if (incoming.type === "cmdReq") {
      //cmdReq event handling
      const { destID, cmdType, cmdMagnitude } = incoming; //destructure incoming message into a JSON object
      if (clients.has(destID)) {
        const cmdExe = { type: "cmdExe", cmdType, cmdMagnitude };
        clients.get(destID).ws.send(JSON.stringify(cmdExe));
        console.log(`cmdExe: ${JSON.stringify(cmdExe)}, sent to client id ${destID}`);
      } else {
        console.log(`invalid destID: ${destID}`);
      }
    } //end cmdReq handling

    if (incoming.type === "telemetry") {
      // TODO: design then implement telemetry design and parsing logic
    } //end telemetry handling

    if (incoming.type === "kick") {
      const incid = incoming.id;
      const kClient = clients.get(incid);
      const kws = kClient.ws;

      handleDisconnect(kws);
      kws.close();
    }
  }); //end message parsing logic

  ws.on("close", (code, reason) => {
    console.log(`Client disconnected w/ code ${code} reason: ${reason}`);
    handleDisconnect(ws);
    ws.close();
  }); //end closing logic

  ws.on("error", (err) => {
    console.log(`error: ${err}`);
  });
});

//when passed an ipv6 address, ipv4 is stripped and returned, otherwise the passed parameter is returned
function extractIPv4(ip) {
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  return ip;
} //end extractIPv4

//returns a fake generate ip address where the last digit is always 69, nice
function genIP() {
  //todo: ADD IP AUTH LOGIC, checks to make sure generated ip doe snot exist on the network before returning the value
  return Math.floor(Math.random() * 255) + 1 + "." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255) + "." + 69;
}

/*
 *@param ws: websockets instance that has been disconnected from the server
 */
function handleDisconnect(ws) {
  let disconnectedClientID = null; //temp variable to store disconnected id when discovered
  /*
  loop over clients map, searching for a ws instance matching the passed parameter
  if this match is found, its id component is assigned to the value of the temp id variable
  let [id,client] id is the key for the current map element, client is the corresponding value
  */
  for (let [id, client] of clients) {
    if (client.ws === ws) {
      disconnectedClientID = id;
      break; //break if found
    }
  } //end id search

  if (disconnectedClientID) {
    //if the dissconnectedCientID is not null
    console.log(`Client disconnected: ${disconnectedClientID}`);
    clients.delete(disconnectedClientID); //delete the client from the map(key = id)
    console.log("Client removed from map");
    updateClientMap(); // Update client map after disconnection
  }

  if (user && user.ws === ws) {
    //if user exists and the users ws instance matches the passed value
    console.log("Interface client disconnected");
    user = null; //assign user to null, deleted via garbage collection
    //updateClientMap(); // Update client map after interface disconnects
  } //end interface disconnection
} //handleDisconnect()

function handleVerification(ws, ip, data) {
  if (!data.clientType) {
    ws.close();
    console.log(`client kicked for invalid client data`);
    return;
  }
  if (data.clientType === "interface") {
    if (user) {
      // if user exists
      ws.close(); //kick
      console.log("clientType: interface kicked, user already connected");
    } else {
      const uniqueID = uuidv4(); // generate a unique ID
      user = new Client(data.clientType, uniqueID, ip, ws); // create Client instance
      console.log("Interface client connected");
      user.logClient(); // log client specific data to server console
      ws.send(JSON.stringify({ type: "assignedID", id: uniqueID })); // send generated assignedID to newly connected client
      //updateClientMap(); // Update client map after verification
    }
  } else if (validClientTypes.includes(data.clientType)) {
    //verify that the client type is valid
    //handle non interface client connections
    const uniqueID = uuidv4(); // generate unique ID for newly connected client
    const client = new Client(data.clientType, uniqueID, ip, ws); // create Client instance for newly connected client
    clients.set(uniqueID, client); // add client to clients map
    console.log("Client verified successfully, logging info:");
    client.logClient();
    ws.send(JSON.stringify({ type: "assignedID", id: uniqueID })); // send generated uniqueID to newly connected client
    updateClientMap(); // Update client map after verification
  } else {
    ws.close();
    console.log("Client could not be verified");
  }
} //end handleVerification()

/*
  function creates an array from the cuurent state of clients(map)
  elements of this array have mapped each client's id, type and name into an array element
  this array is then sent to the user interface, message type='intUpdate'
*/
function updateClientMap() {
  if (user) {
    //check if there is a user client connected
    //create clientList, an array, from the current state of clients(map)
    //uses just the values component of the clients map. id keys are not needed
    const clientList = Array.from(clients.values()).map((c) => ({
      cid: c.id,
      cname: c.name,
      ctype: c.type,
    })); //end clientList mapping
    user.ws.send(JSON.stringify({ type: "intUpdate", clients: clientList }));
  } //end user existence check
} //end updateCLientMap

// Function to log the server's IP address
function logServerIP() {
  const interfaces = os.networkInterfaces();
  console.log("Listing active network interfaces and their IPs.....");
  for (const iface in interfaces) {
    for (const alias of interfaces[iface]) {
      if (alias.family === "IPv4" && !alias.internal) {
        console.log(`Interface: ${iface}, IP Address: ${alias.address}`);
      }
    }
  }
} //end log serverIP()

//Client class
class Client {
  #type;
  #id;
  #name;
  #ipaddr;

  constructor(type, id, ipaddr, ws) {
    this.type = type; //MUST BE SPECIFIED @ instantiation
    this.id = id; //generated server side
    this.ipaddr = ipaddr; //assigned @ instantiation
    this.ws = ws; //WebSocket instance created when client connects to server
    this.name = `DEFAULTNAME_${type}`; //assigns a default name based on the client's specified type
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
} //end client class
